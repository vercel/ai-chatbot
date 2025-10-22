import type { AuditItem, Doc, Message, Twin, User } from "./types";

export const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome! I'm Glen AI, a digital twin that reflects Glen Tullman's leadership voice, strategic priorities, and decades of healthcare innovation experience. I'm here to help you understand his philosophy on healthcare transformation, entrepreneurship, and building outcome-driven solutions. Feel free to ask me anything about healthcare strategy, leadership principles, or the future of health technology.",
  },
];

export const MEMORY_ITEMS = [
  "Strategic partnerships focus for Q4",
  "Health outcomes → cost savings narrative",
  "AI twin demo narrative for conference",
] as const;

export const ABOUT_TEXT = `Glen AI reflects Glen Tullman's leadership voice and priorities, grounded in curated materials and governed access.

This is a design prototype for alignment. Not a production system.`;

// Mock response generator
export function generateMockResponse(_userMessage: string): string {
  const responses = [
    "That's an excellent question. In my experience, the key is to focus on outcomes rather than just cost reduction.",
    "I'd approach this by first understanding the strategic priorities and then aligning resources accordingly.",
    "Health outcomes should always be the north star. When we optimize for that, cost savings naturally follow.",
    "Let me share a perspective from our work at Transcarent...",
    "The future of healthcare is about making the system work for people, not the other way around.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// CMS mock data
export const APPROVED_DOCS: Doc[] = [
  {
    id: "d1",
    title: "Leadership Principles",
    source: "Family Office",
    updated: "2025-10-01",
    status: "Live",
  },
  {
    id: "d2",
    title: "Letter to Investors — 2024",
    source: "PDF",
    updated: "2025-07-15",
    status: "Live",
  },
  {
    id: "d3",
    title: "Transcarent Mission Statement",
    source: "Internal Docs",
    updated: "2025-09-12",
    status: "Live",
  },
];

export const PENDING_DOCS: Doc[] = [
  {
    id: "p1",
    title: "Health Outcomes Strategy Interview",
    source: "YouTube",
    discovered: "2025-09-21",
    status: "Pending",
  },
  {
    id: "p2",
    title: "Forbes Feature on Transcarent",
    source: "Web",
    discovered: "2025-09-14",
    status: "Pending",
  },
  {
    id: "p3",
    title: "HLTH Conference Keynote 2024",
    source: "Video",
    discovered: "2025-08-30",
    status: "Pending",
  },
];

export const AUDIT_TRAIL: AuditItem[] = [
  {
    id: "a1",
    timestamp: "2025-10-18 09:42",
    actor: "Zach M.",
    action: "Approved",
    target: "Leadership Principles",
  },
  {
    id: "a2",
    timestamp: "2025-10-17 15:10",
    actor: "Natalie M.",
    action: "Edited title",
    target: "Letter to Investors — 2024",
  },
  {
    id: "a3",
    timestamp: "2025-10-15 11:23",
    actor: "Zach M.",
    action: "Rejected",
    target: "Outdated Healthcare Policy Brief",
  },
];

export const USERS: User[] = [
  {
    id: "u1",
    name: "Zach M.",
    email: "zach@example.com",
    platformRole: "platform_admin",
    lastActive: "2h ago",
    twinAssignments: ["t1"], // Has platform admin + assigned to Glen AI
  },
  {
    id: "u2",
    name: "Natalie M.",
    email: "natalie@example.com",
    platformRole: "user",
    lastActive: "Yesterday",
    twinAssignments: ["t1"], // Only has access to Glen AI
  },
  {
    id: "u3",
    name: "Andrew W.",
    email: "andrew@example.com",
    platformRole: "user",
    lastActive: "Just now",
    twinAssignments: [], // No twin access yet
  },
  {
    id: "u4",
    name: "Sarah K.",
    email: "sarah@example.com",
    platformRole: "user",
    lastActive: "1 week ago",
    twinAssignments: ["t1"], // Has access to Glen AI
  },
];

// Twins
export const TWINS: Twin[] = [
  {
    id: "t1",
    name: "Glen AI",
    status: "active",
    description: "Glen Tullman's leadership voice and strategic priorities",
    createdAt: "2025-09-01",
  },
];
