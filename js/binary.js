/**
 * 二进制文件管理模块
 * 处理 yt-dlp 和 ffmpeg 的下载和配置
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

// 插件路径
const PLUGIN_ROOT = __dirname.replace(/[/\\]js$/, '');
const BIN_DIR = path.join(PLUGIN_ROOT, 'bin');

/**
 * 获取特定平台的 yt-dlp 二进制文件名
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
 * 获取 yt-dlp 二进制文件路径
 */
function getYtDlpPath() {
    return path.join(BIN_DIR, getYtDlpBinaryName());
}

/**
 * 获取 ffmpeg-static 中的 ffmpeg 二进制路径
 */
function getFfmpegPath() {
    try {
        return require('ffmpeg-static');
    } catch (error) {
        return null;
    }
}

/**
 * 检查 yt-dlp 是否已安装
 */
function isYtDlpInstalled() {
    return fs.existsSync(getYtDlpPath());
}

/**
 * 下载文件并显示进度
 */
function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);

        const request = https.get(url, (response) => {
            // 处理重定向
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
 * 从 GitHub 获取最新发布的 yt-dlp 下载链接
 */
async function getYtDlpDownloadUrl() {
    return new Promise((resolve, reject) => {
        const binaryName = getYtDlpBinaryName();

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
 * 下载 yt-dlp 二进制文件
 */
async function downloadYtDlp(onProgress) {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
    }

    const destPath = getYtDlpPath();

    try {
        const downloadUrl = await getYtDlpDownloadUrl();
        await downloadFile(downloadUrl, destPath, onProgress);

        if (os.platform() !== 'win32') {
            fs.chmodSync(destPath, '755');
        }

        return destPath;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    BIN_DIR,
    getYtDlpPath,
    getFfmpegPath,
    isYtDlpInstalled,
    downloadYtDlp
};
