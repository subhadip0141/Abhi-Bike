"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../js/serve.cjs");

test("preview server serves the website and blocks private repository files", async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const home = await fetch(base + "/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /frontend\/index.html/);
  const image = await fetch(base + "/assets/images/gallery/trains.webp", { method: "HEAD" });
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/webp");
  assert.equal(await image.text(), "");
  for (const route of ["/.git/config", "/.env", "/package.json", "/js/serve.cjs", "/assets/%2e%2e/%2e%2e/.git/config"]) assert.equal((await fetch(base + route)).status, 403, route);
  assert.equal((await fetch(base + "/frontend/missing.html")).status, 404);
  assert.equal((await fetch(base + "/frontend/%00.html")).status, 400);
  assert.equal((await fetch(base + "/frontend/%FF.html")).status, 400);
  assert.equal((await fetch(base, { method: "POST" })).status, 405);
});
