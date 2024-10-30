"use client";

import { SplashOverview } from "./splash-overview";

export function Splash(){
  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4">
        <div
          className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
        >
          <SplashOverview />
        </div>
      </div>
    </div>
  );
}
