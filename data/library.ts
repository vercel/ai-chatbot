export type LibraryItem = {
  id: string; title: string; source: string; type: "Video"|"PDF"|"Web"|"Excerpt";
  addedBy: string; addedAt: string; status: "Approved";
};

export const LIBRARY_SEED: LibraryItem[] = [
  { id:"lib-1", title:"Keynote: Consumer-Directed Health", source:"Video", type:"Video", addedBy:"Zach", addedAt:"2025-10-10", status:"Approved" },
  { id:"lib-2", title:"On Our Terms (Book) — Ch. 3 Excerpt", source:"Excerpt", type:"Excerpt", addedBy:"Staff", addedAt:"2025-10-09", status:"Approved" },
  { id:"lib-3", title:"Interview: Leadership & AI Twins", source:"Web", type:"Web", addedBy:"Staff", addedAt:"2025-10-08", status:"Approved" },
  { id:"lib-4", title:"Op-Ed: Making Care Affordable", source:"Web", type:"Web", addedBy:"Staff", addedAt:"2025-10-06", status:"Approved" },
  { id:"lib-5", title:"Values One-Pager (PDF)", source:"PDF", type:"PDF", addedBy:"EA Team", addedAt:"2025-10-05", status:"Approved" },
  { id:"lib-6", title:"All-Hands Clip: Oncology Q&A", source:"Video", type:"Video", addedBy:"EA Team", addedAt:"2025-10-03", status:"Approved" },
];
