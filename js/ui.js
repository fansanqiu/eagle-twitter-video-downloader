/**
 * UI 管理模块
 * 处理用户界面交互
 */


/**
 * 更新 UI 主题
 */
function updateTheme() {
  const THEME_SUPPORT = {
    AUTO: eagle.app.isDarkColors() ? "gray" : "light",
    LIGHT: "light",
    LIGHTGRAY: "lightgray",
    GRAY: "gray",
    DARK: "dark",
    BLUE: "blue",
    PURPLE: "purple",
  };

  const theme = eagle.app.theme.toUpperCase();
  const themeName = THEME_SUPPORT[theme] ?? "dark";
  const htmlEl = document.querySelector("html");

  htmlEl.classList.add("no-transition");
  htmlEl.setAttribute("theme", themeName);
  htmlEl.setAttribute("platform", eagle.app.platform);
  htmlEl.classList.remove("no-transition");
}

/**
 * 显示初始化 UI
 */
function showInitUI() {
  const initContainer = document.getElementById("initContainer");
  const mainContainer = document.getElementById("mainContainer");

  if (initContainer) initContainer.classList.remove("hidden");
  if (mainContainer) mainContainer.classList.add("hidden");
}

/**
 * 显示主 UI
 */
function showMainUI() {
  const initContainer = document.getElementById("initContainer");
  const mainContainer = document.getElementById("mainContainer");

  if (initContainer) initContainer.classList.add("hidden");
  if (mainContainer) mainContainer.classList.remove("hidden");
}

/**
 * 更新初始化状态显示
 */
function updateInitStatus(message, progress) {
  const initMessage = document.getElementById("initMessage");
  const initProgressFill = document.getElementById("initProgressFill");

  if (initMessage) initMessage.textContent = message;
  if (initProgressFill) initProgressFill.style.width = `${progress}%`;
}

/**
 * 验证 URL 格式
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

/**
 * 显示进度容器
 */
function showProgress() {
  const progressContainer = document.getElementById("progressContainer");
  if (progressContainer) {
    progressContainer.classList.remove("hidden");
  }
}

/**
 * 隐藏进度容器
 */
function hideProgress() {
  const progressContainer = document.getElementById("progressContainer");
  if (progressContainer) {
    progressContainer.classList.add("hidden");
  }
  updateProgress({ percent: 0 });
}

/**
 * 更新进度显示
 */
function updateProgress(progress) {
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const progressSpeed = document.getElementById("progressSpeed");
  const progressEta = document.getElementById("progressEta");
  const button = document.querySelector("#downloadForm button");

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
    progressEta.textContent = `${t("progress.remaining")}: ${progress.eta}`;
  }

  if (button) {
    button.style.backgroundSize = `${percent}% 100%`;
  }
}

/**
 * 更新状态消息
 */
function updateStatus(message) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.remove("error");
  }
}

/**
 * 显示错误消息
 */
function showError(message) {
  const statusEl = document.getElementById("status");
  const urlInput = document.getElementById("videoUrl");

  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.add("error");
  }
  if (urlInput) {
    urlInput.classList.add("error");
  }
}

/**
 * 清除错误状态
 */
function clearError() {
  const statusEl = document.getElementById("status");
  const urlInput = document.getElementById("videoUrl");

  if (statusEl) {
    statusEl.textContent = "";
    statusEl.classList.remove("error");
  }
  if (urlInput) {
    urlInput.classList.remove("error");
  }

  hideRedownloadLink();
}

/**
 * 设置按钮加载状态
 */
function setButtonLoading(loading) {
  const button = document.querySelector("#downloadForm button");
  if (button) {
    button.disabled = loading;
    button.querySelector("span").textContent = loading
      ? t("ui.downloadingBtn")
      : t("ui.downloadBtn");

    if (loading) {
      button.style.backgroundSize = "0% 100%";
    } else {
      button.style.backgroundSize = "100% 100%";
    }
  }
}

/**
 * 显示重新下载链接
 * @param {string} url - 要重新下载的视频 URL
 * @param {Function} performDownload - 执行下载的回调函数
 */
function showRedownloadLink(url, performDownload) {
  const redownloadLink = document.getElementById("locateLink");
  if (redownloadLink) {
    redownloadLink.textContent = t("error.clickToRedownload");
    redownloadLink.classList.remove("hidden");
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
  const redownloadLink = document.getElementById("locateLink");
  if (redownloadLink) {
    redownloadLink.classList.add("hidden");
    redownloadLink.onclick = null;
  }
}

/**
 * 渲染整个队列 UI
 */
function renderQueueUI() {
  const queue = require("./queue");
  const queueContainer = document.getElementById("queueContainer");
  if (!queueContainer) return;

  const items = queue.getQueueState();

  // 清空容器
  queueContainer.innerHTML = "";

  // 渲染每个项目
  items.forEach((item) => {
    const itemElement = renderDownloadItem(item);
    queueContainer.appendChild(itemElement);
  });
}

/**
 * 渲染单个下载项目
 */
function renderDownloadItem(item) {
  const div = document.createElement("div");
  div.className = "download-item";
  div.setAttribute("data-item-id", item.id);

  // 构建元数据字符串
  const metadata =
    [item.source, item.format, item.resolution, item.fileSize]
      .filter((v) => v)
      .join(" - ") || t("ui.loading");

  // 根据状态显示不同的进度条内容
  let progressContent = "";
  let statusText = "";

  switch (item.state) {
    case "waiting":
      statusText = t("ui.waiting");
      progressContent = `<div class="progress-text">${statusText}</div>`;
      break;
    case "preparing":
      statusText = t("ui.preparing");
      progressContent = `<div class="progress-text">${statusText}</div>`;
      break;
    case "downloading":
      statusText = `${Math.round(item.progress)}%`;
      progressContent = `
                <div class="progress-bar-fill" style="width: ${item.progress}%"></div>
                <div class="progress-text">${statusText}</div>
            `;
      break;
    case "completed":
      statusText = t("ui.completed");
      progressContent = `
                <div class="progress-bar-fill" style="width: 100%"></div>
                <div class="progress-text">${statusText}</div>
            `;
      break;
    case "error":
      statusText = item.error || t("download.failed");
      break;
  }

  // 构建 HTML
  div.innerHTML = `
        <div class="item-header">
            <div class="item-title">${escapeHtml(item.title)}</div>
            ${item.state === "error" ? `<button class="item-retry">${t("ui.retry")}</button>` : ""}
        </div>
        <div class="item-metadata">${escapeHtml(metadata)}</div>
        ${
          item.state === "error"
            ? `<div class="item-error">${escapeHtml(statusText)}</div>`
            : `<div class="item-progress">
                <div class="progress-bar-container">
                    ${progressContent}
                </div>
            </div>`
        }
    `;

  // 添加重试按钮事件
  if (item.state === "error") {
    const retryBtn = div.querySelector(".item-retry");
    if (retryBtn) {
      retryBtn.onclick = () => {
        const queue = require("./queue");
        queue.retryDownload(item.id);
      };
    }
  }

  return div;
}

/**
 * 更新单个下载项目
 */
function updateDownloadItem(itemId, item) {
  const existingElement = document.querySelector(`[data-item-id="${itemId}"]`);

  if (existingElement) {
    // 更新现有元素
    const newElement = renderDownloadItem(item);
    existingElement.replaceWith(newElement);
  } else {
    // 添加新元素到顶部
    const queueContainer = document.getElementById("queueContainer");
    if (queueContainer) {
      const newElement = renderDownloadItem(item);
      queueContainer.insertBefore(newElement, queueContainer.firstChild);
    }
  }
}

/**
 * 滚动到顶部
 */
function scrollToTop() {
  const queueContainer = document.getElementById("queueContainer");
  if (queueContainer) {
    queueContainer.scrollTop = 0;
  }
}

/**
 * 设置输入栏
 */
function setupInputBar() {
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");

  if (!urlInput || !addButton) return;

  // 清除错误状态
  urlInput.addEventListener("input", () => {
    clearInputError();
  });

  // 处理提交
  const handleSubmit = () => {
    const url = urlInput.value.trim();

    if (!url) {
      showInputError(t("error.emptyUrl"));
      return;
    }

    if (!isValidUrl(url)) {
      showInputError(t("error.invalidUrl"));
      return;
    }

    // 触发自定义事件
    const event = new CustomEvent("addToQueue", { detail: { url } });
    document.dispatchEvent(event);
  };

  // 按钮点击
  addButton.addEventListener("click", handleSubmit);

  // 回车键
  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  });
}

/**
 * 清空输入栏
 */
function clearInputBar() {
  const urlInput = document.getElementById("urlInput");
  if (urlInput) {
    urlInput.value = "";
    clearInputError();
  }
}

/**
 * 显示输入错误
 */
function showInputError(message) {
  const urlInput = document.getElementById("urlInput");
  if (urlInput) {
    urlInput.classList.add("error");
    urlInput.setAttribute("placeholder", message);
  }
}

/**
 * 清除输入错误
 */
function clearInputError() {
  const urlInput = document.getElementById("urlInput");
  if (urlInput) {
    urlInput.classList.remove("error");
    urlInput.setAttribute("placeholder", t("ui.inputPlaceholder"));
  }
}

/**
 * 转义 HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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
  hideRedownloadLink,
  // 新的队列 UI 函数
  renderQueueUI,
  renderDownloadItem,
  updateDownloadItem,
  scrollToTop,
  setupInputBar,
  clearInputBar,
  showInputError,
  clearInputError,
};
