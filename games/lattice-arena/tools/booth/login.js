/* One-time Twitch connect. Runs on the PC where the browser is.
   Writes twitch.json next to this file. The secret stays on this machine. */
"use strict";
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = 8792;
const FILE = process.argv[2] || path.join(__dirname, "twitch.json");
/* Twitch rejects http://127.0.0.1. It accepts http://localhost on this port. */
const REDIRECT = "http://localhost:" + PORT + "/callback";
const SCOPES = "channel:manage:predictions user:write:chat";

function read() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { return {}; }
}
function write(obj) { fs.writeFileSync(FILE, JSON.stringify(obj, null, 2)); }

function page(body) {
  return `<!doctype html><meta charset="utf-8"><title>LYGO booth</title>
  <style>body{font:18px/1.45 Segoe UI,sans-serif;background:#140e08;color:#f6e7c2;margin:40px}
  a,button{color:#140e08;background:#e7c27a;border:0;padding:10px 16px;font:inherit;cursor:pointer}
  input{display:block;width:min(520px,100%);margin:8px 0 16px;padding:8px;font:16px monospace}
  code{color:#e7c27a}</style>${body}`;
}

function form() {
  const cur = read();
  return page(`<h1>Connect the booth to Twitch</h1>
  <p>One time. This page stays on this PC. The API docs page is not the app form.</p>
  <ol>
  <li>Open <a href="https://dev.twitch.tv/console/apps">dev.twitch.tv/console/apps</a> and register an application.</li>
  <li>Name it <b>LYGO Arena Booth</b>. Category <b>Broadcasting Suite</b>.</li>
  <li>OAuth Redirect URL, typed in the box: <code>${REDIRECT}</code></li>
  <li>Do not click Add. An extra empty box makes Twitch demand HTTPS. Then click Create.</li>
  <li>Open the app, copy the client id, click New Secret, and paste both here.</li>
  </ol>
  <form method="post" action="/save">
  <label>Client id<input name="clientId" value="${cur.clientId || ""}" autocomplete="off"></label>
  <label>Client secret<input name="clientSecret" value="" autocomplete="off"></label>
  <button type="submit">Connect the channel</button>
  </form>`);
}

function exchange(code, conf) {
  const body = new URLSearchParams({
    client_id: conf.clientId,
    client_secret: conf.clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT
  }).toString();
  return new Promise((resolve) => {
    const req = https.request("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) }
    }, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, json: {} }); }
      });
    });
    req.on("error", (e) => resolve({ status: 0, json: { message: e.message } }));
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:" + PORT);
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(form());
    return;
  }
  if (req.method === "POST" && url.pathname === "/save") {
    let raw = "";
    for await (const c of req) raw += c;
    const data = new URLSearchParams(raw);
    const conf = read();
    conf.clientId = String(data.get("clientId") || "").trim();
    conf.clientSecret = String(data.get("clientSecret") || "").trim();
    write(conf);
    const auth = "https://id.twitch.tv/oauth2/authorize?client_id=" + encodeURIComponent(conf.clientId) +
      "&redirect_uri=" + encodeURIComponent(REDIRECT) +
      "&response_type=code&scope=" + encodeURIComponent(SCOPES);
    res.writeHead(302, { Location: auth });
    res.end();
    return;
  }
  if (req.method === "GET" && url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    const conf = read();
    const out = await exchange(code, conf);
    if (!out.json.access_token) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(page("<h1>Twitch did not return a token</h1><p>" + (out.json.message || out.status) + "</p><p><a href='/'>Try again</a></p>"));
      return;
    }
    conf.accessToken = out.json.access_token;
    conf.refreshToken = out.json.refresh_token || "";
    write(conf);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(page("<h1>The channel is connected.</h1><p>You can close this tab. The booth picks the token up on its own.</p>"));
    console.log("token saved");
    return;
  }
  res.writeHead(404);
  res.end();
});
server.listen(PORT, "127.0.0.1", () => console.log("open http://localhost:" + PORT));
