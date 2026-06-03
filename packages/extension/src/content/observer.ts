// MutationObserver on role="log" — wires extractor + anonymizer + vault.
// Stub: full implementation in Week 1 Day 3-5.

import { extractMessages } from "./extractor";
import { anonymizeSession } from "./anonymizer";
import { encrypt } from "../crypto/vault";

let observer: MutationObserver | null = null;

function findLogRoot(): Element | null {
  return (
    document.querySelector('[role="log"]') ??
    document.querySelector('[aria-label*="conversation"]') ??
    null
  );
}

export function startObserver(): void {
  const root = findLogRoot();
  if (!root) return;

  observer = new MutationObserver(async () => {
    const messages = extractMessages();
    const anonymized = anonymizeSession(messages);
    const payload = JSON.stringify(anonymized);
    await encrypt(payload);
  });

  observer.observe(root, { childList: true, subtree: true });
}

export function stopObserver(): void {
  observer?.disconnect();
  observer = null;
}

if (document.readyState === "complete") {
  startObserver();
} else {
  window.addEventListener("load", startObserver);
}
