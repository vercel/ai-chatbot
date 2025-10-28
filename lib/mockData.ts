import type {
  AuditItem,
  DiscoveredItem,
  Doc,
  KnowledgeItem,
  Message,
  Source,
  Twin,
  User,
} from "./types";

export const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome! I'm Glen AI, reflecting Glen Tullman's leadership voice, strategic priorities, and decades of healthcare innovation experience. I'm here to help you understand his philosophy on healthcare transformation, entrepreneurship, and building outcome-driven solutions. Feel free to ask me anything about healthcare strategy, leadership principles, or the future of health technology.",
  },
];

export const MEMORY_ITEMS = [
  "Strategic partnerships focus for Q4",
  "Health outcomes → cost savings narrative",
  "Glen AI demo narrative for conference",
] as const;

export const ABOUT_TEXT = `Glen AI reflects Glen Tullman's leadership voice and priorities, grounded in curated materials and governed access.

This is a prototype experience for alignment. Not a production system.`;

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
    contentType: "doc",
    description:
      "Core leadership principles and values that guide decision-making and organizational culture. Covers topics including outcome-focused thinking, strategic partnerships, and building trust through transparency.",
    url: "https://example.com/leadership-principles.pdf",
    fileSize: "1.2 MB",
    author: "Glen Tullman",
    publishedDate: "2025-01-15",
  },
  {
    id: "d2",
    title: "Letter to Investors — 2024",
    source: "PDF",
    updated: "2025-07-15",
    status: "Live",
    contentType: "pdf",
    description:
      "Annual letter outlining strategic vision, market opportunities, and key achievements. Discusses the healthcare transformation landscape and Transcarent's position in driving meaningful change.",
    url: "https://example.com/investor-letter-2024.pdf",
    fileSize: "2.5 MB",
    author: "Glen Tullman",
    publishedDate: "2024-12-15",
  },
  {
    id: "d3",
    title: "Transcarent Mission Statement",
    source: "Internal Docs",
    updated: "2025-09-12",
    status: "Live",
    contentType: "doc",
    description:
      "Company mission and vision statement emphasizing the commitment to making healthcare work for all people. Outlines core values and strategic objectives.",
    fileSize: "450 KB",
    publishedDate: "2023-03-01",
  },
];

export const PENDING_DOCS: Doc[] = [
  {
    id: "p1",
    title: "Health Outcomes Strategy Interview",
    source: "YouTube",
    discovered: "2025-09-21",
    status: "Pending",
    contentType: "video",
    description:
      "In-depth interview discussing strategies for improving health outcomes while reducing costs. Glen shares insights on leveraging technology and data to drive better patient experiences.",
    url: "https://www.youtube.com/watch?v=example",
    duration: "42:15",
    thumbnailUrl: "https://img.youtube.com/vi/example/maxresdefault.jpg",
    author: "Glen Tullman",
    publishedDate: "2025-09-15",
  },
  {
    id: "p2",
    title: "Forbes Feature on Transcarent",
    source: "Web",
    discovered: "2025-09-14",
    status: "Pending",
    contentType: "website",
    description:
      "Feature article exploring Transcarent's innovative approach to healthcare delivery and the vision behind making healthcare accessible and affordable for everyone.",
    url: "https://www.forbes.com/sites/healthcare/transcarent-feature",
    thumbnailUrl:
      "https://imageio.forbes.com/specials-images/imageserve/example/960x0.jpg",
    author: "Forbes Staff",
    publishedDate: "2025-09-10",
  },
  {
    id: "p3",
    title: "HLTH Conference Keynote 2024",
    source: "Video",
    discovered: "2025-08-30",
    status: "Pending",
    contentType: "video",
    description:
      "Keynote presentation from HLTH 2024 conference discussing the future of digital health, AI in healthcare, and the importance of patient-centered care models.",
    url: "https://example.com/hlth-2024-keynote.mp4",
    duration: "58:30",
    fileSize: "850 MB",
    author: "Glen Tullman",
    publishedDate: "2024-11-15",
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
    role: "admin",
    lastActive: "2h ago",
  },
  {
    id: "u2",
    name: "Natalie M.",
    email: "natalie@example.com",
    role: "viewer",
    lastActive: "Yesterday",
  },
  {
    id: "u3",
    name: "Andrew W.",
    email: "andrew@example.com",
    role: "viewer",
    lastActive: "Just now",
  },
  {
    id: "u4",
    name: "Sarah K.",
    email: "sarah@example.com",
    role: "admin",
    lastActive: "1 week ago",
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

// Discovery
export const MOCK_SOURCES: Source[] = [
  {
    id: "s1",
    name: "Glen's LinkedIn Activity",
    url: "https://linkedin.com/in/glentullman/recent-activity",
    type: "linkedin",
    frequency: "12h",
    lastScanned: "2 hours ago",
    enabled: true,
    description: "Glen's LinkedIn posts and activity",
    scanStatus: "success",
    itemsFound: 3,
    nextScheduledScan: "2025-10-27T14:00:00",
  },
  {
    id: "s2",
    name: "Transcarent Blog - Glen's Posts",
    url: "https://transcarent.com/blog/author/glen-tullman/rss",
    type: "rss",
    frequency: "24h",
    lastScanned: "12 hours ago",
    enabled: true,
    description: "RSS feed of Glen's blog posts",
    scanStatus: "success",
    itemsFound: 1,
    nextScheduledScan: "2025-10-28T00:00:00",
  },
  {
    id: "s3",
    name: "WSJ - Glen Tullman Articles",
    url: "https://wsj.com/news/author/glen-tullman",
    type: "news",
    frequency: "24h",
    lastScanned: "5 days ago",
    enabled: false,
    description: "News articles by or about Glen",
    scanStatus: "idle",
    itemsFound: 0,
    nextScheduledScan: undefined,
  },
  {
    id: "s4",
    name: "Healthcare Podcast Network",
    url: "https://healthcarepodcasts.com/rss/glen-tullman",
    type: "podcast",
    frequency: "weekly",
    lastScanned: "4 days ago",
    enabled: true,
    description: "Healthcare industry podcasts featuring Glen",
    scanStatus: "success",
    itemsFound: 1,
    nextScheduledScan: "2025-10-30T14:15:00",
  },
  {
    id: "s5",
    name: "Transcarent Press Releases",
    url: "https://transcarent.com/newsroom/press-releases/rss",
    type: "press",
    frequency: "48h",
    lastScanned: "1 day ago",
    enabled: true,
    description: "Official press releases and announcements",
    scanStatus: "success",
    itemsFound: 2,
    nextScheduledScan: "2025-10-28T12:00:00",
  },
  {
    id: "s6",
    name: "Transcarent YouTube Channel",
    url: "https://www.youtube.com/@transcarent/videos",
    type: "youtube",
    frequency: "24h",
    lastScanned: "6 hours ago",
    enabled: true,
    description: "Official company videos and presentations",
    scanStatus: "success",
    itemsFound: 2,
    nextScheduledScan: "2025-10-27T18:45:00",
  },
];

export const MOCK_DISCOVERIES: DiscoveredItem[] = [
  {
    id: "disc1",
    sourceId: "s1",
    sourceName: "Glen Tullman on LinkedIn",
    title: "The Future of Healthcare: AI and Patient Outcomes",
    url: "https://www.linkedin.com/posts/glentullman_healthcare-ai-outcomes-example",
    discoveredAt: "2025-10-25 14:30",
    contentType: "website",
    description:
      "Detailed post discussing how AI can transform healthcare delivery while maintaining focus on patient outcomes. Explores the intersection of technology and personalized care.",
    author: "Glen Tullman",
    publishedDate: "2025-10-25",
    discoveryMethod: "automatic_scan",
  },
  {
    id: "disc2",
    sourceId: "s4",
    sourceName: "Transcarent YouTube Channel",
    title: "Q4 2025 Healthcare Innovation Summit Keynote",
    url: "https://www.youtube.com/watch?v=example123",
    discoveredAt: "2025-10-24 09:15",
    contentType: "video",
    description:
      "Keynote presentation covering innovation in healthcare technology, focusing on transparency, accessibility, and the role of digital health platforms in modernizing care delivery.",
    thumbnailUrl: "https://img.youtube.com/vi/example123/maxresdefault.jpg",
    author: "Glen Tullman",
    publishedDate: "2025-10-20",
    discoveryMethod: "automatic_scan",
  },
  {
    id: "disc3",
    sourceId: "s3",
    sourceName: "Healthcare Podcast Network",
    title: "Ep 142: Building Healthcare Companies That Matter",
    url: "https://healthcarepodcasts.com/episodes/142",
    discoveredAt: "2025-10-23 16:45",
    contentType: "podcast",
    description:
      "Interview discussing the journey of building impactful healthcare companies, lessons learned from previous ventures, and advice for healthcare entrepreneurs.",
    author: "Healthcare Podcast Network",
    publishedDate: "2025-10-22",
    discoveryMethod: "rss_feed",
  },
  {
    id: "disc4",
    sourceId: "s2",
    sourceName: "Transcarent Blog",
    title: "Why Healthcare Transparency Matters More Than Ever",
    url: "https://transcarent.com/blog/healthcare-transparency-2025",
    discoveredAt: "2025-10-22 11:20",
    contentType: "website",
    description:
      "Blog post exploring the critical importance of transparency in healthcare delivery and how it drives better outcomes and lower costs for patients and employers.",
    author: "Glen Tullman",
    publishedDate: "2025-10-18",
    discoveryMethod: "rss_feed",
  },
  {
    id: "disc5",
    sourceId: "s1",
    sourceName: "Glen Tullman on LinkedIn",
    title: "Leadership Lessons from 30 Years in Healthcare",
    url: "https://www.linkedin.com/posts/glentullman_leadership-healthcare-innovation",
    discoveredAt: "2025-10-21 08:15",
    contentType: "website",
    description:
      "Reflections on three decades of building healthcare companies and the key principles that have guided success through changing market conditions.",
    author: "Glen Tullman",
    publishedDate: "2025-10-20",
    discoveryMethod: "automatic_scan",
  },
];
