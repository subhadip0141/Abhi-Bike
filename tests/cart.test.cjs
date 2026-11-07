"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname, "../js/cart.js"), "utf8");
function setup(storage = new Map(), blocked = false) {
  let storageEvent;
  const window = {
    localStorage: {
      getItem(key) { if (blocked) throw Error("blocked"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error("blocked"); storage.set(key, value); },
    },
    addEventListener(type, listener) { storageEvent = listener; },
  };
  vm.runInNewContext(source, { window });
  return { cart: window.BikeCart, storageEvent };
}
test("each bike is added once, persists across pages and can be removed", () => {
  const storage = new Map();
  const { cart } = setup(storage);
  const [first, second] = cart.names;
  cart.add(first); cart.add(second); cart.add(first);
  const restored = setup(storage).cart;
  assert.equal(restored.count(), 2);
  assert.equal(restored.getItems()[0].quantity, 1);
  restored.remove(first);
  assert.equal(setup(storage).cart.getItems()[0].name, second);
  assert.equal(setup(storage).cart.count(), 1);
});
test("invalid storage and unknown bikes cannot enter the cart; older quantities become one", () => {
  for (const value of ["bad json", "{}", "null", '[{"name":"unknown","quantity":2}]']) {
    assert.equal(setup(new Map([["abhi-bike-cart-v1", value]])).cart.count(), 0);
  }
  const { cart } = setup();
  assert.equal(cart.add("unknown"), false);
  const name = cart.names[0];
  cart.add(name);
  assert.equal(cart.add(name), false);
  assert.equal(cart.count(), 1);
  const migrated = setup(new Map([["abhi-bike-cart-v1", JSON.stringify([{ name, quantity: 99 }, { name, quantity: 2 }])]])).cart;
  assert.equal(migrated.count(), 1);
  assert.equal(migrated.getItems()[0].quantity, 1);
  const copy = cart.getItems(); copy[0].quantity = 500;
  assert.equal(cart.getItems()[0].quantity, 1);
  cart.remove(name); cart.add(name);
  assert.equal(cart.count(), 1);
});
test("blocked storage keeps an in-memory cart and reports the persistence limit", () => {
  const { cart } = setup(new Map(), true);
  cart.add(cart.names[0]);
  assert.equal(cart.count(), 1);
  assert.equal(cart.isPersistent(), false);
});
test("cross-tab updates and storage clearing notify the booking page", () => {
  const { cart, storageEvent } = setup();
  let changes = 0;
  cart.subscribe(() => changes++);
  storageEvent({ key: "abhi-bike-cart-v1", newValue: JSON.stringify([{ name: cart.names[0], quantity: 2 }]) });
  assert.equal(cart.count(), 1);
  storageEvent({ key: null, newValue: null });
  assert.equal(cart.count(), 0);
  assert.equal(changes, 2);
});
