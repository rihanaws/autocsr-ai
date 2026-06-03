export interface ChatMessage {
  role: "agent" | "customer";
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Attachment {
  type: "image" | "file";
  name: string;
  dataUrl?: string;
  href?: string;
}

export interface ExtractedContext {
  ticketId?: string;
  agentName?: string;
  customerRef?: string;
  messages: ChatMessage[];
  extractedAt: number;
}

export interface Session {
  id: string;
  tenantId: string;
  startedAt: number;
  endedAt?: number;
  resolved: boolean;
  context: ExtractedContext;
  encrypted: boolean;
}
