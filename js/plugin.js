/**
 * Eagle 视频下载插件
 * 主入口 - 处理插件初始化和队列管理
 */

// 导入模块
const { getFfmpegPath, isYtDlpInstalled, downloadYtDlp } = require("./binary");
const queue = require("./queue");
const ui = require("./ui");

// 状态管理
let isInitialized = false;

/**
 * 初始化 i18next
 */
async function initI18n() {
  const enTranslation = require("../_locales/en.json");
  const zhCNTranslation = require("../_locales/zh_CN.json");

  await i18next.init({
    lng: eagle.app.locale || "en",
    fallbackLng: "en",
    resources: {
      en: { translation: enTranslation },
      zh_CN: { translation: zhCNTranslation },
    },
  });
}

/**
 * 应用翻译到 UI 元素
 */
function applyTranslations() {
  const appName = document.getElementById("appName");
  if (appName) appName.textContent = i18next.t("ui.appTitle");

  const videoUrl = document.getElementById("urlInput");
  if (videoUrl) videoUrl.placeholder = i18next.t("ui.inputPlaceholder");

  const addButton = document.getElementById("addButton");
  if (addButton) addButton.textContent = i18next.t("ui.downloadBtn");

  const initHint = document.querySelector(".init-hint");
  if (initHint) initHint.textContent = i18next.t("init.hint");
}

/**
 * 初始化插件
 */
eagle.onPluginCreate(async (plugin) => {
  // 初始化 i18next
  await initI18n();

  // 应用翻译到 UI
  applyTranslations();

  // 更新主题
  ui.updateTheme();

  // 设置事件监听器
  setupEventListeners();

  // 检查并初始化二进制文件
  await initializeBinaries();
});

/**
 * 处理主题变更
 */
eagle.onThemeChanged(() => {
  ui.updateTheme();
});

/**
 * 设置 UI 事件监听器
 */
function setupEventListeners() {
  // 关闭按钮
  document.getElementById("closeButton").addEventListener("click", () => {
    window.close();
  });

  // 监听添加到队列事件
  document.addEventListener("addToQueue", (e) => {
    handleAddToQueue(e.detail.url);
  });
}

/**
 * 初始化二进制文件
 */
async function initializeBinaries() {
  // 检查 ffmpeg
  getFfmpegPath();

  if (isYtDlpInstalled()) {
    isInitialized = true;
    initializeQueue();
    ui.showMainUI();
    return;
  }

  // 需要下载 yt-dlp
  ui.showInitUI();
  ui.updateInitStatus(t("init.downloading"), 0);

  try {
    await downloadYtDlp((progress) => {
      ui.updateInitStatus(t("init.downloading"), progress);
    });

    ui.updateInitStatus(t("init.complete"), 100);

    // 短暂延迟显示完成状态
    await new Promise((resolve) => setTimeout(resolve, 500));

    isInitialized = true;
    initializeQueue();
    ui.showMainUI();
  } catch (error) {
    ui.updateInitStatus(`${t("init.failed")}: ${error.message}`, 0);
    ui.showError(t("init.networkError"));
  }
}

/**
 * 初始化队列管理器
 */
function initializeQueue() {
  // 初始化队列
  queue.initialize();

  // 设置队列状态变更监听器
  queue.onStateChange((item) => {
    ui.updateDownloadItem(item.id, item);
  });

  // 设置输入栏
  ui.setupInputBar();

  // 渲染初始队列（可能包含恢复的项目）
  ui.renderQueueUI();

  // 聚焦输入框
  const urlInput = document.getElementById("urlInput");
  if (urlInput) {
    urlInput.focus();
  }
}

/**
 * 处理添加到队列
 */
function handleAddToQueue(url) {
  if (!isInitialized) {
    ui.showInputError(t("error.notInitialized"));
    return;
  }

  if (!ui.isValidUrl(url)) {
    ui.showInputError(t("error.invalidUrl"));
    return;
  }

  // 添加到队列
  const itemId = queue.addToQueue(url);

  // 清空输入栏
  ui.clearInputBar();

  // 滚动到顶部
  ui.scrollToTop();
}

// 在窗口关闭时清空历史记录
window.addEventListener("beforeunload", () => {
  // 清空 localStorage 中的队列历史记录
  try {
    localStorage.removeItem("eagle-video-downloader-queue");
  } catch (error) {
    console.error("Failed to clear queue history:", error);
  }
});
