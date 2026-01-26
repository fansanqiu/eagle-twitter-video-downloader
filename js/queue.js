/**
 * 队列管理器模块
 * 处理多任务下载队列的核心逻辑
 */

const downloader = require("./downloader");
const { t } = require("./i18n");

// 队列状态
const queueState = {
  items: [], // DownloadItem 数组
  activeSlots: 0, // 当前活动下载数
  maxSlots: 3, // 最大并发下载数
  nextId: 1, // 自增 ID 计数器
};

// 状态变更监听器
const stateChangeListeners = [];

/**
 * 初始化队列管理器
 */
function initialize() {
  queueState.items = [];
  queueState.activeSlots = 0;
  queueState.nextId = 1;

  // 尝试从 localStorage 恢复状态
  loadQueueState();
}

/**
 * 获取当前队列状态
 */
function getQueueState() {
  return queueState.items;
}

/**
 * 根据 ID 获取项目
 */
function getItemById(id) {
  return queueState.items.find((item) => item.id === id);
}

/**
 * 更新项目状态
 */
function updateItemState(id, updates) {
  const item = getItemById(id);
  if (!item) return;

  // 更新字段
  Object.assign(item, updates);

  // 更新时间戳
  item.timestamp = Date.now();

  // 发射状态变更事件
  emitStateChange(item);
}

/**
 * 注册状态变更监听器
 */
function onStateChange(callback) {
  stateChangeListeners.push(callback);
}

/**
 * 发射状态变更事件
 */
function emitStateChange(item) {
  stateChangeListeners.forEach((listener) => {
    try {
      listener(item);
    } catch (error) {
      console.error("State change listener error:", error);
    }
  });
}

/**
 * 添加到队列
 */
function addToQueue(url) {
  const item = {
    id: queueState.nextId++,
    url: url,
    title: t("loading"),
    source: "",
    format: "",
    resolution: "",
    fileSize: "",
    state: "waiting",
    progress: 0,
    speed: "",
    eta: "",
    error: null,
    timestamp: Date.now(),
    filePath: null,
  };

  // 添加到队列开头（最新的在前）
  queueState.items.unshift(item);

  // 发射状态变更
  emitStateChange(item);

  // 尝试启动下载
  processQueue();

  return item.id;
}

/**
 * 处理队列 - 启动等待中的下载
 */
function processQueue() {
  // 检查是否有可用槽位
  if (queueState.activeSlots >= queueState.maxSlots) {
    return;
  }

  // 查找等待中的项目
  const waitingItem = queueState.items.find((item) => item.state === "waiting");
  if (!waitingItem) {
    return;
  }

  // 启动下载
  startDownload(waitingItem.id);
}

/**
 * 启动单个下载
 */
async function startDownload(itemId) {
  const item = getItemById(itemId);
  if (!item) return;

  // 更新状态为 preparing
  updateItemState(itemId, { state: "preparing" });

  // 增加活动槽位计数
  queueState.activeSlots++;

  try {
    // 获取视频元数据
    const videoInfo = await downloader.getVideoInfo(item.url);

    // 更新项目元数据
    updateItemState(itemId, {
      title: videoInfo.title || t("untitledVideo"),
      source: videoInfo.extractor || t("unknown"),
      format: "MP4",
      resolution: "1080p",
      fileSize: t("unknown"),
      state: "downloading",
    });

    // 开始下载
    const result = await downloader.downloadVideo(
      item.url,
      (progress) => handleDownloadProgress(itemId, progress),
      (status) => {
        // 状态更新（可选）
      },
    );

    // 下载完成
    await handleDownloadComplete(itemId, result);
  } catch (error) {
    // 下载失败
    handleDownloadError(itemId, error);
  }
}

/**
 * 处理下载进度
 */
function handleDownloadProgress(id, progress) {
  const item = getItemById(id);
  if (!item || item.state !== "downloading") return;

  updateItemState(id, {
    progress: progress.percent || 0,
    speed: progress.currentSpeed || "",
    eta: progress.eta || "",
  });
}

/**
 * 处理下载完成
 */
async function handleDownloadComplete(id, result) {
  const item = getItemById(id);
  if (!item) return;

  // 更新状态为 completed
  updateItemState(id, {
    state: "completed",
    progress: 100,
    filePath: result.path,
    speed: "",
    eta: "",
  });

  // 减少活动槽位
  queueState.activeSlots--;

  // 导入到 Eagle
  try {
    const eagle = require("./eagle");
    await eagle.importToEagle(result.path, result.metadata, item.url);

    // 清理临时文件
    downloader.cleanup(result.path);
  } catch (error) {
    console.error("Eagle import error:", error);
    // 不阻止队列继续处理
  }

  // 不再自动保存队列状态（关闭时会清空历史记录）
  // saveQueueState();

  // 处理下一个等待的项目
  processQueue();
}

/**
 * 处理下载错误
 */
function handleDownloadError(id, error) {
  const item = getItemById(id);
  if (!item) return;

  // 更新状态为 error
  updateItemState(id, {
    state: "error",
    error: error.message || t("downloadFailed"),
    speed: "",
    eta: "",
  });

  // 减少活动槽位
  queueState.activeSlots--;

  // 不再自动保存队列状态（关闭时会清空历史记录）
  // saveQueueState();

  // 处理下一个等待的项目
  processQueue();
}

/**
 * 重试下载
 */
function retryDownload(itemId) {
  const item = getItemById(itemId);
  if (!item || item.state !== "error") return;

  // 重置状态
  updateItemState(itemId, {
    state: "waiting",
    error: null,
    progress: 0,
    speed: "",
    eta: "",
  });

  // 尝试启动下载
  processQueue();
}

/**
 * 保存队列状态到 localStorage
 */
function saveQueueState() {
  try {
    const completedItems = queueState.items
      .filter((item) => item.state === "completed")
      .slice(0, 50); // 限制为最近 50 个

    const storage = {
      version: 1,
      items: completedItems,
      timestamp: Date.now(),
    };

    localStorage.setItem(
      "eagle-video-downloader-queue",
      JSON.stringify(storage),
    );
  } catch (error) {
    console.error("Failed to save queue state:", error);
  }
}

/**
 * 从 localStorage 恢复队列状态
 */
function loadQueueState() {
  try {
    const stored = localStorage.getItem("eagle-video-downloader-queue");
    if (!stored) return;

    const storage = JSON.parse(stored);
    if (storage.version !== 1) return;

    // 仅恢复已完成的项目
    const completedItems = storage.items.filter(
      (item) => item.state === "completed",
    );

    // 添加到队列
    queueState.items.push(...completedItems);

    // 更新 nextId
    if (completedItems.length > 0) {
      const maxId = Math.max(...completedItems.map((item) => item.id));
      queueState.nextId = maxId + 1;
    }
  } catch (error) {
    console.error("Failed to load queue state:", error);
  }
}

/**
 * 清除已完成的项目
 */
function clearCompleted() {
  queueState.items = queueState.items.filter(
    (item) => item.state !== "completed",
  );
  saveQueueState();
}

module.exports = {
  initialize,
  addToQueue,
  retryDownload,
  getQueueState,
  clearCompleted,
  onStateChange,
};
