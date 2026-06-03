const statusEl = document.getElementById("status")!;

document.getElementById("start")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SESSION_START" });
  statusEl.textContent = "Status: recording";
});

document.getElementById("stop")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SESSION_END" });
  statusEl.textContent = "Status: stopped";
});

document.getElementById("export")?.addEventListener("click", async () => {
  const data = await chrome.storage.local.get("autocsr_session");
  if (!data.autocsr_session) {
    statusEl.textContent = "No session data";
    return;
  }
  const blob = new Blob([JSON.stringify(data.autocsr_session)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({ url, filename: `autocsr-session-${Date.now()}.enc.json` });
  statusEl.textContent = "Exported";
});
