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
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }] });
  fs.mkdirSync(path.join(root, "previews"), { recursive: true });
  for (const width of [375, 390, 430, 768, 1024, 1440, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const file of ["frontpage.html", "bikes.html", "about.html", "contact.html", "booking.html"]) {
      await navigate(file);
      const topbar = await evaluate(`(() => {
        const mobile = innerWidth < 768;
        const header = document.querySelector('.site-header');
        const nav = document.querySelector('#pill-navbar');
        const logo = document.querySelector(mobile ? '#pill-navbar .pill-logo' : '.site-header .site-logo');
        let menuWorks = true;
        if (mobile) {
          const burger = nav.querySelector('.burger');
          const menu = nav.querySelector('.menu');
          burger.click();
          menuWorks = burger.getAttribute('aria-expanded') === 'true' && !menu.inert;
          const link = menu.querySelector('a');
          const bounds = link.getBoundingClientRect();
          menuWorks = menuWorks && link.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          menuWorks = menuWorks && burger.getAttribute('aria-expanded') === 'false' && menu.inert;
        }
        return {
          visible: mobile ? getComputedStyle(nav).display !== 'none' && getComputedStyle(header).display === 'none' : header.getBoundingClientRect().height >= 76 && header.getBoundingClientRect().height <= 77,
          logo: logo.getAttribute('src').endsWith('/frontpage-logo.webp'),
          current: !mobile || nav.querySelector('.menu [aria-current="page"]')?.getAttribute('href') === (location.pathname.endsWith('booking.html') ? '#booking' : location.pathname.split('/').pop()),
          menuWorks
        };
      })()`);
      assert.ok(Object.values(topbar).every(Boolean), JSON.stringify({ file, width, topbar }));
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
          BikeCart.add('Royal Enfield Himalayan 450');
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
  // Verify the new front page in both themes and exercise native FAQ controls.
  for (const scheme of ['light', 'dark']) {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: scheme }] });
    for (const width of [390, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
      await navigate('frontpage.html');
      const homepage = await evaluate(`(() => {
        const hero = document.querySelector('.home-hero');
        const cta = hero.querySelector('.home-primary').getBoundingClientRect();
        const faq = document.querySelector('.home-faq-list details');
        faq.querySelector('summary').click();
        return { background: getComputedStyle(document.body).backgroundColor,
          heroSource: hero.querySelector('.hero-photo').getAttribute('src'),
          bikes: document.querySelectorAll('.bike-card').length,
          reviewLink: document.querySelector('.home-review-source a').href,
          faqOpen: faq.open, ctaVisible: cta.top >= 0 && cta.bottom < innerHeight,
          overflow: document.documentElement.scrollWidth > innerWidth };
      })()`);
      assert.equal(homepage.bikes, 0);
      assert.ok(homepage.heroSource.endsWith('/Background.webp') && homepage.faqOpen && homepage.ctaVisible && !homepage.overflow);
      assert.ok(homepage.reviewLink.includes('ChIJQRBojXlB5DkROOzZxL9hzrA'));
      assert.equal(homepage.background, 'rgb(248, 250, 252)');
      await evaluate("document.querySelector('.home-faq-list details').open = false");
      const metrics = await send('Page.getLayoutMetrics');
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: {x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1} });
      fs.writeFileSync(path.join(root, 'previews', 'frontpage-' + scheme + '-' + width + '.png'), Buffer.from(screenshot.data, 'base64'));
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate("frontpage.html");
  const pillStates = await evaluate(`(() => {
    const nav = document.querySelector('#pill-navbar');
    const button = nav.querySelector('.burger');
    const panel = nav.querySelector('.menu');
    const state = () => [nav.classList.contains('is-open'), button.getAttribute('aria-expanded'), button.getAttribute('aria-label'), panel.getAttribute('aria-hidden'), panel.inert];
    const states = [state()];
    button.click(); states.push(state());
    button.click(); states.push(state());
    button.click(); document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'})); states.push(state());
    button.click(); document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); states.push(state());
    button.click(); panel.querySelector('a').dispatchEvent(new MouseEvent('click', {bubbles: true})); states.push(state());
    return states;
  })()`);
  const closedPill = [false, 'false', 'Open menu', 'true', true];
  assert.deepEqual(pillStates, [closedPill, [true, 'true', 'Close menu', 'false', false], closedPill, closedPill, closedPill, closedPill]);
  // Inspect real motion separately from the reduced-motion layout checks.
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await navigate("frontpage.html");
  await sleep(1100);
  await evaluate("document.querySelector('#pill-navbar .burger').click()");
  await sleep(260);
  const glass = await evaluate(`(() => {
    const nav = document.querySelector('#pill-navbar');
    const pill = nav.querySelector('.pill');
    const menu = nav.querySelector('.menu');
    const photo = document.querySelector('.hero-photo').getBoundingClientRect();
    const bounds = nav.getBoundingClientRect();
    return {
      loaded: nav.classList.contains('is-loaded'),
      backgrounds: [pill, menu].map(el => getComputedStyle(el).backgroundColor),
      filters: [pill, menu].map(el => getComputedStyle(el).backdropFilter),
      opacities: [nav, pill, menu, nav.parentElement].map(el => getComputedStyle(el).opacity),
      middleOpacity: getComputedStyle(nav.querySelector('.burger span:nth-child(2)')).opacity,
      placement: Math.abs(bounds.top - photo.top - 18) < 1 && Math.abs(photo.right - bounds.right - 18) < 1 && Math.abs(bounds.left - photo.left - 18) < 1,
      fullWidth: Math.abs(pill.getBoundingClientRect().width - (photo.width - 36)) < 1,
      logoLoaded: nav.querySelector('.pill-logo').naturalWidth > 0,
      overPhoto: bounds.bottom <= photo.bottom,
      pointerEvents: getComputedStyle(menu).pointerEvents
    };
  })()`);
  assert.ok(glass.loaded && glass.placement && glass.overPhoto && glass.fullWidth && glass.logoLoaded, JSON.stringify(glass));
  assert.deepEqual(glass.backgrounds, ['rgba(0, 26, 77, 0.72)', 'rgba(0, 26, 77, 0.72)']);
  assert.deepEqual(glass.filters, ['blur(18px) saturate(1.4)', 'blur(18px) saturate(1.4)']);
  assert.deepEqual(glass.opacities, ['1', '1', '1', '1']);
  assert.equal(glass.middleOpacity, '0');
  assert.equal(glass.pointerEvents, 'auto');
  const pillScreenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(root, "previews", "frontpage-pill-open-390.png"), Buffer.from(pillScreenshot.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#pill-navbar')).display"), 'none');
  assert.equal(await evaluate("document.querySelector('#pill-navbar .burger').getAttribute('aria-expanded')"), 'false');
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("bikes.html");
  const links = await evaluate("[...document.querySelectorAll('.bike-bottom a')].map(a => ({href: a.getAttribute('href'), bike: a.dataset.bike}))");
  assert.equal(links.length, 9);
  const carousel = await evaluate(`(async () => {
    const stage = document.querySelector('#bike-carousel');
    const pause = () => new Promise(resolve => setTimeout(resolve, 60));
    const active = () => ({
      name: stage.querySelector('.oc-name.is-active .oc-name__title').textContent,
      alt: stage.querySelector('.oc-thumb.is-active img').alt,
      booking: stage.querySelector('.oc-book').getAttribute('href'),
      position: Number(stage.dataset.position)
    });
    const start = active();
    const firstName = stage.querySelector('.oc-name');
    const firstPhoto = stage.querySelector('.oc-thumb');
    const nameY = new DOMMatrix(getComputedStyle(firstName).transform).m42;
    const photoY = new DOMMatrix(getComputedStyle(firstPhoto).transform).m42;
    document.dispatchEvent(new WheelEvent('wheel', {deltaY: 7, cancelable: true}));
    const belowThreshold = active().position;
    document.dispatchEvent(new WheelEvent('wheel', {deltaY: 7, cancelable: true}));
    const forward = active();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', cancelable: true}));
    const throttled = active().position;
    const directions = new DOMMatrix(getComputedStyle(firstName).transform).m42 < nameY && new DOMMatrix(getComputedStyle(firstPhoto).transform).m42 > photoY;
    await pause();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', cancelable: true}));
    const back = active();
    const sequence = [];
    for (let i = 0; i < 19; i++) {
      await pause(); stage.querySelector('.oc-next').click(); sequence.push(active());
    }
    for (let i = 0; i < 20; i++) { await pause(); stage.querySelector('.oc-previous').click(); }
    const backwardsWrap = active();
    await pause();
    stage.dispatchEvent(new TouchEvent('touchstart', {touches: [new Touch({identifier: 1, target: stage, clientY: 400})]}));
    stage.dispatchEvent(new TouchEvent('touchmove', {cancelable: true, touches: [new Touch({identifier: 1, target: stage, clientY: 370})]}));
    const swipe = active();
    stage.dispatchEvent(new TouchEvent('touchend', {touches: []}));
    return {start, belowThreshold, forward, throttled, directions, back, sequence, backwardsWrap, swipe,
      nameTiles: stage.querySelectorAll('.oc-name').length, photoTiles: stage.querySelectorAll('.oc-thumb').length,
      accessibleNames: stage.querySelectorAll('.oc-name[aria-hidden="false"]').length,
      accessiblePhotos: stage.querySelectorAll('.oc-thumb[aria-hidden="false"]').length,
      noScroll: scrollY === 0 && document.documentElement.scrollHeight === innerHeight,
      headerClear: document.querySelector('.site-header').getBoundingClientRect().bottom < innerHeight * 0.2
    };
  })()`);
  assert.equal(carousel.nameTiles, 18); assert.equal(carousel.photoTiles, 18);
  assert.equal(carousel.belowThreshold, 0); assert.equal(carousel.forward.position, 1);
  assert.equal(carousel.throttled, 1); assert.ok(carousel.directions);
  assert.equal(carousel.back.position, 0); assert.equal(carousel.backwardsWrap.position, 17);
  assert.equal(carousel.swipe.position, 0); assert.ok(carousel.noScroll);
  assert.ok(carousel.headerClear);
  assert.equal(carousel.accessibleNames, 1); assert.equal(carousel.accessiblePhotos, 1);
  for (const [index, item] of carousel.sequence.entries()) {
    assert.equal(item.name, links[(index + 1) % 9].bike);
    assert.equal(item.alt, item.name); assert.equal(item.booking, links[(index + 1) % 9].href);
  }
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.oc-name')).transitionDuration"), "1.5s, 1.5s, 1.5s");
  for (const [width, height] of [[390, 900], [1024, 600], [1440, 900]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
    await sleep(50);
    if (width >= 768) {
      const textLayout = await evaluate(`(() => {
        const active = document.querySelector('.oc-name.is-active');
        const [title, category, rent] = ['.oc-name__title', '.oc-name__tag', '.oc-rent'].map(selector => active.querySelector(selector).getBoundingClientRect());
        const top = document.querySelector('.oc-hairline--top').getBoundingClientRect();
        const bottom = document.querySelector('.oc-hairline--bottom').getBoundingClientRect();
        return { aligned: Math.abs(title.left - category.left) < 1 && Math.abs(category.left - rent.left) < 1,
          ordered: title.bottom < category.top && category.bottom < rent.top,
          fits: title.top >= top.bottom + 8 && rent.bottom <= bottom.top - 8 };
      })()`);
      assert.ok(textLayout.aligned && textLayout.ordered && textLayout.fits, JSON.stringify({width, height, textLayout}));
    }
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(root, "previews", `bikes-carousel-${width}.png`), Buffer.from(screenshot.data, "base64"));
  }
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  for (const link of links) {
    await navigate(link.href);
    assert.ok(await evaluate(`window.BikeCart.getItems().some(item => item.name === ${JSON.stringify(link.bike)})`));
  }
  await navigate("booking.html?bike=unknown");
  assert.equal(await evaluate("document.querySelector('#bike-select, #cart-add')"), null);
  // Exercise the customer cart flow through the carousel and booking controls.
  await evaluate("localStorage.removeItem('abhi-bike-cart-v1')");
  await navigate("bikes.html");
  const cartBikes = await evaluate(`(async () => {
    const add = document.querySelector('.oc-book');
    const first = add.dataset.bike;
    add.click(); add.click();
    if (BikeCart.count() !== 1) throw new Error('Duplicate bike was added');
    if (add.getAttribute('aria-disabled') !== 'true' || !add.textContent.includes('In cart')) throw new Error('Added bike state did not update');
    await new Promise(resolve => setTimeout(resolve, 70));
    document.querySelector('.oc-next').click();
    const second = add.dataset.bike;
    add.click();
    if (BikeCart.count() !== 2) throw new Error('Carousel did not add two different bikes');
    if (!document.querySelector('.cart-link').textContent.includes('2')) throw new Error('Cart badge did not update');
    return { first, second };
  })()`);
  await navigate("booking.html");
  assert.equal(await evaluate("BikeCart.count()"), 2);
  assert.equal(await evaluate("document.querySelectorAll('.cart-item button:not(.cart-remove), .cart-item output').length"), 0);
  await navigate("booking.html");
  assert.equal(await evaluate("BikeCart.count()"), 2);
  for (const width of [375, 390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    assert.ok(await evaluate("document.documentElement.scrollWidth <= innerWidth"), `Cart overflow at ${width}`);
  }
  // Intercept the outgoing URL; never send a booking message during testing.
  const booking = await evaluate(`(() => {
    window.open = url => { window.testWhatsAppUrl = url; return {}; };
    const fill = (id, value) => { document.getElementById(id).value = value; };
    fill('customer-name', 'Test & Rider'); fill('customer-phone', '+91 98765 43210');
    fill('pickup-location', 'Ashapurna Sarani Road, near Siliguri Junction');
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
  assert.match(url.searchParams.get("text"), /Pickup Time: 9:00 AM/);
  assert.match(url.searchParams.get("text"), /Return Time: 5:00 PM/);
  assert.ok(url.searchParams.get("text").includes('- ' + cartBikes.first + '\n'));
  assert.ok(url.searchParams.get("text").includes('- ' + cartBikes.second + '\n'));
  assert.match(url.searchParams.get("text"), /Total bikes: 2/);
  await evaluate("document.querySelector('.cart-item .cart-remove').click()");
  assert.equal(await evaluate("BikeCart.count()"), 1);
  await evaluate("document.querySelector('.cart-item .cart-remove').click()");
  assert.equal(await evaluate("BikeCart.count()"), 0);
  assert.match(await evaluate("document.querySelector('#cart-summary').textContent"), /empty/);
  assert.ok(booking.invalidPhoneBlocked && booking.invalidDateBlocked);
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.join(root, "quality"), { recursive: true });
  fs.writeFileSync(path.join(root, "quality", "browser-checks.json"), JSON.stringify({ pages: report, booking: "passed", carousel: "passed", menu: "passed" }, null, 2));
  console.log("Passed: 35 layouts, seven terms popup layouts, nine bike links, unique-bike cart persistence, duplicate prevention, removal, carousel inputs and looping, mobile menu, WhatsApp URL encoding and validation.");
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
