"use strict";
(() => {
  const key = "abhi-bike-cart-v1";
  const names = ["Royal Enfield Himalayan 450", "Royal Enfield Himalayan 411", "Royal Enfield Scram 411", "Royal Enfield Hunter 350", "Bajaj Pulsar NS160", "TVS Ntorq B.P. Edition", "TVS Ntorq Race Edition", "Suzuki Burgman 125", "Bajaj Avenger"];
  const normalize = value => {
    if (!Array.isArray(value)) return [];
    const items = new Map();
    for (const item of value) {
      if (item && names.includes(item.name) && Number.isInteger(item.quantity) && item.quantity > 0) {
        items.set(item.name, { name: item.name, quantity: 1 });
      }
    }
    return [...items.values()];
  };
  let items = [];
  let persistent = true;
  try { items = normalize(JSON.parse(window.localStorage.getItem(key))); }
  catch { persistent = false; }
  const listeners = new Set();
  const notify = () => listeners.forEach(listener => listener());
  const save = () => {
    try { window.localStorage.setItem(key, JSON.stringify(items)); persistent = true; }
    catch { persistent = false; }
    notify();
  };
  window.BikeCart = {
    names,
    getItems: () => items.map(item => ({ ...item })),
    count: () => items.length,
    has: name => items.some(item => item.name === name),
    isPersistent: () => persistent,
    add(name) {
      if (!names.includes(name) || items.some(item => item.name === name)) return false;
      items.push({ name, quantity: 1 });
      save();
      return true;
    },
    remove(name) {
      items = items.filter(item => item.name !== name);
      save();
    },
    subscribe(listener) { listeners.add(listener); },
  };
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    try { items = normalize(JSON.parse(event.newValue)); } catch { items = []; }
    notify();
  });
})();
