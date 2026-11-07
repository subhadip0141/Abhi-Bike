"use strict";
(() => {
  const stage = document.getElementById("bike-carousel");
  if (!stage) return;
  const projects = [...document.querySelectorAll("#fleet-grid .bike-card")].map(card => {
    const link = card.querySelector("[data-bike]");
    const image = card.querySelector("img");
    return {
      name: link.dataset.bike, category: card.dataset.category,
      src: image.getAttribute("src"), alt: image.alt, href: link.getAttribute("href"),
      cc: card.querySelector(".bike-category span").textContent.trim(),
      rent: card.querySelector(".bike-bottom h4").textContent.trim()
    };
  });
  if (projects.length < 2) return;
  const names = stage.querySelector(".oc-names");
  const photos = stage.querySelector(".oc-carousel");
  const tiles = [];
  const count = projects.length;
  const total = count * 2;
  let position = 0;
  let nameStep = 0;
  let photoStep = 0;
  let lastStep = -Infinity;
  let wheelDelta = 0;
  let touchY = null;
  let announceTimer;
  for (let index = 0; index < total; index++) {
    const project = projects[index % count];
    const name = document.createElement("div");
    name.className = "oc-name";
    const title = document.createElement("span");
    title.className = "oc-name__title";
    title.textContent = project.name;
    const tag = document.createElement("span");
    tag.className = "oc-name__tag";
    tag.textContent = project.category;
    name.append(title, tag);
    name.setAttribute("aria-hidden", "true");
    const photo = document.createElement("div");
    photo.className = "oc-thumb";
    const image = document.createElement("img");
    image.src = project.src;
    image.alt = project.alt;
    image.decoding = "async";
    const cc = document.createElement("span");
    cc.className = "oc-cc";
    cc.textContent = project.cc;
    const rent = document.createElement("span");
    rent.className = "oc-rent";
    rent.textContent = project.rent;
    name.append(rent);
    photo.append(image, cc);
    photo.setAttribute("aria-hidden", "true");
    names.append(name);
    photos.append(photo);
    tiles.push({ name, photo, rel: null });
  }
  const modulo = (value, size) => ((value % size) + size) % size;
  function render(instant = false) {
    const teleports = [];
    tiles.forEach((tile, index) => {
      let rel = modulo(index - position, total);
      if (rel > count) rel -= total;
      if (instant || (tile.rel !== null && Math.abs(rel - tile.rel) > 1)) {
        tile.name.classList.add("oc-teleport");
        tile.photo.classList.add("oc-teleport");
        teleports.push(tile);
      }
      tile.name.style.transform = `translateY(calc(-50% + ${rel * nameStep}px)) scale(${rel === 0 ? 1 : 0.4})`;
      tile.name.style.opacity = Math.abs(rel) <= 1 ? "1" : "0";
      tile.name.style.zIndex = rel === 0 ? "2" : "1";
      tile.name.classList.toggle("is-active", rel === 0);
      tile.photo.style.transform = `translate(-50%, calc(-50% + ${-rel * photoStep}px)) scale(${rel === 0 ? 1 : 0.86})`;
      tile.photo.style.opacity = rel === 0 ? "1" : Math.abs(rel) === 1 ? "0.5" : "0";
      tile.photo.style.zIndex = rel === 0 ? "2" : "1";
      tile.photo.classList.toggle("is-active", rel === 0);
      // Only the current item is read; duplicates and off-screen tiles stay hidden.
      tile.name.setAttribute("aria-hidden", String(rel !== 0));
      tile.photo.setAttribute("aria-hidden", String(rel !== 0));
      tile.rel = rel;
    });
    if (teleports.length) {
      void stage.offsetHeight;
      teleports.forEach(tile => {
        tile.name.classList.remove("oc-teleport");
        tile.photo.classList.remove("oc-teleport");
      });
    }
    const project = projects[modulo(position, count)];
    const booking = stage.querySelector(".oc-book");
    booking.href = project.href;
    booking.dataset.bike = project.name;
    booking.setAttribute("aria-label", `Add ${project.name} to cart`);
    document.dispatchEvent(new Event("bikechange"));
    stage.querySelector(".oc-counter").textContent = `${String(modulo(position, count) + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
    stage.dataset.position = String(position);
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      stage.querySelector(".oc-status").textContent = `${project.name}, ${project.category}, ${project.cc}, ${project.rent}. Bike ${modulo(position, count) + 1} of ${count}.`;
    }, 200);
  }
  function measure() {
    const content = stage.querySelector(".oc-content");
    const gutter = parseFloat(getComputedStyle(content).paddingLeft);
    stage.style.setProperty("--oc-name-inset", `${Math.max(0, content.clientWidth * 0.054 - gutter)}px`);
    nameStep = innerHeight * 0.18;
    if (innerWidth >= 768) {
      // Leave room for the title, category and rent, including shorter laptop screens.
      const tallestName = Math.max(...tiles.map(tile => tile.name.offsetHeight));
      nameStep = Math.max(nameStep, tallestName * 0.7 + 32);
      stage.style.setProperty("--oc-frame-offset", `${Math.max(innerHeight * 0.126, tallestName / 2 + 16)}px`);
    } else {
      stage.style.removeProperty("--oc-frame-offset");
    }
    photoStep = tiles[0].photo.offsetHeight + innerHeight * 0.03;
    render(true);
  }
  function step(direction) {
    const now = performance.now();
    if (now - lastStep < 55) return false;
    lastStep = now;
    position = modulo(position + direction, total);
    render();
    return true;
  }
  const editable = target => target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']");
  const bookingButton = stage.querySelector(".oc-book");
  let bookingTimer;
  bookingButton.addEventListener("click", event => {
    if (window.BikeCart) return;
    // Let mobile visitors see the slide before following the selected bike link.
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        !window.matchMedia("(max-width: 767px)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (bookingButton.classList.contains("is-booking")) return;
    const destination = bookingButton.href;
    bookingButton.classList.add("is-booking");
    bookingTimer = setTimeout(() => { window.location.assign(destination); }, 450);
  });
  window.addEventListener("pageshow", () => {
    clearTimeout(bookingTimer);
    bookingButton.classList.remove("is-booking");
  });
  document.addEventListener("wheel", event => {
    if (event.ctrlKey || editable(event.target)) return;
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (wheelDelta && Math.sign(delta) !== Math.sign(wheelDelta)) wheelDelta = 0;
    wheelDelta += delta;
    if (Math.abs(wheelDelta) >= 14 && step(Math.sign(wheelDelta))) wheelDelta = 0;
  }, { passive: false });
  stage.addEventListener("touchstart", event => {
    touchY = event.touches.length === 1 && !event.target.closest(".oc-actions") ? event.touches[0].clientY : null;
  }, { passive: true });
  stage.addEventListener("touchmove", event => {
    if (touchY === null || event.touches.length !== 1) return;
    event.preventDefault();
    const y = event.touches[0].clientY;
    if (Math.abs(touchY - y) > 28 && step(touchY > y ? 1 : -1)) touchY = y;
  }, { passive: false });
  ["touchend", "touchcancel"].forEach(type => stage.addEventListener(type, () => { touchY = null; }));
  document.addEventListener("keydown", event => {
    if (editable(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    step(direction);
  });
  stage.querySelector(".oc-previous").addEventListener("click", () => step(-1));
  stage.querySelector(".oc-next").addEventListener("click", () => step(1));
  window.addEventListener("resize", measure);
  document.documentElement.classList.add("oc-enabled");
  stage.hidden = false;
  measure();
})();
