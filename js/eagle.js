/**
 * Eagle 集成模块
 * 处理与 Eagle 应用的交互
 */

/**
 * 导入视频到 Eagle
 */
async function importToEagle(videoPath, metadata, sourceUrl) {
  if (typeof eagle === "undefined") {
    throw new Error(i18next.t("error.eagleApiNotAvailable"));
  }

  const importOptions = {
    name: metadata.title || i18next.t("error.downloadedVideo"),
    website: sourceUrl,
    tags: [metadata.extractor || "video"],
    annotation: metadata.description ? metadata.description.slice(0, 500) : "",
  };

  try {
    const itemId = await eagle.item.addFromPath(videoPath, importOptions);
    return itemId;
  } catch (error) {
    throw new Error(`${i18next.t("error.eagleImportFailed")}: ${error.message}`);
  }
}

module.exports = {
  importToEagle,
};
