const DEFAULT_SEARXNG_URL = "https://search.billfish-pirate.ts.net";
const SEARXNG_URL_KEY = "searxngUrl";

const ENGINE_ORDER = ["ddg", "google", "bing", "brave", "startpage"];
const ENGINE_LABELS = {
  ddg: "DuckDuckGo",
  google: "Google",
  bing: "Bing",
  brave: "Brave",
  startpage: "Startpage",
  searxng: "SearXNG",
};

const ENGINES = {
  searxng: {
    key: "searxng",
    label: "SearXNG",
    matches(host) {
      return host === this.baseHost();
    },
    baseHost() {
      try {
        return new URL(state.searxngUrl).hostname;
      } catch {
        return new URL(DEFAULT_SEARXNG_URL).hostname;
      }
    },
    searchUrl(q) {
      return `${state.searxngUrl}/search?q=${encodeURIComponent(q)}`;
    },
    extractQuery() {
      const u = new URL(location.href);
      if (u.pathname === "/search" && u.searchParams.has("q")) {
        return u.searchParams.get("q");
      }
      const input = document.querySelector("input#q, input[name='q']");
      return (input && input.value) || null;
    },
  },
  ddg: {
    key: "ddg",
    label: "DuckDuckGo",
    matches(host) {
      return host === "duckduckgo.com";
    },
    searchUrl(q) {
      return `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    },
    extractQuery() {
      const u = new URL(location.href);
      if (u.searchParams.has("q")) return u.searchParams.get("q");
      const input = document.querySelector("input[name='q'], input#search_form_input");
      return (input && input.value) || null;
    },
  },
  google: {
    key: "google",
    label: "Google",
    matches(host) {
      return host.endsWith(".google.com");
    },
    searchUrl(q) {
      return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    },
    extractQuery() {
      const u = new URL(location.href);
      if (u.searchParams.has("q")) return u.searchParams.get("q");
      const input = document.querySelector("input[name='q'], input[aria-label='Search'], input[type='search']");
      return (input && input.value) || null;
    },
  },
  bing: {
    key: "bing",
    label: "Bing",
    matches(host) {
      return host === "www.bing.com" || host === "bing.com";
    },
    searchUrl(q) {
      return `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    },
    extractQuery() {
      const u = new URL(location.href);
      if (u.searchParams.has("q")) return u.searchParams.get("q");
      const input = document.querySelector("input[name='q'], input#sb_form_q, input[type='search']");
      return (input && input.value) || null;
    },
  },
  brave: {
    key: "brave",
    label: "Brave",
    matches(host) {
      return host === "search.brave.com";
    },
    searchUrl(q) {
      return `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
    },
    extractQuery() {
      const u = new URL(location.href);
      if (u.searchParams.has("q")) return u.searchParams.get("q");
      const input = document.querySelector("input[name='q'], input#searchbox, input[type='search']");
      return (input && input.value) || null;
    },
  },
  startpage: {
    key: "startpage",
    label: "Startpage",
    matches(host) {
      return host === "www.startpage.com" || host === "startpage.com";
    },
    searchUrl(q) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}`;
    },
    extractQuery() {
      const u = new URL(location.href);
      if (u.searchParams.has("query")) return u.searchParams.get("query");
      const input = document.querySelector("input[name='query'], input#query, input[type='search']");
      return (input && input.value) || null;
    },
  },
};

const state = {
  searxngUrl: DEFAULT_SEARXNG_URL,
  currentEngineKey: null,
};

function getSearxngUrl() {
  return (state.searxngUrl || DEFAULT_SEARXNG_URL).replace(/\/+$/, "");
}

function detectCurrentEngine() {
  const host = location.hostname;
  for (const key of ["searxng", "ddg", "google", "bing", "brave", "startpage"]) {
    if (ENGINES[key].matches(host)) return key;
  }
  return null;
}

function detectFromUrlHeuristic() {
  const href = location.href;
  const host = location.hostname;
  const searxngHost = ENGINES.searxng.baseHost();
  if (host === searxngHost) return "searxng";
  if (host === "duckduckgo.com") return "ddg";
  if (host.endsWith(".google.com")) return "google";
  if (host === "www.bing.com" || host === "bing.com") return "bing";
  if (host === "search.brave.com") return "brave";
  if (host === "www.startpage.com" || host === "startpage.com") return "startpage";
  return null;
}

let menuTarget = null;
function buildMenu() {
  const current = state.currentEngineKey;
  const target = menuTarget;
  let entries = ENGINE_ORDER.filter((k) => k !== current && k !== target);
  if (current !== "searxng") {
    entries = entries.filter((k) => k !== "searxng");
    entries.unshift("searxng");
  }
  return entries;
}

let host;
let menuEl = null;

function create() {
  host = document.createElement("div");
  host.id = "searxng-switcher-host";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = STYLE + MARKUP;
  document.documentElement.appendChild(host);

  menuEl = root.querySelector("#sx-menu");

  root.querySelector("#sx-main").addEventListener("click", onMain);
  root.querySelector("#sx-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  root.querySelector("#sx-menu").addEventListener("click", (e) => {
    const item = e.target.closest(".sx-item");
    if (!item) return;
    const key = item.dataset.key;
    hideMenu();
    navigateTo(key);
  });
  document.addEventListener("click", hideMenu, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideMenu();
  });
  window.addEventListener("blur", hideMenu);
}

function onMain() {
  const target = menuTarget || buildMenu()[0];
  if (target) navigateTo(target);
}

function navigateTo(key) {
  const q = ENGINES[state.currentEngineKey]
    ? ENGINES[state.currentEngineKey].extractQuery()
    : null;
  const query = q || readVisibleQuery();
  if (!query) return;
  const url = ENGINES[key].searchUrl(query);
  location.href = url;
}

function readVisibleQuery() {
  const candidates = document.querySelectorAll(
    "input[type='search'], input[name='q'], input[name='query'], input#q, input#search_form_input, input#sb_form_q, input#searchbox"
  );
  for (const el of candidates) {
    if (el.offsetParent !== null && el.value) return el.value;
  }
  return null;
}

function toggleMenu() {
  if (menuEl.hasAttribute("open")) hideMenu();
  else showMenu();
}

function showMenu() {
  const entries = buildMenu();
  menuEl.innerHTML = "";
  for (const key of entries) {
    const li = document.createElement("div");
    li.className = "sx-item";
    li.dataset.key = key;
    li.textContent = ENGINE_LABELS[key];
    menuEl.appendChild(li);
  }
  menuEl.setAttribute("open", "");
}

function hideMenu() {
  if (menuEl) menuEl.removeAttribute("open");
}

function update() {
  state.currentEngineKey = detectCurrentEngine();
  const root = host.shadowRoot;
  if (!state.currentEngineKey) {
    host.style.display = "none";
    return;
  }
  const q = ENGINES[state.currentEngineKey].extractQuery() || readVisibleQuery();
  if (!q) {
    host.style.display = "none";
    return;
  }
  host.style.display = "block";
  const entries = buildMenu();
  menuTarget = entries[0] || null;
  root.querySelector("#sx-main-label").textContent = menuTarget ? ENGINE_LABELS[menuTarget] : "—";
}

let debounce;
function scheduleUpdate() {
  clearTimeout(debounce);
  debounce = setTimeout(update, 150);
}

const STYLE = `
<style>
  :host {
    all: initial;
  }
  #sx-widget {
    position: fixed;
    left: 16px;
    bottom: 16px;
    z-index: 2147483647;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: stretch;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    border-radius: 8px;
    overflow: visible;
    background: #1f2937;
  }
  #sx-main {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    color: #fff;
    background: #2563eb;
    border: none;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    white-space: nowrap;
  }
  #sx-main:hover { background: #1d4ed8; }
  #sx-main .sx-logo { font-size: 16px; }
  #sx-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    color: #fff;
    background: #1f2937;
    border: none;
    border-left: 1px solid rgba(255,255,255,0.18);
    cursor: pointer;
    font: inherit;
  }
  #sx-toggle:hover { background: #374151; }
  #sx-toggle .sx-arrow {
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 6px solid #fff;
    margin-top: -2px;
  }
  #sx-menu {
    position: absolute;
    left: 0;
    bottom: calc(100% + 6px);
    min-width: 160px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    overflow: hidden;
    display: none;
    flex-direction: column;
  }
  #sx-menu[open] { display: flex; }
  .sx-item {
    padding: 9px 14px;
    color: #1f2937;
    cursor: pointer;
    white-space: nowrap;
  }
  .sx-item:hover { background: #eef2ff; color: #2563eb; }
</style>
`;

const MARKUP = `
<div id="sx-widget">
  <button id="sx-main" type="button">
    <span class="sx-logo">🔍</span>
    <span id="sx-main-label">—</span>
  </button>
  <button id="sx-toggle" type="button" aria-label="Weitere Suchmaschinen">
    <span class="sx-arrow"></span>
  </button>
  <div id="sx-menu" role="menu"></div>
</div>
`;

async function init() {
  try {
    const res = await browser.storage.sync.get(SEARXNG_URL_KEY);
    state.searxngUrl = res[SEARXNG_URL_KEY] || DEFAULT_SEARXNG_URL;
  } catch {
    state.searxngUrl = DEFAULT_SEARXNG_URL;
  }
  create();
  update();
  setInterval(scheduleUpdate, 1000);
  window.addEventListener("popstate", scheduleUpdate);
  if (document.body) {
    new MutationObserver(scheduleUpdate).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["value"],
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
