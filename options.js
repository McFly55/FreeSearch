const DEFAULT_SEARXNG_URL = "https://search.billfish-pirate.ts.net";
const SEARXNG_URL_KEY = "searxngUrl";

const urlInput = document.getElementById("searxng-url");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

browser.storage.sync.get(SEARXNG_URL_KEY).then((res) => {
  urlInput.value = res[SEARXNG_URL_KEY] || DEFAULT_SEARXNG_URL;
});

saveBtn.addEventListener("click", () => {
  let value = urlInput.value.trim().replace(/\/+$/, "");
  if (!value) value = DEFAULT_SEARXNG_URL;
  browser.storage.sync.set({ [SEARXNG_URL_KEY]: value }).then(() => {
    status.textContent = "Gespeichert.";
    setTimeout(() => (status.textContent = ""), 2500);
  });
});
