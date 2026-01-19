/**
 * esbuild configuration for Eagle Video Downloader plugin
 */

const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['js/plugin.js'],
  bundle: true,
  outfile: 'dist/plugin.js',
  platform: 'node',
  format: 'cjs',
  target: 'node16',
  external: [
    'electron',
    'ffmpeg-static'  // Keep as external since it provides a binary path
  ],
  sourcemap: false,
  minify: false,
  logLevel: 'info'
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
