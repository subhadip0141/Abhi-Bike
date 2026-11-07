"use strict";
(() => {
  const navbar = document.getElementById("pill-navbar");
  if (!navbar) return;
  const burger = navbar.querySelector(".burger");
  const menu = navbar.querySelector(".menu");
  const setOpen = (open) => {
    navbar.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    // Inert removes closed links from keyboard navigation without hiding glass transitions.
    menu.inert = !open;
  };
  const close = () => {
    const focusWasInside = menu.contains(document.activeElement);
    setOpen(false);
    if (focusWasInside) burger.focus();
  };
  burger.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!navbar.classList.contains("is-open"));
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!navbar.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navbar.classList.contains("is-open")) {
      close();
      burger.focus();
    }
  });
  window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
  const settle = () => requestAnimationFrame(() => requestAnimationFrame(() => navbar.classList.add("is-loaded")));
  if (document.readyState === "complete") settle();
  else window.addEventListener("load", settle, { once: true });
})();
