import type { ChatMessage } from "../lib/schema";

// Strategy order: ARIA roles first, data-attributes second, fallback last.
// ZERO CSS class selectors — per project rules.

function parseMessageEl(el: Element): ChatMessage | null {
  const role = el.getAttribute("aria-label")?.toLowerCase().includes("agent")
    ? "agent"
    : "customer";
  const content = el.textContent?.trim() ?? "";
  if (!content) return null;

  const timeEl = el.querySelector("time");
  const timestamp = timeEl?.getAttribute("datetime")
    ? new Date(timeEl.getAttribute("datetime")!).getTime()
    : Date.now();

  return { role, content, timestamp };
}

export function extractMessages(): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Strategy 1: role="article" inside role="log"
  const logEl = document.querySelector('[role="log"]');
  if (logEl) {
    const articles = logEl.querySelectorAll('[role="article"]');
    if (articles.length > 0) {
      articles.forEach((el) => {
        const msg = parseMessageEl(el);
        if (msg) messages.push(msg);
      });
      return messages;
    }
  }

  // Strategy 2: data-testid containing "message"
  const testIdEls = document.querySelectorAll('[data-testid*="message"]');
  if (testIdEls.length > 0) {
    testIdEls.forEach((el) => {
      const msg = parseMessageEl(el);
      if (msg) messages.push(msg);
    });
    return messages;
  }

  // Strategy 3: aria-label containing "message"
  const ariaEls = document.querySelectorAll('[aria-label*="message"]');
  if (ariaEls.length > 0) {
    ariaEls.forEach((el) => {
      const msg = parseMessageEl(el);
      if (msg) messages.push(msg);
    });
    return messages;
  }

  // Strategy 4: time-stamped <p> fallback
  document.querySelectorAll("p").forEach((el) => {
    const hasSibling = el.previousElementSibling?.tagName === "TIME" ||
      el.nextElementSibling?.tagName === "TIME";
    if (hasSibling) {
      const msg = parseMessageEl(el);
      if (msg) messages.push(msg);
    }
  });

  return messages;
}
