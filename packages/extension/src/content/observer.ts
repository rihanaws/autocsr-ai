import { extractMessages } from "./extractor";
import { anonymizeSession } from "./anonymizer";
import { captureImages } from "./media-capture";
import { encrypt } from "../crypto/vault";
import type { Session, ExtractedContext } from "../lib/schema";

let observer: MutationObserver | null = null;
let sessionId: string | null = null;

function findLogRoot(): Element | null {
  return (
    document.querySelector('[role="log"]') ??
    document.querySelector('[aria-label*="conversation"]') ??
    null
  );
}

async function snapshot(): Promise<void> {
  if (!sessionId) return;

  const rawMessages = extractMessages();
  const anonymized = anonymizeSession(rawMessages);
  const attachments = await captureImages();

  // Merge attachments into last message if any found
  if (attachments.length > 0 && anonymized.length > 0) {
    const last = anonymized[anonymized.length - 1];
    last.attachments = [...(last.attachments ?? []), ...attachments];
  }

  const context: ExtractedContext = {
    ticketId: getTicketId(),
    agentName: getAgentName(),
    messages: anonymized,
    extractedAt: Date.now(),
  };

  const session: Session = {
    id: sessionId,
    tenantId: getTenantId(),
    startedAt: sessionStartedAt,
    resolved: false,
    context,
    encrypted: true,
  };

  const payload = JSON.stringify(session);
  const encryptedPayload = await encrypt(payload);
  await chrome.storage.local.set({ autocsr_session: encryptedPayload });
  chrome.runtime.sendMessage({ type: "SESSION_SNAPSHOT", messageCount: anonymized.length });
}

function getTicketId(): string | undefined {
  const el =
    document.querySelector('[data-testid*="ticket-id"]') ??
    document.querySelector('[aria-label*="ticket"]');
  return el?.textContent?.trim() ?? undefined;
}

function getAgentName(): string | undefined {
  const el =
    document.querySelector('[data-testid*="agent-name"]') ??
    document.querySelector('[aria-label*="agent"]');
  return el?.textContent?.trim() ?? undefined;
}

function getTenantId(): string {
  // Injected by background service-worker at session start via chrome.storage.session
  return (window as unknown as Record<string, string>).__AUTOCSR_TENANT_ID__ ?? "unknown";
}

let sessionStartedAt = Date.now();

export function startObserver(): void {
  const root = findLogRoot();
  if (!root || observer) return;

  sessionId = crypto.randomUUID();
  sessionStartedAt = Date.now();

  observer = new MutationObserver(() => {
    snapshot().catch(console.error);
  });

  observer.observe(root, { childList: true, subtree: true });
  snapshot().catch(console.error);
}

export function stopObserver(): void {
  observer?.disconnect();
  observer = null;
  sessionId = null;
}

if (document.readyState === "complete") {
  startObserver();
} else {
  window.addEventListener("load", startObserver);
}
