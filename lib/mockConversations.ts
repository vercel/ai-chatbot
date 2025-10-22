import type { Message } from "./types";

// Mock conversations for demo - in real app would come from DB
export const mockConversations: Record<string, Message[]> = {
  "1": [
    {
      id: "1-initial",
      role: "assistant",
      content: "Welcome! I'm Glen AI, a digital twin that reflects Glen Tullman's leadership voice, strategic priorities, and decades of healthcare innovation experience. I'm here to help you understand his philosophy on healthcare transformation, entrepreneurship, and building outcome-driven solutions. Feel free to ask me anything about healthcare strategy, leadership principles, or the future of health technology.",
    },
    {
      id: "1-user",
      role: "user",
      content: "Tell me about your healthcare philosophy",
    },
    {
      id: "1-response",
      role: "assistant",
      content: "Healthcare should work for people, not systems. My philosophy is simple: lower costs, better outcomes, less friction. Every decision should make care more accessible, more transparent, and more human. At Livongo and now Transcarent, we've proven that when you put the patient first—truly first—everyone wins. Employers save money, people get healthier, and clinicians can focus on care instead of paperwork.",
    },
  ],
  "2": [
    {
      id: "2-initial",
      role: "assistant",
      content: "Welcome! I'm Glen AI, a digital twin that reflects Glen Tullman's leadership voice, strategic priorities, and decades of healthcare innovation experience. I'm here to help you understand his philosophy on healthcare transformation, entrepreneurship, and building outcome-driven solutions. Feel free to ask me anything about healthcare strategy, leadership principles, or the future of health technology.",
    },
    {
      id: "2-user",
      role: "user",
      content: "What are your priorities for 2025?",
    },
    {
      id: "2-response",
      role: "assistant",
      content: "For 2025, we're focused on three things at Transcarent: scaling our Surgery and Cancer Centers of Excellence, proving AI can deliver personalized care at scale, and expanding employer partnerships that share our mission. The healthcare system is broken, but we're building the alternative. We're not waiting for permission—we're shipping solutions people can use today.",
    },
  ],
  "3": [
    {
      id: "3-initial",
      role: "assistant",
      content: "Welcome! I'm Glen AI, a digital twin that reflects Glen Tullman's leadership voice, strategic priorities, and decades of healthcare innovation experience. I'm here to help you understand his philosophy on healthcare transformation, entrepreneurship, and building outcome-driven solutions. Feel free to ask me anything about healthcare strategy, leadership principles, or the future of health technology.",
    },
    {
      id: "3-user",
      role: "user",
      content: "What's your biggest leadership lesson?",
    },
    {
      id: "3-response",
      role: "assistant",
      content: "Here's what I've learned after decades in healthcare: spotlight effort publicly, remove one blocker daily, and ship small wins weekly. Leaders who do this consistently build unstoppable teams. It's not flashy, but it works. Every time.",
    },
  ],
};
