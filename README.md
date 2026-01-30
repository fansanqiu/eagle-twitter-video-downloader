<img src="./docs/banner-docs.png">

# Eagle Video Downloader

Download videos from **1000+ websites** directly into Eagle. Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp).

## Supported Platforms

- YouTube
- Twitter / X
- TikTok
- Bilibili
- Instagram
- Vimeo
- And [many more...](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

## Features

- 🎬 **Multi-platform Support**: Download from 1000+ video websites
- 📦 **Auto Setup**: Automatically downloads required binaries on first run
- 📊 **Download Queue**: Add multiple videos and download them concurrently
- 🔄 **Concurrent Downloads**: Process up to 3 downloads simultaneously
- 📋 **Queue Management**: View all downloads with real-time progress tracking
- 🔄 **High Quality**: Downloads best available quality with ffmpeg merging
- 🦅 **Eagle Integration**: Automatically imports videos to Eagle with metadata
- 💾 **Persistent History**: Download history saved across sessions

## Installation

### Eagle Community

This plugin is published on the Eagle Community:

- Install it via [the community](https://community-en.eagle.cool/plugins)
- Search for it in the Plugin Center on the Eagle app

### Manual Install

1. Download [latest release](https://github.com/OlivierEstevez/eagle-twitter-video-downloader/releases)
2. In Eagle: Plugin → Developer options... → Import Local Project

## First Run

On first launch, the plugin will automatically download:

- **yt-dlp** (~30MB) - Video extraction engine
- **ffmpeg** (~80MB) - For video/audio merging

This is a one-time download. Please wait for the initialization to complete.

## Usage

1. Copy a video URL from any supported website
2. Paste it into the plugin input field
3. Click "Download" to add it to the queue
4. Add more videos while downloads are in progress
5. Videos will be downloaded automatically and imported to Eagle
6. View download progress and history in the queue list

## Development

### Project Structure

```
├── index.html           # UI with embedded CSS
├── js/
│   ├── plugin.js        # Main entry point
│   ├── ui.js            # UI management module
│   ├── queue.js         # Download queue management
│   ├── downloader.js    # Video download logic
│   ├── binary.js        # Binary setup (yt-dlp/ffmpeg)
│   └── eagle.js         # Eagle API integration
├── dist/plugin.js       # Bundled output (esbuild)
├── bin/                 # yt-dlp & ffmpeg binaries (auto-downloaded)
├── _locales/            # Internationalization files
├── assets/              # Logo and icons
└── manifest.json        # Eagle plugin config
```

### Commands

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Watch mode for development
npm run dev
```

## Requirements

- Eagle 3.0 or later
- Internet connection (for first-time setup and downloading videos)

## License

MIT © [Olivier Estévez](https://github.com/OlivierEstevez)

---

> **Note**: This tool is for personal use only. Please respect the terms of service of the video platforms and copyright laws in your region.
