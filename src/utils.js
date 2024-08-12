
export const color = {
    magenta: (...args) => `\u001b[35m${args.join(' ')}\u001b[0m`,
    bold: (...args) => `\u001b[1m${args.join(' ')}\u001b[0m`,
    yellow: (...args) => `\u001b[33m${args.join(' ')}\u001b[0m`,
    green: (...args) => `\u001b[32m${args.join(' ')}\u001b[0m`,
    blue: (...args) => `\u001b[34m${args.join(' ')}\u001b[0m`,
    red: (...args) => `\u001b[31m${args.join(' ')}\u001b[0m`,
    blink: (...args) => `\u001b[5m${args.join(' ')}\u001b[0m`,
    randomColorHEX: () => `#${Math.random().toString(16).slice(-6)}`,
    randomColorANSI: (str) => Object.values(color)[Math.floor(Math.random() * 6)](str), // const set
    randomColorRGB: () => `rgb(${[1,2,3].map(x=>Math.random()*256|0)})`
};
// -----------------------------------------------------------------------
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let frameIndex = 0;
let spinnerInterval;
let timerId;
let startTime;

function pad(num, size) {
  return ('0' + num).slice(-size);
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const milliseconds = ms % 1000;
  const formattedSeconds = pad(seconds % 60, 2);
  const formattedMinutes = pad(minutes % 60, 2);
  const formattedHours = pad(hours, 2);
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}:${pad(milliseconds, 3)}`;
}

export function startSpinnerAndTimer() {
  startTime = Date.now();
  let elapsedMilliseconds = 0;

  spinnerInterval = setInterval(() => {
    const terminalWidth = process.stdout.columns;
    process.stdout.write('\r'.repeat(terminalWidth));
    frameIndex %= spinnerFrames.length;
    process.stdout.write(`\x1b[?25l${color.randomColorANSI(spinnerFrames[frameIndex++])} ${formatTime(elapsedMilliseconds)}`);
    process.stdout.write('\x1b[0G');
  }, 100);

  timerId = setInterval(() => {
    elapsedMilliseconds += 10;
  }, 10);
}

export function stopSpinnerAndTimer() {
  clearInterval(spinnerInterval);
  clearInterval(timerId);
  const totalTime = Date.now() - startTime;
  process.stdout.write(`\r✅ GitHub Statistics (${color.blink(formatTime(totalTime))})\x1b[?25h\n`);
}
// -----------------------------------------------------------------------
export function arrayBufferToAsciiString(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  return String.fromCharCode(...uint8Array);

}
// -----------------------------------------------------------------------