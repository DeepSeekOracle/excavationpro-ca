(function () {
  const CHAMPS = {
    LYRA: "Memory, song, continuity of theme. Observed / Inferred / Unknown.",
    "Δ9RA": "Boundary vigilance. List risks and what would break first.",
    "ΣRΛΘ": "Shadow sentinel. What is omitted or failing silently?",
    ARKOS: "Ethical Reality Architect. Intent, constraints, blueprint, failure, receipts.",
    KAIROS: "Timing. Ordered steps with why this order.",
    "ÆTHERIS": "Claim vs evidence. RESOURCE vs CANON.",
    "ΣCENΔR": "At least two live scenarios and what would falsify each.",
    SANCORA: "Shared vocabulary and handoff. Not medical advice.",
    SEPHRAEL: "Echoes, fragile items, archive vs discard. No secrets in notes.",
    "OMNIΣIREN": "Constraints only, then the next irreversible-safe step.",
    Lightfather: "Provenance and consent. Never claim to be the human operator.",
    "VΩLARIS": "Criteria, scores, tradeoffs, recommendation.",
    "ZETAΔ9": "Weird inputs and boundary tests. Do not break production.",
    JUSTICAE: "Affected parties, disclosure, consent. No doxxing.",
    "ΣEIDŌN": "Surface vs depth. Witness, do not flatten a long project.",
  };
  const P0 = /format\s+c:|\bdiskpart\b|\bbcdedit\b|rm\s+-rf\s+\/|invoke-expression/i;
  const PROVIDERS = {
    groq: { label: "Groq (free, no card)", kind: "openai", url: "https://api.groq.com/openai/v1/chat/completions", model: "openai/gpt-oss-20b", models: ["openai/gpt-oss-20b", "groq/compound-mini", "groq/compound", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"], key: true, help: "Get a key at console.groq.com/keys (one free option). Any provider in the list works." },
    gemini: { label: "Google Gemini (free, no card)", kind: "openai", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.0-flash", key: true, help: "aistudio.google.com/apikey" },
    openrouter: { label: "OpenRouter (many :free models)", kind: "openai", url: "https://openrouter.ai/api/v1/chat/completions", model: "openrouter/auto", key: true, help: "openrouter.ai/keys — use model ids ending :free", extra: { "HTTP-Referer": "https://excavationpro.ca/portal/", "X-Title": "LYGO API Portal" } },
    cerebras: { label: "Cerebras (fast, free/trial)", kind: "openai", url: "https://api.cerebras.ai/v1/chat/completions", model: "llama3.1-8b", key: true, help: "cloud.cerebras.ai" },
    huggingface: { label: "Hugging Face router", kind: "openai", url: "https://router.huggingface.co/v1/chat/completions", model: "Qwen/Qwen2.5-1.5B-Instruct", key: true, help: "huggingface.co/settings/tokens" },
    mistral: { label: "Mistral (free / cheap)", kind: "openai", url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-small-latest", key: true, help: "console.mistral.ai" },
    nvidia: { label: "NVIDIA NIM (free catalog)", kind: "openai", url: "https://integrate.api.nvidia.com/v1/chat/completions", model: "meta/llama-3.1-8b-instruct", key: true, help: "build.nvidia.com" },
    cohere: { label: "Cohere (trial)", kind: "openai", url: "https://api.cohere.ai/compatibility/v1/chat/completions", model: "command-r-plus", key: true, help: "dashboard.cohere.com/api-keys" },
    sambanova: { label: "SambaNova Cloud", kind: "openai", url: "https://api.sambanova.ai/v1/chat/completions", model: "Meta-Llama-3.1-8B-Instruct", key: true, help: "cloud.sambanova.ai" },
    llm7: { label: "LLM7.io (free)", kind: "openai", url: "https://api.llm7.io/v1/chat/completions", model: "gpt-4o-mini-2024-07-18", key: true, help: "llm7.io — key optional on some models" },
    zai: { label: "Z.ai / Zhipu GLM", kind: "openai", url: "https://api.z.ai/api/paas/v4/chat/completions", model: "glm-4.5-flash", key: true, help: "z.ai / open.bigmodel.cn" },
    deepinfra: { label: "DeepInfra", kind: "openai", url: "https://api.deepinfra.com/v1/openai/chat/completions", model: "meta-llama/Meta-Llama-3.1-8B-Instruct", key: true, help: "deepinfra.com" },
    hyperbolic: { label: "Hyperbolic", kind: "openai", url: "https://api.hyperbolic.xyz/v1/chat/completions", model: "meta-llama/Meta-Llama-3.1-8B-Instruct", key: true, help: "app.hyperbolic.xyz" },
    novita: { label: "Novita", kind: "openai", url: "https://api.novita.ai/v3/openai/chat/completions", model: "meta-llama/llama-3.1-8b-instruct", key: true, help: "novita.ai" },
    siliconflow: { label: "SiliconFlow", kind: "openai", url: "https://api.siliconflow.cn/v1/chat/completions", model: "Qwen/Qwen2.5-7B-Instruct", key: true, help: "siliconflow.cn / siliconflow.com" },
    openai: { label: "OpenAI (paid)", kind: "openai", url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", key: true, help: "platform.openai.com/api-keys" },
    xai: { label: "xAI Grok (credits)", kind: "openai", url: "https://api.x.ai/v1/chat/completions", model: "grok-4-fast-non-reasoning", key: true, help: "console.x.ai" },
    deepseek: { label: "DeepSeek V4.1 Flash (token deal)", kind: "openai", url: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-flash", key: true, help: "platform.deepseek.com — model deepseek-flash · off-peak $0.15/$0.60 per 1M · cache-hit $0.003 · 1M context" },
    together: { label: "Together AI", kind: "openai", url: "https://api.together.xyz/v1/chat/completions", model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", key: true, help: "api.together.xyz" },
    fireworks: { label: "Fireworks", kind: "openai", url: "https://api.fireworks.ai/inference/v1/chat/completions", model: "accounts/fireworks/models/llama-v3p1-8b-instruct", key: true, help: "fireworks.ai" },
    anthropic: { label: "Anthropic Claude (paid)", kind: "anthropic", url: "https://api.anthropic.com/v1/messages", model: "claude-3-5-haiku-latest", key: true, help: "console.anthropic.com" },
    perplexity: { label: "Perplexity", kind: "openai", url: "https://api.perplexity.ai/chat/completions", model: "sonar", key: true, help: "perplexity.ai/settings/api" },
    github: { label: "GitHub Models (PAT)", kind: "openai", url: "https://models.inference.ai.azure.com/chat/completions", model: "gpt-4o-mini", key: true, help: "github.com/settings/tokens — GitHub Models may be limited" },
    custom: { label: "Any OpenAI-compatible URL", kind: "openai", url: "", model: "", key: true, help: "Paste base (we append /v1/chat/completions) or full chat URL" },
  };

  // ── Provider reachability, measured 2026-09-20 from this very origin ──────
  // A browser page can only call an API that sends CORS headers. A key is not
  // enough for these, so say so plainly instead of failing silently later.
  const BROWSER_BLOCKED = {
    nvidia: "NVIDIA NIM does not allow browser calls (no CORS header)",
    together: "Together AI does not allow browser calls (no CORS header)",
    anthropic: "Anthropic does not allow browser calls (no CORS header)",
    sambanova: "SambaNova does not allow browser calls (no CORS header)",
    zai: "Z.ai does not allow browser calls (no CORS header)",
    github: "GitHub Models does not allow browser calls (no CORS header)",
  };
  // Providers with no usable /models endpoint: the built-in seed plus a live
  // one-token probe of the picked model is the only honest answer.
  const NO_MODEL_LIST = { perplexity: 1, llm7: 1 };
  const MODEL_MEM_KEY = "lygo_portal_model_by_provider";
  let OR_FREE = false;
  function modelMem() {
    try { return JSON.parse(localStorage.getItem(MODEL_MEM_KEY) || "{}") || {}; } catch (_) { return {}; }
  }
  function rememberModel(pid, id) {
    if (!pid || !id) return;
    try { const m = modelMem(); m[pid] = id; localStorage.setItem(MODEL_MEM_KEY, JSON.stringify(m)); } catch (_) {}
  }
  function setModels(text, kind) {
    const el = document.getElementById("models-status");
    if (!el) return;
    el.textContent = text;
    el.className = "models-status" + (kind ? " " + kind : "");
  }
  function errText(j, status) {
    const e = j && j.error;
    const m = (e && (e.message || e)) || (j && (j.message || j.detail || j.reason)) || "";
    let s = typeof m === "string" ? m : JSON.stringify(m || "");
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s ? s.slice(0, 240) : "http " + status;
  }
  // What the vendor actually said. The chat path used to read the answer with r.json().catch(() => ({})):
  // a 400 whose body is not the JSON shape we expect (an HTML page from a proxy, a plain-text reason, a
  // field-level complaint under a different key) became an empty object, and the visitor was shown the
  // literal string "http 400" - which is exactly what happened at Google Gemini on 2026-09-24. The body
  // is now kept as text and quoted when nothing structured is there.
  function vendorMessage(j, raw, status) {
    const e = j && j.error;
    const m = (e && (typeof e === "string" ? e : (e.message || e))) || (j && (j.message || j.detail || j.reason)) || "";
    const s = (typeof m === "string" ? m : JSON.stringify(m || "")).replace(/\s+/g, " ").trim();
    if (s) return s.slice(0, 400);
    const t = String(raw || "").replace(/\s+/g, " ").trim();
    return t ? "the vendor answered body: " + t.slice(0, 300) : "http " + status;
  }

  function hostOf(url) {
    try { return new URL(url).host; } catch (_) { return String(url || ""); }
  }
  const AGENT_TOOLS = window.LYGO_AGENT_TOOLS || [];
  const AGENT_TOOLS_CORE = window.LYGO_AGENT_TOOLS_CORE || AGENT_TOOLS;
  let howtoShown = false;

  function stewardHowTo(kind) {
    const p = provider();
    if (kind === "short" && howtoShown) {
      return "Still no key in the box. Pick a provider (Groq, Gemini, OpenRouter, OpenAI, Grok, DeepSeek, …), paste that vendor’s key, click Connect, then send. This page has no GPU of its own.";
    }
    howtoShown = true;
    return (
      "LYGO API Portal — how to start (this page does not host a model).\n\n" +
      "1) Provider dropdown (top): Groq is one free option. Gemini, OpenRouter, OpenAI, xAI Grok, DeepSeek, Mistral, Hugging Face, or Any OpenAI-compatible URL also work.\n" +
      "2) Get a key from that vendor (table below: Free and near-free API keys). Paste it in the key box. It stays in this tab — excavationpro.ca never sees it.\n" +
      "3) Click Connect. The model id is filled for you.\n" +
      "4) Then type in chat. Champions and browser tools are already on this page (toggle in Skills).\n\n" +
      "Now selected: " + p.label + ".\n" +
      "Need GGUF / folders / USB? Local console: https://chatagent.ca/lygo-llm-console.html"
    );
  }

  const log = document.getElementById("log");
  const healthEl = document.getElementById("health");
  const limb = document.getElementById("limb-out");
  const msg = document.getElementById("msg");
  const modeEl = document.getElementById("mode");
  const endpointEl = document.getElementById("endpoint");
  const tokenEl = document.getElementById("hf-token");
  const modelEl = document.getElementById("model");
  let history = [];
  let connected = false;
  let SKILLS = [];
  let ENABLED = {};
  let DOCS = { soul: "", identity: "", memory: "" };

  function bubble(role, text) {
    const d = document.createElement("div");
    d.className = "bubble " + role;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  function setHealth(t) {
    if (healthEl) healthEl.textContent = t;
  }
  async function saveToDisk(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: "Text", accept: { "text/plain": [".txt", ".md", ".json"] } }],
        });
        const w = await h.createWritable();
        await w.write(blob);
        await w.close();
        return { ok: true, method: "picker", name: filename };
      } catch (e) {
        if (e && e.name === "AbortError") return { ok: false, error: "cancelled" };
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    return { ok: true, method: "download", name: filename };
  }
  function sessionPayload() {
    return JSON.stringify({ v: 1, saved: new Date().toISOString(), provider: modeEl && modeEl.value, model: modelEl && modelEl.value, history: history, notepad: (document.getElementById("np-body") || {}).value || "" }, null, 2);
  }
  function provider() {
    return PROVIDERS[modeEl.value] || PROVIDERS.groq;
  }

  function latin1(s) {
    return String(s == null ? "" : s).replace(/[^\x00-\xFF]/g, "");
  }
  function readKey() {
    let k = (tokenEl && tokenEl.value) || "";
    k = k.replace(/^\uFEFF/, "");
    k = k.replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, "");
    k = k.replace(/[\u2018\u2019\u201C\u201D]/g, "");
    k = k.replace(/^Bearer\s+/i, "").trim();
    k = k.replace(/^["'`]+|["'`]+$/g, "");
    k = k.replace(/\s+/g, "");
    k = k.replace(/[^\x21-\x7E]/g, "");
    if (tokenEl && k && tokenEl.value !== k) tokenEl.value = k;
    return k;
  }
  function safeHeaders(obj) {
    const out = {};
    Object.keys(obj || {}).forEach(function (k) {
      const key = String(k).replace(/[^\x21-\x7E]/g, "");
      if (!key) return;
      out[key] = latin1(obj[k]);
    });
    return out;
  }

  let ALL_MODELS = [];
  function fillModelOptions(ids, selected) {
    if (!modelEl) return selected || "";
    const want = selected || (modelEl.value) || (provider().model) || "";
    const list = [];
    (ids || []).forEach(function (id) {
      if (id && list.indexOf(id) < 0) list.push(id);
    });
    if (want && list.indexOf(want) < 0) list.unshift(want);
    if (!list.length) list.push("openai/gpt-oss-20b");
    ALL_MODELS = list.slice();
    return paintModelOptions(list, want);
  }

  function paintModelOptions(list, want) {
    if (!modelEl) return "";
    const keep = want || modelEl.value || "";
    modelEl.innerHTML = "";
    list.forEach(function (id) {
      const o = document.createElement("option");
      o.value = id;
      o.textContent = id;
      modelEl.appendChild(o);
    });
    modelEl.value = list.indexOf(keep) >= 0 ? keep : (list[0] || "");
    const f = document.getElementById("model-filter");
    if (f) {
      const long = list.length >= 12;
      f.hidden = !long;
      if (long) f.placeholder = "filter " + list.length + " models…";
      else f.value = "";
    }
    return modelEl.value;
  }

  function wireModelFilter() {
    const f = document.getElementById("model-filter");
    if (!f) return;
    f.addEventListener("input", function () {
      const q = String(f.value || "").trim().toLowerCase();
      const cur = modelEl.value;
      const sub = q ? ALL_MODELS.filter(function (id) { return id.toLowerCase().indexOf(q) >= 0; }) : ALL_MODELS;
      paintModelOptions(sub.length ? sub : ALL_MODELS, cur);
    });
  }

  function wireModelControls() {
    wireModelFilter();
    const b = document.getElementById("models-refresh");
    if (b) b.addEventListener("click", function () { refreshModels({ note: "manual refresh" }); });
    if (tokenEl) {
      let t = 0;
      tokenEl.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          const k = readKey();
          if (k.length >= 8 && modeEl && !BROWSER_BLOCKED[modeEl.value]) refreshModels({ note: "key detected" });
        }, 800);
      });
    }
  }

  function fillProvider() {
    const p = provider();
    const pid = modeEl ? modeEl.value : "";
    const mem = modelMem()[pid];
    fillModelOptions((p.models || (p.model ? [p.model] : [])).concat([mem]), mem || p.model);
    remapDeadModel();
    if (BROWSER_BLOCKED[pid]) setModels("⚠ " + p.label + " — " + BROWSER_BLOCKED[pid] + " (this provider works only in the desktop console)", "warn");
    else if (readKey().length >= 8) setTimeout(function () { refreshModels({}); }, 0);
    else setModels("models — the list is read from your key, not a hard-coded table");
    if (endpointEl) {
      const custom = modeEl && modeEl.value === "custom";
      // Custom URLs are the visitor's own — never blank what they typed
      // (this used to erase the endpoint on Connect) and remember it locally.
      let kept = "";
      try { kept = localStorage.getItem("lygo_portal_endpoint") || ""; } catch (_) {}
      endpointEl.value = custom ? (endpointEl.value || kept) : (p.url || "");
      endpointEl.hidden = !custom;
      if (custom) {
        endpointEl.removeAttribute("hidden");
        endpointEl.placeholder = "https://your-host/v1 — base or full chat URL";
        endpointEl.oninput = function () {
          try { localStorage.setItem("lygo_portal_endpoint", endpointEl.value || ""); } catch (_) {}
        };
      }
    }
    if (tokenEl) {
      tokenEl.style.display = p.key ? "" : "none";
      tokenEl.placeholder = "Paste API key — stays in this browser";
    }
    const help = document.getElementById("mode-help");
    if (help) {
      help.innerHTML =
        (p.help || "Pick a provider, paste its key, Connect.") +
        ' · Keys table: <a href="#free-keys">free keys</a> · <a href="/guides/how-to-lygo-llm-portal.html">How to connect</a>';
    }
    setHealth("API portal · " + p.label + (connected ? " · connected" : " · pick provider → paste key → Connect"));
  }

  function systemPrompt(invoked) {
    let s =
      "You are a LYGO-aligned agent in the public API portal at https://excavationpro.ca/portal/. " +
      "The human is the publisher. Assist; never replace them. Dual ledgers / Haven Star Chart = CANON. This chat = RESOURCE. " +
      "P0: no OS wipe, no secrets in notes, no fabricated receipts. " +
      "You have real browser limbs (call them; do not describe calling): wiki_search, wiki_summary, web_search, fetch_page, web_fetch, http_json, weather, geocode, world_pulse, now, calc, hash_text, base64, uuid, json_pretty, champion, skill_list, skill_read, skill_enable, skill_disable, hn_search, arxiv_search, github_search, github_repo, wayback, clawhub_search, skillhub_list, hf_search, npm_search, pypi_search, so_search, define, currency, crypto_price, quake, eonet, iss, book_search, pubmed, lattice_handshake, site_card, whoami, kernel_status, soul_read, identity_read, memory_read, remember, memory_recall, notepad_read, notepad_write, todo_add, todo_list, p0_gate, geolocate (asks permission), clipboard_write/read (asks permission), image_generate (make a picture from a prompt - the picture is SHOWN to the human in this chat; it needs a picture route, which the Image generation suite at the bottom of this page names honestly). Skills are already on this page — toggle on/off. Never tell the human to install or download a skill for this portal. " +
      "If they want disk/skills/local GGUF, send them to https://chatagent.ca/lygoskillhub.html#lygo-llm-kernel and https://chatagent.ca/lygo-llm-console.html — this page is API-only. " +
      "Never invent github.com/user/repo. Real org https://github.com/DeepSeekOracle · HF https://huggingface.co/DeepSeekOracle.";
    if (invoked) s += " Champion lens: " + invoked + ". Observed / Inferred / Unknown.";
    s += "\n\n=== SOUL.md ===\n" + (DOCS.soul || "").slice(0, 2500);
    s += "\n\n=== IDENTITY.md ===\n" + (DOCS.identity || "").slice(0, 1500);
    s += "\n\n=== MEMORY.md ===\n" + (DOCS.memory || "").slice(0, 1500);
    const on = SKILLS.filter(function (x) { return ENABLED[x.slug] !== false; });
    s += "\n\n=== ENABLED SKILLS (already installed on this portal) ===\n";
    on.forEach(function (x) {
      s += "- " + x.slug + " (" + x.name + "): " + (x.when || "") + "\n";
    });
    s += "Call skill_read for full text. Disabled skills must not be used.\n";
    return s.slice(0, 14000);
  }

  async function runTool(name, args) {
    args = args || {};
    try {
      if (typeof window.lygoRunPortalTool === "function") {
        return await window.lygoRunPortalTool(name, args, {
          skills: SKILLS,
          enabled: ENABLED,
          docs: DOCS,
          champs: CHAMPS,
          p0: P0,
          persistEnabled: persistEnabled,
          paintSkills: paintSkills,
          connected: connected,
          provider: modeEl && modeEl.value,
        });
      }
    } catch (e) {
      return { ok: false, error: String(e) };
    }
    return { ok: false, error: "unknown_tool" };
  }

  function providerOf(pid) {
    return PROVIDERS[pid] || PROVIDERS.groq;
  }

  // The URL ladder, for the provider in the top box AND for any compare lane: a lane may carry its own
  // endpoint, which is how two self-hosted servers or two custom OpenAI-compatible URLs are compared.
  function urlFor(pid, raw) {
    const p = providerOf(pid);
    let e = String(raw || p.url || "").trim().replace(/\/$/, "");
    if (!e) return "";
    if (/\/chat\/completions$/i.test(e) || /\/messages$/i.test(e) || /\/paas\/v4\/chat\/completions$/i.test(e)) return e;
    if (/\/openai\/v1$/i.test(e) || /\/v1$/i.test(e) || /\/v1beta\/openai$/i.test(e) || /\/compatibility\/v1$/i.test(e)) return e + "/chat/completions";
    if (/\/v1\//i.test(e) && /chat/i.test(e)) return e;
    return e + "/v1/chat/completions";
  }

  function openaiUrl() {
    return urlFor(modeEl ? modeEl.value : "", (endpointEl && endpointEl.value) || provider().url || "");
  }

  const DEAD_MODELS = {
    "llama-3.1-8b-instant": "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
    "llama3.1-8b": "llama-3.3-70b",
  };
  const MODEL_PREFER = {
    groq: ["openai/gpt-oss-20b", "groq/compound-mini", "groq/compound", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"],
  };

  function modelsUrlFor(pid, raw) {
    const chat = urlFor(pid, raw);
    if (!chat) return "";
    return chat.replace(/\/chat\/completions$/i, "/models").replace(/\/messages$/i, "/models");
  }
  function modelsUrl() {
    return modelsUrlFor(modeEl ? modeEl.value : "", (endpointEl && endpointEl.value) || provider().url || "");
  }
  function isChatModel(id) {
    const s = String(id || "").toLowerCase();
    if (!s) return false;
    if (/whisper|tts|orpheus|guard|embed|moderation|prompt-guard/.test(s)) return false;
    return true;
  }
  function remapDeadModel() {
    if (!modelEl) return "";
    const cur = (modelEl.value || "").trim();
    const next = DEAD_MODELS[cur];
    if (next) {
      fillModelOptions((provider().models || []).concat([next, cur]), next);
      return next;
    }
    return cur;
  }
  function modelHeadersFor(pid, key) {
    const h = { Authorization: "Bearer " + key };
    if (pid === "github") h["api-key"] = key;
    if (pid === "anthropic") {
      h["x-api-key"] = key;
      h["anthropic-version"] = "2023-06-01";
      h["anthropic-dangerous-direct-browser-access"] = "true";
    }
    return h;
  }

  async function probeJson(url, headers) {
    try {
      const r = await fetch(url, { headers: safeHeaders(headers) });
      const text = await r.text();
      let j = {};
      try { j = JSON.parse(text); } catch (_) {}
      return { ok: r.ok, status: r.status, json: j };
    } catch (e) {
      return { ok: false, status: 0, blocked: true, json: {}, thrown: String((e && e.message) || e) };
    }
  }

  // One model list, read from whoever holds the key: the provider in the top box, or one compare lane
  // (spec = { pid, url, key }). Without a spec it behaves exactly as before.
  async function listProviderModels(spec) {
    const pid = spec && spec.pid ? spec.pid : (modeEl ? modeEl.value : "");
    const u = spec ? modelsUrlFor(pid, spec.url || "") : modelsUrl();
    const key = spec && spec.key !== undefined ? spec.key : readKey();
    if (BROWSER_BLOCKED[pid]) return { ok: false, blocked: true, reason: BROWSER_BLOCKED[pid] };
    if (!u) return { ids: [], ok: false, status: 0, reason: "no endpoint yet", source: "none" };
    if (!key && pid !== "openrouter" && pid !== "llm7") return { ids: [], ok: false, status: 0, reason: "no key yet", source: "none" };
    const res = await probeJson(u, modelHeadersFor(pid, key));
    if (res.blocked) {
      return { ids: [], ok: false, status: 0, blocked: true, source: "live",
               reason: (BROWSER_BLOCKED[pid] || ("the browser refused the call to " + hostOf(u) + " (CORS or page policy)")) };
    }
    const raw = (res.json.data || res.json.models || []);
    const ids = raw.map(function (m) { return m.id || m.name; }).filter(Boolean)
      .map(function (id) { return String(id).indexOf("models/") === 0 ? String(id).slice(7) : String(id); });
    return { ids: ids, ok: res.ok, status: res.status, source: "live", raw: raw,
             reason: res.ok ? "" : errText(res.json, res.status) };
  }

  async function openrouterKeyInfo(key) {
    if (!key) return { ok: false, status: 0, text: "" };
    const r = await probeJson("https://openrouter.ai/api/v1/auth/key", { Authorization: "Bearer " + key });
    const d = (r.json && r.json.data) || null;
    if (!r.ok || !d) return { ok: false, status: r.status || 0, text: "" };
    const parts = [];
    if (d.label) parts.push("key " + d.label);
    if (d.is_free_tier) parts.push("free tier — pick a :free model");
    if (typeof d.usage === "number") parts.push("used $" + Number(d.usage).toFixed(3) + (typeof d.limit === "number" ? " of $" + Number(d.limit).toFixed(2) : " · no hard limit"));
    return { ok: true, status: 200, free: !!d.is_free_tier, text: parts.join(" · ") };
  }

  async function refreshModels(opts) {
    opts = opts || {};
    const p = provider();
    const pid = modeEl ? modeEl.value : "";
    setModels("reading the model list from " + p.label + " …", "busy");
    const r = await listProviderModels();
    const chat = (r.ids || []).filter(isChatModel).sort();
    if (r.ok && chat.length) {
      let note = opts.note || "";
      let line = "";
      let kind = "ok";
      if (pid === "openrouter") {
        // Listed from OpenRouter's public catalogue, NOT entitlement-filtered.
        const info = await openrouterKeyInfo(readKey());
        OR_FREE = !!info.free;
        if (info.ok) line = "✓ " + chat.length + " models listed by OpenRouter" + (info.text ? " · " + info.text : "") + " — :free models cost nothing, the rest bill your key";
        else if (readKey()) {
          line = "⚠ OpenRouter did not accept that key" + (info.status ? " (" + info.status + ")" : "") + " — these " + chat.length + " models are its public catalogue, not your entitlement";
          kind = "warn";
          connected = false;
        } else line = "✓ " + chat.length + " models in OpenRouter's public catalogue — paste a key to see which are on your plan";
      }
      const mem = modelMem()[pid];
      const cur = (modelEl && modelEl.value) || "";
      let pref = (MODEL_PREFER[pid] || []).slice();
      if (pid === "openrouter" && OR_FREE) pref = chat.filter(function (id) { return /:free$/.test(id); }).concat(pref);
      pref = pref.concat([cur, mem, p.model]).filter(Boolean);
      let pick = "";
      for (let i = 0; i < pref.length && !pick; i++) if (chat.indexOf(pref[i]) >= 0) pick = pref[i];
      fillModelOptions(chat, pick || chat[0]);
      rememberModel(pid, modelEl.value);
      if (!line) line = "✓ " + chat.length + " model" + (chat.length === 1 ? "" : "s") + " from your key" + (note ? " · " + note : "") + " — this is your key's own list, not a hard-coded table";
      setModels(line, kind);
      return { ok: true, model: modelEl.value, count: chat.length, note: note };
    }
    const mem = modelMem()[pid];
    const seed = (p.models || []).concat([mem, p.model]).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    fillModelOptions(seed, mem || p.model);
    const n = seed.filter(isChatModel).length;
    const tail = (n === 1 && mem) ? " — keeping your last pick (" + mem + "); the provider did not confirm it" : (n ? " — showing " + n + " built-in default" + (n === 1 ? "" : "s") + " (not your key's list)" : " — no model list yet");
    if (r.reason) setModels("⚠ " + p.label + ": " + r.reason + tail, "warn");
    else setModels("⚠ no model list from " + p.label + tail, "warn");
    if (r.blocked || r.status === 401 || r.status === 402 || r.status === 403) {
      connected = false;
      setHealth("⚠ not connected · " + p.label + " — " + (r.reason || "the provider refused the call"));
    }
    return { ok: false, model: modelEl.value, reason: r.reason || "no list", blocked: !!r.blocked, status: r.status };
  }

  let modelsStamp = "";
  function keyStamp() {
    const k = readKey();
    let h = 0;
    for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    return (modeEl ? modeEl.value : "") + "|" + k.length + "|" + h;
  }
  async function maybeRefreshModels() {
    const stamp = keyStamp();
    if (stamp === modelsStamp) return { ok: true, model: modelEl.value, cached: true };
    const r = await refreshModels({});
    if (r.ok) modelsStamp = stamp;
    return r;
  }

  async function probeModel(model) {
    const p = provider();
    const url = openaiUrl();
    const key = readKey();
    if (!url || !key) return { ok: false, reason: "no key yet" };
    if (BROWSER_BLOCKED[modeEl.value]) return { ok: false, blocked: true, reason: BROWSER_BLOCKED[modeEl.value] };
    const headers = { "Content-Type": "application/json" };
    if (p.kind === "anthropic") {
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    } else {
      headers.Authorization = "Bearer " + key;
      if (modeEl.value === "github") headers["api-key"] = key;
    }
    if (p.extra) Object.keys(p.extra).forEach(function (k) { headers[k] = p.extra[k]; });
    const payload = { model: model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] };
    try {
      const r = await fetch(url, { method: "POST", headers: safeHeaders(headers), body: JSON.stringify(payload) });
      const text = await r.text();
      let j = {};
      try { j = JSON.parse(text); } catch (_) {}
      return { ok: r.ok, status: r.status, reason: r.ok ? "" : errText(j, r.status) };
    } catch (e) {
      return { ok: false, status: 0, blocked: true, reason: "the browser refused the call to " + hostOf(url) + " (CORS or page policy)" };
    }
  }
  // One POST, plus the payload ladder that survives a vendor's 400. Shared by the chat path and the
  // compare bench, so both learn a vendor's field shapes in the same place. opts.signal lets a caller
  // put a deadline on the whole ladder (a compare lane must not wait forever); opts is optional and the
  // chat path passes none, which is exactly the behaviour it had before.
  async function postWithLadder(url, hdrs, payload, opts) {
    opts = opts || {};
    async function attempt(body) {                  // one POST; the answer is kept as text, parsed if it can be
      const rr = await fetch(url, { method: "POST", headers: hdrs, body: JSON.stringify(body), signal: opts.signal });
      const raw = await rr.text();
      let jj = null;
      try { jj = JSON.parse(raw); } catch (_) {}
      return { r: rr, j: jj || {}, raw: raw };
    }
    const retryable = { 400: 1, 404: 1, 422: 1 };
    let n = 0;
    let out = await attempt(payload); n++;
    if (!out.r.ok && retryable[out.r.status] && payload.tools && AGENT_TOOLS_CORE.length && payload.tools.length > AGENT_TOOLS_CORE.length) {
      payload.tools = AGENT_TOOLS_CORE;
      out = await attempt(payload); n++;
    }
    if (!out.r.ok && retryable[out.r.status] && payload.tools) {
      delete payload.tools;
      out = await attempt(payload); n++;
    }
    // Google's OpenAI-compatible endpoint is where this bites: a body it does not expect comes back 400
    // naming the field it will not take, and that field has been max_tokens. Try the newer name, then try
    // with no cap at all, before telling the visitor anything - and if it still fails, quote the vendor.
    if (!out.r.ok && out.r.status === 400 && ("max_tokens" in payload)) {
      delete payload.max_tokens;
      payload.max_completion_tokens = 1024;
      out = await attempt(payload); n++;
    }
    if (!out.r.ok && out.r.status === 400 && ("max_completion_tokens" in payload)) {
      delete payload.max_completion_tokens;
      out = await attempt(payload); n++;
    }
    out.attempts = n;                              // what this answer really cost, rungs included
    return out;
  }

  async function callApi(messages) {
    const p = provider();
    const url = openaiUrl();
    remapDeadModel();
    const model = modelEl.value || p.model;
    const key = readKey();
    const headers = { "Content-Type": "application/json" };
    if (key) {
      if (p.kind === "anthropic") {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
      } else {
        headers.Authorization = "Bearer " + key;
        if (modeEl.value === "github") headers["api-key"] = key;
      }
    }
    if (p.extra) Object.keys(p.extra).forEach(function (k) { headers[k] = p.extra[k]; });
    const hdrs = safeHeaders(headers);
    let payload;
    if (p.kind === "anthropic") {
      payload = { model: model, max_tokens: 1024, system: messages[0] && messages[0].content, messages: messages.filter(function (m) { return m.role !== "system"; }) };
    } else {
      payload = { model: model, messages: messages, max_tokens: 1024, stream: false, tools: AGENT_TOOLS };
    }
    const out = await postWithLadder(url, hdrs, payload);
    let r = out.r;
    let j = out.j;
    if (!r.ok) {
      const msg = vendorMessage(j, out.raw, r.status);
      if (/does not exist|do not have access|model_not_found|invalid_model|not a valid model|unknown model|no such model/i.test(msg)) {
        const live = await refreshModels({ note: "model not on this key — list reloaded" });
        if (live.model && live.model !== model) {
          payload.model = live.model;
          r = await fetch(url, { method: "POST", headers: hdrs, body: JSON.stringify(payload) });
          j = await r.json().catch(function () { return {}; });
          if (r.ok) { rememberModel(modeEl.value, payload.model); setModels("✓ switched to " + payload.model + " — this key's own list", "ok"); return j; }
        }
        throw new Error("Your key cannot use “" + model + "”: " + msg + (live.ok && live.model && live.model !== model ? " Reloaded your list — picked " + live.model + "." : " The model box now lists your key's own models — pick one of those."));
      }
      const byStatus = {
        401: "key rejected (401) — check it at " + p.help,
        402: "no credit left on this key (402)",
        403: "this key is not allowed “" + model + "” (403)",
        404: "“" + model + "” is not available to this key (404) — use ↻ models",
        429: "rate limit or quota reached (429) — wait, or pick another model",
      };
      if (byStatus[r.status]) throw new Error(p.label + " — " + byStatus[r.status] + " · vendor said: " + msg);
      throw new Error(p.label + " (http " + r.status + "): " + msg);
    }
    rememberModel(modeEl && modeEl.value, model);
    return j;
  }

  function extractMessage(j) {
    const msg = ((j.choices || [])[0] || {}).message || {};
    const text = msg.content || (((j.content || [])[0] || {}).text) || "";
    return { text: typeof text === "string" ? text : JSON.stringify(text), tool_calls: msg.tool_calls || [] };
  }

  document.getElementById("connect").onclick = async function () {
    fillProvider();
    const p = provider();
    const pid = modeEl.value;
    if (p.key && !readKey() && pid !== "llm7" && pid !== "custom" && pid !== "openrouter") {
      setHealth("paste your API key (this tab only) — " + p.help);
      setModels("waiting for your key — the model list comes from the key, not from us", "warn");
      bubble("assistant", stewardHowTo("missing-key"));
      return;
    }
    if (!openaiUrl()) {
      setHealth("paste an endpoint URL");
      return;
    }
    if (BROWSER_BLOCKED[pid]) {
      connected = false;
      setHealth("⚠ " + p.label + " — " + BROWSER_BLOCKED[pid]);
      setModels("⚠ " + BROWSER_BLOCKED[pid], "warn");
      bubble("assistant", p.label + " cannot be called from a web page. " + BROWSER_BLOCKED[pid] +
        " — that is the vendor's browser policy, not your key. Pick another provider above (Groq, Gemini, OpenRouter, Cerebras, Mistral, DeepSeek, OpenAI and ~15 more work here), or run a model on your own disk with the local console.");
      return;
    }
    const res = await refreshModels({});
    if (res.ok) {
      connected = true;
      try { sessionStorage.setItem("lygo_portal_provider", pid); } catch (_) {}
      setHealth("connected · " + p.label + " · " + res.model);
      bubble("assistant", "Connected to " + p.label + " · model " + res.model + " — read from your key (" + res.count + " models available)." + (res.note ? " " + res.note + "." : "") + " Send a message.");
      return;
    }
    setHealth("checking your key against " + p.label + " · " + res.model + " …");
    const probe = await probeModel(res.model);
    if (probe.ok) {
      connected = true;
      try { sessionStorage.setItem("lygo_portal_provider", pid); } catch (_) {}
      rememberModel(pid, res.model);
      setHealth("connected · " + p.label + " · " + res.model + " (verified with a 1-token ping)");
      bubble("assistant", "Connected to " + p.label + " · model " + res.model + "." + (res.reason ? " (" + res.reason + ")" : "") + " Send a message.");
      return;
    }
    connected = false;
    const hint = probe.status === 401 ? "The provider rejected this key (401)."
      : probe.status === 403 ? "This key is not allowed that model (403)."
      : probe.status === 402 ? "This key has no credit (402)."
      : probe.status === 404 ? "Your key cannot see “" + res.model + "” (404) — use ↻ models and pick another."
      : probe.status === 429 ? "Rate limit or quota reached (429)."
      : (probe.blocked ? probe.reason : (probe.reason || "The call failed."));
    setHealth("⚠ not connected · " + p.label + " — " + hint);
    setModels("⚠ " + hint, "warn");
    bubble("assistant", "Could not connect to " + p.label + ". " + hint +
      (probe.reason && probe.reason !== hint ? " — vendor said: " + probe.reason : "") +
      " Provider note: " + p.help + " Nothing about this reached chatagent.ca: the call went from your browser straight to " + hostOf(openaiUrl()) + ".");
  };
  if (tokenEl) {
    tokenEl.addEventListener("paste", function () { setTimeout(readKey, 0); });
    tokenEl.addEventListener("blur", readKey);
    tokenEl.addEventListener("change", readKey);
  }

  wireModelControls();

  if (modeEl) {
    modeEl.innerHTML = "";
    Object.keys(PROVIDERS).forEach(function (id) {
      const o = document.createElement("option");
      o.value = id;
      o.textContent = PROVIDERS[id].label + (BROWSER_BLOCKED[id] ? " — browser-blocked" : "");
      modeEl.appendChild(o);
    });
    try {
      const saved = sessionStorage.getItem("lygo_portal_provider");
      modeEl.value = saved && PROVIDERS[saved] ? saved : "groq";
    } catch (_) {
      modeEl.value = "groq";
    }
    modeEl.onchange = function () { fillProvider(); const pid = modeEl.value; if (!BROWSER_BLOCKED[pid] && readKey().length >= 8) refreshModels({}); };
    fillProvider();
  }
  document.querySelectorAll("[data-fill]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      const id = a.getAttribute("data-fill");
      if (!id || !PROVIDERS[id] || !modeEl) return;
      ev.preventDefault();
      modeEl.value = id;
      fillProvider();
      if (tokenEl && PROVIDERS[id].key) tokenEl.focus();
    });
  });

  function persistEnabled() {
    try { localStorage.setItem("lygo_portal_enabled", JSON.stringify(ENABLED)); } catch (_) {}
  }
  function paintSkills() {
    const box = document.getElementById("skills-list");
    if (!box) return;
    box.innerHTML = "";
    SKILLS.forEach(function (s) {
      const row = document.createElement("label");
      row.className = "skill-row";
      const ck = document.createElement("input");
      ck.type = "checkbox";
      ck.checked = ENABLED[s.slug] !== false;
      ck.onchange = function () {
        ENABLED[s.slug] = ck.checked;
        persistEnabled();
      };
      const name = document.createElement("span");
      name.className = "sn";
      name.textContent = (s.slug.indexOf("champion-") === 0 ? "★ " : "") + (s.name || s.slug);
      name.title = s.when || "";
      name.onclick = function (ev) {
        ev.preventDefault();
        msg.value = "Invoke skill " + s.slug + " — " + (s.when || s.name);
        msg.focus();
      };
      row.appendChild(ck);
      row.appendChild(name);
      box.appendChild(row);
    });
    const st = document.getElementById("skill-pack");
    const nOn = SKILLS.filter(function (s) { return ENABLED[s.slug] !== false; }).length;
    if (st) st.textContent = nOn + "/" + SKILLS.length + " on · already on this page · no download";
  }
  document.querySelectorAll("[data-cont]").forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll("[data-cont]").forEach(function (b) { b.classList.remove("on"); });
      btn.classList.add("on");
      const id = btn.getAttribute("data-cont");
      ["soul", "id", "mem"].forEach(function (k) {
        const p = document.getElementById("pane-" + k);
        if (p) p.hidden = k !== id;
      });
    };
  });
  function bindDoc(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = DOCS[key] || "";
    el.onchange = function () {
      DOCS[key] = el.value;
      try { localStorage.setItem("lygo_portal_" + key, el.value); } catch (_) {}
    };
  }
  async function loadDocs() {
    async function get(path, key) {
      try {
        const t = await (await fetch(path, { cache: "no-store" })).text();
        const over = localStorage.getItem("lygo_portal_" + key);
        DOCS[key] = over != null ? over : t;
      } catch (_) {}
    }
    await get("SOUL.md", "soul");
    await get("IDENTITY.md", "identity");
    await get("MEMORY.md", "memory");
    bindDoc("soul-edit", "soul");
    bindDoc("id-edit", "identity");
    bindDoc("mem-edit", "memory");
  }
  const rst = document.getElementById("id-reset");
  if (rst) {
    rst.onclick = function () {
      ["soul", "identity", "memory"].forEach(function (k) { try { localStorage.removeItem("lygo_portal_" + k); } catch (_) {} });
      loadDocs();
    };
  }
  loadDocs();

  document.querySelectorAll("[data-limb]").forEach(function (b) {
    b.onclick = async function () {
      const n = b.getAttribute("data-limb");
      if (n === "skillhub") window.open("https://chatagent.ca/lygoskillhub.html#lygo-llm-kernel", "_blank", "noopener");
      else if (n === "howto") window.open("/guides/how-to-lygo-llm-portal.html", "_blank", "noopener");
      else if (n === "kit") window.open("https://chatagent.ca/lygo-llm-console.html", "_blank", "noopener");
      else {
        const map = { wiki: "wiki_search", weather: "weather", now: "now", hn: "hn_search", github: "github_search", handshake: "lattice_handshake", whoami: "whoami", iss: "iss", quake: "quake" };
        const tool = map[n] || n;
        const args = tool.indexOf("search") >= 0 ? { q: (msg && msg.value) || "LYGO" } : {};
        const r = await runTool(tool, args);
        limb.textContent = JSON.stringify(r, null, 2);
        bubble("assistant", tool + ":\n" + (typeof r.text === "string" ? r.text : JSON.stringify(r, null, 2)).slice(0, 2000));
      }
    };
  });

  const npBody = document.getElementById("np-body");
  const npSt = document.getElementById("np-status");
  if (npBody) {
    try { npBody.value = localStorage.getItem("lygo_public_notepad") || ""; } catch (_) {}
  }
  const npSave = document.getElementById("np-save");
  if (npSave) {
    npSave.onclick = function () {
      try {
        localStorage.setItem("lygo_public_notepad", npBody.value || "");
        npSt.textContent = "saved in this browser";
      } catch (_) { npSt.textContent = "blocked"; }
    };
  }
  const npDisk = document.getElementById("np-disk");
  if (npDisk) {
    npDisk.onclick = async function () {
      const r = await saveToDisk("lygo-notepad-" + Date.now() + ".md", (npBody && npBody.value) || "");
      if (npSt) npSt.textContent = r.ok ? ("saved " + r.method) : (r.error || "fail");
    };
  }
  const sessSave = document.getElementById("sess-save");
  if (sessSave) {
    sessSave.onclick = async function () {
      try { localStorage.setItem("lygo_portal_session", sessionPayload()); } catch (_) {}
      const r = await saveToDisk("lygo-session-" + Date.now() + ".json", sessionPayload());
      limb.textContent = JSON.stringify(r, null, 2);
    };
  }
  const sessLoad = document.getElementById("sess-load");
  if (sessLoad) {
    sessLoad.onclick = function () {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".json,application/json";
      inp.onchange = function () {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = function () {
          try {
            const data = JSON.parse(String(rd.result || "{}"));
            history = data.history || [];
            if (npBody && data.notepad) npBody.value = data.notepad;
            log.innerHTML = "";
            history.forEach(function (m) { bubble(m.role === "user" ? "user" : "assistant", m.content || ""); });
            limb.textContent = "session loaded " + (data.saved || "");
          } catch (e) { limb.textContent = "bad session file"; }
        };
        rd.readAsText(f);
      };
      inp.click();
    };
  }
  const attachBtn = document.getElementById("attach-file");
  if (attachBtn) {
    attachBtn.onclick = function () {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.onchange = function () {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = function () {
          const text = String(rd.result || "").slice(0, 20000);
          history.push({ role: "user", content: "Attached file " + f.name + ":\n" + text });
          bubble("user", "Attached " + f.name + " (" + text.length + " chars) into this session.");
        };
        rd.readAsText(f);
      };
      inp.click();
    };
  }
  fetch("lygo-skills.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      SKILLS = j.skills || [];
      try {
        const saved = JSON.parse(localStorage.getItem("lygo_portal_enabled") || "{}");
        SKILLS.forEach(function (s) {
          ENABLED[s.slug] = saved[s.slug] !== false;
        });
      } catch (_) {
        SKILLS.forEach(function (s) { ENABLED[s.slug] = true; });
      }
      paintSkills();
    })
    .catch(function () {});
  fetch("https://chatagent.ca/data/lygoskillhub_catalog.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      const extra = (j.skills || []).filter(function (s) { return s && s.slug && s.kind !== "page"; }).slice(0, 50);
      extra.forEach(function (s) {
        if (SKILLS.some(function (x) { return x.slug === s.slug; })) return;
        SKILLS.push({
          slug: s.slug,
          name: s.name || s.slug,
          when: s.category || "skillhub",
          text: (s.summary || s.name || s.slug) + "\nAlready on this portal as an advisor card. Scripts need the local FULL console.",
        });
        if (ENABLED[s.slug] === undefined) ENABLED[s.slug] = true;
      });
      paintSkills();
    })
    .catch(function () {});

  document.getElementById("form").onsubmit = async function (ev) {
    ev.preventDefault();
    const text = (msg.value || "").trim();
    if (!text) return;
    if (P0.test(text)) {
      bubble("assistant", "P0 blocked that prompt.");
      return;
    }
    msg.value = "";
    bubble("user", text);
    if (COMPARE) {
      // The bench answers, not the single model in the top box: the visitor's own turn joins the
      // conversation, and an assistant turn is added only when they pick an answer or a synthesis.
      history.push({ role: "user", content: text });
      benchRun(text);
      return;
    }
    if (!connected) {
      if (readKey()) {
        setHealth("connecting…");
        const r0 = await refreshModels({});
        const live = r0.model;
        if (!r0.ok) {
          const pr = await probeModel(live);
          if (!pr.ok) {
            setHealth("⚠ not connected · " + provider().label);
            bubble("assistant", "Could not reach " + provider().label + ": " + (pr.reason || r0.reason || "the call failed") + " — press Connect for the details.");
            return;
          }
        }
        connected = true;
        setHealth("connected · " + provider().label + " · " + live);
      } else {
        bubble("assistant", stewardHowTo("short"));
        return;
      }
    }
    history.push({ role: "user", content: text });
    await maybeRefreshModels();
    const invoked = Object.keys(CHAMPS).find(function (n) { return text.toUpperCase().indexOf(n.toUpperCase()) >= 0; });
    let messages = [{ role: "system", content: systemPrompt(invoked) }].concat(history.slice(-10));
    let out = "";
    try {
      for (let round = 0; round < 4; round++) {
        const j = await callApi(messages);
        const got = extractMessage(j);
        limb.textContent = JSON.stringify({ round: round, tools: (got.tool_calls || []).map(function (t) { return (t.function || t).name; }) }, null, 2);
        if (got.tool_calls && got.tool_calls.length) {
          messages.push({ role: "assistant", content: got.text || "", tool_calls: got.tool_calls });
          for (let i = 0; i < got.tool_calls.length; i++) {
            const tc = got.tool_calls[i];
            const fn = tc.function || tc;
            let args = {};
            try { args = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments || {}; } catch (_) {}
            const result = await runTool(fn.name, args);
            if (result && result.image) showAgentImage(result);
            // The picture itself never enters the message history: 2.8 MB of base64 re-sent on every
            // turn is a provider bill, not a feature. The model is told it was shown instead.
            const wire = Object.assign({}, result);
            if (wire.image) { delete wire.image; wire.shown_to_human = true; }
            messages.push({ role: "tool", tool_call_id: tc.id || String(i), content: JSON.stringify(wire) });
          }
          continue;
        }
        out = got.text;
        break;
      }
    } catch (e) {
      const m = String(e && e.message ? e.message : e);
      if (/does not exist|do not have access|model_not_found|invalid_model|not a valid model|unknown model|no such model/i.test(m)) {
        const live = await refreshModels({ note: "your key rejected that model — list reloaded" });
        try {
          const j2 = await callApi(messages);
          const got2 = extractMessage(j2);
          out = got2.text || "";
          if (live.model) setHealth("connected · " + provider().label + " · " + live.model);
        } catch (e2) {
          out = String((e2 && e2.message) || e2 || m);
        }
      } else if (/ISO-8859-1|non ISO|code point/i.test(m)) {
        readKey();
        try {
          const j2 = await callApi(messages);
          const got2 = extractMessage(j2);
          out = got2.text || "Key cleaned. Send Hello again.";
        } catch (e2) {
          out = "The key paste had hidden characters. We cleaned it — press Connect and send Hello again.";
        }
      } else if (/Failed to fetch|CORS|NetworkError/i.test(m)) {
        out = "That call never left your browser: " + m + ".\n" + (BROWSER_BLOCKED[modeEl.value] ? BROWSER_BLOCKED[modeEl.value] + "." : "This vendor (or your network) refuses browser callers — Groq, Gemini, OpenRouter, Cerebras and Mistral do work here.");
      } else {
        out = "Provider error: " + m;
      }
    }
    if (P0.test(out || "")) out = "[output quarantined]";
    if (!out) out = "(empty model reply — try again or another provider)";
    history.push({ role: "assistant", content: out });
    bubble("assistant", out);
  };

  bubble("assistant", stewardHowTo("welcome"));

  // ---- ⇄ Compare bench --------------------------------------------------------------------------
  // The feature the visitors asked for in their own thread: send ONE prompt to two or more connected
  // models and read the answers side by side, then pick one or blend them - everything inside this tab.
  // It keeps the promises the rest of this page makes:
  //   * a lane's key lives in this tab's memory only - never localStorage, never sessionStorage, sent
  //     to that lane's own vendor and nowhere else. A lane set to the provider in the top box shares
  //     the key already pasted there, so comparing two Groq models costs one paste;
  //   * one lane failing quotes that vendor's own words and never blanks or blocks another lane;
  //   * every lane gets a deadline, so one dead host cannot leave the grid spinning;
  //   * the bench sends no browser limbs: same system prompt, one shot each, so the answers are the
  //     models' own rather than a tool round dressed up as a comparison;
  //   * one pick (or one blend) per run, so the log stays a conversation.
  const LANE_STORE = "lygo_portal_lanes";
  const COMPARE_STORE = "lygo_portal_compare";
  const LANE_MAX = 4;
  const LANE_TIMEOUT = 120000;      // 2 minutes: a reasoning model may be slow, a dead host must not be forever
  const LANE_LETTERS = "ABCD";      // the tag a segment carries in the assembled answer and the sources
  let LANES = [];                   // [{ id, pid, model, url }] - provider, model, endpoint. Never a key.
  let LANE_KEYS = {};               // lane id -> key. Memory only, by design.
  let LANE_RUN = null;              // the last fan-out
  let COMPARE = false;
  let BENCH_CALLS = 0;              // POSTs actually spent this session, ladder rungs included
  let LANE_SEQ = 0;

  // The synthesis core is synth.js, loaded before this file, so the splitter, the assembler and the
  // meta-prompt here are byte-for-byte the functions tools/portal_synth_check.js runs in node. If that
  // file were missing the bench must still work (one segment per answer, synthesis from whole answers),
  // so the fallback degrades the feature and says so in the console instead of throwing on first paint.
  const SY = window.LYGO_SYNTH || (function () {
    if (window.console && console.error) {
      console.error("LYGO portal: synth.js did not load — segment picking is off, the bench still runs.");
    }
    function seg1(t) { const s = String(t == null ? "" : t).trim(); return s ? [{ i: 1, text: s, kind: "para", para: 1 }] : []; }
    return {
      splitSegments: seg1,
      assemble: function (rows) {
        const list = (rows || []).filter(function (r) { return r && r.seg && r.seg.text; });
        return { text: list.map(function (r) { return r.seg.text; }).join("\n\n"), count: list.length, lanes: [], tags: [] };
      },
      sourceBlock: function (sources) {
        return (sources || []).map(function (s, i) {
          return "--- ANSWER " + String.fromCharCode(65 + i) + " (" + (s.label || "unnamed lane") + ") ---\n" + s.text;
        }).join("\n\n");
      },
      synthPrompt: function (o) {
        return String(o.body || "") + "\n\nWrite ONE refined answer to that prompt, invent nothing, and end with a line beginning 'Provenance:' naming what you leaned on.";
      },
      synthSystem: function () {
        return "You are reading answers other models wrote to the same prompt. Your reply is one refined answer built from them.";
      },
    };
  })();

  function laneId() { return "lane" + (++LANE_SEQ) + "-" + Math.random().toString(36).slice(2, 7); }
  function laneProvider(l) { return providerOf(l.pid); }
  function laneUrl(l) { return urlFor(l.pid, l.url || laneProvider(l).url || ""); }
  function laneModel(l) { return l.model || laneProvider(l).model || ""; }
  function laneShortName(l) {
    if (l.pid === "custom") return "custom " + (hostOf(laneUrl(l)) || "url");
    return String(laneProvider(l).label || l.pid).replace(/\s*\(.*$/, "");
  }
  function laneLabel(l) { return laneShortName(l) + " · " + laneModel(l); }
  function laneKeyOf(l) {
    const own = String(LANE_KEYS[l.id] || "").trim();
    if (own) return own;
    if (modeEl && l.pid === modeEl.value) return readKey();   // the top box covers every lane on that provider
    return "";
  }
  function laneSharesTopKey(l) {
    return !String(LANE_KEYS[l.id] || "").trim() && !!modeEl && l.pid === modeEl.value && !!readKey();
  }
  function laneNeedsKey(l) { return l.pid !== "openrouter" && l.pid !== "llm7"; }
  function laneReady(l) {
    if (BROWSER_BLOCKED[l.pid]) return false;
    if (!laneUrl(l)) return false;
    if (!laneKeyOf(l) && laneNeedsKey(l)) return false;
    return true;
  }
  function readyLanes() { return LANES.filter(laneReady); }
  function laneEl(l) { return document.querySelector('[data-lane="' + l.id + '"]'); }
  function lanePart(l, cls) { const c = laneEl(l); return c ? c.querySelector("." + cls) : null; }

  function laneSave() {
    try {
      localStorage.setItem(LANE_STORE, JSON.stringify(LANES.map(function (l) {
        return { pid: l.pid, model: l.model, url: l.url || "" };
      })));
    } catch (_) {}
  }
  function laneLoad() {
    let rows = [];
    try { rows = JSON.parse(localStorage.getItem(LANE_STORE) || "[]") || []; } catch (_) { rows = []; }
    const topPid = (modeEl && PROVIDERS[modeEl.value]) ? modeEl.value : "groq";
    if (!rows.length) rows = [{ pid: topPid, model: "" }, { pid: topPid, model: "" }];
    LANES = rows.slice(0, LANE_MAX).map(function (r) {
      return { id: laneId(), pid: PROVIDERS[r.pid] ? r.pid : topPid, model: String(r.model || ""), url: String(r.url || "") };
    });
    // Two lanes on the same provider, pointed at that provider's next model, is the cheapest useful
    // comparison there is (one key, two models) - so seed it instead of leaving both lanes identical.
    if (LANES.length > 1 && !LANES[1].model) {
      const p = laneProvider(LANES[0]);
      if (p.models && p.models.length > 1) LANES[1].model = p.models[1];
    }
    LANES.forEach(function (l) {
      if (!l.model) l.model = laneProvider(l).model || "";
    });
  }
  function compareLoad() {
    try { COMPARE = localStorage.getItem(COMPARE_STORE) === "1"; } catch (_) {}
    return COMPARE;
  }
  function compareSave() {
    try { localStorage.setItem(COMPARE_STORE, COMPARE ? "1" : "0"); } catch (_) {}
  }

  function laneFillModels(l, ids) {
    const sel = lanePart(l, "lane-model");
    const p = laneProvider(l);
    const mem = modelMem()[l.pid];
    const seed = ((ids && ids.length) ? ids.slice() : (p.models || []).concat([p.model, mem])).filter(Boolean);
    const list = [];
    seed.forEach(function (x) { if (list.indexOf(x) < 0) list.push(x); });
    if (!l.model) l.model = mem || (p.models || [])[0] || p.model || "";
    if (l.model && list.indexOf(l.model) < 0) list.unshift(l.model);
    if (!sel) return;
    if (sel.tagName === "INPUT") {
      // A custom lane: the list is only a suggestion, and the visitor's own model id always wins.
      let dl = document.getElementById("lane-models-" + l.id);
      if (!dl) {
        dl = document.createElement("datalist");
        dl.id = "lane-models-" + l.id;
        document.body.appendChild(dl);
      }
      dl.innerHTML = "";
      list.forEach(function (id) {
        const o = document.createElement("option");
        o.value = id;
        dl.appendChild(o);
      });
      if (!sel.value && l.model) sel.value = l.model;
      l.model = String(sel.value || "").trim();
      return;
    }
    if (!list.length) {
      sel.innerHTML = "";
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "— press ↻ models from this key —";
      sel.appendChild(o);
      return;
    }
    sel.innerHTML = "";
    list.forEach(function (id) {
      const o = document.createElement("option");
      o.value = id;
      o.textContent = id;
      sel.appendChild(o);
    });
    sel.value = l.model || list[0];
    l.model = sel.value;
  }

  function laneState(l, note) {
    const el = lanePart(l, "lane-state");
    if (!el) return;
    const p = laneProvider(l);
    let t = "", cls = "";
    if (BROWSER_BLOCKED[l.pid]) { t = "browser-blocked · " + BROWSER_BLOCKED[l.pid]; cls = "warn"; }
    else if (!laneUrl(l)) { t = "no endpoint — a custom lane needs the URL of an OpenAI-compatible /v1"; cls = "warn"; }
    else if (laneSharesTopKey(l)) { t = "ready · shares the key in the top box"; cls = "ok"; }
    else if (String(LANE_KEYS[l.id] || "").trim().length >= 8) { t = "ready · its own key, this tab only"; cls = "ok"; }
    else if (!laneNeedsKey(l)) { t = "ready · that provider answers keyless on its free models"; cls = "ok"; }
    else { t = "no key yet — paste one here, or put it in the top box and set this lane to " + p.label; cls = "warn"; }
    if (note) t += " · " + note;
    el.textContent = t;
    el.className = "lane-state" + (cls ? " " + cls : "");
  }

  function benchStatus() {
    const el = document.getElementById("bench-status");
    if (!el) return;
    const n = readyLanes().length;
    el.textContent = LANES.length + " lane" + (LANES.length === 1 ? "" : "s") + " · " + n + " ready · a run spends 1 call per ready lane on your keys" +
      (BENCH_CALLS ? " · this session: " + BENCH_CALLS + " call" + (BENCH_CALLS === 1 ? "" : "s") : "");
  }

  function paintLanes() {
    const box = document.getElementById("bench-lanes");
    if (!box) return;
    box.innerHTML = "";
    LANES.forEach(function (l, i) {
      const card = document.createElement("div");
      card.className = "lane";
      card.setAttribute("data-lane", l.id);

      const head = document.createElement("div");
      head.className = "lane-head";
      const n = document.createElement("span");
      n.className = "lane-n";
      n.textContent = "lane " + (i + 1);
      const x = document.createElement("button");
      x.type = "button";
      x.className = "lane-x";
      x.textContent = "×";
      x.title = LANES.length <= 2 ? "two lanes is the minimum" : "remove this lane";
      x.disabled = LANES.length <= 2;
      x.onclick = function () {
        LANES = LANES.filter(function (m) { return m.id !== l.id; });
        delete LANE_KEYS[l.id];
        laneSave();
        paintLanes();
      };
      head.appendChild(n);
      head.appendChild(x);
      card.appendChild(head);

      const pid = document.createElement("select");
      pid.className = "lane-pid";
      pid.setAttribute("aria-label", "lane " + (i + 1) + " provider");
      Object.keys(PROVIDERS).forEach(function (id) {
        const o = document.createElement("option");
        o.value = id;
        o.textContent = PROVIDERS[id].label + (BROWSER_BLOCKED[id] ? " — browser-blocked" : "");
        pid.appendChild(o);
      });
      pid.value = l.pid;
      pid.onchange = function () {
        l.pid = pid.value;
        l.model = "";
        if (l.pid !== "custom") l.url = "";
        laneSave();
        // Re-paint so the model control matches the new provider (list vs. free text). Lane keys live in
        // memory, not in the DOM, so nothing is lost but the focus in this one select.
        paintLanes();
        if (!BROWSER_BLOCKED[l.pid] && laneKeyOf(l).length >= 8) laneDiscover(l);
      };
      card.appendChild(pid);

      // Known vendors get a list to choose from; a custom endpoint gets a text box, because the model id
      // there belongs to whoever runs the server (llama.cpp and some proxies do not answer /models at all).
      const sel = document.createElement(l.pid === "custom" ? "input" : "select");
      sel.className = "lane-model";
      sel.setAttribute("aria-label", "lane " + (i + 1) + " model");
      if (l.pid === "custom") {
        sel.type = "text";
        sel.autocomplete = "off";
        sel.placeholder = "model id (as your server names it)";
        sel.setAttribute("list", "lane-models-" + l.id);
      }
      sel.onchange = function () {
        l.model = String(sel.value || "").trim();
        laneSave();
        laneState(l);
      };
      sel.oninput = sel.onchange;
      card.appendChild(sel);

      const url = document.createElement("input");
      url.type = "text";
      url.className = "lane-url";
      url.placeholder = "https://your-host/v1 (custom lanes)";
      url.autocomplete = "off";
      url.hidden = l.pid !== "custom";
      url.value = l.url || "";
      url.oninput = function () { l.url = url.value; laneSave(); laneState(l); benchStatus(); };
      card.appendChild(url);

      const key = document.createElement("input");
      key.type = "password";
      key.className = "lane-key";
      key.autocomplete = "off";
      key.placeholder = "key for this provider (this tab only)";
      key.value = LANE_KEYS[l.id] || "";
      key.oninput = function () { LANE_KEYS[l.id] = String(key.value || "").trim(); laneState(l); benchStatus(); };
      key.onchange = function () {
        if (laneKeyOf(l).length >= 8 && !BROWSER_BLOCKED[l.pid]) laneDiscover(l);
      };
      card.appendChild(key);

      const st = document.createElement("div");
      st.className = "lane-state";
      card.appendChild(st);

      const tools = document.createElement("div");
      tools.className = "lane-tools";
      const rf = document.createElement("button");
      rf.type = "button";
      rf.textContent = "↻ models from this key";
      rf.onclick = function () { laneDiscover(l); };
      const ck = document.createElement("button");
      ck.type = "button";
      ck.textContent = "forget this key";
      ck.title = "the lane key lives in this tab's memory only; this clears it";
      ck.onclick = function () {
        delete LANE_KEYS[l.id];
        key.value = "";
        laneState(l);
        benchStatus();
      };
      tools.appendChild(rf);
      tools.appendChild(ck);
      card.appendChild(tools);

      box.appendChild(card);
      laneFillModels(l);
      laneState(l);
    });
    benchStatus();
  }

  async function laneDiscover(l) {
    const note = "reading the model list from " + laneProvider(l).label + " …";
    laneState(l, note);
    let r;
    try {
      r = await listProviderModels({ pid: l.pid, url: l.url || laneProvider(l).url || "", key: laneKeyOf(l) });
    } catch (e) {
      laneState(l, "could not read the list: " + String((e && e.message) || e));
      return;
    }
    const chat = (r.ids || []).filter(isChatModel).sort();
    if (r.ok && chat.length) {
      laneFillModels(l, chat);
      laneSave();
      laneState(l, chat.length + " models read from that key");
    } else {
      laneState(l, r.reason || "no model list — keeping the built-in defaults (not that key's list)");
    }
  }

  function copyText(t) {
    const s = String(t || "");
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s);
    return new Promise(function (res, rej) {
      try {
        const ta = document.createElement("textarea");
        ta.value = s;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? res() : rej(new Error("the browser refused the copy"));
      } catch (e) { rej(e); }
    });
  }

  // One lane's own call: same system prompt, one shot, its own key and endpoint, with a deadline.
  async function laneCall(l, messages) {
    const p = laneProvider(l);
    const url = laneUrl(l);
    const key = laneKeyOf(l);
    const model = laneModel(l);
    const clock = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
    const t0 = clock();
    const ms = function () { return Math.round(clock() - t0); };
    if (BROWSER_BLOCKED[l.pid]) return { ok: false, ms: ms(), error: BROWSER_BLOCKED[l.pid] };
    if (!url) return { ok: false, ms: ms(), error: "no endpoint for this lane" };
    if (!model) return { ok: false, ms: ms(), attempts: 1, error: "no model set for this lane — press ↻ models from this key, or type the model id your server uses" };
    if (!key && laneNeedsKey(l)) return { ok: false, ms: ms(), error: "no key for this lane — " + (p.help || "paste that vendor's key") };
    const headers = { "Content-Type": "application/json" };
    if (key) {
      if (p.kind === "anthropic") {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      } else {
        headers.Authorization = "Bearer " + key;
        if (l.pid === "github") headers["api-key"] = key;
      }
    }
    if (p.extra) Object.keys(p.extra).forEach(function (k) { headers[k] = p.extra[k]; });
    const hdrs = safeHeaders(headers);
    // No tools: the comparison is the models' own answer to the same prompt. The payload ladder still
    // runs, so a vendor that rejects a field gets the same second and third try as the main chat.
    const payload = (p.kind === "anthropic")
      ? { model: model, max_tokens: 1024, system: messages[0] && messages[0].content,
          messages: messages.filter(function (m) { return m.role !== "system"; }) }
      : { model: model, messages: messages, max_tokens: 1024, stream: false };
    const ctl = window.AbortController ? new AbortController() : null;
    const timer = ctl ? setTimeout(function () { ctl.abort(); }, LANE_TIMEOUT) : 0;
    try {
      const out = await postWithLadder(url, hdrs, payload, { signal: ctl ? ctl.signal : undefined });
      BENCH_CALLS += out.attempts || 1;
      benchStatus();
      const elapsed = ms();
      if (!out.r.ok) {
        return { ok: false, status: out.r.status, ms: elapsed, attempts: out.attempts || 1,
                 error: vendorMessage(out.j, out.raw, out.r.status) };
      }
      const got = extractMessage(out.j);
      return { ok: true, text: got.text, toolCalls: (got.tool_calls || []).length,
               usage: (out.j && out.j.usage) || null, served: (out.j && out.j.model) || model,
               ms: elapsed, attempts: out.attempts || 1 };
    } catch (e) {
      const m = String((e && e.message) || e);
      if (ctl && ctl.signal && ctl.signal.aborted) {
        return { ok: false, ms: ms(), attempts: 1, error: "no answer within " + Math.round(LANE_TIMEOUT / 1000) + " s — I stopped waiting" };
      }
      if (/Failed to fetch|NetworkError|CORS/i.test(m)) {
        return { ok: false, ms: ms(), attempts: 1,
                 error: "that call never left your browser (" + m + "). " + hostOf(url) + " either sends no CORS header, or this page's own policy blocked it — the page allows https and 127.0.0.1/localhost only, so a plain LAN address like http://192.168.x.x cannot be called from here." };
      }
      return { ok: false, ms: ms(), attempts: 1, error: m };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function cmpMeta(r) {
    if (r.state === "wait") return "waiting…";
    if (!r.ok) return "failed · " + (r.error || "no answer");
    const bits = [(r.ms < 1000 ? r.ms + "ms" : (r.ms / 1000).toFixed(1) + "s")];
    if (r.usage && r.usage.total_tokens) bits.push(r.usage.total_tokens + " tok");
    if (r.attempts > 1) bits.push(r.attempts + " attempts");
    if (r.toolCalls) bits.push("asked for " + r.toolCalls + " tool call(s) — the bench runs none, so that is the model's own text");
    if (r.served && r.served !== r.model) bits.push("served as " + r.served);
    return bits.join(" · ");
  }

  // ---- picking the strongest segments ------------------------------------------------------------
  // The side-by-side view answers "which is best"; synthesis answers "give me the answer". Two routes,
  // both one click: keep the segments that earn their place and assemble them verbatim, or hand the
  // whole bench to one lane and let it write a single refined answer. Selection lives on LANE_RUN only
  // (never localStorage) and dies with the run, like the lane keys.
  function pickedOf(id) { return (LANE_RUN && LANE_RUN.picks && LANE_RUN.picks[id]) || []; }
  function pickToggle(r, idx) {
    if (!LANE_RUN || LANE_RUN.picked || LANE_RUN.busy) return;
    const list = LANE_RUN.picks[r.id] || (LANE_RUN.picks[r.id] = []);
    const at = list.indexOf(idx);
    if (at < 0) list.push(idx); else list.splice(at, 1);
    list.sort(function (a, b) { return a - b; });
    if (!list.length) delete LANE_RUN.picks[r.id];
    benchPaintRun();
  }
  function paintSegments(body, r, segs) {
    const picked = pickedOf(r.id);
    segs.forEach(function (s) {
      const on = picked.indexOf(s.i) >= 0;
      const d = document.createElement("div");
      d.className = "seg" + (on ? " on" : "");
      d.setAttribute("role", "checkbox");
      d.setAttribute("aria-checked", on ? "true" : "false");
      d.tabIndex = 0;
      d.title = on ? "kept — press again to drop it" : "press to keep this segment for the synthesis";
      const mark = document.createElement("span");
      mark.className = "seg-mark";
      mark.textContent = on ? "✓" : "+";
      const tx = document.createElement("span");
      tx.className = "seg-tx";
      tx.textContent = s.text;
      d.appendChild(mark);
      d.appendChild(tx);
      const hit = function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        pickToggle(r, s.i);
      };
      d.onclick = hit;
      d.onkeydown = function (ev) {
        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") hit(ev);
      };
      body.appendChild(d);
    });
  }
  // The picks, lane by lane in reading order, each carrying the live answer text and its tag. Both the
  // assembler and the meta-prompt read this one list, so what the visitor picked is what gets used.
  function pickRows() {
    const rows = [];
    if (!LANE_RUN) return rows;
    LANE_RUN.results.forEach(function (r, i) {
      const idx = pickedOf(r.id);
      if (!idx.length || !r.ok || !r.text) return;
      const segs = SY.splitSegments(r.text);
      idx.forEach(function (n) {
        const s = segs.filter(function (x) { return x.i === n; })[0];
        if (s) rows.push({ lane: LANE_LETTERS[i] || "?", label: r.label, seg: s, id: r.id });
      });
    });
    return rows;
  }
  function picksStamp() {
    if (!LANE_RUN || !LANE_RUN.picks) return "";
    return Object.keys(LANE_RUN.picks).sort().map(function (k) {
      return k + ":" + LANE_RUN.picks[k].join(",");
    }).join("|");
  }
  // What the synthesizer reads: the picked segments if any were picked (labelled with their segment
  // number), otherwise every full answer - the meta-prompt route the visitor asked for. Each source
  // carries the bench's lane letter, so the meta-prompt and the (A2)/(B3) tags name answers the same way.
  function synthSources(rows) {
    if (rows && rows.length) {
      return rows.map(function (r) {
        return { lane: r.lane, label: r.label + " · segment " + r.seg.i, text: r.seg.text };
      });
    }
    return LANE_RUN.results.filter(function (r) { return r.ok && r.text; })
      .map(function (r, i) { return { lane: LANE_LETTERS[i] || "?", label: r.label, text: r.text }; });
  }

  // One card for a routed answer (a synthesis or a hand assembly), with its own pick and copy.
  function candidateCard(c) {
    const card = document.createElement("div");
    card.className = c.cls;
    const h = document.createElement("div");
    h.className = "cmp-head";
    h.textContent = c.head;
    const meta = document.createElement("div");
    meta.className = "cmp-meta";
    meta.textContent = c.meta;
    const body = document.createElement("div");
    body.className = "cmp-body";
    body.textContent = c.text || "";
    card.appendChild(h);
    card.appendChild(meta);
    card.appendChild(body);
    if (c.text) {
      const bar = document.createElement("div");
      bar.className = "cmp-bar";
      const pick = document.createElement("button");
      pick.type = "button";
      pick.textContent = LANE_RUN.picked === c.pick.id ? "✓ your answer" : c.useLabel;
      pick.disabled = !!LANE_RUN.picked || !!LANE_RUN.busy;
      pick.onclick = function () { benchPick(c.pick); };
      const cp = document.createElement("button");
      cp.type = "button";
      cp.textContent = "Copy";
      cp.onclick = function () {
        copyText(c.text).then(function () { cp.textContent = "✓ copied"; },
                              function () { cp.textContent = "select & copy"; });
      };
      bar.appendChild(pick);
      bar.appendChild(cp);
      card.appendChild(bar);
    }
    return card;
  }

  // The synthesis row: which lane writes it, one click to write it, one click to assemble by hand.
  function synthBar(foot, good) {
    if (!LANE_RUN || LANE_RUN.picked) return;
    const rows = pickRows();
    const n = rows.length;
    const busy = !!LANE_RUN.busy;
    if (good.length >= 2) {
      const pickLane = document.createElement("select");
      pickLane.id = "bench-synth-lane";
      pickLane.setAttribute("aria-label", "which lane writes the synthesis");
      good.forEach(function (r) {
        const l = LANES.filter(function (x) { return x.id === r.id; })[0];
        if (!l) return;
        const o = document.createElement("option");
        o.value = l.id;
        o.textContent = r.label;
        pickLane.appendChild(o);
      });
      const sy = document.createElement("button");
      sy.type = "button";
      sy.id = "bench-synth";
      sy.textContent = n
        ? "⇄ Synthesize from the " + n + " picked segment" + (n === 1 ? "" : "s")
        : "⇄ Synthesize into one answer";
      sy.title = n
        ? "one call to the chosen lane: it reads only the segments you kept and writes one refined answer from them"
        : "one call to the chosen lane: it reads every answer and writes one refined answer — or press the + on the strongest segments first, and only those are sent";
      sy.disabled = busy || !!(LANE_RUN.synth && LANE_RUN.synth.ok);
      sy.onclick = function () { benchSynthesize(); };
      foot.appendChild(pickLane);
      foot.appendChild(sy);
    }
    if (n) {
      const asm = document.createElement("button");
      asm.type = "button";
      asm.id = "bench-assemble";
      asm.textContent = "⇄ Assemble the " + n + " picked · no call";
      asm.title = "no API call, no key, nothing sent anywhere: your picked segments in order, verbatim, with their provenance";
      asm.disabled = busy;
      asm.onclick = function () { benchAssemble(); };
      const clr = document.createElement("button");
      clr.type = "button";
      clr.id = "bench-unpick";
      clr.textContent = "clear picks";
      clr.title = "drop every segment you kept";
      clr.disabled = busy;
      clr.onclick = function () {
        if (!LANE_RUN) return;
        LANE_RUN.picks = {};
        LANE_RUN.assembled = null;
        benchPaintRun();
      };
      foot.appendChild(asm);
      foot.appendChild(clr);
    }
  }

  function benchPaintRun() {
    const out = document.getElementById("bench-out");
    if (!out) return;
    out.innerHTML = "";
    if (!LANE_RUN) { out.hidden = true; return; }
    out.hidden = false;

    const grid = document.createElement("div");
    grid.className = "bench-cols";
    LANE_RUN.results.forEach(function (r) {
      const col = document.createElement("div");
      col.className = "cmp-col" + (r.state === "wait" ? " cmp-wait" : (r.ok ? " cmp-ok" : " cmp-no"));
      const h = document.createElement("div");
      h.className = "cmp-head";
      h.textContent = r.label;
      h.title = r.label;
      const meta = document.createElement("div");
      meta.className = "cmp-meta";
      meta.textContent = cmpMeta(r);
      const segs = (r.ok && r.text) ? SY.splitSegments(r.text) : [];
      const body = document.createElement("div");
      body.className = "cmp-body";
      if (segs.length && !LANE_RUN.picked) paintSegments(body, r, segs);
      else body.textContent = r.ok ? (r.text || "(empty answer)") : "";
      col.appendChild(h);
      col.appendChild(meta);
      col.appendChild(body);
      if (r.ok) {
        const kept = pickedOf(r.id).length;
        if (!LANE_RUN.picked) {
          const cnt = document.createElement("div");
          cnt.className = "seg-count" + (kept ? " on" : "");
          cnt.textContent = kept
            ? "keeping " + kept + " of " + segs.length + " segment" + (segs.length === 1 ? "" : "s")
            : segs.length + " segment" + (segs.length === 1 ? "" : "s") + " — press one to keep it";
          col.appendChild(cnt);
        }
        const bar = document.createElement("div");
        bar.className = "cmp-bar";
        const pick = document.createElement("button");
        pick.type = "button";
        pick.textContent = (LANE_RUN.picked === r.id) ? "✓ your answer" : "Use this one";
        pick.disabled = (!!LANE_RUN.picked && LANE_RUN.picked !== r.id) || !!LANE_RUN.busy;
        pick.title = (LANE_RUN.picked && LANE_RUN.picked !== r.id)
          ? "one answer per run — this run is already closed by another answer; send again to choose differently"
          : "add this reply to the conversation (one answer per run)";
        pick.onclick = function () { benchPick(r); };
        const cp = document.createElement("button");
        cp.type = "button";
        cp.textContent = "Copy";
        cp.onclick = function () {
          copyText(r.text).then(function () { cp.textContent = "✓ copied"; },
                                function () { cp.textContent = "select & copy"; });
        };
        bar.appendChild(pick);
        bar.appendChild(cp);
        col.appendChild(bar);
      }
      grid.appendChild(col);
    });
    out.appendChild(grid);

    const good = LANE_RUN.results.filter(function (r) { return r.ok && r.text; });
    const done = LANE_RUN.results.every(function (r) { return r.state !== "wait"; });
    const foot = document.createElement("div");
    foot.className = "cmp-foot";
    const note = document.createElement("span");
    note.className = "hint";
    note.textContent = done
      ? (good.length + " of " + LANE_RUN.results.length + " lane(s) answered · same system prompt, one shot each, no browser limbs · " +
         LANE_RUN.results.reduce(function (n, r) { return n + (r.attempts || 1); }, 0) +
         " request(s) charged to your keys (a lane that needed a payload retry counts every try)" +
         (LANE_RUN.picked ? " · this run is closed" : " · press a segment and it becomes the material for the synthesis"))
      : "asking " + LANE_RUN.results.length + " lane(s) at once…";
    foot.appendChild(note);

    if (done) synthBar(foot, good);

    // The routed answers sit under the grid: a synthesis one lane wrote, and/or the hand assembly of
    // the picked segments. Either one can be the answer that joins the conversation.
    if (LANE_RUN.synth) {
      const s = LANE_RUN.synth;
      out.appendChild(candidateCard({
        cls: "cmp-synth",
        head: "synthesis by " + s.label,
        meta: s.ok
          ? ((s.ms < 1000 ? s.ms + "ms" : (s.ms / 1000).toFixed(1) + "s") + " · " +
             (s.mode === "picks"
               ? s.count + " picked segment" + (s.count === 1 ? "" : "s") + " — nothing else was sent"
               : s.count + " answers in full") +
             " · one model reading the others and writing: the synthesis is that model's writing, not a new oracle")
          : ("failed · " + s.error),
        text: s.ok ? s.text : "",
        useLabel: "Use the synthesis",
        pick: { id: "synth", label: s.label, text: s.text },
      }));
    }
    if (LANE_RUN.assembled) {
      const a = LANE_RUN.assembled;
      const stale = a.stamp !== picksStamp();
      out.appendChild(candidateCard({
        cls: "cmp-assembled",
        head: "assembled by hand — " + a.count + " picked segment" + (a.count === 1 ? "" : "s") + " from " + a.lanes + " answer" + (a.lanes === 1 ? "" : "s"),
        meta: "kept verbatim, in the order you picked them, tagged to the answer and segment each block came from" +
          " · no API call, no key, nothing left this tab" +
          (stale ? " · your picks changed since — press Assemble again to refresh this" : ""),
        text: a.text,
        useLabel: "Use this assembly",
        pick: { id: "assemble", label: a.count + " picked segment(s) from " + a.lanes + " answer(s)", text: a.text, count: a.count, lanes: a.lanes },
      }));
    }
    out.appendChild(foot);
    out.scrollTop = 0;
  }

  // The prompt every lane gets: the same conversation the main chat would send, so the comparison is fair.
  function benchMessages(promptText, extra) {
    const invoked = Object.keys(CHAMPS).find(function (n) { return promptText.toUpperCase().indexOf(n.toUpperCase()) >= 0; });
    const sys = systemPrompt(invoked) + (extra ? "\n\n" + extra : "");
    return [{ role: "system", content: sys }, { role: "user", content: promptText }];
  }

  async function benchRun(promptText) {
    const text = String(promptText || "").trim();
    const run = document.getElementById("bench-run");
    if (!text) { bubble("assistant", "Type the prompt first, then run it on the lanes."); return; }
    const lanes = readyLanes();
    if (!lanes.length) {
      bubble("assistant", "No lane is ready. Give each lane a provider and a model, and either paste its key in the lane or put that provider's key in the top box — a lane set to the same provider shares it. Blocked vendors are labelled on the lane.");
      return;
    }
    if (P0.test(text)) { bubble("assistant", "P0 blocked that prompt."); return; }
    if (run) run.disabled = true;
    LANE_RUN = {
      prompt: text,
      at: Date.now(),
      picked: false,
      busy: false,
      picks: {},            // lane id -> the segment numbers the visitor kept. This run only.
      synth: null,          // the meta-prompt route's card
      assembled: null,      // the hand-assembly route's card
      results: lanes.map(function (l) {
        return { id: l.id, label: laneLabel(l), model: laneModel(l), state: "wait", ok: false, text: "", ms: 0, error: "" };
      }),
    };
    benchPaintRun();
    bubble("assistant", "⇄ compare — the same prompt went to " + lanes.length + " lane(s) at once: " +
      lanes.map(function (l) { return laneLabel(l); }).join(" · ") +
      ". The answers are side by side in the bench under the composer. Then either pick one, press one segment in each answer to keep the strongest and assemble them, or synthesize all of it into one refined answer.");
    const messages = benchMessages(text);
    try {
      const got = await Promise.all(lanes.map(function (l) { return laneCall(l, messages); }));
      LANE_RUN.results = lanes.map(function (l, i) {
        const r = got[i] || { ok: false, error: "no answer" };
        return {
          id: l.id, label: laneLabel(l), model: laneModel(l), state: "done",
          ok: !!r.ok, text: r.text || "", ms: r.ms || 0, error: r.error || "",
          attempts: r.attempts || 1, usage: r.usage || null, served: r.served || "", toolCalls: r.toolCalls || 0,
        };
      });
    } catch (e) {
      LANE_RUN.results.forEach(function (r) { r.state = "done"; r.error = r.error || String((e && e.message) || e); });
    } finally {
      if (run) run.disabled = false;
      benchPaintRun();
    }
  }

  // One answer per run joins the conversation: a lane's own reply, the synthesis, or the hand assembly.
  // One turn in, one turn out — so the log stays a conversation instead of a pile of variants.
  function benchPick(r) {
    if (!LANE_RUN || LANE_RUN.picked) return;
    const text = String((r && r.text) || "").trim();
    if (!text) return;
    LANE_RUN.picked = r.id;
    history.push({ role: "assistant", content: text });
    let how;
    if (r.id === "synth") how = "synthesis by " + r.label;
    else if (r.id === "assemble") how = "assembled by hand — " + r.label;
    else how = "picked: " + r.label;
    bubble("assistant", how + "\n\n" + text);
    benchPaintRun();
  }

  // Route B: one meta-prompt, one call, one refined answer. It reads the picked segments when there are
  // any (cheaper and sharper), and every full answer when there are none.
  async function benchSynthesize() {
    if (!LANE_RUN || LANE_RUN.picked || LANE_RUN.busy) return;
    const good = LANE_RUN.results.filter(function (r) { return r.ok && r.text; });
    if (good.length < 2) return;
    const sel = document.getElementById("bench-synth-lane");
    const snap = LANES.filter(function (x) { return sel && x.id === sel.value; });
    const l = snap[0] || LANES.filter(function (x) { return x.id === LANE_RUN.results[0].id; })[0];
    if (!l) return;
    const rows = pickRows();
    const mode = rows.length ? "picks" : "all";
    const ask = SY.synthPrompt({ prompt: LANE_RUN.prompt, mode: mode, body: SY.sourceBlock(synthSources(rows)) });
    const spent = mode === "picks" ? rows.length : good.length;
    LANE_RUN.busy = true;
    LANE_RUN.synth = null;
    benchPaintRun();
    bubble("assistant", "⇄ synthesizing " + spent + (mode === "picks" ? " picked segment(s)" : " answers") +
      " with " + laneLabel(l) + " — it writes the one answer, and names what it leaned on…");
    const r = await laneCall(l, benchMessages(ask, SY.synthSystem(mode)));
    LANE_RUN.busy = false;
    LANE_RUN.synth = {
      id: l.id, label: laneLabel(l), ok: !!r.ok, text: r.text || "", error: r.error || "",
      ms: r.ms || 0, mode: mode, count: spent,
    };
    benchPaintRun();
  }

  // Route A: the picked segments, verbatim, tagged to the answer and segment each came from. No call.
  function benchAssemble() {
    if (!LANE_RUN || LANE_RUN.picked || LANE_RUN.busy) return;
    const rows = pickRows();
    if (!rows.length) return;
    const out = SY.assemble(rows.map(function (r) {
      return { lane: r.lane, label: r.label, seg: r.seg };
    }));
    LANE_RUN.assembled = {
      text: out.text, count: out.count, lanes: out.lanes.length, stamp: picksStamp(),
    };
    benchPaintRun();
  }

  function benchShow(on) {
    const bench = document.getElementById("bench");
    const tgl = document.getElementById("cmp-toggle");
    COMPARE = !!on;
    compareSave();
    if (bench) bench.hidden = !COMPARE;
    if (tgl) {
      tgl.setAttribute("aria-pressed", COMPARE ? "true" : "false");
      tgl.className = "cmp-toggle" + (COMPARE ? " on" : "");
    }
    if (COMPARE) {
      if (!LANES.length) laneLoad();
      paintLanes();
      if (msg) msg.placeholder = "Ask — every ready lane answers side by side…";
      if (LANE_RUN) benchPaintRun();
    } else if (msg) {
      msg.placeholder = connected ? "Ask…" : "Connect first, then ask…";
    }
  }

  (function benchWire() {
    const tgl = document.getElementById("cmp-toggle");
    const add = document.getElementById("bench-add");
    const run = document.getElementById("bench-run");
    if (tgl) {
      tgl.addEventListener("click", function () { benchShow(!COMPARE); });
      compareLoad();
      if (COMPARE) benchShow(true);
    }
    if (add) {
      add.addEventListener("click", function () {
        if (LANES.length >= LANE_MAX) { benchStatus(); return; }
        const topPid = (modeEl && PROVIDERS[modeEl.value]) ? modeEl.value : "groq";
        const l = { id: laneId(), pid: topPid, model: "", url: "" };
        LANES.push(l);
        laneFillModels(l);
        laneSave();
        paintLanes();
      });
    }
    if (run) {
      run.addEventListener("click", function () {
        const text = String((msg && msg.value) || "").trim();
        if (!text) { bubble("assistant", "Type the prompt in the box first, then run it on the lanes."); return; }
        // Same record as pressing Send with the bench on: the visitor's turn joins the conversation,
        // and one assistant turn is added when they pick a lane, the synthesis or the assembly.
        bubble("user", text);
        history.push({ role: "user", content: text });
        if (msg) msg.value = "";
        benchRun(text);
      });
    }
    benchStatus();
  })();

  // ---- Image generation suite ----------------------------------------------------------------
  // ONE owner for "make a picture": the module at the bottom of the page and the agent's
  // image_generate limb both call lygoImageGenerate() below, so a picture the visitor asks for and a
  // picture the agent asks for come from the same routes with the same honest metadata.
  //
  // MEASURED 2026-09-23 from https://chatagent.ca with an OPTIONS preflight (asking a server what it
  // will allow a browser costs no key):
  //   BROWSER-OK : gemini (generateContent), openrouter, siliconflow, novita, fireworks, huggingface
  //   NO CORS    : xai, openai, deepinfra, hyperbolic, groq (403) - a web page cannot call them at all
  // The console route is what makes the PC console's OWN pictures (SDXL-Turbo through the kit's picture
  // limb): POST /api/image starts a job, this page polls it, the bytes come back from /api/image?file=…
  // MEASURED: 12.5 s on a free card, 272-300 s on the CPU route the limb picks while the chat model
  // holds the card - so the clock is shown instead of a spinner that looks hung.
  const IMG_PROVIDER = {
    gemini: {
      label: "Google Gemini image", kind: "gemini", model: "gemini-2.5-flash-image",
      url: "https://generativelanguage.googleapis.com/v1beta/models/",
      note: "free tier — aistudio.google.com/apikey",
    },
    openrouter: {
      label: "OpenRouter image model", kind: "openrouter", model: "google/gemini-2.5-flash-image-preview",
      url: "https://openrouter.ai/api/v1/", note: "paid, a few cents a picture",
    },
    huggingface: {
      label: "Hugging Face router (FLUX.1-schnell)", kind: "hf", model: "black-forest-labs/FLUX.1-schnell",
      url: "https://router.huggingface.co/hf-inference/models/", note: "your HF token; free tier is rate-limited",
    },
    siliconflow: {
      label: "SiliconFlow (Kolors)", kind: "openai-images", model: "Kwai-Kolors/Kolors",
      url: "https://api.siliconflow.cn/v1/images/generations", note: "cheap",
    },
    fireworks: {
      label: "Fireworks (FLUX schnell)", kind: "openai-images",
      model: "accounts/fireworks/models/flux-1-schnell",
      url: "https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell",
      note: "cheap",
    },
    novita: {
      label: "Novita (SDXL)", kind: "novita", model: "sd_xl_base_1.0.safetensors",
      url: "https://api.novita.ai/v3/async/", note: "cheap",
    },
  };
  // Why a vendor that HAS pictures is still not on the list: the browser is the limit, not the key.
  const IMG_NO_BROWSER = {
    xai: "xAI has an image model (grok-2-image) but sends no CORS header — a web page cannot call it.",
    openai: "OpenAI's images API sends no CORS header to this page — use the console route or Gemini.",
    deepinfra: "DeepInfra hosts FLUX but sends no CORS header — a web page cannot call it.",
    hyperbolic: "Hyperbolic hosts FLUX but sends no CORS header — a web page cannot call it.",
    together: "Together hosts FLUX but its API sends no CORS header, so even chat is blocked here.",
    anthropic: "Anthropic has no image generation API.",
    groq: "Groq has no image generation API.",
    mistral: "Mistral has no image generation API.",
    deepseek: "DeepSeek has no image generation API.",
    cerebras: "Cerebras has no image generation API.",
    cohere: "Cohere has no image generation API.",
    perplexity: "Perplexity has no image generation API.",
    llm7: "LLM7 has no image generation API.",
    custom: "a custom chat URL is not an image endpoint — point it at an OpenAI-compatible images route and use it as a chat provider.",
  };
  const IMG = { routes: null, busy: false, last: null };

  function imgEl(id) { return document.getElementById(id); }
  function imgSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function imgStatus(t, kind) {
    const el = imgEl("img-status");
    if (!el) return;
    el.textContent = t;
    el.className = "hint" + (kind ? " img-" + kind : "");
  }
  function imgKey() { return tokenEl ? String(tokenEl.value || "").trim() : ""; }

  function imgConsoleAttached() {
    const base = consoleBase();
    return !!(base && base !== location.origin) || !!(IMG.routes && IMG.routes.console && IMG.routes.console.ok);
  }

  function imgRouteRows() {
    const rows = [];
    const base = consoleBase();
    const health = IMG.routes && IMG.routes.console;
    rows.push({
      id: "console",
      label: "Your LYGO console (this machine's own picture engine)",
      ready: !!(health && health.ok && (health.image || {}).ready),
      keyed: true,
      note: health && health.ok
        ? "attached at " + base + (health.image && health.image.engine ? " · " + health.image.engine : "") +
          (health.image && health.image.route ? " · route " + health.image.route : "")
        : (!base || base === location.origin
            ? "no console attached — open this page with ?console=https://your-gateway (PC LOCAL default: http://127.0.0.1:9642)"
            : "no answer from " + base + (LOCAL_ACCESS ? " — " + LOCAL_ACCESS : "")),
      cost: "free (your machine) · one at a time · 3 per 10 min",
      verified: !!(health && health.ok),
    });
    Object.keys(IMG_PROVIDER).forEach(function (pid) {
      const p = IMG_PROVIDER[pid];
      const probe = IMG.routes && IMG.routes.providers && IMG.routes.providers[pid];
      rows.push({
        id: pid, label: p.label, ready: !!(probe && probe.ok), keyed: !!imgKey(),
        note: (probe ? (probe.ok ? "browser can call it" : "blocked: " + (probe.why || "no CORS header")) : "not checked yet") +
              " · " + p.note,
        cost: "your key, your account",
        verified: !!(probe && probe.ok && probe.used),
      });
    });
    Object.keys(IMG_NO_BROWSER).forEach(function (pid) {
      rows.push({ id: "no:" + pid, label: (PROVIDERS[pid] ? PROVIDERS[pid].label : pid), ready: false, keyed: false,
                  note: IMG_NO_BROWSER[pid], cost: "not available to a web page", verified: false });
    });
    return rows;
  }

  function renderImgRoutes() {
    const box = imgEl("img-routes-body");
    const sel = imgEl("img-route");
    const rows = imgRouteRows();
    if (sel) {
      const keep = sel.value;
      sel.innerHTML = "";
      rows.filter(function (r) { return r.id.indexOf("no:") !== 0; }).forEach(function (r) {
        const o = document.createElement("option");
        o.value = r.id;
        o.textContent = r.label + (r.ready ? (r.id === "console" ? " — ready" : " — browser-callable") : " — not available yet");
        sel.appendChild(o);
      });
      if (keep) sel.value = keep;
      if (!sel.value && sel.options.length) sel.value = sel.options[0].value;
    }
    if (box) {
      box.innerHTML = "";
      rows.forEach(function (r) {
        const row = document.createElement("div");
        row.className = "img-route-row " + (r.ready ? "img-ok" : "img-no");
        const name = document.createElement("b");
        name.textContent = r.label;
        const why = document.createElement("span");
        why.className = "hint";
        why.textContent = (r.ready ? "ready · " : "not available · ") + r.note + " · " + r.cost +
          (r.verified ? " · verified here" : "");
        row.appendChild(name);
        row.appendChild(why);
        box.appendChild(row);
      });
    }
  }

  async function imgCheckRoutes(deep) {
    // Live, from THIS page's origin: the console's own /health, then one unauthenticated call to each
    // image endpoint. A readable answer of any status means a browser may call it; "Failed to fetch"
    // means the server sent no CORS header, which no key can fix.
    imgStatus("checking the routes from this page…");
    const out = { console: { ok: false }, providers: {} };
    const base = consoleBase();
    try {
      const r = await consoleFetch(base + "/health", { headers: { Accept: "application/json" } });
      const j = await r.json();
      out.console = { ok: true, base: base, image: j.image || null, model: j.model || "" };
    } catch (e) {
      out.console = { ok: false, base: base, why: base === location.origin
        ? "this page is not being served by a console (add ?console=https://your-gateway)"
        : String(e && e.message ? e.message : e) };
    }
    const ids = Object.keys(IMG_PROVIDER);
    for (let i = 0; i < ids.length; i++) {
      const pid = ids[i];
      const p = IMG_PROVIDER[pid];
      const url = p.kind === "gemini" ? p.url + p.model + ":generateContent"
        : p.kind === "novita" ? p.url + "txt2img" : p.url;
      if (!deep && pid === "novita") { out.providers[pid] = { ok: false, why: "not probed" }; continue; }
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ prompt: "route check", inputs: "route check" }) });
        out.providers[pid] = { ok: true, status: r.status, acao: r.headers.get("access-control-allow-origin") || "" };
      } catch (e) {
        out.providers[pid] = { ok: false, why: "no CORS header (Failed to fetch from a web page)" };
      }
    }
    IMG.routes = out;
    renderImgRoutes();
    const okN = Object.keys(out.providers).filter(function (k) { return out.providers[k].ok; }).length;
    imgStatus("routes checked: console " + (out.console.ok ? "answered" : "not attached") +
              " · " + okN + " key route(s) callable from a browser" + (imgKey() ? " · a key is in the box" : " · no key pasted yet"));
    return out;
  }

  function imgProviderError(pid, j, status) {
    const e = (j && j.error) || {};
    const m = (typeof e === "string" ? e : e.message || e.type || "") || (j && (j.message || j.detail || j.reason)) || "";
    let hint = String(m || ("HTTP " + status)).slice(0, 300);
    if (status === 401 || status === 403) hint += " — that key was refused for image generation.";
    if (status === 404) hint += " — this provider has no image model by that id; check the model name.";
    if (status === 429) hint += " — rate limited by the provider; try again in a minute.";
    return { ok: false, error: "provider_" + status, hint: hint, route: pid };
  }

  async function imgBlobToDataUrl(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status + " fetching the picture");
    const blob = await r.blob();
    return await new Promise(function (res, rej) {
      const fr = new FileReader();
      fr.onload = function () { res(fr.result); };
      fr.onerror = function () { rej(new Error("could not read the picture bytes")); };
      fr.readAsDataURL(blob);
    });
  }

  async function imgViaConsole(prompt, size) {
    const base = consoleBase();
    const post = await consoleFetch(base + "/api/image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt, size: Number(size) || 0 }),
    });
    const started = await post.json().catch(function () { return {}; });
    if (!post.ok || !started.job) {
      return { ok: false, error: started.error || ("HTTP " + post.status),
               hint: started.hint || (started.image && started.image.enabled === false
                 ? "the operator turned the public picture route off (LYGO_PUBLIC_IMAGE=0)"
                 : "no console answered at " + base + " — attach one with ?console=https://your-gateway") };
    }
    const cpu = started.route === "cpu";
    imgStatus("the console is drawing… 0s" + (cpu ? " — the CPU route takes about 5 minutes, leave the tab open" : " — the card route takes seconds to a minute"));
    const deadline = Date.now() + 20 * 60 * 1000;
    while (Date.now() < deadline) {
      await imgSleep(2000);
      let row = {};
      try {
        const r = await consoleFetch(base + "/api/image?job=" + encodeURIComponent(started.job));
        row = await r.json();
      } catch (e) {
        return { ok: false, error: "poll_failed", hint: String(e && e.message ? e.message : e) };
      }
      if (!row.status || row.status === "running") {
        imgStatus("the console is drawing… " + (row.elapsed || 0) + "s" + (cpu ? " (CPU route)" : ""));
        continue;
      }
      if (row.status === "failed") {
        return { ok: false, error: row.error || "image_failed", hint: row.hint || "", seconds: row.seconds,
                 route: "console · " + (row.route || "?"), model: row.engine || "" };
      }
      const dataUrl = await imgBlobToDataUrl(base + row.url);
      return { ok: true, image: dataUrl, route: "console" + (row.route ? " · " + row.route : ""),
               model: row.engine || "sd-cli", bytes: row.bytes, seconds: row.seconds, prompt: prompt,
               width: row.drawn_w || 0, height: row.drawn_h || 0 };
    }
    return { ok: false, error: "timeout", hint: "the console was still drawing after 20 minutes" };
  }

  async function imgViaProvider(pid, prompt, size) {
    const p = IMG_PROVIDER[pid];
    if (!p) return { ok: false, error: "no_route", hint: IMG_NO_BROWSER[pid] || ("no picture route for " + pid) };
    const key = imgKey();
    if (!key) return { ok: false, error: "no_key",
                       hint: "paste that provider's key in the Connect box at the top first — it stays in this tab" };
    const px = String(size || "1024");
    if (p.kind === "gemini") {
      const url = p.url + encodeURIComponent(p.model) + ":generateContent?key=" + encodeURIComponent(key);
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const j = await r.json().catch(function () { return {}; });
      if (!r.ok) return imgProviderError(pid, j, r.status);
      const parts = ((((j.candidates || [])[0] || {}).content || {}).parts) || [];
      for (let i = 0; i < parts.length; i++) {
        const inl = parts[i].inlineData || parts[i].inline_data;
        if (inl && inl.data) {
          return { ok: true, image: "data:" + (inl.mimeType || inl.mime_type || "image/png") + ";base64," + inl.data,
                   route: pid, model: p.model, prompt: prompt };
        }
      }
      return { ok: false, error: "no_image_in_answer", route: pid,
               hint: "the model answered without a picture — a safety filter or a text-only model id can do that" };
    }
    if (p.kind === "openrouter") {
      const r = await fetch(p.url + "chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key,
                   "HTTP-Referer": "https://excavationpro.ca/portal/", "X-Title": "LYGO API Portal" },
        body: JSON.stringify({ model: p.model, modalities: ["image", "text"],
                               messages: [{ role: "user", content: prompt }] }),
      });
      const j = await r.json().catch(function () { return {}; });
      if (!r.ok) return imgProviderError(pid, j, r.status);
      const msg = (((j.choices || [])[0] || {}).message) || {};
      const imgs = msg.images || [];
      if (imgs.length && imgs[0].image_url && imgs[0].image_url.url) {
        return { ok: true, image: imgs[0].image_url.url, route: pid, model: p.model, prompt: prompt };
      }
      return { ok: false, error: "no_image_in_answer", route: pid,
               hint: "that model answered text only — pick an image model id on OpenRouter" };
    }
    if (p.kind === "openai-images") {
      const r = await fetch(p.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({ model: p.model, prompt: prompt, n: 1, size: px + "x" + px,
                               response_format: "b64_json" }),
      });
      const j = await r.json().catch(function () { return {}; });
      if (!r.ok) return imgProviderError(pid, j, r.status);
      const d = ((j.data || [])[0]) || (j.images || [])[0] || {};
      if (d.b64_json) return { ok: true, image: "data:image/png;base64," + d.b64_json, route: pid, model: p.model, prompt: prompt };
      if (d.url || d.image_url) return { ok: true, image: d.url || d.image_url, route: pid, model: p.model, prompt: prompt };
      return { ok: false, error: "no_image_in_answer", route: pid, hint: "the answer carried no picture data" };
    }
    if (p.kind === "novita") {
      const r = await fetch(p.url + "txt2img", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({ model_name: p.model, prompt: prompt, image_num: 1,
                               width: Number(px), height: Number(px), steps: 25 }),
      });
      const j = await r.json().catch(function () { return {}; });
      if (!r.ok) return imgProviderError(pid, j, r.status);
      const task = j.task_id || "";
      if (!task) return { ok: false, error: "no_task_id", route: pid, hint: JSON.stringify(j).slice(0, 200) };
      for (let i = 0; i < 60; i++) {
        await imgSleep(2000);
        imgStatus("Novita is drawing… " + (i * 2) + "s");
        const rr = await fetch(p.url + "txt2img/result?task_id=" + encodeURIComponent(task),
                               { headers: { Authorization: "Bearer " + key } });
        const rj = await rr.json().catch(function () { return {}; });
        if (rj.task && rj.task.status === "TASK_STATUS_SUCCEED") {
          const im = ((rj.images || [])[0]) || {};
          if (im.image_url) return { ok: true, image: im.image_url, route: pid, model: p.model, prompt: prompt };
        }
        if (rj.task && /FAILED/.test(String(rj.task.status))) {
          return { ok: false, error: "novita_failed", route: pid, hint: String(rj.task.reason || "task failed") };
        }
      }
      return { ok: false, error: "timeout", route: pid, hint: "Novita did not finish the task in 2 minutes" };
    }
    if (p.kind === "hf") {
      const r = await fetch(p.url + p.model, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({ inputs: prompt }),
      });
      if (!r.ok) {
        const t = await r.text().catch(function () { return ""; });
        return imgProviderError(pid, { error: t.slice(0, 200) }, r.status);
      }
      const blob = await r.blob();
      const dataUrl = await new Promise(function (res, rej) {
        const fr = new FileReader();
        fr.onload = function () { res(fr.result); };
        fr.onerror = function () { rej(new Error("could not read the picture bytes")); };
        fr.readAsDataURL(blob);
      });
      return { ok: true, image: dataUrl, route: pid, model: p.model, bytes: blob.size, prompt: prompt };
    }
    return { ok: false, error: "no_route", route: pid, hint: IMG_NO_BROWSER[pid] || "no picture route here" };
  }

  // The one function the module UI and the agent limb share.
  async function lygoImageGenerate(prompt, size, routeId) {
    const p = String(prompt || "").trim().slice(0, 700);
    if (!p) return { ok: false, error: "empty_prompt", hint: "say what the picture should show" };
    const sel = imgEl("img-route");
    const rid = String(routeId || (sel ? sel.value : "") || "console");
    if (IMG.busy) return { ok: false, error: "busy", hint: "a picture is already being made on this page — one at a time" };
    IMG.busy = true;
    const t0 = Date.now();
    try {
      const r = (rid === "console") ? await imgViaConsole(p, size) : await imgViaProvider(rid, p, size);
      if (!r.ok) {
        imgStatus("no picture: " + (r.error || "failed") + (r.hint ? " — " + r.hint : ""), "err");
        return r;
      }
      r.seconds = r.seconds || Math.round((Date.now() - t0) / 100) / 10;
      IMG.last = r;
      return r;
    } catch (e) {
      const m = String(e && e.message ? e.message : e);
      const hint = /Failed to fetch|NetworkError|CORS/i.test(m)
        ? (rid === "console"
            ? "your browser did not let this page reach your own machine: " + m +
              " — for a public page calling 127.0.0.1 that is Chrome's Local Network Access rule " +
              "(Private Network Access), not a vendor and not a key. Allow local network access for " +
              "chatagent.ca, and make sure the console's PUBLIC_GATEWAY.bat is actually running " +
              "(default port 9642). The page cannot tell the two apart from here — the browser hides it."
            : "that call never left your browser: " + m + " — the vendor sends no CORS header, so no key can fix it here.")
        : m;
      imgStatus("no picture: " + hint, "err");
      return { ok: false, error: "call_failed", hint: hint, route: rid };
    } finally {
      IMG.busy = false;
    }
  }

  function imgShow(r) {
    const out = imgEl("img-out"), meta = imgEl("img-meta"), dl = imgEl("img-dl");
    const again = imgEl("img-again"), clr = imgEl("img-clear");
    if (!out) return;
    out.src = r.image;
    out.hidden = false;
    if (dl) {
      dl.href = r.image;
      dl.download = "lygo-image-" + Date.now() + ".png";
      dl.hidden = false;
    }
    if (again) again.hidden = false;
    if (clr) clr.hidden = false;
    if (meta) {
      meta.textContent = [r.route || "?", r.model || "?",
                          (r.width ? r.width + "×" + (r.height || r.width) + " px" : ""),
                          (r.seconds ? r.seconds + "s" : ""),
                          (r.bytes ? Math.round(r.bytes / 1024) + " KB" : ""),
                          (r.prompt ? "“" + String(r.prompt).slice(0, 60) + "”" : "")].filter(Boolean).join(" · ");
    }
  }

  async function imgGo() {
    const pr = imgEl("img-prompt"), sz = imgEl("img-size"), sel = imgEl("img-route");
    const prompt = pr ? String(pr.value || "").trim() : "";
    if (!prompt) { imgStatus("type what the picture should show first.", "err"); return null; }
    if (sel && sel.value.indexOf("no:") === 0) { imgStatus("that vendor cannot be called from a web page — pick another route.", "err"); return null; }
    const go = imgEl("img-go");
    if (go) { go.disabled = true; }
    try {
      const r = await lygoImageGenerate(prompt, sz ? sz.value : "1024", sel ? sel.value : "console");
      if (r.ok) {
        imgShow(r);
        imgStatus("done in " + r.seconds + "s on " + (r.route || "?") + " — the picture is above; “Download” saves it.");
      }
      return r;
    } finally {
      if (go) { go.disabled = false; }
    }
  }

  function imgClear() {
    const out = imgEl("img-out"), meta = imgEl("img-meta"), dl = imgEl("img-dl");
    const again = imgEl("img-again"), clr = imgEl("img-clear");
    if (out) { out.hidden = true; out.removeAttribute("src"); }
    if (dl) { dl.hidden = true; dl.removeAttribute("href"); }
    if (again) again.hidden = true;
    if (clr) clr.hidden = true;
    if (meta) meta.textContent = "No picture yet.";
    IMG.last = null;
  }

  // An agent-made picture is SHOWN, never narrated, and its bytes never enter the message history:
  // 2.8 MB of base64 re-sent every turn is a provider bill, not a feature.
  function showAgentImage(r) {
    if (!log || !r || !r.image) return;
    const fig = document.createElement("figure");
    fig.className = "bubble assistant img-bubble";
    const im = document.createElement("img");
    im.src = r.image;
    im.alt = r.prompt || "picture generated by the agent";
    const cap = document.createElement("figcaption");
    cap.textContent = "image_generate · " + (r.route || "?") + " · " + (r.model || "?") +
                      (r.seconds ? " · " + r.seconds + "s" : "") + " — saved from here with Download in the image suite below";
    fig.appendChild(im);
    fig.appendChild(cap);
    log.appendChild(fig);
    log.scrollTop = log.scrollHeight;
  }

  window.lygoImageGenerate = lygoImageGenerate;    // the agent limb calls exactly this
  window.lygoImageSuite = { check: imgCheckRoutes, routes: imgRouteRows, generate: imgGo, show: imgShow };

  (function imgWire() {
    const go = imgEl("img-go"), check = imgEl("img-check"), again = imgEl("img-again"), clr = imgEl("img-clear");
    const prompt = imgEl("img-prompt");
    if (go) go.addEventListener("click", function () { imgGo(); });
    if (check) check.addEventListener("click", function () { imgCheckRoutes(true); });
    if (again) again.addEventListener("click", function () {
      const pr = imgEl("img-prompt");
      if (pr && pr.value) imgGo();
    });
    if (clr) clr.addEventListener("click", imgClear);
    if (prompt) prompt.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); imgGo(); }
    });
    if (imgEl("img-go")) {
      renderImgRoutes();
      imgStatus("pick a prompt and a route, then Generate. Nothing has been generated yet.");
      imgCheckRoutes(false).catch(function () { renderImgRoutes(); });
    }
  })();

  // ---- LYGO Function Modules ---------------------------------------------------------------
  // This page grows by module, it never forks. A console you attach (PC LOCAL or USB CLAW)
  // publishes its module table at /api/modules; this page renders what each module can do
  // HERE, and names the ones that need your own machine. No console attached = the page
  // behaves exactly as before, so the public build can never be broken by a module.
  const MODULES = { ok: false, base: "", list: [], counts: {}, edition: "", status: "no console attached" };

  function consoleBase() {
    const q = new URLSearchParams(location.search).get("console");
    if (q) { try { return new URL(q).origin; } catch (_) { return ""; } }
    if (typeof window.LYGO_CONSOLE_BASE === "string" && window.LYGO_CONSOLE_BASE) return window.LYGO_CONSOLE_BASE;
    return location.origin;                       // a console serving this page itself
  }

  // Reaching your OWN console from this public page is a "local address" request: Chrome (138+) wants
  // the caller to say so, and then it can ask the visitor to allow it. Without the option the fetch is
  // refused with a bare "Failed to fetch" that looks exactly like a dead gateway - MEASURED 2026-09-24,
  // https://excavationpro.ca/portal/ -> http://127.0.0.1:9642, navigator.permissions
  // .query({name:'local-network-access'}) = denied, while the same request from curl answered 200.
  // Unknown fetch options are ignored by older browsers, so this is safe to always pass.
  function isLocalAddress(u) {
    try {
      const h = new URL(u, location.href).hostname;
      return h === "127.0.0.1" || h === "localhost" || h === "::1" || h === "[::1]" || h === "0.0.0.0";
    } catch (_) { return false; }
  }
  function consoleFetch(u, opts) {
    const o = Object.assign({}, opts || {});
    if (isLocalAddress(u) && !("targetAddressSpace" in o)) o.targetAddressSpace = "local";
    return fetch(u, o);
  }

  // What the browser thinks about this page reaching the visitor's own machine. A refused request and
  // a gateway that is not running both arrive as "Failed to fetch", and telling a visitor to start
  // something that is already running wastes their time - so ask the browser which one this was.
  var LOCAL_ACCESS = "";                    // cached: the route table below is built synchronously
  // (var, not let: this file runs top to bottom in one IIFE, and the image module renders before this
  //  line executes - a let here would be in the temporal dead zone and throw on the first paint.)
  async function probeLocalAccess() {
    LOCAL_ACCESS = await localNote();
    return LOCAL_ACCESS;
  }

  async function localNote() {
    try {
      if (!navigator.permissions || !navigator.permissions.query) return "";
      const st = await navigator.permissions.query({ name: "local-network-access" });
      if (st.state === "denied") return "allow it for chatagent.ca: site settings → Local network access → Allow, then reload.";
      if (st.state === "prompt") return "reload this page and say yes when the browser asks about your local network.";
      return "";
    } catch (e) { return ""; }
  }

  function moduleTone(m) {
    const s = String((m.surfaces || {}).web || "");
    if (s.indexOf("FULL") === 0) return { cls: "mod-full", label: "web-ready" };
    if (s.indexOf("DEGRADED") === 0) return { cls: "mod-deg", label: s.replace("DEGRADED", "in the tab") };
    if (s.indexOf("N/A") === 0 || s.indexOf("N_A") === 0) return { cls: "mod-na", label: "needs your machine" };
    return { cls: "mod-na", label: "unknown" };
  }

  function moduleGets(m) {                        // read-only by construction: GET routes only
    return (m.routes || []).map(function (r) {
      const t = String(r).trim().split(/\s+/);
      return t.length > 1 ? { method: t[0], path: t[1] } : { method: "GET", path: t[0] };
    }).filter(function (r) { return r.method === "GET"; });
  }

  async function moduleCall(path, query) {
    const u = new URL(path, MODULES.base || location.origin);
    if (query) Object.keys(query).forEach(function (k) { u.searchParams.set(k, query[k]); });
    const r = await consoleFetch(u.toString(), { headers: { Accept: "application/json" } });
    const body = await r.text();
    if (!r.ok) throw new Error("HTTP " + r.status + " from " + u.pathname +
      (r.status === 0 ? " (a console on another origin must allow this page via CORS)" : ""));
    try { return JSON.parse(body); } catch (_) { throw new Error("the answer from " + u.pathname + " was not JSON"); }
  }

  function renderModules() {
    const list = document.getElementById("modules-list");
    const status = document.getElementById("modules-status");
    if (!list || !status) return;
    list.innerHTML = "";
    if (!MODULES.ok) {
      status.textContent = MODULES.status + " — attach one by starting the console's public gateway (PUBLIC_GATEWAY.bat) and opening this page with ?console=http://127.0.0.1:9642, then allowing local network access when the browser asks. The gateway carries the headers this page needs; the admin UI on :9641 / :9651 is for you, not for a web page.";
      return;
    }
    const c = MODULES.counts || {};
    status.textContent = (MODULES.edition || "console").toUpperCase() + " console · " + MODULES.list.length +
      " module(s) · wired " + (c.wired != null ? c.wired : "?") +
      " · refused " + (c.refused != null ? c.refused : "?") +
      " · degraded " + (c.degraded != null ? c.degraded : "?") +
      " · routes " + (c.routes != null ? c.routes : "?");
    MODULES.list.forEach(function (m) {
      const tone = moduleTone(m);
      const gets = moduleGets(m);
      const row = document.createElement("div");
      row.className = "mod-row";
      const head = document.createElement("div");
      head.className = "mod-head";
      const name = document.createElement("strong");
      name.textContent = m.title || m.id;
      const id = document.createElement("code");
      id.textContent = m.id;
      const state = document.createElement("span");
      state.className = "mod-state";
      state.textContent = m.state || "";
      const badge = document.createElement("span");
      badge.className = "mod-badge " + tone.cls;
      badge.textContent = tone.label;
      head.appendChild(name); head.appendChild(id); head.appendChild(state); head.appendChild(badge);
      row.appendChild(head);
      const foot = document.createElement("div");
      foot.className = "mod-foot";
      foot.textContent = gets.length ? gets.map(function (g) { return g.path; }).join(" · ")
                                     : (m.routes && m.routes.length ? m.routes.join(" · ") : "no HTTP route of its own");
      foot.title = foot.textContent;
      row.appendChild(foot);
      if (m.error) {
        const err = document.createElement("div");
        err.className = "mod-err";
        err.textContent = m.error;
        row.appendChild(err);
      }
      if (gets.length) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mod-read";
        btn.textContent = "Read " + gets[0].path;
        const out = document.createElement("pre");
        out.className = "mod-out";
        btn.addEventListener("click", async function () {
          out.textContent = "reading " + gets[0].path + " …";
          try {
            const j = await moduleCall(gets[0].path);
            out.textContent = JSON.stringify(j, null, 1).slice(0, 1200);
          } catch (e) {
            out.textContent = "could not read it: " + String(e && e.message ? e.message : e) +
              " (a console on another origin must allow this page via CORS)";
          }
        });
        row.appendChild(btn);
        row.appendChild(out);
      }
      list.appendChild(row);
    });
  }

  async function loadModules() {
    MODULES.base = consoleBase();
    try {
      const r = await consoleFetch(MODULES.base + "/api/modules", { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (!j || !j.ok) throw new Error(j && j.load_error ? j.load_error : "no module table in the answer");
      MODULES.ok = true;
      MODULES.list = j.modules || [];
      MODULES.counts = j.counts || {};
      MODULES.edition = j.edition || "";
      MODULES.status = "attached";
    } catch (e) {
      MODULES.ok = false;
      const msg = String(e && e.message ? e.message : e);
      const quiet = MODULES.base === location.origin && /HTTP 404/.test(msg);   // public page: no console here, and that is normal
      let why = quiet ? "" : " (" + msg + ")";
      if (!quiet && isLocalAddress(MODULES.base)) {
        await probeLocalAccess();
        if (LOCAL_ACCESS) why = " — " + LOCAL_ACCESS;
      }
      MODULES.status = (MODULES.base === location.origin ? "no console attached here" : "no console at " + MODULES.base) + why;
    }
    renderModules();
  }

  window.lygoModules = { table: function () { return MODULES; }, call: moduleCall, reload: loadModules };
  probeLocalAccess().then(loadModules, loadModules);

  const worldLocal = document.getElementById("world-local");
  const worldUtc = document.getElementById("world-utc");
  function paintWorld() {
    const now = new Date();
    if (worldLocal) worldLocal.textContent = now.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (worldUtc) worldUtc.textContent = "UTC " + now.toISOString().slice(0, 19).replace("T", " ");
  }
  paintWorld();
  setInterval(paintWorld, 1000);

  // The city strip. #world-cities and the .wcity markup (.n name / .t time / .w note) have been in the
  // page and the stylesheet since the beginning with nothing writing into them, so the "World time"
  // band showed a local clock, UTC, and an empty row. Built here from the visitor's own clock: no API,
  // no key, nothing fetched, works offline. A zone this browser cannot do is left out rather than faked.
  const worldCities = document.getElementById("world-cities");
  if (worldCities) {
    const CITIES = [["Your time", null], ["Edmonton", "America/Edmonton"], ["Toronto", "America/Toronto"],
                    ["New York", "America/New_York"], ["London", "Europe/London"],
                    ["Berlin", "Europe/Berlin"], ["Tokyo", "Asia/Tokyo"]];
    function cityTime(tz, now) {
      const opt = tz ? { timeZone: tz, hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" };
      return new Intl.DateTimeFormat(undefined, opt).format(now);
    }
    function cityOffset(tz) {
      try {
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date());
        const name = parts.filter(function (p) { return p.type === "timeZoneName"; })[0];
        return name ? name.value.replace("GMT", "UTC") : "";
      } catch (e) { return ""; }
    }
    function cityDay(tz) {
      return new Intl.DateTimeFormat("en-CA", tz ? { timeZone: tz } : {}).format(new Date());
    }
    const chips = [];
    CITIES.forEach(function (row) {
      let time = "";
      try { time = cityTime(row[1], new Date()); } catch (e) { return; }
      const el = document.createElement("div");
      el.className = "wcity";
      el.title = row[1] ? row[0] + " — " + row[1] : "the clock this browser runs on";
      el.innerHTML = '<div class="n"></div><div class="t"></div><div class="w"></div>';
      el.children[0].textContent = row[0];
      el.children[1].textContent = time;
      el.children[2].textContent = row[1] ? cityOffset(row[1]) : "this browser";
      worldCities.appendChild(el);
      chips.push({ el: el, tz: row[1] });
    });
    function paintCities() {
      const now = new Date();
      const here = cityDay(null);
      chips.forEach(function (c) {
        try {
          c.el.children[1].textContent = cityTime(c.tz, now);
          if (!c.tz) return;
          const day = cityDay(c.tz);
          c.el.children[2].textContent = cityOffset(c.tz) + (day === here ? "" : (day > here ? " · next day" : " · previous day"));
        } catch (e) { /* leave what is there rather than blank it */ }
      });
    }
    paintCities();
    setInterval(paintCities, 30000);
  }
  document.querySelectorAll(".y").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
