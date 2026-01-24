/**
 * 国际化 (i18n) 模块
 * 处理多语言翻译
 */

// 当前语言
let currentLang = "en";

// 翻译字典
const i18n = {
  zh_CN: {
    // UI Labels
    appTitle: "视频下载器",
    inputPlaceholder: "粘贴任意视频链接...",
    downloadBtn: "下载",
    downloadingBtn: "下载中...",

    // Init messages
    initDownloading: "正在下载 yt-dlp...",
    initComplete: "初始化完成！",
    initFailed: "初始化失败",
    initHint: "首次使用需要下载必要组件，请稍候...",
    initNetworkError: "初始化失败，请检查网络连接后重试",

    // Download messages
    fetchingInfo: "正在获取视频信息...",
    foundVideo: "找到视频",
    downloading: "正在下载视频...",
    downloadComplete: "下载完成，正在导入 Eagle...",
    importSuccess: "导入成功",
    downloadFailed: "下载失败",

    // Error messages
    notInitialized: "插件尚未初始化完成",
    emptyUrl: "请输入视频链接",
    invalidUrl: "请输入有效的视频链接",
    fileNotFound: "下载完成但找不到文件",
    eagleImportFailed: "导入 Eagle 失败",
    duplicateFound: "该视频已存在于库中",
    checkingDuplicate: "正在检查重复...",
    clickToRedownload: "点击重新下载并导入",

    // Progress
    remaining: "剩余",
  },
  en: {
    // UI Labels
    appTitle: "Video Downloader",
    inputPlaceholder: "Paste any video URL...",
    downloadBtn: "Download",
    downloadingBtn: "Downloading...",

    // Init messages
    initDownloading: "Downloading yt-dlp...",
    initComplete: "Initialization complete!",
    initFailed: "Initialization failed",
    initHint:
      "First-time setup requires downloading components, please wait...",
    initNetworkError:
      "Initialization failed. Please check your network connection.",

    // Download messages
    fetchingInfo: "Fetching video information...",
    foundVideo: "Found video",
    downloading: "Downloading video...",
    downloadComplete: "Download complete, importing to Eagle...",
    importSuccess: "Import successful",
    downloadFailed: "Download failed",

    // Error messages
    notInitialized: "Plugin not yet initialized",
    emptyUrl: "Please enter a video URL",
    invalidUrl: "Please enter a valid video URL",
    fileNotFound: "Download complete but file not found",
    eagleImportFailed: "Failed to import to Eagle",
    duplicateFound: "This video already exists in library",
    checkingDuplicate: "Checking for duplicates...",
    clickToRedownload: "Click to re-download and import",

    // Progress
    remaining: "Remaining",
  },
};

/**
 * 设置当前语言
 * @param {string} lang - 语言代码
 */
function setCurrentLang(lang) {
  currentLang = lang;
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getCurrentLang() {
  return currentLang;
}

/**
 * 获取当前语言（基于 Eagle 的语言设置）
 * 中文环境使用 zh_CN，其他环境使用 English
 */
function detectLanguage() {
  try {
    const locale = eagle.app.locale || "en";
    if (locale.startsWith("zh")) {
      return "zh_CN";
    }
    return "en";
  } catch (error) {
    return "en";
  }
}

/**
 * 根据 key 获取翻译文本
 * @param {string} key - 翻译键
 * @param {Object} params - 字符串插值的可选参数
 * @returns {string} 翻译后的文本
 */
function t(key, params = {}) {
  let text = i18n[currentLang]?.[key] || i18n["en"][key] || key;

  Object.keys(params).forEach((param) => {
    text = text.replace(new RegExp(`\\{${param}\\}`, "g"), params[param]);
  });

  return text;
}

/**
 * 应用翻译到 UI 元素
 * @param {boolean} isDownloading - 是否正在下载
 */
function applyTranslations(isDownloading = false) {
  const appName = document.getElementById("appName");
  if (appName) appName.textContent = t("appTitle");

  const videoUrl = document.getElementById("videoUrl");
  if (videoUrl) videoUrl.placeholder = t("inputPlaceholder");

  const downloadBtn = document.querySelector("#downloadForm button span");
  if (downloadBtn && !isDownloading) downloadBtn.textContent = t("downloadBtn");

  const initHint = document.querySelector(".init-hint");
  if (initHint) initHint.textContent = t("initHint");
}

module.exports = {
  i18n,
  setCurrentLang,
  getCurrentLang,
  detectLanguage,
  t,
  applyTranslations,
};
