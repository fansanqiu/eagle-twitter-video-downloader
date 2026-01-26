/**
 * Eagle 集成模块
 * 处理与 Eagle 应用的交互
 */

const { t } = require("./i18n");

/**
 * 检查 Eagle 中是否已存在相同 URL 的视频
 * @param {string} url - 视频来源 URL
 * @returns {Promise<Object|null>} 如果找到则返回存在的项目，否则返回 null
 */
async function checkDuplicateByUrl(url) {
  if (typeof eagle === "undefined") {
    return null;
  }

  try {
    const items = await eagle.item.get({
      url: url,
    });

    if (items && items.length > 0) {
      return items[0];
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 导入视频到 Eagle
 */
async function importToEagle(videoPath, metadata, sourceUrl) {
  if (typeof eagle === "undefined") {
    throw new Error(t("eagleApiNotAvailable"));
  }

  const importOptions = {
    name: metadata.title || t("downloadedVideo"),
    website: sourceUrl,
    tags: [metadata.extractor || "video"],
    annotation: metadata.description ? metadata.description.slice(0, 500) : "",
  };

  try {
    const itemId = await eagle.item.addFromPath(videoPath, importOptions);
    return itemId;
  } catch (error) {
    throw new Error(`${t("eagleImportFailed")}: ${error.message}`);
  }
}

module.exports = {
  checkDuplicateByUrl,
  importToEagle,
};
