"use strict";
// Business WhatsApp number, including country code and digits only.
const WHATSAPP_NUMBER = "917001193713";
const bookingForm = document.getElementById("booking-form");
const pickupDate = document.getElementById("pickup-date");
const returnDate = document.getElementById("return-date");
const pickupTime = document.getElementById("pickup-time");
const returnTime = document.getElementById("return-time");
const phoneInput = document.getElementById("customer-phone");
const statusMessage = document.getElementById("booking-status");
const contactDialog = document.getElementById("contact-dialog");
const termsDialog = document.getElementById("terms-dialog");
const termsForm = document.getElementById("terms-form");
const termsAgree = document.getElementById("terms-agree");
const termsSubmit = document.getElementById("terms-submit");
let pendingBookingMessage = "";

function localDate() {
  // Business dates follow India time, regardless of the visitor's time zone.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function syncTimes() {
  returnTime.setCustomValidity(
    pickupDate.value && pickupDate.value === returnDate.value &&
      pickupTime.value && returnTime.value && returnTime.value <= pickupTime.value
      ? "Return time must be after pickup time for a same-day rental."
      : "",
  );
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
  syncTimes();
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
  pickupTime.addEventListener("input", syncTimes);
  returnTime.addEventListener("input", syncTimes);
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
    locationInput.value.trim() ? "" : "Select your pickup location.",
  );
  if (!bookingForm.reportValidity()) return;
  const values = new FormData(bookingForm);
  const message = `Hello ABHI BIKE RENTAL 👋\n\nI would like to rent a bike.\n\nName: ${values.get("name").trim()}\nWhatsApp: ${values.get("phone").trim()}\nBike: ${values.get("bike")}\nPickup Date: ${values.get("pickupDate")}\nPickup Time: ${values.get("pickupTime")}\nReturn Date: ${values.get("returnDate")}\nReturn Time: ${values.get("returnTime")}\nPickup Location: ${values.get("location").trim()}\n\nPlease let me know the availability and rental price.\n\nThank you.`;
  pendingBookingMessage = message;
  termsAgree.checked = false;
  termsSubmit.disabled = true;
  termsDialog.showModal();
  termsDialog.querySelector(".terms-content").scrollTop = 0;
});
termsAgree.addEventListener("change", () => {
  termsSubmit.disabled = !termsAgree.checked;
});
document.getElementById("terms-close").addEventListener("click", () => termsDialog.close());
termsDialog.addEventListener("close", () => {
  pendingBookingMessage = "";
  termsAgree.checked = false;
  termsSubmit.disabled = true;
});
termsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!termsDialog.open || !pendingBookingMessage || !termsAgree.checked || !termsForm.reportValidity()) return;
  if (openWhatsApp(pendingBookingMessage + "\n\nI agree to the TERMS & CONDITIONS.")) {
    termsDialog.close();
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
