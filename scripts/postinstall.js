/**
 * Post-install script
 * Creates necessary directories and performs setup tasks
 */

const fs = require("fs");
const path = require("path");

// Create bin directory for storing yt-dlp binary
const binDir = path.join(__dirname, "..", "bin");
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
  console.log("Created bin directory for yt-dlp binary");
}

// Create dist directory for build output
const distDir = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log("Created dist directory for build output");
}

console.log("Post-install setup complete!");
