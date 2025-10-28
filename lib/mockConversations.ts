import type { Message } from "./types";

// Mock conversations for demo - in real app would come from DB
export const mockConversations: Record<string, Message[]> = {
  "1": [
    {
      id: "1-user-1",
      role: "user",
      content: "I'm preparing for a board presentation on our Q4 strategy. What should I focus on when talking about healthcare partnerships?",
    },
    {
      id: "1-assistant-1",
      role: "assistant",
      content: "Focus on three things: outcomes, scale, and urgency. Board members want to know you're solving real problems, not theoretical ones. Lead with the health outcomes you're driving—actual patient impact. Then show how you'll scale those outcomes to reach more people. Finally, explain why now matters. Healthcare moves slowly, but the companies that win are the ones that move decisively while others are still in planning mode.",
    },
    {
      id: "1-user-2",
      role: "user",
      content: "How do I make the case for investing in strategic partnerships versus building everything in-house?",
    },
    {
      id: "1-assistant-2",
      role: "assistant",
      content: "Smart partnerships accelerate time to market and let you focus on what you do best. At Livongo, we didn't try to be the best at everything—we partnered with the best. Build where you have unfair advantage, partner where others have proven expertise. The question isn't whether to partner, it's who to partner with and how to structure it so everyone wins. Show your board the math: partnerships can get you 18 months ahead while letting your team stay focused on core innovation.",
    },
    {
      id: "1-user-3",
      role: "user",
      content: "What metrics should I highlight to show partnership success?",
    },
    {
      id: "1-assistant-3",
      role: "assistant",
      content: "Start with health outcomes—reduced hospitalizations, better chronic disease management, medication adherence. Then show the cost impact: healthcare dollars saved per member. Finally, engagement metrics: are people actually using what you built? A partnership that doesn't drive engagement isn't a partnership, it's a press release. Show the board real numbers from real people, not projections.",
    },
  ],
  "2": [
    {
      id: "2-user-1",
      role: "user",
      content: "We're pitching to potential enterprise clients. How should we frame the value proposition around health outcomes leading to cost savings?",
    },
    {
      id: "2-assistant-1",
      role: "assistant",
      content: "Lead with outcomes, close with costs. Nobody wants to hear \"we'll save you money\" first—they've heard that a thousand times. Start with the health problem you solve: \"We helped 10,000 diabetics reduce their A1C by an average of 1.2 points in 90 days.\" That's real. That's credible. Then connect it to cost: \"That translates to 40% fewer ER visits and $2,400 saved per member annually.\" Health outcomes are the story. Cost savings are the proof the story matters.",
    },
    {
      id: "2-user-2",
      role: "user",
      content: "What if clients push back and say they're not seeing those results elsewhere?",
    },
    {
      id: "2-assistant-2",
      role: "assistant",
      content: "Perfect—that means they've tried other solutions and been disappointed. Your response: \"You're right, most programs don't deliver these outcomes because they treat healthcare like a transaction instead of a relationship. Our approach is different. We combine clinical expertise, behavioral science, and technology that people actually want to use. Let me show you the data from three employers similar to you who were skeptical at first.\" Skepticism means they care. Give them reasons to believe.",
    },
  ],
  "3": [
    {
      id: "3-user-1",
      role: "user",
      content: "I'm preparing for an upcoming healthcare innovation conference. What should I emphasize about Glen AI in my demo?",
    },
    {
      id: "3-assistant-1",
      role: "assistant",
      content: "Don't demo features—demo outcomes. Show how Glen AI helps people make better decisions faster. Healthcare conferences are full of flashy tech that solves problems nobody has. You need to show the opposite: a simple, human experience that solves a real problem. Walk them through a scenario: a leader preparing for a tough strategic decision, having a conversation, getting insights that change their thinking. Make them feel what it's like to have decades of healthcare expertise available instantly. That's the story.",
    },
    {
      id: "3-user-2",
      role: "user",
      content: "How technical should I get about the AI and knowledge base?",
    },
    {
      id: "3-assistant-2",
      role: "assistant",
      content: "Keep it simple. Healthcare leaders don't care about the size of your training data or your model architecture—they care whether it works. Say something like: \"Glen AI is trained on decades of Glen's insights from building and scaling healthcare companies. It understands strategy, leadership, and healthcare transformation because it's learned from someone who's lived it.\" Then show it in action. Five seconds of a great conversation beats five minutes of technical explanation every time.",
    },
  ],
};
