"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SettingsSection = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
};

type SettingsLayoutProps = {
  title: string;
  description?: string;
  sections: SettingsSection[];
};

export function SettingsLayout({
  title,
  description,
  sections,
}: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState(() => sections[0]?.id ?? "" );

  const sectionMap = useMemo(
    () =>
      sections.reduce<Record<string, SettingsSection>>((acc, section) => {
        acc[section.id] = section;
        return acc;
      }, {}),
    [sections]
  );

  const active = sectionMap[activeSection] ?? sections[0];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-8 px-6 pb-12 pt-8 md:flex-row md:gap-12">
      <aside className="md:w-64 md:flex-none">
        <div className="sticky top-28 z-30 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <nav aria-label={`${title} sections`}>
            <ul className="space-y-1">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                      aria-current={isActive ? "true" : undefined}
                    >
                      {section.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-h-0">
        {active ? (
          <div
            key={active.id}
            className="flex h-full min-h-0 flex-col rounded-xl border bg-muted/50 p-6 shadow-sm"
          >
            <div className="mb-4 space-y-2">
              <h2 className="text-xl font-semibold">{active.title}</h2>
              {active.description ? (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {active.description}
                </p>
              ) : null}
            </div>
            <div className="flex-1 overflow-auto">
              <div className="space-y-6">{active.content}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


