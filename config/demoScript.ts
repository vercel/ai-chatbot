import type { SuggestionChip } from '@/components/SuggestionChips';

export type DemoFlow = {
  id: string;
  title: string;
  description: string;
  avatarResponse: string;
  userPrompt: string;
  priorities: string[];
  videoClip?: string;
  followUps?: SuggestionChip[];
};

export const prepOncology: DemoFlow = {
  id: 'prep-oncology',
  title: 'Prep: Oncology meeting',
  description: 'Prepare for upcoming oncology meeting',
  avatarResponse: "Great timing. The oncology team is laser-focused on three things right now: better outcomes, lower friction, and lower cost. Walk in with that north star. Ask them for one metric they'd proudly show a patient family in 90 days. And leave with an owner and a date for a patient journey upgrade. You'll make real progress.",
  userPrompt: "Glen, I'm meeting the oncology team tomorrow. What should I know?",
  priorities: [
    'Reaffirm the north star: better outcomes, lower friction, lower cost.',
    "Ask for one metric they'd proudly show a patient family in 90 days.",
    'Leave with an owner + date for a patient journey upgrade.'
  ],
  videoClip: '/demo-avatar-prep.mp4',
  followUps: [
    { id: 'oncology-friction', text: 'Tell me about friction reduction', category: 'tactical' },
    { id: 'oncology-metrics', text: 'What metrics should I track?', category: 'company' },
    { id: 'oncology-owner', text: 'How do I pick an owner?', category: 'leadership' },
  ],
};

export const leadershipLesson: DemoFlow = {
  id: 'leadership-lesson',
  title: 'Philosophy: Leadership lesson',
  description: 'Leadership philosophy and guidance',
  avatarResponse: "Here's what I've learned after decades in healthcare: spotlight effort publicly, remove one blocker daily, and ship small wins weekly. Leaders who do this consistently build unstoppable teams. It's not flashy, but it works. Every time.",
  userPrompt: "What's your biggest leadership lesson?",
  priorities: [
    'Spotlight effort publicly',
    'Remove one blocker daily',
    'Ship small wins weekly'
  ],
  videoClip: '/demo-avatar-leadership.mp4',
  followUps: [
    { id: 'spotlight-how', text: 'How do I spotlight effort publicly?', category: 'leadership' },
    { id: 'remove-blocker', text: 'What counts as a blocker?', category: 'tactical' },
    { id: 'ship-wins', text: 'How do I define a "win"?', category: 'tactical' },
  ],
};

export const humanVsAI: DemoFlow = {
  id: 'humans-vs-ai',
  title: 'Humans vs AI',
  description: 'What makes humans unique',
  avatarResponse: "Humans bring three things AI can't: empathy that builds trust, creativity that spots patterns in chaos, and judgment that weighs trade-offs beyond data. AI scales the knowledge. You scale the wisdom. Together, you 10x your impact.",
  userPrompt: "What makes humans unique versus AI?",
  priorities: [
    'Empathy builds trust that data never will',
    'Creativity spots the patterns AI misses',
    'Judgment weighs trade-offs beyond spreadsheets',
  ],
};

export const scaleWisdom: DemoFlow = {
  id: 'scale-wisdom',
  title: 'Scale Your Wisdom',
  description: 'How leaders scale wisdom',
  avatarResponse: "You can't clone yourself, but you can clone your thinking. Record your decisions—why, not just what. Create decision templates. Build Glen AI to handle the repetitive conversations. Your team gets your brain at scale. You get your time back.",
  userPrompt: "How can leaders scale their wisdom?",
  priorities: [
    'Record decisions: document the why, not just the what',
    'Create reusable decision frameworks and templates',
    'Build Glen AI to handle repetitive conversations',
  ],
};

export const twinTimeSave: DemoFlow = {
  id: 'twin-time-save',
  title: 'Glen AI ROI',
  description: 'How Glen AI saves time',
  avatarResponse: "Execs spend 30-40% of their time answering the same strategic questions over and over. Glen AI handles those. You focus on the 10% only you can do—the novel problems, the tough calls, the moments that need your full presence.",
  userPrompt: "How could Glen AI save you time today?",
  priorities: [
    'Offload repetitive strategic Q&A (30-40% time savings)',
    'Focus on novel problems only you can solve',
    'Scale your presence without burning out',
  ],
};

export const demoFlows: DemoFlow[] = [prepOncology, leadershipLesson];

export const oncologyFriction: DemoFlow = {
  id: 'oncology-friction',
  title: 'Friction Reduction',
  description: 'How to reduce friction in oncology care',
  avatarResponse: "Friction is anything that slows down care or adds zero value. At Livongo, we eliminated 14 steps in diabetes enrollment and saw 3x adoption. Map your oncology patient's first 48 hours—every handoff, every form, every wait. Pick the biggest pain point and cut it in half. What's the one thing you'll eliminate this week?",
  userPrompt: "Tell me about friction reduction",
  priorities: [
    'Map the first 48 hours: identify every handoff, form, and wait',
    'Pick the biggest pain point and cut it in half',
  ],
  followUps: [
    { id: 'friction-measurement', text: 'How do I measure friction?', category: 'tactical' },
    { id: 'friction-quick-wins', text: 'What are common quick wins?', category: 'tactical' },
  ],
};

export const oncologyMetrics: DemoFlow = {
  id: 'oncology-metrics',
  title: 'Oncology Metrics',
  description: 'Which metrics matter for oncology',
  avatarResponse: "Track what patients feel, not just what systems measure. Time-to-treatment-start, patient-reported friction scores, and care plan adherence tell the real story. At Transcarent, we obsessed over 'days to specialist access'—it moved the needle. Pick one metric the oncology team will own. What gets measured gets fixed.",
  userPrompt: "What metrics should I track?",
  priorities: [
    'Focus on patient-felt metrics: time-to-treatment, friction scores, adherence',
    'Pick one metric for the team to own and improve',
  ],
  followUps: [
    { id: 'metrics-dashboard', text: 'How often should we review metrics?', category: 'company' },
  ],
};

export const oncologyOwner: DemoFlow = {
  id: 'oncology-owner',
  title: 'Picking an Owner',
  description: 'How to identify the right owner',
  avatarResponse: "Look for the person who's already frustrated by the problem—they're halfway to the solution. They need authority to make decisions, access to the right people, and a reputation for finishing. Don't pick the most senior person. Pick the hungriest. Give them air cover and get out of their way. Who on your team can't stop talking about this problem?",
  userPrompt: "How do I pick an owner?",
  priorities: [
    'Find someone already frustrated by the problem',
    'Ensure they have authority, access, and a track record of finishing',
  ],
};

export const spotlightHow: DemoFlow = {
  id: 'spotlight-how',
  title: 'Spotlighting Effort',
  description: 'How to spotlight effort publicly',
  avatarResponse: "Be specific and timely. Don't say 'great job'—say 'you shipped the dashboard update by Friday and unblocked three teams.' Do it in public: team meetings, Slack, all-hands. At Livongo, I'd spotlight one win per week in the company meeting. People remember what you celebrate. What effort will you spotlight tomorrow?",
  userPrompt: "How do I spotlight effort publicly?",
  priorities: [
    'Be specific: name the action, impact, and who it helped',
    'Do it publicly: team meetings, Slack, all-hands',
  ],
  followUps: [
    { id: 'spotlight-frequency', text: 'How often should I spotlight wins?', category: 'leadership' },
  ],
};

export const removeBlocker: DemoFlow = {
  id: 'remove-blocker',
  title: 'Defining Blockers',
  description: 'What counts as a blocker',
  avatarResponse: "A blocker is anything that stops forward motion. Waiting on approvals, missing data, unclear priorities, broken tools. If your team says 'we can't move until...'—that's your blocker. Remove one daily. It compounds. At Allscripts, I'd spend 30 minutes each morning clearing blockers. The team felt it immediately. What's blocking your team right now?",
  userPrompt: "What counts as a blocker?",
  priorities: [
    'Blockers stop forward motion: approvals, data, clarity, tools',
    'Remove one daily—it compounds fast',
  ],
};

export const shipWins: DemoFlow = {
  id: 'ship-wins',
  title: 'Defining Wins',
  description: 'How to define a "win"',
  avatarResponse: "A win is something real people can use or feel. Not a meeting, not a plan—a shipped feature, a solved problem, a decision made. Small is fine. Weekly momentum beats monthly perfection. At Transcarent, we celebrated every 'first member helped by X.' It kept the team energized and focused. What's one thing you can ship this week?",
  userPrompt: "How do I define a 'win'?",
  priorities: [
    'Wins are tangible: shipped features, solved problems, decisions made',
    'Small and weekly beats big and monthly',
  ],
};

export const healthcarePhilosophy: DemoFlow = {
  id: 'healthcare-philosophy',
  title: 'Healthcare Philosophy',
  description: 'Core beliefs about healthcare transformation',
  avatarResponse: "Healthcare should work for people, not systems. My philosophy is simple: lower costs, better outcomes, less friction. Every decision should make care more accessible, more transparent, and more human. At Livongo and now Transcarent, we've proven that when you put the patient first—truly first—everyone wins. Employers save money, people get healthier, and clinicians can focus on care instead of paperwork.",
  userPrompt: "Tell me about your healthcare philosophy",
  priorities: [
    'Put patients first: lower costs, better outcomes, less friction',
    'Make care accessible, transparent, and human',
    'Align incentives so everyone wins',
  ],
};

export const priorities2025: DemoFlow = {
  id: 'priorities-2025',
  title: '2025 Priorities',
  description: 'Strategic priorities for the year ahead',
  avatarResponse: "For 2025, we're focused on three things at Transcarent: scaling our Surgery and Cancer Centers of Excellence, proving AI can deliver personalized care at scale, and expanding employer partnerships that share our mission. The healthcare system is broken, but we're building the alternative. We're not waiting for permission—we're shipping solutions people can use today.",
  userPrompt: "What are your priorities for 2025?",
  priorities: [
    'Scale Centers of Excellence for Surgery and Cancer',
    'Prove AI-driven personalized care works at scale',
    'Expand employer partnerships aligned with our mission',
  ],
};

export const aiHealthcare: DemoFlow = {
  id: 'ai-healthcare',
  title: 'AI in Healthcare',
  description: 'Vision for AI-powered healthcare',
  avatarResponse: "AI is the unlock for personalized healthcare at scale. Today, every patient gets the same generic advice. With AI, we can deliver the right care, to the right person, at the right time—based on their data, their history, their life. At Transcarent, we're using AI to guide people through complex medical decisions, surface better provider options, and predict health issues before they become crises. But AI without empathy is just automation. The human touch still matters.",
  userPrompt: "How do you think about AI in healthcare?",
  priorities: [
    'AI enables personalized care at scale',
    'Use it to guide decisions, surface options, predict issues',
    'Always pair AI with human empathy',
  ],
};

export const entrepreneurAdvice: DemoFlow = {
  id: 'entrepreneur-advice',
  title: 'Entrepreneur Advice',
  description: 'Guidance for startup founders',
  avatarResponse: "Start with a problem that pisses you off personally. Build something you'd use yourself. Move fast, but listen obsessively—your users will tell you what's broken if you pay attention. At Livongo, we talked to hundreds of diabetics before writing a line of code. And remember: raise enough money to have a real shot, but not so much that you lose the hunger. Stay close to the pain, ship often, and don't confuse activity with progress.",
  userPrompt: "What advice do you have for entrepreneurs?",
  priorities: [
    'Solve a problem that pisses you off',
    'Listen obsessively to users before building',
    'Stay close to the pain, ship often, measure progress',
  ],
};

export const allDemoFlows: Record<string, DemoFlow> = {
  'prep-oncology': prepOncology,
  'leadership-lesson': leadershipLesson,
  'humans-vs-ai': humanVsAI,
  'scale-wisdom': scaleWisdom,
  'twin-time-save': twinTimeSave,
  'oncology-friction': oncologyFriction,
  'oncology-metrics': oncologyMetrics,
  'oncology-owner': oncologyOwner,
  'spotlight-how': spotlightHow,
  'remove-blocker': removeBlocker,
  'ship-wins': shipWins,
  'healthcare-philosophy': healthcarePhilosophy,
  'priorities-2025': priorities2025,
  'ai-healthcare': aiHealthcare,
  'entrepreneur-advice': entrepreneurAdvice,
};

