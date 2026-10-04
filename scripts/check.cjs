"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const failures = [];
let references = 0;
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function checkReference(file, raw) {
  const value = raw.replace(/&amp;/g, "&");
  if (/^(?:[a-z]+:|\/\/)/i.test(value)) return;
  const [pathname, fragment] = value.split("#");
  const target = path.resolve(root, path.dirname(file), decodeURIComponent(pathname.split("?")[0] || path.basename(file)));
  references++;
  if (!fs.existsSync(target)) failures.push(`${file}: missing ${raw}`);
  else if (fragment && target.endsWith(".html") && !new RegExp(`id=["']${fragment}["']`).test(fs.readFileSync(target, "utf8"))) failures.push(`${file}: missing fragment ${raw}`);
}
const pages = ["index.html", ...fs.readdirSync(path.join(root, "frontend")).filter(f => f.endsWith(".html")).map(f => "frontend/" + f)];
for (const file of pages) {
  const html = read(file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) failures.push(`${file}: duplicate IDs`);
  if (!/<html lang="en"/.test(html) || !/<title>.+<\/title>/.test(html)) failures.push(`${file}: missing language or title`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) checkReference(file, match[1]);
  for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) for (const source of match[1].split(",")) checkReference(file, source.trim().split(/\s+/)[0]);
  for (const match of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="[^"]*"/.test(match[0])) failures.push(`${file}: image missing alt text`);
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(match[0])) failures.push(`${file}: external link missing noopener`);
}
for (const file of fs.readdirSync(path.join(root, "css")).filter(f => f.endsWith(".css"))) {
  for (const match of read("css/" + file).matchAll(/url\(["']?([^"')]+)["']?\)/g)) checkReference("css/" + file, match[1]);
}
for (const file of fs.readdirSync(path.join(root, "js")).filter(f => /\.(?:js|cjs)$/.test(f))) {
  try { new vm.Script(read("js/" + file), { filename: file }); } catch (error) { failures.push(error.message); }
}
const booking = read("js/booking.js").match(/WHATSAPP_NUMBER = "([^"]+)"/);
if (!booking || !/^\d{10,15}$/.test(booking[1])) failures.push("Booking WhatsApp number must contain 10–15 digits only");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log(`Checked ${pages.length} HTML pages, ${references} local references, JavaScript syntax and WhatsApp configuration.`);
