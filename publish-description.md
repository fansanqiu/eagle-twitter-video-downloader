# Eagle Video Downloader 发布说明

发布时按需复制以下内容填写到 Eagle 社区对应字段。

---

## 插件名称

中文：视频下载器
英文：Video Downloader

---

## 简短描述（一句话）

中文：
从 YouTube、Twitter / X、TikTok、Bilibili、Pinterest 等 yt-dlp 支持的网站下载视频，以及下载 Pinterest 纯图片 Pin，完成后自动连同元数据导入 Eagle。

英文：
Download videos from sites supported by yt-dlp and image-only Pinterest Pins, then automatically import completed media into Eagle with useful metadata.

---

## 详细说明（中文）

使用步骤：

1. 首次使用时，在插件的「依赖管理」页安装 yt-dlp，并安装 Eagle 官方 FFmpeg 插件。
2. 依赖安装完成后自动进入主界面。
3. 复制受支持网站的 HTTPS 媒体链接（视频页面或 Pinterest 图钉链接）。
4. 将链接粘贴到主界面顶部的输入框。
5. 点击输入框右侧的「下载」按钮，任务会加入下载队列（最多 3 个并发）。
6. 下载完成后，媒体文件会自动导入 Eagle，并附带标题、平台标签与简介摘要。

支持从 YouTube、Twitter / X、TikTok、Bilibili、Instagram、Pinterest、Vimeo 等 yt-dlp 支持的网站下载视频，同时支持下载 Pinterest 纯图片 Pin，并自动导入到 Eagle。导入时自动保存视频标题、平台解析标签与简介摘要（截取前 500 字符）；当用户在偏好设置中开启「自动设置 Eagle 数据来源」选项时，将同步写入原始网页链接。

采用全新的 3.0.0 界面设计规范，提供独立的偏好设置与依赖管理分栏：

个性化偏好设置：
- 支持自定义清晰度上限（最高画质 / 4K / 1080P 等）与帧率上限（最高帧率 / 60fps / 30fps 等），未找到对应规格时自动向下匹配最高可用画质。
- 支持配置是否自动在 Eagle 中记录原始网页来源链接（默认开启）。

智能平台解析：
- 新增 Pinterest 图钉（视频与图片）下载，针对转存内容自动前置提取第三方源地址（如 Instagram、YouTube、TikTok、Vimeo 等原始来源）并优先下载源视频；纯图片 Pin 自动获取高清原图。
- 站点适配器模块化架构，全面提升各平台解析稳定性。

浏览器 Cookie 授权与隐私说明：
- 选用功能：浏览器 Cookie 功能属于可选设置，默认保持禁用状态，必须由用户在偏好设置中主动开启授权。
- 数据读取与使用范围：开启授权后，若某个受支持 HTTPS 链接下载失败，yt-dlp 可能读取本机 Chrome 中与目标网站匹配的登录 Cookie，并直接发送给该网站（用于解析与下载受限或高清内容）。对于从 Pinterest 页面提取的第三方媒体来源，插件会在下载前弹窗显示确切的目标域名并请求用户逐域名同意。
- 隐私安全保障：插件本身不收集、不存储且不向任何开发者服务器或第三方服务器上传任何 Cookie 数据，所有 Cookie 仅由本地 yt-dlp 直接发送给目标网站。插件自身发起的所有请求均限定为 HTTPS 协议，并阻断对本地地址与私有 IP 的访问；传递给 yt-dlp 的派生目标 URL 严格限制在已批准平台域名（如 Instagram、YouTube、Vimeo、TikTok）范围内。注意：上述网络边界仅覆盖插件自身发起的请求，不覆盖 yt-dlp 子进程自身的 DNS 解析、重定向跟随与媒体分片请求。

依赖管理与安装流程：
- 插件由 yt-dlp（视频解析与提取）与 FFmpeg（音视频合并与转码）提供核心支持。
- 首次使用或依赖缺失：插件会打开依赖管理页（门槛模式），用户需在依赖管理页手动点击”安装”按钮以完成 yt-dlp 安装（锁定官方发布版本并强制执行 SHA-256 完整性校验）；FFmpeg 需配合 Eagle 官方 FFmpeg 插件使用，若未检测到可直接在依赖管理页点击一键跳转至 Eagle 应用商店快速安装。

致谢与开源协议：
- 本项目基于 OlivierEstevez 开发的 eagle-twitter-video-downloader（https://github.com/OlivierEstevez/eagle-twitter-video-downloader）进行扩展，感谢原作者的开创性工作。视频解析与提取由 yt-dlp（https://github.com/yt-dlp/yt-dlp）提供支持，音视频合并与转码由 FFmpeg（https://ffmpeg.org）提供支持。

---

## 详细说明（英文）

How to use:

1. On first launch, install yt-dlp from the Dependencies tab and install Eagle's official FFmpeg plugin.
2. Once both dependencies are ready, the main view opens automatically.
3. Copy a supported HTTPS media URL (a video page URL, or a Pinterest Pin URL).
4. Paste the URL into the input field at the top of the main view.
5. Click the Download button next to the input field; the task is added to the download queue (up to 3 concurrent downloads).
6. When a download completes, the media is imported into Eagle automatically, together with its title, a platform tag, and a description excerpt.

Video Downloader uses yt-dlp to download videos from supported sites. It also downloads image-only Pinterest Pins and imports completed media into Eagle. Imported items include the title, a platform tag, and up to 500 characters of the description. Saving the original page as the Eagle data source is enabled by default and can be turned off in Preferences. Key features include downloading supported videos, downloading image-only Pinterest Pins, setting maximum resolution and frame rate, and automatically importing completed media into Eagle. First-time setup requires yt-dlp and Eagle's official FFmpeg plugin, plus an internet connection. Chrome Cookie access is optional and disabled by default. If enabled, yt-dlp may read Chrome login Cookies matching the target website and retry after a download from any supported HTTPS URL fails. The plugin does not use a developer-operated or intermediary collection server for Cookies; matching Cookies are sent by yt-dlp directly to the target website. For third-party sources extracted from Pinterest Pins, the plugin shows a per-domain prompt with the exact domain name before using Cookies.

Built with the 3.0.0 design system featuring dedicated Preferences and Dependency Management tabs:

Customizable Preferences:
- Configure maximum resolution limits (Auto / 4K / 1080P, etc.) and framerate caps (Auto / 60fps / 30fps, etc.), automatically falling back to the highest available quality.
- Option to automatically save the original webpage URL into Eagle's item source field (enabled by default).

Smart Platform Extraction:
- Added Pinterest pin (video & image) support with automatic extraction of embedded third-party source URLs (e.g., original Instagram, YouTube, TikTok, or Vimeo sources) to download the original video; automatically fetches full-resolution images for image pins.
- Modularized site adapters for improved maintainability and extraction performance across platforms.

Browser Cookie Usage & Privacy Disclosure:
- Optional Feature: Browser cookie access is strictly optional, disabled by default, and requires explicit user opt-in in the Preferences tab.
- Data Access & Scope: When enabled by the user, if a download from any supported HTTPS URL fails, yt-dlp may read Chrome login cookies matching that site and retry. For third-party media sources extracted from Pinterest Pins, the plugin shows a per-domain prompt displaying the exact domain name and requests explicit consent before using cookies.
- Privacy & Security: The plugin does not collect, store, or upload cookie data to any developer-operated or third-party servers. All cookies are sent by yt-dlp directly to the target website only. All requests initiated by the plugin itself are restricted to HTTPS and block local and private IP addresses. Derived target URLs passed to yt-dlp are strictly limited to approved platform domains (e.g. Instagram, YouTube, Vimeo, TikTok). Note: the above network boundary applies only to requests initiated by the plugin itself, and does not cover yt-dlp's own DNS resolution, redirect following, or media segment requests.

Dependency Management & Setup Flow:
- Powered by yt-dlp (video extraction engine) and FFmpeg (audio/video merging and transcoding).
- First-Time Setup: If any component is missing, the plugin opens the Dependency Management tab. Users must click the "Install" button in the dependency panel to install yt-dlp (downloads the pinned official release with mandatory SHA-256 integrity verification). FFmpeg requires the official Eagle FFmpeg plugin; if not detected, users can click the one-click store button to install it from the Eagle Plugin Center.

Acknowledgements:
- This project is based on eagle-twitter-video-downloader by OlivierEstevez (https://github.com/OlivierEstevez/eagle-twitter-video-downloader). Thanks to the original author for the foundational work. Video extraction is powered by yt-dlp (https://github.com/yt-dlp/yt-dlp), and audio/video merging and transcoding are powered by FFmpeg (https://ffmpeg.org).
