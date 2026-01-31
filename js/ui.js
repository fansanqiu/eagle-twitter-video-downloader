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
 * 显示下载状态区域
 */
function showDownloadStatus() {
  const downloadContainer = document.getElementById("downloadContainer");
  if (downloadContainer) {
    downloadContainer.classList.remove("hidden");
  }
}

/**
 * 隐藏下载状态区域
 */
function hideDownloadStatus() {
  const downloadContainer = document.getElementById("downloadContainer");
  if (downloadContainer) {
    downloadContainer.classList.add("hidden");
  }
}

/**
 * 渲染下载状态
 */
function renderDownloadStatus(item) {
  const downloadContainer = document.getElementById("downloadContainer");
  if (!downloadContainer) return;

  // 从 URL 提取 source（hostname）
  let source = item.source;
  if (!source && item.url) {
    try {
      source = new URL(item.url).hostname;
    } catch (e) {
      source = "";
    }
  }

  // 构建元数据项数组（只包含有值的项）
  const metadataItems = [source, item.format, item.resolution].filter((v) => v);

  // 根据状态显示不同的进度条内容
  let progressContent = "";
  let statusText = "";
  let hoverText = "";
  let hoverAction = ""; // "cancel" or "retry"

  switch (item.state) {
    case "preparing":
      statusText = i18next.t("ui.preparing");
      hoverText = i18next.t("ui.cancel");
      hoverAction = "cancel";
      progressContent = `
        <div class="progress-text progress-status">${statusText}</div>
        <div class="progress-text progress-hover">${hoverText}</div>
      `;
      break;
    case "downloading":
      statusText = i18next.t("ui.downloading");
      hoverText = i18next.t("ui.cancel");
      hoverAction = "cancel";
      progressContent = `
        <div class="progress-bar-fill" style="width: ${item.progress}%"></div>
        <div class="progress-text progress-status">${statusText}</div>
        <div class="progress-text progress-hover">${hoverText}</div>
      `;
      break;
    case "completed":
      statusText = i18next.t("ui.completed");
      progressContent = `
        <div class="progress-bar-fill" style="width: 100%"></div>
        <div class="progress-text">${statusText}</div>
      `;
      break;
    case "error":
      statusText = item.error || i18next.t("download.failed");
      hoverText = i18next.t("ui.retry");
      hoverAction = "retry";
      progressContent = `
        <div class="progress-text progress-status error">${escapeHtml(statusText)}</div>
        <div class="progress-text progress-hover">${hoverText}</div>
      `;
      break;
  }

  // 添加可交互类名
  const interactiveClass = hoverAction ? "interactive" : "";

  // 构建 HTML
  const metadataHtml = metadataItems
    .map((v) => `<span class="metadata-tag">${escapeHtml(v)}</span>`)
    .join("");

  downloadContainer.innerHTML = `
    <div class="download-item">
      <div class="item-content">
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-metadata">${metadataHtml}</div>
      </div>
      <div class="item-progress ${interactiveClass}" data-action="${hoverAction}">
        <div class="progress-bar-container">
          ${progressContent}
        </div>
      </div>
    </div>
  `;

  // 添加交互事件
  if (hoverAction) {
    const progressEl = downloadContainer.querySelector(".item-progress");
    if (progressEl) {
      progressEl.onclick = () => {
        if (hoverAction === "retry") {
          document.dispatchEvent(new CustomEvent("retryDownload"));
        } else if (hoverAction === "cancel") {
          document.dispatchEvent(new CustomEvent("cancelDownload"));
        }
      };
    }
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
      showInputError(i18next.t("error.emptyUrl"));
      return;
    }

    if (!isValidUrl(url)) {
      showInputError(i18next.t("error.invalidUrl"));
      return;
    }

    // 触发下载事件
    const event = new CustomEvent("startDownload", { detail: { url } });
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
    urlInput.setAttribute("placeholder", i18next.t("ui.inputPlaceholder"));
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

/**
 * 设置输入栏状态
 * @param {string} state - 'idle' | 'preparing' | 'downloading' | 'error'
 * @param {string} errorMessage - 错误信息（仅 error 状态使用）
 */
function setInputBarState(state, errorMessage = "") {
  const addButton = document.getElementById("addButton");
  const inputOverlay = document.querySelector(".input-overlay");
  const overlayText = document.querySelector(".overlay-text");
  const buttonImg = addButton?.querySelector("img");

  // 移除所有状态
  addButton?.classList.remove("disabled", "error");
  inputOverlay?.classList.add("hidden");

  // 移除错误 tooltip
  const existingTooltip = addButton?.querySelector(".error-tooltip");
  if (existingTooltip) existingTooltip.remove();

  switch (state) {
    case "preparing":
      addButton?.classList.add("disabled");
      inputOverlay?.classList.remove("hidden");
      if (overlayText) overlayText.textContent = "Preparing...";
      if (buttonImg) buttonImg.src = "assets/icon_download.svg";
      break;

    case "downloading":
      addButton?.classList.add("disabled");
      inputOverlay?.classList.remove("hidden");
      if (overlayText) overlayText.textContent = "Downloading...";
      if (buttonImg) buttonImg.src = "assets/icon_download.svg";
      break;

    case "error":
      if (buttonImg) buttonImg.src = "assets/icon_error.svg";
      addButton?.classList.add("error");
      // 添加 tooltip
      if (addButton && errorMessage) {
        const tooltip = document.createElement("span");
        tooltip.className = "error-tooltip";
        tooltip.textContent = errorMessage;
        addButton.appendChild(tooltip);
      }
      break;

    case "idle":
    default:
      if (buttonImg) buttonImg.src = "assets/icon_download.svg";
      break;
  }
}

/**
 * 重置输入栏到初始状态
 */
function resetInputBar() {
  setInputBarState("idle");
}

module.exports = {
  updateTheme,
  showInitUI,
  showMainUI,
  updateInitStatus,
  isValidUrl,
  showDownloadStatus,
  hideDownloadStatus,
  renderDownloadStatus,
  setupInputBar,
  clearInputBar,
  showInputError,
  clearInputError,
  setInputBarState,
  resetInputBar,
};
