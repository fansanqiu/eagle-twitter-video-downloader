/**
 * Eagle 视频下载插件
 * 主入口 - 处理插件初始化和单下载管理
 */

// 导入模块
const { getFfmpegPath, isYtDlpInstalled, downloadYtDlp } = require("./binary");
const downloader = require("./downloader");
const eagleApi = require("./eagle");
const ui = require("./ui");

// 状态管理
let isInitialized = false;

// 当前下载状态
let currentDownload = null;

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

  // 监听下载事件
  document.addEventListener("startDownload", (e) => {
    handleDownload(e.detail.url);
  });

  // 监听取消事件
  document.addEventListener("cancelDownload", () => {
    cancelCurrentDownload();
  });

  // 监听重试事件
  document.addEventListener("retryDownload", () => {
    if (currentDownload && currentDownload.url) {
      handleDownload(currentDownload.url);
    }
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
    initializeMainUI();
    ui.showMainUI();
    return;
  }

  // 需要下载 yt-dlp
  ui.showInitUI();
  ui.updateInitStatus(i18next.t("init.downloading"), 0);

  try {
    await downloadYtDlp((progress) => {
      ui.updateInitStatus(i18next.t("init.downloading"), progress);
    });

    ui.updateInitStatus(i18next.t("init.complete"), 100);

    // 短暂延迟显示完成状态
    await new Promise((resolve) => setTimeout(resolve, 500));

    isInitialized = true;
    initializeMainUI();
    ui.showMainUI();
  } catch (error) {
    ui.updateInitStatus(`${i18next.t("init.failed")}: ${error.message}`, 0);
  }
}

/**
 * 初始化主 UI
 */
function initializeMainUI() {
  // 设置输入栏
  ui.setupInputBar();

  // 隐藏下载状态区域
  ui.hideDownloadStatus();

  // 聚焦输入框
  const urlInput = document.getElementById("urlInput");
  if (urlInput) {
    urlInput.focus();
  }
}

/**
 * 处理下载请求
 */
async function handleDownload(url) {
  if (!isInitialized) {
    ui.showInputError(i18next.t("error.notInitialized"));
    return;
  }

  if (!ui.isValidUrl(url)) {
    ui.showInputError(i18next.t("error.invalidUrl"));
    return;
  }

  // 如果有正在进行的下载，不处理新请求
  if (currentDownload && (currentDownload.state === "preparing" || currentDownload.state === "downloading")) {
    return;
  }

  // 清空输入栏
  ui.clearInputBar();

  // 初始化下载状态
  currentDownload = {
    url: url,
    title: i18next.t("ui.loading"),
    source: "",
    format: "",
    resolution: "",
    state: "preparing",
    progress: 0,
    error: null,
  };

  // 设置输入栏为准备状态
  ui.setInputBarState("preparing");

  // 显示下载状态
  ui.showDownloadStatus();
  ui.renderDownloadStatus(currentDownload);

  try {
    // 获取视频元数据
    const videoInfo = await downloader.getVideoInfo(url);

    // 更新项目元数据
    currentDownload.title = videoInfo.title || i18next.t("error.untitledVideo");
    currentDownload.source = videoInfo.extractor || i18next.t("error.unknown");
    currentDownload.format = "MP4";
    currentDownload.resolution = "1080p";
    currentDownload.state = "downloading";

    // 设置输入栏为下载状态
    ui.setInputBarState("downloading");

    ui.renderDownloadStatus(currentDownload);

    // 开始下载
    const result = await downloader.downloadVideo(
      url,
      (progress) => {
        if (currentDownload && currentDownload.state === "downloading") {
          currentDownload.progress = progress.percent || 0;
          ui.renderDownloadStatus(currentDownload);
        }
      },
      (status) => {
        // 状态更新（可选）
      }
    );

    // 下载完成
    currentDownload.state = "completed";
    currentDownload.progress = 100;
    ui.renderDownloadStatus(currentDownload);

    // 重置输入栏状态
    ui.resetInputBar();

    // 导入到 Eagle
    try {
      await eagleApi.importToEagle(result.path, result.metadata, url);
      // 清理临时文件
      downloader.cleanup(result.path);
    } catch (error) {
      console.error("Eagle import error:", error);
    }

  } catch (error) {
    // 下载失败
    if (currentDownload) {
      currentDownload.state = "error";
      currentDownload.error = error.message || i18next.t("download.failed");
      ui.renderDownloadStatus(currentDownload);
      // 设置输入栏为错误状态
      ui.setInputBarState("error", currentDownload.error);
    }
  }
}

/**
 * 取消当前下载
 */
function cancelCurrentDownload() {
  if (!currentDownload) return;

  if (currentDownload.state !== "preparing" && currentDownload.state !== "downloading") {
    return;
  }

  // TODO: 实现取消 yt-dlp 进程的逻辑

  // 重置状态
  currentDownload = null;
  ui.hideDownloadStatus();
}
