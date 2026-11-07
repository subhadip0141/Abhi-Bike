"use strict";
(() => {
  const cart = window.BikeCart;
  const status = document.createElement("p");
  status.className = "cart-feedback";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  document.body.append(status);
  let timer;
  function announce(name, added) {
    status.textContent = `${name} ${added ? "added" : "is already in your cart"}. ${cart.count()} bike${cart.count() === 1 ? "" : "s"} in your cart.${cart.isPersistent() ? "" : " Cart saving is unavailable; keep this page open."}`;
    status.classList.add("is-visible");
    clearTimeout(timer);
    timer = setTimeout(() => status.classList.remove("is-visible"), 4500);
  }
  document.querySelectorAll(".desktop-nav, .pill-navbar .pill").forEach(nav => {
    const link = document.createElement("a");
    link.href = "booking.html#cart";
    link.className = "cart-link";
    nav.append(link);
  });
  function update() {
    document.querySelectorAll(".cart-link").forEach(link => {
      link.textContent = `Cart (${cart.count()})`;
      link.setAttribute("aria-label", `View cart, ${cart.count()} bikes`);
    });
    document.querySelectorAll("[data-bike]").forEach(link => {
      const added = cart.has(link.dataset.bike);
      link.setAttribute("aria-disabled", String(added));
      link.setAttribute("aria-label", added ? `${link.dataset.bike} is in your cart` : `Add ${link.dataset.bike} to cart`);
      const label = link.querySelector(".oc-book__label");
      if (label) label.textContent = added ? "In cart" : "Add to cart";
      else if (link.firstChild?.nodeType === 3) link.firstChild.textContent = added ? "In cart " : "Add to cart ";
    });
  }
  cart.subscribe(update);
  document.addEventListener("bikechange", update);
  update();
  document.addEventListener("click", event => {
    const link = event.target.closest("[data-bike], .oc-book");
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const name = link.dataset.bike;
    if (!cart.names.includes(name)) return;
    event.preventDefault();
    announce(name, cart.add(name));
  });
})();
