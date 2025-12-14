import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
};

const defaultAchievements: Achievement[] = [
  {
    id: "first-message",
    title: "First Message!",
    description: "Send your first message in TiQology.",
    xp: 10,
    unlocked: false,
  },
  {
    id: "ai-explorer",
    title: "AI Explorer",
    description: "Try out three different AI demos.",
    xp: 25,
    unlocked: false,
  },
  {
    id: "collaborator",
    title: "Collaborator",
    description: "Collaborate with another user.",
    xp: 20,
    unlocked: false,
  },
  {
    id: "power-user",
    title: "Power User",
    description: "Unlock all features in a single session.",
    xp: 50,
    unlocked: false,
  },
];

export default function Gamification() {
  const [achievements, setAchievements] = useState(defaultAchievements);
  const totalXP = achievements.reduce(
    (sum, a) => sum + (a.unlocked ? a.xp : 0),
    0
  );

  // Simulate unlocking an achievement for demo
  const unlockAchievement = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a))
    );
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-xl">
      <CardHeader>
        <CardTitle>Achievements & Rewards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="default">XP: {totalXP}</Badge>
        </div>
        <ul className="space-y-3">
          {achievements.map((a) => (
            <li className="flex items-center gap-3" key={a.id}>
              <Badge variant={a.unlocked ? "success" : "secondary"}>
                {a.unlocked ? "Unlocked" : "Locked"}
              </Badge>
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-muted-foreground text-xs">
                  {a.description}
                </div>
              </div>
              {!a.unlocked && (
                <button
                  className="ml-auto text-primary text-xs underline"
                  onClick={() => unlockAchievement(a.id)}
                >
                  Unlock (Demo)
                </button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
