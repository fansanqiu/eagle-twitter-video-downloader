/**
 * Eagle 视频下载插件
 * 主入口 - 处理插件初始化和下载工作流
 */

// 导入模块
const { setCurrentLang, detectLanguage, t, applyTranslations } = require('./i18n');
const { getFfmpegPath, isYtDlpInstalled, downloadYtDlp } = require('./binary');
const { downloadVideo, cleanup } = require('./downloader');
const { checkDuplicateByUrl, importToEagle } = require('./eagle');
const {
  updateTheme,
  showInitUI,
  showMainUI,
  updateInitStatus,
  isValidUrl,
  showProgress,
  hideProgress,
  updateProgress,
  updateStatus,
  showError,
  clearError,
  setButtonLoading,
  showRedownloadLink
} = require('./ui');

// 状态管理
let isInitialized = false;
let isDownloading = false;

/**
 * 初始化插件
 */
eagle.onPluginCreate(async (plugin) => {
  // 检测并设置语言
  setCurrentLang(detectLanguage());

  // 应用翻译到 UI
  applyTranslations(isDownloading);

  // 更新主题
  updateTheme();

  // 聚焦输入框
  document.getElementById('videoUrl').focus();

  // 设置事件监听器
  setupEventListeners();

  // 检查并初始化二进制文件
  await initializeBinaries();
});

/**
 * 处理主题变更
 */
eagle.onThemeChanged(() => {
  updateTheme();
});

/**
 * 设置 UI 事件监听器
 */
function setupEventListeners() {
  // 关闭按钮
  document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
  });

  // 下载表单提交
  document.getElementById('downloadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isDownloading) {
      await handleDownload();
    }
  });

  // 输入时清除错误状态
  document.getElementById('videoUrl').addEventListener('input', () => {
    clearError();
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
    showMainUI();
    return;
  }

  // 需要下载 yt-dlp
  showInitUI();
  updateInitStatus(t('initDownloading'), 0);

  try {
    await downloadYtDlp((progress) => {
      updateInitStatus(t('initDownloading'), progress);
    });

    updateInitStatus(t('initComplete'), 100);

    // 短暂延迟显示完成状态
    await new Promise(resolve => setTimeout(resolve, 500));

    isInitialized = true;
    showMainUI();
  } catch (error) {
    updateInitStatus(`${t('initFailed')}: ${error.message}`, 0);
    showError(t('initNetworkError'));
  }
}

/**
 * 处理下载
 */
async function handleDownload() {
  if (!isInitialized) {
    showError(t('notInitialized'));
    return;
  }

  const urlInput = document.getElementById('videoUrl');
  const url = urlInput.value.trim();

  if (!url) {
    return;
  }

  if (!isValidUrl(url)) {
    showError(t('invalidUrl'));
    return;
  }

  // 检查重复
  isDownloading = true;
  clearError();
  showProgress();
  updateStatus(t('checkingDuplicate'));
  setButtonLoading(true);

  try {
    const existingItem = await checkDuplicateByUrl(url);
    if (existingItem) {
      const itemName = existingItem.name || 'Unknown';
      showError(`${t('duplicateFound')}: ${itemName}`);

      showRedownloadLink(url, performDownload);

      hideProgress();
      isDownloading = false;
      setButtonLoading(false);
      return;
    }
  } catch (error) {
    // 重复检查失败，继续下载
  }

  await performDownload(url);
}

/**
 * 执行实际下载和导入
 */
async function performDownload(url) {
  const urlInput = document.getElementById('videoUrl');

  isDownloading = true;
  showProgress();
  updateStatus(t('fetchingInfo'));
  setButtonLoading(true);

  let downloadedPath = null;

  try {
    const result = await downloadVideo(
      url,
      (progress) => {
        updateProgress(progress);
      },
      (status) => {
        updateStatus(status);
      }
    );

    downloadedPath = result.path;
    updateStatus(t('downloadComplete'));

    // 导入到 Eagle
    await importToEagle(result.path, result.metadata, url);

    // 成功！
    updateStatus(`${t('importSuccess')}: ${result.metadata.title}`);
    if (urlInput) urlInput.value = '';

    // 清理临时文件
    cleanup(downloadedPath);
    downloadedPath = null;

    // 延迟后隐藏进度
    setTimeout(() => {
      hideProgress();
      updateStatus('');
    }, 2000);

  } catch (error) {
    showError(error.message || t('downloadFailed'));
    hideProgress();

    if (downloadedPath) {
      cleanup(downloadedPath);
    }
  } finally {
    isDownloading = false;
    setButtonLoading(false);
  }
}