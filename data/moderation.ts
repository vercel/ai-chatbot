export type ModItem = {
  id: string; title: string; type: "Video"|"PDF"|"Web"; submittedBy: string; submittedAt: string; status: "Pending";
};

export const MOD_QUEUE_SEED: ModItem[] = [
  { id:"mod-1", title:"Podcast: Why Consolidation Matters", type:"Web", submittedBy:"Staff", submittedAt:"2025-10-11", status:"Pending" },
  { id:"mod-2", title:"Panel: Employer Benefits 2026", type:"Video", submittedBy:"EA Team", submittedAt:"2025-10-11", status:"Pending" },
  { id:"mod-3", title:"Press Quote Roundup", type:"Web", submittedBy:"Staff", submittedAt:"2025-10-10", status:"Pending" },
  { id:"mod-4", title:"Slide: North Star & Metrics", type:"PDF", submittedBy:"Zach", submittedAt:"2025-10-09", status:"Pending" },
  { id:"mod-5", title:"Interview: Oncology Outcomes", type:"Video", submittedBy:"EA Team", submittedAt:"2025-10-08", status:"Pending" },
  { id:"mod-6", title:"FAQ: New Employee Onboarding", type:"PDF", submittedBy:"Staff", submittedAt:"2025-10-08", status:"Pending" },
];
