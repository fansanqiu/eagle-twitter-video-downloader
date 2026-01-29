/**
 * 视频下载模块
 * 处理视频下载核心逻辑
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const { getYtDlpPath, getFfmpegPath, BIN_DIR } = require("./binary");

/**
 * 执行 yt-dlp 命令
 */
function execYtDlp(args, onProgress, onOutput) {
  return new Promise((resolve, reject) => {
    const ytdlp = getYtDlpPath();

    if (!fs.existsSync(ytdlp)) {
      reject(new Error(i18next.t("error.ytdlpNotInstalled")));
      return;
    }

    const proc = spawn(ytdlp, args, {
      cwd: BIN_DIR,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;

      if (onOutput) onOutput(output);

      // 解析 yt-dlp 输出进度 - 支持多种格式
      // 格式1: [download]  45.2% of 123.45MiB at 1.23MiB/s ETA 00:30
      // 格式2: [download]  45.2% of ~ 123.45MiB at 1.23MiB/s ETA 00:30
      // 格式3: [download]  45.2% of 123.45MB at 1.23MB/s ETA 00:30
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);

      if (progressMatch && onProgress) {
        const percent = parseFloat(progressMatch[1]);

        // 提取文件大小
        const sizeMatch = output.match(/of\s+~?\s*(\S+)/);
        const totalSize = sizeMatch ? sizeMatch[1] : "";

        // 提取速度
        const speedMatch = output.match(/at\s+(\S+)/);
        const currentSpeed = speedMatch ? speedMatch[1] : "";

        // 提取 ETA
        const etaMatch = output.match(/ETA\s+(\S+)/);
        const eta = etaMatch ? etaMatch[1] : "";

        onProgress({
          percent: percent,
          totalSize: totalSize,
          currentSpeed: currentSpeed,
          eta: eta,
        });
      }
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", (error) => {
      reject(new Error(`${i18next.t("error.failedToExecuteYtdlp")}: ${error.message}`));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(`${i18next.t("error.ytdlpExitedWithCode")} ${code}: ${stderr}`),
        );
      }
    });
  });
}

/**
 * 标准化 URL，处理特殊情况
 * - Vimeo: 将 vimeo.com/ID 转换为 player.vimeo.com/video/ID 以绕过登录限制
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);

    if (
      urlObj.hostname === "vimeo.com" ||
      urlObj.hostname === "www.vimeo.com"
    ) {
      const pathParts = urlObj.pathname.split("/").filter((p) => p);
      const videoId = pathParts.find((part) => /^\d+$/.test(part));

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch (error) {
    return url;
  }
}

/**
 * 获取视频信息
 */
async function getVideoInfo(url) {
  url = normalizeUrl(url);
  const args = ["--dump-json", "--no-warnings", url];

  const output = await execYtDlp(args);
  const info = JSON.parse(output.trim().split("\n")[0]);

  return {
    title: info.title || i18next.t("error.untitledVideo"),
    description: info.description || "",
    duration: info.duration || 0,
    thumbnail: info.thumbnail || null,
    uploader: info.uploader || info.channel || i18next.t("error.unknown"),
    extractor: info.extractor || i18next.t("error.unknown"),
    webpage_url: info.webpage_url || url,
    id: info.id || null,
  };
}

/**
 * 净化文件名
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * 获取下载临时目录
 */
function getTempDir() {
  const tempDir = path.join(os.tmpdir(), "eagle-video-downloader");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * 下载视频
 */
async function downloadVideo(url, onProgress, onStatus) {
  if (onStatus) onStatus(i18next.t("download.fetchingInfo"));

  let videoInfo;
  try {
    videoInfo = await getVideoInfo(url);
    if (onStatus) onStatus(`${i18next.t("download.foundVideo")}: ${videoInfo.title}`);
  } catch (error) {
    videoInfo = {
      title: i18next.t("error.untitledVideo"),
      extractor: i18next.t("error.unknown"),
    };
  }

  const outputDir = getTempDir();
  const sanitizedTitle = sanitizeFilename(videoInfo.title);
  const outputPath = path.join(outputDir, `${sanitizedTitle}.mp4`);

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  url = normalizeUrl(url);

  const args = [
    url,
    "-o",
    outputPath,
    "-f",
    "bestvideo+bestaudio/best",
    "--merge-output-format",
    "mp4",
    "--no-playlist",
    "--no-warnings",
  ];

  const ffmpeg = getFfmpegPath();
  if (ffmpeg && fs.existsSync(ffmpeg)) {
    args.push("--ffmpeg-location", path.dirname(ffmpeg));
  }

  if (onStatus) onStatus(i18next.t("ui.downloading"));

  await execYtDlp(args, onProgress);

  if (!fs.existsSync(outputPath)) {
    const files = fs.readdirSync(outputDir);
    const matchingFile = files.find((f) => f.startsWith(sanitizedTitle));
    if (matchingFile) {
      return {
        path: path.join(outputDir, matchingFile),
        metadata: videoInfo,
        filename: matchingFile,
      };
    }
    throw new Error(i18next.t("error.fileNotFound"));
  }

  return {
    path: outputPath,
    metadata: videoInfo,
    filename: path.basename(outputPath),
  };
}

/**
 * 清理临时文件
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

module.exports = {
  downloadVideo,
  getVideoInfo,
  cleanup,
};
