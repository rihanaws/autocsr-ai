import type { Attachment } from "../lib/schema";

export async function captureImages(): Promise<Attachment[]> {
  const attachments: Attachment[] = [];

  // Capture <img> elements inside chat log via canvas
  const logEl =
    document.querySelector('[role="log"]') ??
    document.querySelector('[aria-label*="conversation"]');

  const imgs = logEl
    ? logEl.querySelectorAll("img[src]")
    : document.querySelectorAll('[role="log"] img[src]');

  for (const img of imgs) {
    const el = img as HTMLImageElement;
    if (!el.src || el.width === 0 || el.height === 0) continue;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = el.naturalWidth || el.width;
      canvas.height = el.naturalHeight || el.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(el, 0, 0);
      attachments.push({
        type: "image",
        name: el.alt || el.src.split("/").pop() || "image",
        dataUrl: canvas.toDataURL("image/webp", 0.8),
      });
    } catch {
      // Cross-origin image — log href instead
      attachments.push({
        type: "image",
        name: el.alt || "image",
        href: el.src,
      });
    }
  }

  // Log file attachment hrefs (data-testid, aria-label patterns for LiveAgent)
  const fileLinks = document.querySelectorAll(
    '[data-testid*="attachment"] a[href], [aria-label*="attachment"] a[href], a[download]'
  );
  for (const link of fileLinks) {
    const a = link as HTMLAnchorElement;
    attachments.push({
      type: "file",
      name: a.download || a.textContent?.trim() || a.href.split("/").pop() || "file",
      href: a.href,
    });
  }

  return attachments;
}
