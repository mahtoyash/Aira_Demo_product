const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { spawn } = require('child_process');

const ffmpegPath = ffmpegInstaller.path;

const ffmpeg = spawn(ffmpegPath, [
  '-i', 'public/12386532_3840_2160_30fps.mp4',
  '-vf', 'scale=1920:-1',
  '-vcodec', 'libx264',
  '-crf', '26',
  '-preset', 'veryfast',
  '-y',
  'public/hero_compressed.mp4'
]);

ffmpeg.stdout.on('data', (data) => console.log(`stdout: ${data}`));
ffmpeg.stderr.on('data', (data) => console.log(`${data}`));
ffmpeg.on('close', (code) => {
  console.log(`Compression finished with code ${code}`);
});
