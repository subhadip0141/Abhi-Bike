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
      value: "", hidden: true, checked: false, validation: "", listeners: {},
      addEventListener(event, callback) { this.listeners[event] = callback; },
      setCustomValidity(message) { this.validation = message; },
      showModal() { this.open = true; }, close() { this.open = false; this.listeners.close?.(); },
      querySelector() { return element("terms-content"); },
    });
    return elements.get(id);
  }
  element("bike-select").options = [{ value: "" }, ...bikeNames.map(value => ({ value }))];
  element("booking-form").reportValidity = () => ["customer-name", "customer-phone", "pickup-date", "return-date", "pickup-time", "return-time", "pickup-location", "bike-select"].every(id => element(id).value && !element(id).validation);
  element("terms-form").reportValidity = () => element("terms-agree").checked;
  const names = { name: "customer-name", phone: "customer-phone", pickupDate: "pickup-date", returnDate: "return-date", pickupTime: "pickup-time", returnTime: "return-time", pickupPeriod: "pickup-period", returnPeriod: "return-period", location: "pickup-location", bike: "bike-select" };
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
    element("pickup-location").value = "Ashapurna Sarani Road, near Siliguri Junction";
    element("bike-select").value = bikeNames[0];
    element("pickup-date").value = element("pickup-date").min;
    element("return-date").value = element("pickup-date").min;
    element("pickup-time").value = "09:00";
    element("return-time").value = "05:00";
    element("pickup-period").value = "AM";
    element("return-period").value = "PM";
  };
  const submit = () => element("booking-form").listeners.submit({ preventDefault() {} });
  const acceptTerms = () => {
    element("terms-agree").checked = true;
    element("terms-agree").listeners.change();
    element("terms-form").listeners.submit({ preventDefault() {} });
  };
  return { element, opened, fillValid, submit, acceptTerms };
}

test("all catalogue bikes prefill, unknown bikes are ignored", () => {
  assert.equal(bikeNames.length, 9);
  for (const name of bikeNames) assert.equal(bookingPage(name).element("bike-select").value, name);
  assert.equal(bookingPage("unknown").element("bike-select").value, "");
});

test("valid enquiry opens a correctly encoded WhatsApp URL with the configured business number", () => {
  const page = bookingPage(); page.fillValid(); page.submit();
  assert.equal(page.opened.length, 0);
  assert.equal(page.element("terms-dialog").open, true);
  page.acceptTerms();
  assert.equal(page.opened.length, 1);
  const [href, target, features] = page.opened[0];
  const url = new URL(href);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/917001193713");
  assert.match(url.searchParams.get("text"), /Name: Test & Rider/);
  assert.match(url.searchParams.get("text"), /Pickup Location: Ashapurna Sarani Road, near Siliguri Junction/);
  assert.match(url.searchParams.get("text"), /Pickup Time: 9:00 AM/);
  assert.match(url.searchParams.get("text"), /Return Time: 5:00 PM/);
  assert.match(url.searchParams.get("text"), /I agree to the TERMS & CONDITIONS/);
  assert.equal(target, "_blank"); assert.equal(features, "noopener,noreferrer");
  assert.equal(page.element("booking-status").hidden, false);
});

test("WhatsApp times show AM and PM correctly at midnight, noon and day boundaries", () => {
  for (const [time, period, formatted] of [["12:00", "AM", "12:00 AM"], ["11:59", "AM", "11:59 AM"], ["12:00", "PM", "12:00 PM"], ["11:05", "PM", "11:05 PM"]]) {
    const page = bookingPage(); page.fillValid();
    page.element("pickup-time").value = time;
    page.element("return-time").value = time;
    page.element("pickup-period").value = period;
    page.element("return-period").value = period;
    page.element("return-date").value = "2099-12-31";
    page.submit(); page.acceptTerms();
    const message = new URL(page.opened[0][0]).searchParams.get("text");
    assert.ok(message.includes(`Pickup Time: ${formatted}\n`));
    assert.ok(message.includes(`Return Time: ${formatted}\n`));
  }
});

test("invalid phone, dates and whitespace-only fields block enquiries", () => {
  for (const [field, value] of [["customer-phone", "123"], ["customer-name", "   "], ["pickup-location", "   "], ["pickup-date", "2000-01-01"], ["return-date", "2000-01-01"]]) {
    const page = bookingPage(); page.fillValid(); page.element(field).value = value; page.submit();
    assert.equal(page.opened.length, 0, field);
  }
});

test("same-day returns must be after pickup and changing dates clears time errors", () => {
  for (const time of ["08:00", "09:00"]) {
    const page = bookingPage(); page.fillValid();
    page.element("return-period").value = "AM";
    page.element("return-time").value = time; page.submit();
    assert.equal(page.opened.length, 0);
    assert.match(page.element("return-time").validation, /after pickup time/);
    page.element("return-date").value = "2099-12-31";
    page.element("return-date").listeners.change();
    assert.equal(page.element("return-time").validation, "");
    page.submit(); page.acceptTerms(); assert.equal(page.opened.length, 1);
  }
});

test("both times are required and editing a time clears an invalid order", () => {
  for (const field of ["pickup-time", "return-time"]) {
    const page = bookingPage(); page.fillValid();
    page.element(field).value = ""; page.submit();
    assert.equal(page.opened.length, 0);
  }
  const page = bookingPage(); page.fillValid();
  page.element("return-period").value = "AM";
  page.element("return-time").value = "08:00"; page.submit();
  page.element("pickup-time").value = "07:00";
  page.element("pickup-time").listeners.input();
  assert.equal(page.element("return-time").validation, "");
  page.submit(); page.acceptTerms(); assert.equal(page.opened.length, 1);
});

test("AM/PM selections determine same-day ordering and changing the period clears errors", () => {
  for (const [pickup, pickupPeriod, returned, returnPeriod, valid] of [
    ["11:30", "AM", "12:00", "PM", true],
    ["12:00", "AM", "01:00", "AM", true],
    ["12:00", "PM", "11:00", "AM", false],
    ["09:00", "PM", "09:00", "AM", false],
  ]) {
    const page = bookingPage(); page.fillValid();
    page.element("pickup-time").value = pickup;
    page.element("pickup-period").value = pickupPeriod;
    page.element("return-time").value = returned;
    page.element("return-period").value = returnPeriod;
    page.submit();
    assert.equal(!!page.element("terms-dialog").open, valid);
  }
  const page = bookingPage(); page.fillValid();
  page.element("return-time").value = "08:00";
  page.element("return-period").value = "AM";
  page.submit();
  assert.match(page.element("return-time").validation, /after pickup time/);
  page.element("return-period").value = "PM";
  page.element("return-period").listeners.change();
  assert.equal(page.element("return-time").validation, "");
  page.submit(); page.acceptTerms();
  assert.match(new URL(page.opened[0][0]).searchParams.get("text"), /Return Time: 8:00 PM/);
});

test("invalid 12-hour times cannot open the terms popup", () => {
  for (const field of ["pickup-time", "return-time"]) {
    for (const value of ["00:00", "13:30", "9:60", "9", "abc"]) {
      const page = bookingPage(); page.fillValid();
      page.element(field).value = value; page.submit();
      assert.equal(!!page.element("terms-dialog").open, false);
      assert.equal(page.opened.length, 0);
    }
  }
});

test("terms require agreement, cancellation preserves the booking and reopening resets consent", () => {
  const page = bookingPage(); page.fillValid(); page.submit();
  assert.equal(page.element("terms-submit").disabled, true);
  page.element("terms-form").listeners.submit({ preventDefault() {} });
  assert.equal(page.opened.length, 0);
  page.element("terms-agree").checked = true;
  page.element("terms-agree").listeners.change();
  assert.equal(page.element("terms-submit").disabled, false);
  page.element("terms-close").listeners.click();
  assert.equal(page.element("customer-name").value, "Test & Rider");
  page.acceptTerms();
  assert.equal(page.opened.length, 0);
  page.submit();
  assert.equal(page.element("terms-agree").checked, false);
  assert.equal(page.element("terms-submit").disabled, true);
  page.acceptTerms();
  assert.equal(page.opened.length, 1);
});
