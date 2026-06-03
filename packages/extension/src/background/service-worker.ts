// Session lifecycle management. Relays messages between content scripts and popup.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[AutoCSR] Extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SESSION_START") {
    sendResponse({ ok: true });
  }
  if (message.type === "SESSION_END") {
    sendResponse({ ok: true });
  }
  return true;
});
