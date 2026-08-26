import { chromium, devices } from 'playwright';

const url = process.env.PERF_URL ?? 'http://127.0.0.1:4173/?visual-smoke=1';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['Pixel 7'] });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const result = await page.evaluate(async () => {
  const canvas = document.querySelector('#ocean');
  const shell = document.querySelector('.game-shell');
  if (!(canvas instanceof HTMLCanvasElement) || !(shell instanceof HTMLElement)) throw new Error('game viewport missing');

  const rect = shell.getBoundingClientRect();
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.46;
  const frameTimes = [];
  let previous = performance.now();

  function wheel(deltaY, x = cx, y = cy) {
    canvas.dispatchEvent(new WheelEvent('wheel', { clientX: x, clientY: y, deltaY, bubbles: true, cancelable: true }));
  }

  // Warm lazy coastline loading with a small fixed sequence.
  for (let i = 0; i < 4; i++) wheel(-100);
  await new Promise(resolve => setTimeout(resolve, 800));

  // Short identical camera sequence. The old renderer is slow enough that a
  // long benchmark can take minutes, so 12 frames keeps the A/B practical.
  await new Promise(resolve => {
    let frame = 0;
    function step(now) {
      if (frame > 0) frameTimes.push(now - previous);
      previous = now;
      const delta = frame < 6 ? -42 : 42;
      const x = cx + Math.sin(frame * 0.55) * rect.width * 0.25;
      const y = cy + Math.cos(frame * 0.43) * rect.height * 0.16;
      wheel(delta, x, y);
      frame += 1;
      if (frame < 12) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });

  const sorted = [...frameTimes].sort((a, b) => a - b);
  const percentile = p => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const average = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  return {
    frames: frameTimes.length,
    avgFrameMs: average,
    p50FrameMs: percentile(0.50),
    p95FrameMs: percentile(0.95),
    p99FrameMs: percentile(0.99),
    maxFrameMs: Math.max(...frameTimes),
    longFrames33ms: frameTimes.filter(v => v > 33.34).length,
    longFrames50ms: frameTimes.filter(v => v > 50).length,
    approxFps: 1000 / average,
  };
});

console.log(`PERF_RESULT ${JSON.stringify(result)}`);
await browser.close();
