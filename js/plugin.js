/**
 * Eagle Video Downloader Plugin
 * Main plugin logic - handles UI interaction and coordinates download workflow
 */

// Node.js modules (available in Eagle's Electron environment)
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const https = require('https');

// Plugin paths
const PLUGIN_ROOT = __dirname.replace(/[/\\]js$/, '');
const BIN_DIR = path.join(PLUGIN_ROOT, 'bin');

// State management
let isInitialized = false;
let isDownloading = false;
let ffmpegPath = null;
let currentLang = 'en';

// ====================================
// Internationalization (i18n)
// ====================================

const i18n = {
  zh_CN: {
    // UI Labels
    appTitle: '视频下载器',
    inputLabel: '视频链接 (支持 YouTube, Twitter, Bilibili, TikTok 等)',
    inputPlaceholder: '粘贴任意视频链接...',
    downloadBtn: '下载',
    downloadingBtn: '下载中...',
    
    // Init messages
    initDownloading: '正在下载 yt-dlp...',
    initComplete: '初始化完成！',
    initFailed: '初始化失败',
    initHint: '首次使用需要下载必要组件，请稍候...',
    initNetworkError: '初始化失败，请检查网络连接后重试',
    
    // Download messages
    fetchingInfo: '正在获取视频信息...',
    foundVideo: '找到视频',
    downloading: '正在下载视频...',
    downloadComplete: '下载完成，正在导入 Eagle...',
    importSuccess: '导入成功',
    downloadFailed: '下载失败',
    
    // Error messages
    notInitialized: '插件尚未初始化完成',
    emptyUrl: '请输入视频链接',
    invalidUrl: '请输入有效的视频链接',
    fileNotFound: '下载完成但找不到文件',
    eagleImportFailed: '导入 Eagle 失败',
    duplicateFound: '该视频已存在于库中',
    checkingDuplicate: '正在检查重复...',
    clickToRedownload: '点击重新下载并导入',
    
    // Progress
    remaining: '剩余'
  },
  en: {
    // UI Labels
    appTitle: 'Video Downloader',
    inputLabel: 'Video URL (YouTube, Twitter, Bilibili, TikTok, etc.)',
    inputPlaceholder: 'Paste any video URL...',
    downloadBtn: 'Download',
    downloadingBtn: 'Downloading...',
    
    // Init messages
    initDownloading: 'Downloading yt-dlp...',
    initComplete: 'Initialization complete!',
    initFailed: 'Initialization failed',
    initHint: 'First-time setup requires downloading components, please wait...',
    initNetworkError: 'Initialization failed. Please check your network connection.',
    
    // Download messages
    fetchingInfo: 'Fetching video information...',
    foundVideo: 'Found video',
    downloading: 'Downloading video...',
    downloadComplete: 'Download complete, importing to Eagle...',
    importSuccess: 'Import successful',
    downloadFailed: 'Download failed',
    
    // Error messages
    notInitialized: 'Plugin not yet initialized',
    emptyUrl: 'Please enter a video URL',
    invalidUrl: 'Please enter a valid video URL',
    fileNotFound: 'Download complete but file not found',
    eagleImportFailed: 'Failed to import to Eagle',
    duplicateFound: 'This video already exists in library',
    checkingDuplicate: 'Checking for duplicates...',
    clickToRedownload: 'Click to re-download and import',
    
    // Progress
    remaining: 'Remaining'
  }
};

/**
 * Get current language based on Eagle locale
 * Chinese locales use zh_CN, all others use English
 */
function detectLanguage() {
  try {
    const locale = eagle.app.locale || 'en';
    // Check if locale starts with 'zh' (zh_CN, zh_TW, zh_HK, etc.)
    if (locale.startsWith('zh')) {
      return 'zh_CN';
    }
    return 'en';
  } catch (error) {
    return 'en';
  }
}

/**
 * Get translated text by key
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for string interpolation
 * @returns {string} Translated text
 */
function t(key, params = {}) {
  const lang = currentLang;
  let text = i18n[lang]?.[key] || i18n['en'][key] || key;
  
  // Simple parameter interpolation: {param} -> value
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });
  
  return text;
}

/**
 * Apply translations to UI elements
 */
function applyTranslations() {
  // App title
  const appName = document.getElementById('appName');
  if (appName) appName.textContent = t('appTitle');
  
  // Input label
  const inputLabel = document.querySelector('label[for="videoUrl"]');
  if (inputLabel) inputLabel.textContent = t('inputLabel');
  
  // Input placeholder
  const videoUrl = document.getElementById('videoUrl');
  if (videoUrl) videoUrl.placeholder = t('inputPlaceholder');
  
  // Download button
  const downloadBtn = document.querySelector('#downloadForm button span');
  if (downloadBtn && !isDownloading) downloadBtn.textContent = t('downloadBtn');
  
  // Init hint
  const initHint = document.querySelector('.init-hint');
  if (initHint) initHint.textContent = t('initHint');
}

// ====================================
// Binary Management
// ====================================

/**
 * Get platform-specific binary name for yt-dlp
 */
function getYtDlpBinaryName() {
  const platform = os.platform();
  switch (platform) {
    case 'win32':
      return 'yt-dlp.exe';
    case 'darwin':
      return 'yt-dlp_macos';
    case 'linux':
      return 'yt-dlp_linux';
    default:
      return 'yt-dlp';
  }
}

/**
 * Get path to yt-dlp binary
 */
function getYtDlpPath() {
  return path.join(BIN_DIR, getYtDlpBinaryName());
}

/**
 * Get path to ffmpeg binary from ffmpeg-static
 */
function getFfmpegPath() {
  try {
    // ffmpeg-static is installed via npm and provides the binary path
    return require('ffmpeg-static');
  } catch (error) {
    return null;
  }
}

/**
 * Check if yt-dlp binary exists
 */
function isYtDlpInstalled() {
  return fs.existsSync(getYtDlpPath());
}

/**
 * Download file with progress
 */
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath, onProgress)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (onProgress && totalSize) {
          onProgress(Math.round((downloadedSize / totalSize) * 100));
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    });
    
    request.on('error', (error) => {
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      reject(error);
    });
  });
}

/**
 * Get the latest yt-dlp release download URL from GitHub
 */
async function getYtDlpDownloadUrl() {
  return new Promise((resolve, reject) => {
    const binaryName = getYtDlpBinaryName();
    
    // Check for unsupported platform
    if (binaryName === 'yt-dlp') {
      reject(new Error(`Unsupported platform: ${os.platform()}`));
      return;
    }
    
    const options = {
      hostname: 'api.github.com',
      path: '/repos/yt-dlp/yt-dlp/releases/latest',
      headers: {
        'User-Agent': 'Eagle-Video-Downloader'
      }
    };
    
    https.get(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const release = JSON.parse(data);
          const asset = release.assets.find(a => a.name === binaryName);
          
          if (asset) {
            resolve(asset.browser_download_url);
          } else {
            reject(new Error(`Binary ${binaryName} not found in release`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Download yt-dlp binary
 */
async function downloadYtDlp(onProgress) {
  // Ensure bin directory exists
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }
  
  const destPath = getYtDlpPath();
  
  try {
    // Get download URL
    const downloadUrl = await getYtDlpDownloadUrl();
    
    // Download the binary
    await downloadFile(downloadUrl, destPath, onProgress);
    
    // Make executable on Unix systems
    if (os.platform() !== 'win32') {
      fs.chmodSync(destPath, '755');
    }
    
    return destPath;
  } catch (error) {
    throw error;
  }
}

// ====================================
// Video Downloading
// ====================================

/**
 * Execute yt-dlp command
 */
function execYtDlp(args, onProgress, onOutput) {
  return new Promise((resolve, reject) => {
    const ytdlp = getYtDlpPath();
    
    if (!fs.existsSync(ytdlp)) {
      reject(new Error('yt-dlp not installed'));
      return;
    }
    
    const proc = spawn(ytdlp, args, {
      cwd: BIN_DIR
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      if (onOutput) onOutput(output);
      
      // Parse progress from yt-dlp output
      // Format: [download]  XX.X% of ~XXX.XXMB at XXX.XXKB/s ETA XX:XX
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\S+)\s+at\s+(\S+)\s+ETA\s+(\S+)/);
      if (progressMatch && onProgress) {
        onProgress({
          percent: parseFloat(progressMatch[1]),
          totalSize: progressMatch[2],
          currentSpeed: progressMatch[3],
          eta: progressMatch[4]
        });
      }
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('error', (error) => {
      reject(new Error(`Failed to execute yt-dlp: ${error.message}`));
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * Get video information
 */
async function getVideoInfo(url) {
  const args = [
    '--dump-json',
    '--no-warnings',
    url
  ];
  
  const output = await execYtDlp(args);
  const info = JSON.parse(output.trim().split('\n')[0]);
  
  return {
    title: info.title || 'Untitled Video',
    description: info.description || '',
    duration: info.duration || 0,
    thumbnail: info.thumbnail || null,
    uploader: info.uploader || info.channel || 'Unknown',
    extractor: info.extractor || 'unknown',
    webpage_url: info.webpage_url || url,
    id: info.id || null
  };
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/**
 * Get temp directory for downloads
 */
function getTempDir() {
  const tempDir = path.join(os.tmpdir(), 'eagle-video-downloader');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Download video
 */
async function downloadVideo(url, onProgress, onStatus) {
  // Get video info first
  if (onStatus) onStatus(t('fetchingInfo'));
  
  let videoInfo;
  try {
    videoInfo = await getVideoInfo(url);
    if (onStatus) onStatus(`${t('foundVideo')}: ${videoInfo.title}`);
  } catch (error) {
    videoInfo = { title: 'video', extractor: 'unknown' };
  }
  
  // Prepare output path
  const outputDir = getTempDir();
  const sanitizedTitle = sanitizeFilename(videoInfo.title);
  const outputPath = path.join(outputDir, `${sanitizedTitle}.mp4`);
  
  // Delete existing file if present
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  
  // Build yt-dlp arguments
  const args = [
    url,
    '-o', outputPath,
    '-f', 'bestvideo+bestaudio/best',
    '--merge-output-format', 'mp4',
    '--no-playlist',
    '--no-warnings'
  ];
  
  // Add ffmpeg location if available
  const ffmpeg = getFfmpegPath();
  if (ffmpeg && fs.existsSync(ffmpeg)) {
    args.push('--ffmpeg-location', path.dirname(ffmpeg));
  }
  
  if (onStatus) onStatus(t('downloading'));
  
  await execYtDlp(args, onProgress);
  
  // Verify file exists
  if (!fs.existsSync(outputPath)) {
    // Try to find the file with different extension
    const files = fs.readdirSync(outputDir);
    const matchingFile = files.find(f => f.startsWith(sanitizedTitle));
    if (matchingFile) {
      return {
        path: path.join(outputDir, matchingFile),
        metadata: videoInfo,
        filename: matchingFile
      };
    }
    throw new Error(t('fileNotFound'));
  }
  
  return {
    path: outputPath,
    metadata: videoInfo,
    filename: path.basename(outputPath)
  };
}

/**
 * Check if a video with the same URL already exists in Eagle
 * @param {string} url - Video source URL
 * @returns {Promise<Object|null>} Existing item if found, null otherwise
 */
async function checkDuplicateByUrl(url) {
  if (typeof eagle === 'undefined') {
    return null;
  }
  
  try {
    // Use eagle.item.get to search for items with the same source URL
    // Note: The correct parameter is 'url', not 'website'
    const items = await eagle.item.get({
      url: url
    });
    
    if (items && items.length > 0) {
      const item = items[0];
      return item;
    }
    
    return null;
  } catch (error) {
    // Don't block download if check fails
    return null;
  }
}

/**
 * Import video to Eagle
 */
async function importToEagle(videoPath, metadata, sourceUrl) {
  if (typeof eagle === 'undefined') {
    throw new Error('Eagle API not available');
  }
  
  const importOptions = {
    name: metadata.title || 'Downloaded Video',
    website: sourceUrl,
    tags: [metadata.extractor || 'video'],
    annotation: metadata.description ? metadata.description.slice(0, 500) : ''
  };
  
  try {
    const itemId = await eagle.item.addFromPath(videoPath, importOptions);
    return itemId;
  } catch (error) {
    throw new Error(`${t('eagleImportFailed')}: ${error.message}`);
  }
}

/**
 * Clean up temp file
 */
function cleanup(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// ====================================
// UI Management
// ====================================

// Window size constants
const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 80;  // Fixed height, matches manifest.json

/**
 * Initialize the plugin
 */
eagle.onPluginCreate(async (plugin) => {
  // Detect and set language
  currentLang = detectLanguage();
  
  // Apply translations to UI
  applyTranslations();
  
  updateTheme();
  
  // Focus on input field
  document.getElementById('videoUrl').focus();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check and initialize binaries
  await initializeBinaries();
});

/**
 * Handle theme changes
 */
eagle.onThemeChanged(() => {
  updateTheme();
});

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
  // Close button
  document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
  });
  
  // Download form submission
  document.getElementById('downloadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isDownloading) {
      await handleDownload();
    }
  });
  
  // Clear error state on input
  document.getElementById('videoUrl').addEventListener('input', () => {
    clearError();
  });
}

/**
 * Update UI theme
 */
function updateTheme() {
  const THEME_SUPPORT = {
    AUTO: eagle.app.isDarkColors() ? 'gray' : 'light',
    LIGHT: 'light',
    LIGHTGRAY: 'lightgray',
    GRAY: 'gray',
    DARK: 'dark',
    BLUE: 'blue',
    PURPLE: 'purple',
  };
  
  const theme = eagle.app.theme.toUpperCase();
  const themeName = THEME_SUPPORT[theme] ?? 'dark';
  const htmlEl = document.querySelector('html');
  
  htmlEl.classList.add('no-transition');
  htmlEl.setAttribute('theme', themeName);
  htmlEl.setAttribute('platform', eagle.app.platform);
  htmlEl.classList.remove('no-transition');
}

/**
 * Initialize binaries
 */
async function initializeBinaries() {
  // Check ffmpeg
  ffmpegPath = getFfmpegPath();
  
  if (isYtDlpInstalled()) {
    isInitialized = true;
    showMainUI();
    return;
  }
  
  // Need to download yt-dlp
  showInitUI();
  updateInitStatus(t('initDownloading'), 0);
  
  try {
    await downloadYtDlp((progress) => {
      updateInitStatus(t('initDownloading'), progress);
    });
    
    updateInitStatus(t('initComplete'), 100);
    
    // Brief delay to show completion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    isInitialized = true;
    showMainUI();
  } catch (error) {
    updateInitStatus(`${t('initFailed')}: ${error.message}`, 0);
    showError(t('initNetworkError'));
  }
}

/**
 * Show init UI
 */
function showInitUI() {
  const initContainer = document.getElementById('initContainer');
  const mainContainer = document.getElementById('mainContainer');
  
  if (initContainer) initContainer.style.display = 'block';
  if (mainContainer) mainContainer.style.display = 'none';
}

/**
 * Show main UI
 */
function showMainUI() {
  const initContainer = document.getElementById('initContainer');
  const mainContainer = document.getElementById('mainContainer');
  
  if (initContainer) initContainer.style.display = 'none';
  if (mainContainer) mainContainer.style.display = 'block';
}

/**
 * Update init status display
 */
function updateInitStatus(message, progress) {
  const initMessage = document.getElementById('initMessage');
  const initProgressFill = document.getElementById('initProgressFill');
  
  if (initMessage) initMessage.textContent = message;
  if (initProgressFill) initProgressFill.style.width = `${progress}%`;
}

/**
 * Handle download
 */
async function handleDownload() {
  if (!isInitialized) {
    showError(t('notInitialized'));
    return;
  }
  
  const urlInput = document.getElementById('videoUrl');
  const url = urlInput.value.trim();
  
  if (!url) {
    showError(t('emptyUrl'));
    return;
  }
  
  // Basic URL validation
  if (!isValidUrl(url)) {
    showError(t('invalidUrl'));
    return;
  }
  
  // Check for duplicates before downloading
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
      
      // Show redownload link - user can choose to redownload
      showRedownloadLink(url);
      
      hideProgress();
      isDownloading = false;
      setButtonLoading(false);
      return;
    }
  } catch (error) {
    // If duplicate check fails, continue with download
  }
  
  // Proceed with download (performDownload will manage its own state)
  await performDownload(url);
}

/**
 * Perform the actual download and import (skips duplicate check)
 * @param {string} url - Video URL to download
 */
async function performDownload(url) {
  const urlInput = document.getElementById('videoUrl');
  
  isDownloading = true;
  showProgress();
  updateStatus(t('fetchingInfo'));
  setButtonLoading(true);
  
  let downloadedPath = null;
  
  try {
    // Download video
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
    
    // Import to Eagle
    await importToEagle(result.path, result.metadata, url);
    
    // Success!
    updateStatus(`${t('importSuccess')}: ${result.metadata.title}`);
    if (urlInput) urlInput.value = '';
    
    // Cleanup temp file
    cleanup(downloadedPath);
    downloadedPath = null;
    
    // Hide progress after delay
    setTimeout(() => {
      hideProgress();
      updateStatus('');
    }, 2000);
    
  } catch (error) {
    showError(error.message || t('downloadFailed'));
    hideProgress();
    
    // Cleanup on error
    if (downloadedPath) {
      cleanup(downloadedPath);
    }
  } finally {
    isDownloading = false;
    setButtonLoading(false);
  }
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Show progress container
 */
function showProgress() {
  const progressContainer = document.getElementById('progressContainer');
  if (progressContainer) {
    progressContainer.style.display = 'block';
  }
}

/**
 * Hide progress container
 */
function hideProgress() {
  const progressContainer = document.getElementById('progressContainer');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }
  updateProgress({ percent: 0 });
}

/**
 * Update progress display
 */
function updateProgress(progress) {
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressSpeed = document.getElementById('progressSpeed');
  const progressEta = document.getElementById('progressEta');
  const button = document.querySelector('#downloadForm button');
  
  const percent = progress.percent || 0;
  
  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }
  if (progressPercent) {
    progressPercent.textContent = `${Math.round(percent)}%`;
  }
  if (progressSpeed && progress.currentSpeed) {
    progressSpeed.textContent = progress.currentSpeed;
  }
  if (progressEta && progress.eta) {
    progressEta.textContent = `${t('remaining')}: ${progress.eta}`;
  }
  
  // Update button progress fill (left to right)
  if (button) {
    button.style.backgroundSize = `${percent}% 100%`;
  }
}

/**
 * Update status message
 */
function updateStatus(message) {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.remove('error');
  }
}

/**
 * Show error message
 */
function showError(message) {
  const statusEl = document.getElementById('status');
  const urlInput = document.getElementById('videoUrl');
  
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.add('error');
  }
  if (urlInput) {
    urlInput.classList.add('error');
  }
}

/**
 * Clear error state
 */
function clearError() {
  const statusEl = document.getElementById('status');
  const urlInput = document.getElementById('videoUrl');
  
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.classList.remove('error');
  }
  if (urlInput) {
    urlInput.classList.remove('error');
  }
  
  // Also hide redownload link
  hideRedownloadLink();
}

/**
 * Set button loading state
 */
function setButtonLoading(loading) {
  const button = document.querySelector('#downloadForm button');
  if (button) {
    button.disabled = loading;
    button.querySelector('span').textContent = loading ? t('downloadingBtn') : t('downloadBtn');
    
    // Reset or restore button progress fill
    if (loading) {
      // Start with 0% progress when loading begins
      button.style.backgroundSize = '0% 100%';
    } else {
      // Restore to full when not loading
      button.style.backgroundSize = '100% 100%';
    }
  }
}

/**
 * Show redownload link for duplicate item
 * @param {string} url - Video URL to redownload
 */
function showRedownloadLink(url) {
  const redownloadLink = document.getElementById('locateLink');
  if (redownloadLink) {
    redownloadLink.textContent = t('clickToRedownload');
    redownloadLink.style.display = 'block';
    redownloadLink.onclick = async () => {
      // Hide the link and proceed with download
      hideRedownloadLink();
      clearError();
      
      // Proceed with download (skip duplicate check)
      await performDownload(url);
    };
  }
}

/**
 * Hide redownload link
 */
function hideRedownloadLink() {
  const redownloadLink = document.getElementById('locateLink');
  if (redownloadLink) {
    redownloadLink.style.display = 'none';
    redownloadLink.onclick = null;
  }
}