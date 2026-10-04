"use strict";
// Business WhatsApp number, including country code and digits only.
const WHATSAPP_NUMBER = "917364897023";
const bookingForm = document.getElementById("booking-form");
const pickupDate = document.getElementById("pickup-date");
const returnDate = document.getElementById("return-date");
const phoneInput = document.getElementById("customer-phone");
const statusMessage = document.getElementById("booking-status");
const contactDialog = document.getElementById("contact-dialog");

function localDate() {
  // Business dates follow India time, regardless of the visitor's time zone.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function syncDates() {
  pickupDate.min = localDate();
  returnDate.min = pickupDate.value || pickupDate.min;
  pickupDate.setCustomValidity(
    pickupDate.value && pickupDate.value < pickupDate.min
      ? "Choose today or a future pickup date."
      : "",
  );
  returnDate.setCustomValidity(
    returnDate.value && returnDate.value < returnDate.min
      ? "Return date must be on or after pickup date."
      : "",
  );
}
if (bookingForm) {
  const bikeDropdown = document.getElementById("bike-select");
  const selectedBikeNote = document.getElementById("selected-bike");
  const requestedBike = new URLSearchParams(window.location.search).get("bike");
  if (
    [...bikeDropdown.options].some((option) => option.value === requestedBike)
  ) {
    bikeDropdown.value = requestedBike;
  }
  const showSelectedBike = () => {
    selectedBikeNote.hidden = !bikeDropdown.value;
    selectedBikeNote.textContent = bikeDropdown.value
      ? `Your selected ride: ${bikeDropdown.value}`
      : "";
  };
  showSelectedBike();
  bikeDropdown.addEventListener("change", showSelectedBike);
  syncDates();
  pickupDate.addEventListener("change", syncDates);
  returnDate.addEventListener("change", syncDates);
  phoneInput.addEventListener("input", () => phoneInput.setCustomValidity(""));
}
function openWhatsApp(message) {
  if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
    contactDialog.showModal();
    return false;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  syncDates();
  const digits = phoneInput.value.replace(/\D/g, "");
  phoneInput.setCustomValidity(
    digits.length < 10 || digits.length > 15
      ? "Enter a valid WhatsApp number with 10 to 15 digits."
      : "",
  );
  const nameInput = document.getElementById("customer-name");
  const locationInput = document.getElementById("pickup-location");
  nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Enter your name.");
  locationInput.setCustomValidity(
    locationInput.value.trim() ? "" : "Enter your pickup location.",
  );
  if (!bookingForm.reportValidity()) return;
  const values = new FormData(bookingForm);
  const message = `Hello ABHI BIKE RENTAL 👋\n\nI would like to rent a bike.\n\nName: ${values.get("name").trim()}\nWhatsApp: ${values.get("phone").trim()}\nBike: ${values.get("bike")}\nPickup Date: ${values.get("pickupDate")}\nReturn Date: ${values.get("returnDate")}\nPickup Location: ${values.get("location").trim()}\n\nPlease let me know the availability and rental price.\n\nThank you.`;
  if (openWhatsApp(message)) {
    statusMessage.textContent =
      "Continue in WhatsApp to send your enquiry. Your booking is confirmed only after speaking with ABHI.";
    statusMessage.hidden = false;
  }
});
["customer-name", "pickup-location"].forEach((id) =>
  document
    .getElementById(id)
    ?.addEventListener("input", (event) => event.target.setCustomValidity("")),
);
document
  .querySelectorAll(".dialog-close, .dialog-dismiss")
  .forEach((button) =>
    button.addEventListener("click", () => contactDialog.close()),
  );
contactDialog.addEventListener("click", (event) => {
  if (event.target === contactDialog) {
    const bounds = contactDialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      contactDialog.close();
  }
});
