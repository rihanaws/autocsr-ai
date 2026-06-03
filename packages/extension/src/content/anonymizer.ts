import type { ChatMessage } from "../lib/schema";

// Strip PII: emails, account IDs, names, phone numbers. Keep amount ranges.

const PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi, "[EMAIL]"],
  [/\b\d{10,16}\b/g, "[ACCOUNT_ID]"],
  [/\+?[\d\s\-().]{9,15}/g, "[PHONE]"],
  [/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[NAME]"],
];

function anonymizeText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function anonymizeSession(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((msg) => ({
    ...msg,
    content: anonymizeText(msg.content),
  }));
}
