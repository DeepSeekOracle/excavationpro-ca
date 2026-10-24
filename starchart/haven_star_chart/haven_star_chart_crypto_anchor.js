/* LYGOAGENT economic anchor — live Virtuals Unicorn chart (GeckoTerminal, Base) */
(function () {
  const TOKEN = "0x32B513927F15e7A858bE779198440C04D399c09f";
  const POOL = "0xdbdfc04d005a6b4575b29e5df8109becdc8b9909";
  const GT = "https://api.geckoterminal.com/api/v2";
  const EMBED =
    "https://www.geckoterminal.com/base/pools/" + POOL +
    "?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=15m";
  const REFRESH_MS = 60000;

  const el = (id) => document.getElementById(id);

  function fmtUsd(n, digits) {
    if (digits == null) digits = 6;
    if (n == null || Number.isNaN(n)) return "—";
    const x = Number(n);
    if (x >= 1000000) return "$" + (x / 1000000).toFixed(2) + "M";
    if (x >= 1000) return "$" + x.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (x >= 0.01) return "$" + x.toFixed(4);
    if (x > 0) return "$" + x.toFixed(digits);
    return "$0";
  }

  function fmtPct(n) {
    if (n == null || Number.isNaN(n)) return "—";
    const s = Number(n).toFixed(2);
    return (n >= 0 ? "+" : "") + s + "%";
  }

  async function fetchJson(url) {
    const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  let chart = null;
  let series = null;

  function ensureChart() {
    const box = el("cryptoChart");
    if (!box || chart || typeof LightweightCharts === "undefined") return false;
    box.innerHTML = "";
    delete box.dataset.note;
    chart = LightweightCharts.createChart(box, {
      width: Math.max(box.clientWidth || 320, 240),
      height: 280,
      layout: {
        background: { type: "solid", color: "rgba(5, 5, 12, 0)" },
        textColor: "#9a9ab8",
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(125, 0, 255, 0.12)" },
        horzLines: { color: "rgba(0, 240, 255, 0.08)" },
      },
      rightPriceScale: { borderColor: "rgba(0, 240, 255, 0.2)" },
      timeScale: { borderColor: "rgba(255, 204, 0, 0.25)", timeVisible: true },
      crosshair: {
        vertLine: { color: "rgba(0, 240, 255, 0.45)" },
        horzLine: { color: "rgba(255, 204, 0, 0.45)" },
      },
    });
    series = chart.addCandlestickSeries({
      upColor: "#00f0ff",
      downColor: "#7d00ff",
      borderUpColor: "#00f0ff",
      borderDownColor: "#7d00ff",
      wickUpColor: "#00f0ff",
      wickDownColor: "#7d00ff",
    });
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        if (chart && box) chart.applyOptions({ width: Math.max(box.clientWidth || 320, 240) });
      });
      ro.observe(box);
    }
    return true;
  }

  function showEmbedFallback(why) {
    const box = el("cryptoChart");
    if (!box || box.dataset.embed) return;
    box.dataset.embed = "1";
    box.innerHTML =
      '<iframe src="' + EMBED +
      '" title="LYGOAGENT / VIRTUAL GeckoTerminal" style="width:100%;height:280px;border:0;border-radius:6px;background:#080812" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
    const status = el("cryptoStatus");
    if (status) {
      status.textContent = why || "Live Gecko embed";
      status.className = "crypto-status warn";
    }
  }

  function ohlcvToCandles(list) {
    const seen = Object.create(null);
    return (list || [])
      .map(function (row) {
        return {
          time: Number(row[0]),
          open: Number(row[1]),
          high: Number(row[2]),
          low: Number(row[3]),
          close: Number(row[4]),
        };
      })
      .filter(function (c) {
        if (!(c.time > 0) || !(c.close > 0)) return false;
        if (seen[c.time]) return false;
        seen[c.time] = 1;
        return true;
      })
      .sort(function (a, b) { return a.time - b.time; });
  }

  function fillStats(attrs) {
    const price = Number(attrs.base_token_price_usd || attrs.token_price_usd);
    const fdv = Number(attrs.fdv_usd);
    const reserve = Number(attrs.reserve_in_usd);
    const vol = attrs.volume_usd || {};
    const vol24 = Number(vol.h24);
    const ch = attrs.price_change_percentage || {};
    const ch24 = Number(ch.h24);
    if (el("cryptoPrice")) el("cryptoPrice").textContent = fmtUsd(price, 8);
    if (el("cryptoFdv")) el("cryptoFdv").textContent = fmtUsd(fdv, 2);
    if (el("cryptoReserve")) el("cryptoReserve").textContent = fmtUsd(reserve, 2);
    if (el("cryptoVol24")) el("cryptoVol24").textContent = fmtUsd(vol24, 2);
    if (el("cryptoCh24")) {
      el("cryptoCh24").textContent = fmtPct(ch24);
      el("cryptoCh24").className = "crypto-stat-val " + (ch24 >= 0 ? "up" : "down");
    }
    if (el("cryptoPairName")) el("cryptoPairName").textContent = attrs.name || attrs.pool_name || "LYGOAGENT / VIRTUAL";
    if (el("cryptoUpdated")) el("cryptoUpdated").textContent = "Live · " + new Date().toUTCString();
  }

  async function loadPool() {
    try {
      const poolRes = await fetchJson(GT + "/networks/base/pools/" + POOL);
      if (poolRes && poolRes.data && poolRes.data.attributes) return poolRes.data.attributes;
    } catch (_) { /* try token list */ }
    const listRes = await fetchJson(GT + "/networks/base/tokens/" + TOKEN + "/pools");
    const first = (listRes.data || [])[0];
    return (first && first.attributes) || {};
  }

  async function loadCandles() {
    const urls = [
      GT + "/networks/base/pools/" + POOL + "/ohlcv/hour?aggregate=1&limit=72",
      GT + "/networks/base/pools/" + POOL + "/ohlcv/minute?aggregate=15&limit=96",
      GT + "/networks/base/pools/" + POOL + "/ohlcv/day?aggregate=1&limit=60",
    ];
    for (let i = 0; i < urls.length; i++) {
      try {
        const res = await fetchJson(urls[i]);
        const list = res && res.data && res.data.attributes && res.data.attributes.ohlcv_list;
        const candles = ohlcvToCandles(list);
        if (candles.length) return candles;
      } catch (_) { /* next resolution */ }
    }
    return [];
  }

  async function refresh() {
    const status = el("cryptoStatus");
    try {
      const attrs = await loadPool();
      fillStats(attrs);
      const candles = await loadCandles();
      if (candles.length && typeof LightweightCharts !== "undefined") {
        ensureChart();
        if (series) series.setData(candles);
        if (status) {
          status.textContent = "Virtuals Unicorn · Base · " + candles.length + " candles";
          status.className = "crypto-status ok";
        }
      } else {
        showEmbedFallback(candles.length ? "Candles ready · chart lib missed" : "API empty · Gecko embed");
      }
    } catch (e) {
      console.warn("crypto anchor refresh", e);
      showEmbedFallback("Gecko REST missed · live embed");
    }
  }

  function initCopy() {
    const btn = el("cryptoCopyContract");
    if (!btn) return;
    btn.addEventListener("click", function () {
      const done = function () {
        btn.textContent = "Copied ✓";
        setTimeout(function () { btn.textContent = "Copy contract"; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(TOKEN).then(done).catch(done);
      } else done();
    });
  }

  function start() {
    if (!el("crypto-anchor")) return;
    initCopy();
    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
