"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../js/booking.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../frontend/booking.html"), "utf8");
const bikeNames = [...html.matchAll(/<option>([^<]+)<\/option>/g)].map(match => match[1]);

function bookingPage(requestedBike = "") {
  const elements = new Map();
  const opened = [];
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: "", hidden: true, validation: "", listeners: {},
      addEventListener(event, callback) { this.listeners[event] = callback; },
      setCustomValidity(message) { this.validation = message; },
      showModal() { this.open = true; }, close() { this.open = false; },
    });
    return elements.get(id);
  }
  element("bike-select").options = [{ value: "" }, ...bikeNames.map(value => ({ value }))];
  element("booking-form").reportValidity = () => ["customer-name", "customer-phone", "pickup-date", "return-date", "pickup-location", "bike-select"].every(id => element(id).value && !element(id).validation);
  const names = { name: "customer-name", phone: "customer-phone", pickupDate: "pickup-date", returnDate: "return-date", location: "pickup-location", bike: "bike-select" };
  const context = {
    document: { getElementById: element, querySelectorAll: () => [] },
    window: { location: { search: "?bike=" + encodeURIComponent(requestedBike) }, open: (...args) => opened.push(args) },
    URLSearchParams, Intl, Date,
    FormData: class { get(name) { return element(names[name]).value; } },
  };
  vm.runInNewContext(source, context);
  const fillValid = () => {
    element("customer-name").value = "Test & Rider";
    element("customer-phone").value = "+91 98765 43210";
    element("pickup-location").value = "Siliguri & Hotel";
    element("bike-select").value = bikeNames[0];
    element("pickup-date").value = element("pickup-date").min;
    element("return-date").value = element("pickup-date").min;
  };
  const submit = () => element("booking-form").listeners.submit({ preventDefault() {} });
  return { element, opened, fillValid, submit };
}

test("all catalogue bikes prefill, unknown bikes are ignored", () => {
  assert.equal(bikeNames.length, 9);
  for (const name of bikeNames) assert.equal(bookingPage(name).element("bike-select").value, name);
  assert.equal(bookingPage("unknown").element("bike-select").value, "");
});

test("valid enquiry opens a correctly encoded WhatsApp URL with the configured business number", () => {
  const page = bookingPage(); page.fillValid(); page.submit();
  assert.equal(page.opened.length, 1);
  const [href, target, features] = page.opened[0];
  const url = new URL(href);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/917364897023");
  assert.match(url.searchParams.get("text"), /Name: Test & Rider/);
  assert.match(url.searchParams.get("text"), /Pickup Location: Siliguri & Hotel/);
  assert.equal(target, "_blank"); assert.equal(features, "noopener,noreferrer");
  assert.equal(page.element("booking-status").hidden, false);
});

test("invalid phone, dates and whitespace-only fields block enquiries", () => {
  for (const [field, value] of [["customer-phone", "123"], ["customer-name", "   "], ["pickup-location", "   "], ["pickup-date", "2000-01-01"], ["return-date", "2000-01-01"]]) {
    const page = bookingPage(); page.fillValid(); page.element(field).value = value; page.submit();
    assert.equal(page.opened.length, 0, field);
  }
});
