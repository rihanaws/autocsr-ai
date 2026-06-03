import type { Session } from "./schema";

function cdata(text: string): string {
  // Escape ]]> sequences that would break CDATA
  return `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function attr(key: string, value: string | undefined): string {
  if (!value) return "";
  return ` ${key}="${value.replace(/"/g, "&quot;")}"`;
}

export function sessionToXml(session: Session): string {
  const ctx = session.context;
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<session id="${session.id}" tenantId="${session.tenantId}"` +
      ` startedAt="${new Date(session.startedAt).toISOString()}"` +
      (session.endedAt ? ` endedAt="${new Date(session.endedAt).toISOString()}"` : "") +
      ` resolved="${session.resolved}">`
  );

  lines.push("  <context");
  if (ctx.ticketId) lines.push(`    ticketId="${ctx.ticketId}"`);
  if (ctx.agentName) lines.push(`    agentName="${ctx.agentName}"`);
  if (ctx.customerRef) lines.push(`    customerRef="${ctx.customerRef}"`);
  lines.push(`    extractedAt="${new Date(ctx.extractedAt).toISOString()}">`);

  lines.push("    <messages>");
  for (const msg of ctx.messages) {
    const ts = new Date(msg.timestamp).toISOString();
    lines.push(`      <message role="${msg.role}" timestamp="${ts}">`);
    lines.push(`        <content>${cdata(msg.content)}</content>`);

    if (msg.attachments?.length) {
      lines.push("        <attachments>");
      for (const att of msg.attachments) {
        const hrefAttr = attr("href", att.href);
        lines.push(`          <attachment type="${att.type}" name="${att.name}"${hrefAttr}>`);
        if (att.dataUrl) {
          lines.push(`            <dataUrl>${cdata(att.dataUrl)}</dataUrl>`);
        }
        lines.push("          </attachment>");
      }
      lines.push("        </attachments>");
    }

    lines.push("      </message>");
  }
  lines.push("    </messages>");

  lines.push("  </context>");
  lines.push("</session>");

  return lines.join("\n");
}
