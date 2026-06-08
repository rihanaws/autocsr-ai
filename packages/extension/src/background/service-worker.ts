chrome.runtime.onInstalled.addListener(() => {
  // Extension installed — waiting for tenant configuration
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SESSION_START") {
    chrome.storage.session
      .set({ autocsr_tenant_id: message.tenantId, autocsr_active: true })
      .then(() => sendResponse({ ok: true }))
    return true
  }
  if (message.type === "SESSION_END") {
    chrome.storage.session
      .set({ autocsr_active: false })
      .then(() => sendResponse({ ok: true }))
    return true
  }
  if (message.type === "SESSION_SNAPSHOT") {
    chrome.action.setBadgeText({
      text:  String(message.messageCount),
      tabId: _sender.tab?.id,
    })
    chrome.action.setBadgeBackgroundColor({ color: "#4f46e5" })
    sendResponse({ ok: true })
    return false
  }
  if (message.type === "GET_TENANT_ID") {
    chrome.storage.session
      .get("autocsr_tenant_id")
      .then(data => sendResponse({ tenantId: data.autocsr_tenant_id ?? null }))
    return true
  }
  return false
})
