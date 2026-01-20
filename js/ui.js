/**
 * UI 管理模块
 * 处理用户界面交互
 */

const { t } = require('./i18n');

/**
 * 更新 UI 主题
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
 * 显示初始化 UI
 */
function showInitUI() {
    const initContainer = document.getElementById('initContainer');
    const mainContainer = document.getElementById('mainContainer');

    if (initContainer) initContainer.classList.remove('hidden');
    if (mainContainer) mainContainer.classList.add('hidden');
}

/**
 * 显示主 UI
 */
function showMainUI() {
    const initContainer = document.getElementById('initContainer');
    const mainContainer = document.getElementById('mainContainer');

    if (initContainer) initContainer.classList.add('hidden');
    if (mainContainer) mainContainer.classList.remove('hidden');
}

/**
 * 更新初始化状态显示
 */
function updateInitStatus(message, progress) {
    const initMessage = document.getElementById('initMessage');
    const initProgressFill = document.getElementById('initProgressFill');

    if (initMessage) initMessage.textContent = message;
    if (initProgressFill) initProgressFill.style.width = `${progress}%`;
}

/**
 * 验证 URL 格式
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
 * 显示进度容器
 */
function showProgress() {
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }
}

/**
 * 隐藏进度容器
 */
function hideProgress() {
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
    updateProgress({ percent: 0 });
}

/**
 * 更新进度显示
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

    if (button) {
        button.style.backgroundSize = `${percent}% 100%`;
    }
}

/**
 * 更新状态消息
 */
function updateStatus(message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.classList.remove('error');
    }
}

/**
 * 显示错误消息
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
 * 清除错误状态
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

    hideRedownloadLink();
}

/**
 * 设置按钮加载状态
 */
function setButtonLoading(loading) {
    const button = document.querySelector('#downloadForm button');
    if (button) {
        button.disabled = loading;
        button.querySelector('span').textContent = loading ? t('downloadingBtn') : t('downloadBtn');

        if (loading) {
            button.style.backgroundSize = '0% 100%';
        } else {
            button.style.backgroundSize = '100% 100%';
        }
    }
}

/**
 * 显示重新下载链接
 * @param {string} url - 要重新下载的视频 URL
 * @param {Function} performDownload - 执行下载的回调函数
 */
function showRedownloadLink(url, performDownload) {
    const redownloadLink = document.getElementById('locateLink');
    if (redownloadLink) {
        redownloadLink.textContent = t('clickToRedownload');
        redownloadLink.classList.remove('hidden');
        redownloadLink.onclick = async () => {
            hideRedownloadLink();
            clearError();
            await performDownload(url);
        };
    }
}

/**
 * 隐藏重新下载链接
 */
function hideRedownloadLink() {
    const redownloadLink = document.getElementById('locateLink');
    if (redownloadLink) {
        redownloadLink.classList.add('hidden');
        redownloadLink.onclick = null;
    }
}

module.exports = {
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
    showRedownloadLink,
    hideRedownloadLink
};
