import { sessionToXml } from "../lib/xml-formatter";
import { decrypt } from "../crypto/vault";
import type { Session } from "../lib/schema";

const statusEl = document.getElementById("status")!;
const statsEl = document.getElementById("stats")!;

async function refreshStats(): Promise<void> {
  const data = await chrome.storage.local.get("autocsr_session");
  if (!data.autocsr_session) {
    statsEl.textContent = "No active session";
    return;
  }
  try {
    const raw = await decrypt(data.autocsr_session as string);
    const session: Session = JSON.parse(raw);
    const count = session.context.messages.length;
    statsEl.textContent = `${count} message${count !== 1 ? "s" : ""} captured`;
  } catch {
    statsEl.textContent = "Encrypted session active";
  }
}

document.getElementById("start")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SESSION_START" });
  statusEl.textContent = "Status: recording";
  statsEl.textContent = "0 messages captured";
});

document.getElementById("stop")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SESSION_END" });
  statusEl.textContent = "Status: stopped";
  await refreshStats();
});

document.getElementById("export-xml")?.addEventListener("click", async () => {
  const data = await chrome.storage.local.get("autocsr_session");
  if (!data.autocsr_session) {
    statusEl.textContent = "No session data";
    return;
  }
  try {
    const raw = await decrypt(data.autocsr_session as string);
    const session: Session = JSON.parse(raw);
    const xml = sessionToXml(session);
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({
      url,
      filename: `autocsr-session-${session.id}.xml`,
    });
    statusEl.textContent = "Exported XML";
  } catch {
    statusEl.textContent = "Export failed — decrypt error";
  }
});

document.getElementById("export-enc")?.addEventListener("click", async () => {
  const data = await chrome.storage.local.get("autocsr_session");
  if (!data.autocsr_session) {
    statusEl.textContent = "No session data";
    return;
  }
  const blob = new Blob([JSON.stringify(data.autocsr_session)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({
    url,
    filename: `autocsr-session-${Date.now()}.enc.json`,
  });
  statusEl.textContent = "Exported encrypted";
});

async function checkSetup() {
  const data = await chrome.storage.session.get("autocsr_tenant_id")
  if (!data.autocsr_tenant_id) {
    document.getElementById("setup-section")!.style.display = "block"
  }
}

document.getElementById("save-tenant")?.addEventListener("click", async () => {
  const input = (document.getElementById("tenant-input") as HTMLInputElement).value.trim()
  if (!input) return
  await chrome.runtime.sendMessage({ type: "SESSION_START", tenantId: input })
  document.getElementById("setup-section")!.style.display = "none"
  document.getElementById("status")!.textContent = `Active — tenant …${input.slice(-8)}`
})

// Poll stats while popup is open
refreshStats();
checkSetup();
const interval = setInterval(refreshStats, 2000);
window.addEventListener("unload", () => clearInterval(interval));
