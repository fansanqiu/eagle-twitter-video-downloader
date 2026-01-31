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
 * 设置输入栏
 */
function setupInputBar() {
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");

  if (!urlInput || !addButton) return;

  // 更新按钮状态的辅助函数
  const updateButtonState = () => {
    const hasContent = urlInput.value.trim().length > 0;
    if (hasContent) {
      addButton.classList.remove("disabled");
    } else {
      addButton.classList.add("disabled");
    }
  };

  // 初始状态：禁用按钮
  addButton.classList.add("disabled");

  // 监听输入变化
  urlInput.addEventListener("input", () => {
    resetInputBar();
    updateButtonState();
  });

  // 处理提交
  const handleSubmit = () => {
    const url = urlInput.value.trim();

    // 无内容时不处理（按钮已禁用，但防止回车触发）
    if (!url) return;

    if (!isValidUrl(url)) {
      setInputBarState("error", i18next.t("error.invalidUrl"));
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
 * 清空输入栏内容（不重置状态）
 */
function clearInputBar() {
  const urlInput = document.getElementById("urlInput");
  if (urlInput) {
    urlInput.value = "";
  }
}

/**
 * 设置输入栏状态
 * @param {string} state - 'idle' | 'preparing' | 'downloading' | 'completed' | 'error'
 * @param {string} errorMessage - 错误信息（仅 error 状态使用）
 */
function setInputBarState(state, errorMessage = "") {
  const inputBar = document.querySelector(".input-bar");
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");
  const buttonImg = addButton?.querySelector("img");
  const successMessage = document.querySelector(".success-message");
  const successText = document.getElementById("successText");

  // 移除所有状态
  addButton?.classList.remove("disabled", "error", "loading");
  inputBar?.classList.remove("success");
  if (urlInput) urlInput.disabled = false;
  successMessage?.classList.add("hidden");

  // 移除错误 tooltip
  const existingTooltip = addButton?.querySelector(".error-tooltip");
  if (existingTooltip) existingTooltip.remove();

  switch (state) {
    case "preparing":
    case "downloading":
      addButton?.classList.add("disabled", "loading");
      if (buttonImg) buttonImg.src = "assets/icon_loading.svg";
      if (urlInput) urlInput.disabled = true;
      break;

    case "completed":
      inputBar?.classList.add("success");
      successMessage?.classList.remove("hidden");
      if (successText) successText.textContent = i18next.t("ui.successDownload");
      if (buttonImg) buttonImg.src = "assets/icon_add.svg";
      // 点击按钮恢复默认状态
      if (addButton) {
        addButton.onclick = () => {
          resetInputBar();
          addButton.onclick = null; // 恢复后移除这个特殊处理
        };
      }
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
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");

  setInputBarState("idle");

  // 更新按钮状态
  if (urlInput && addButton) {
    const hasContent = urlInput.value.trim().length > 0;
    if (hasContent) {
      addButton.classList.remove("disabled");
    } else {
      addButton.classList.add("disabled");
    }
  }

  // 聚焦输入框
  if (urlInput) {
    urlInput.focus();
  }
}

module.exports = {
  updateTheme,
  showInitUI,
  showMainUI,
  updateInitStatus,
  isValidUrl,
  setupInputBar,
  clearInputBar,
  setInputBarState,
  resetInputBar,
};
