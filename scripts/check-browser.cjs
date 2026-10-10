"use strict";
// Optional integration checks using a locally installed Chrome or Chromium.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { createServer } = require("../js/serve.cjs");
const root = path.resolve(__dirname, "..");
const candidates = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
const executable = candidates.find(file => fs.existsSync(file));
if (!executable) { console.error("Install Chrome/Chromium or set CHROME_PATH to its executable."); process.exit(1); }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "abhi-browser-"));
const server = createServer();
let chrome, socket, counter = 0;
const pending = new Map();
const errors = [];
const report = [];
function send(method, params = {}) {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
let base;
async function navigate(file) {
  await send("Page.navigate", { url: base + "/frontend/" + file });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    await sleep(50);
    if (await evaluate(`document.readyState === 'complete' && location.pathname.endsWith(${JSON.stringify(file.split("?")[0])})`)) { ready = true; break; }
  }
  assert.ok(ready, `Page did not load: ${file}`);
  await evaluate("document.fonts.ready");
  await evaluate("Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })).then(() => true)");
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  const flags = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"];
  if (process.env.CHROME_NO_SANDBOX === "1") flags.unshift("--no-sandbox");
  chrome = spawn(executable, flags, { windowsHide: true, stdio: "ignore" });
  chrome.on("error", error => errors.push(error.message));
  const marker = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(marker); i++) await sleep(100);
  assert.ok(fs.existsSync(marker), "Chrome did not start");
  const port = fs.readFileSync(marker, "utf8").split("\n")[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const task = pending.get(message.id);
    if (task) {
      clearTimeout(task.timer); pending.delete(message.id);
      message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400) errors.push(`${message.params.response.status}: ${message.params.response.url}`);
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Browser connection timed out")), 10000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Browser connection failed")); }, { once: true });
  });
  await send("Browser.getVersion");
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  fs.mkdirSync(path.join(root, "previews"), { recursive: true });
  for (const width of [375, 390, 430, 768, 1024, 1440, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const file of ["frontpage.html", "bikes.html", "about.html", "contact.html", "booking.html"]) {
      await navigate(file);
      const result = await evaluate(`(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenImages: [...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')),
        missingIcons: [...document.querySelectorAll('i[data-lucide]')].map(i => i.dataset.lucide),
        croppedMaps: innerWidth < 768 && [...document.querySelectorAll('img[src$="tourist_places.webp"]')].some(i => Math.abs(i.clientHeight - i.clientWidth * i.naturalHeight / i.naturalWidth) > 1)
      }))()`);
      report.push({ file, width, ...result });
      assert.ok(!result.overflow && !result.brokenImages.length && !result.missingIcons.length && !result.croppedMaps, JSON.stringify(report.at(-1)));
      if (width === 390 || width === 1440) {
        const metrics = await send("Page.getLayoutMetrics");
        const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 } });
        fs.writeFileSync(path.join(root, "previews", `${file.replace('.html', '')}-${width}.png`), Buffer.from(screenshot.data, "base64"));
      }
      if (file === "booking.html") {
        const terms = await evaluate(`(() => {
          window.open = () => { throw new Error('WhatsApp opened without agreement'); };
          const fill = (id, value) => { document.getElementById(id).value = value; };
          fill('customer-name', 'Test Rider'); fill('customer-phone', '9876543210');
          fill('pickup-location', 'Ashapurna Sarani Road, near Siliguri Junction');
          fill('bike-select', 'Royal Enfield Himalayan 450');
          fill('pickup-date', document.querySelector('#pickup-date').min);
          fill('return-date', document.querySelector('#pickup-date').min);
          fill('pickup-time', '09:00'); fill('return-time', '17:00');
          document.querySelector('#booking-form').requestSubmit();
          const dialog = document.querySelector('#terms-dialog');
          const content = dialog.querySelector('.terms-content');
          const bounds = dialog.getBoundingClientRect();
          const actions = dialog.querySelector('.terms-actions').getBoundingClientRect();
          const heading = document.querySelector('.booking-heading').getBoundingClientRect();
          const icon = document.querySelector('.booking-heading .booking-icon').getBoundingClientRect();
          document.querySelector('#terms-form').dispatchEvent(new Event('submit', {cancelable: true}));
          return {
            open: dialog.open, count: content.querySelectorAll('li').length,
            disabled: document.querySelector('#terms-submit').disabled,
            fits: bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight,
            scrolls: content.scrollHeight > content.clientHeight,
            actionsVisible: actions.bottom <= bounds.bottom && actions.top >= bounds.top,
            iconAligned: Math.abs(icon.right - heading.right) < 1 && icon.width === icon.height
          };
        })()`);
        assert.ok(terms.open && terms.count === 13 && terms.disabled && terms.fits && terms.scrolls && terms.actionsVisible && terms.iconAligned, JSON.stringify({width, terms}));
        if (width === 390 || width === 1440) {
          const screenshot = await send("Page.captureScreenshot", { format: "png" });
          fs.writeFileSync(path.join(root, "previews", `booking-terms-${width}.png`), Buffer.from(screenshot.data, "base64"));
        }
        await evaluate(`new Promise(resolve => {
          const dialog = document.querySelector('#terms-dialog');
          dialog.addEventListener('close', resolve, {once: true});
          document.querySelector('#terms-close').click();
        })`);
        assert.equal(await evaluate("document.querySelector('#customer-name').value"), "Test Rider");
      }
    }
    console.log(`All five pages passed at ${width}px`);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate("frontpage.html");
  assert.deepEqual(await evaluate(`(() => {
    document.querySelector('.menu-toggle').click();
    const opened = !document.querySelector('#mobile-menu').hidden;
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    return [opened, document.querySelector('#mobile-menu').hidden];
  })()`), [true, true]);
  await navigate("bikes.html");
  const links = await evaluate("[...document.querySelectorAll('.bike-bottom a')].map(a => ({href: a.getAttribute('href'), bike: a.dataset.bike}))");
  assert.equal(links.length, 9);
  assert.deepEqual(await evaluate(`(() => {
    const search = document.querySelector('#bike-search');
    search.value = 'Himalayan'; search.dispatchEvent(new Event('input'));
    const matches = document.querySelectorAll('#fleet-grid .bike-card:not([hidden])').length;
    search.value = 'no-such-bike'; search.dispatchEvent(new Event('input'));
    return [matches, !document.querySelector('#fleet-empty').hidden];
  })()`), [2, true]);
  for (const link of links) {
    await navigate(link.href);
    assert.equal(await evaluate("document.querySelector('#bike-select').value"), link.bike);
  }
  await navigate("booking.html?bike=unknown");
  assert.equal(await evaluate("document.querySelector('#bike-select').value"), "");
  // Intercept the outgoing URL; never send a booking message during testing.
  const booking = await evaluate(`(() => {
    window.open = url => { window.testWhatsAppUrl = url; return {}; };
    const fill = (id, value) => { document.getElementById(id).value = value; };
    fill('customer-name', 'Test & Rider'); fill('customer-phone', '+91 98765 43210');
    fill('pickup-location', 'Ashapurna Sarani Road, near Siliguri Junction'); fill('bike-select', 'Royal Enfield Himalayan 450');
    fill('pickup-date', document.querySelector('#pickup-date').min);
    fill('return-date', document.querySelector('#pickup-date').min);
    fill('pickup-time', '09:00'); fill('return-time', '17:00');
    const form = document.querySelector('#booking-form');
    form.dispatchEvent(new Event('submit', {cancelable: true}));
    if (window.testWhatsAppUrl) throw new Error('WhatsApp opened before accepting terms');
    if (!document.querySelector('#terms-dialog').open) throw new Error('Terms dialog did not open');
    const agreement = document.querySelector('#terms-agree');
    agreement.checked = true;
    agreement.dispatchEvent(new Event('change'));
    document.querySelector('#terms-form').requestSubmit();
    const url = window.testWhatsAppUrl;
    window.testWhatsAppUrl = null; fill('customer-phone', '123');
    form.dispatchEvent(new Event('submit', {cancelable: true}));
    const invalidPhoneBlocked = window.testWhatsAppUrl === null;
    fill('customer-phone', '9876543210'); fill('return-date', '2000-01-01');
    form.dispatchEvent(new Event('submit', {cancelable: true}));
    return {url, invalidPhoneBlocked, invalidDateBlocked: window.testWhatsAppUrl === null};
  })()`);
  const url = new URL(booking.url);
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/917001193713");
  assert.match(url.searchParams.get("text"), /Test & Rider/);
  assert.match(url.searchParams.get("text"), /Ashapurna Sarani Road, near Siliguri Junction/);
  assert.match(url.searchParams.get("text"), /I agree to the TERMS & CONDITIONS/);
  assert.ok(booking.invalidPhoneBlocked && booking.invalidDateBlocked);
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.join(root, "quality"), { recursive: true });
  fs.writeFileSync(path.join(root, "quality", "browser-checks.json"), JSON.stringify({ pages: report, booking: "passed", filters: "passed", menu: "passed" }, null, 2));
  console.log("Passed: 35 layouts, seven terms popup layouts, nine booking prefills, filters, mobile menu, WhatsApp URL encoding and validation.");
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  for (const task of pending.values()) clearTimeout(task.timer);
  if (chrome && chrome.exitCode === null) {
    const stopped = new Promise(resolve => chrome.once("exit", resolve));
    chrome.kill();
    await Promise.race([stopped, sleep(3000)]);
  }
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  // This directory was created above specifically for this test run.
  const resolvedProfile = path.resolve(profile);
  const temporaryRoot = path.resolve(os.tmpdir());
  if (resolvedProfile.startsWith(temporaryRoot + path.sep) && path.basename(resolvedProfile).startsWith("abhi-browser-")) {
    try { fs.rmSync(resolvedProfile, { recursive: true, force: true }); } catch { /* Chrome may still hold a file briefly. */ }
  }
});
