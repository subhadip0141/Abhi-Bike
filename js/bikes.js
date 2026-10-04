"use strict";

// Catalogue filters describe bike types, not live rental availability.
const fleetControls = document.getElementById("fleet-controls");
const fleetCards = [...document.querySelectorAll("#fleet-grid .bike-card")];
const categoryButtons = [...document.querySelectorAll("[data-filter]")];
const bikeSearch = document.getElementById("bike-search");
const fleetCount = document.getElementById("fleet-count");
const emptyFleet = document.getElementById("fleet-empty");
let activeCategory = "all";

function filterFleet() {
  const query = bikeSearch.value.trim().toLowerCase();
  let visibleCount = 0;
  fleetCards.forEach((card) => {
    const visible =
      (activeCategory === "all" || card.dataset.category === activeCategory) &&
      query.split(/\s+/).every((word) => card.dataset.search.includes(word));
    card.hidden = !visible;
    // Filter feedback is immediate, including cards not yet revealed by scrolling.
    if (visible) {
      card.classList.add("is-visible");
      visibleCount++;
    }
  });
  emptyFleet.hidden = visibleCount > 0;
  const resultLabel =
    query || activeCategory !== "all"
      ? `${visibleCount === 1 ? "matches" : "match"} your selection`
      : "to explore";
  fleetCount.textContent = `${visibleCount} ${visibleCount === 1 ? "bike" : "bikes"} ${resultLabel}`;
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    categoryButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    filterFleet();
  });
});
bikeSearch.addEventListener("input", filterFleet);
document.getElementById("reset-filters").addEventListener("click", () => {
  bikeSearch.value = "";
  categoryButtons[0].click();
  bikeSearch.focus();
});
fleetControls.hidden = false;
