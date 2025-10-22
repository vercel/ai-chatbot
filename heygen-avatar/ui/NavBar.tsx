"use client";

import Link from "next/link";

import { GithubIcon, HeyGenLogo } from "./Icons";

export const NavBar = () => {
  return (
    <div className="m-auto flex w-[1000px] flex-row items-center justify-between p-6">
      <div className="flex flex-row items-center gap-4">
        <Link
          href="https://app.heygen.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <HeyGenLogo />
        </Link>
        <div className="bg-gradient-to-br from-sky-300 to-indigo-500 bg-clip-text">
          <p className="font-semibold text-transparent text-xl">
            HeyGen Interactive Avatar SDK NextJS Demo
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-6">
        <Link
          href="https://labs.heygen.com/interactive-avatar"
          rel="noopener noreferrer"
          target="_blank"
        >
          Avatars
        </Link>
        <Link
          href="https://docs.heygen.com/reference/list-voices-v2"
          rel="noopener noreferrer"
          target="_blank"
        >
          Voices
        </Link>
        <Link
          href="https://docs.heygen.com/reference/new-session-copy"
          rel="noopener noreferrer"
          target="_blank"
        >
          API Docs
        </Link>
        <Link
          href="https://help.heygen.com/en/articles/9182113-interactive-avatar-101-your-ultimate-guide"
          rel="noopener noreferrer"
          target="_blank"
        >
          Guide
        </Link>
        <Link
          aria-label="Github"
          className="flex flex-row justify-center gap-1 text-foreground"
          href="https://github.com/HeyGen-Official/StreamingAvatarSDK"
          rel="noopener noreferrer"
          target="_blank"
        >
          <GithubIcon className="text-default-500" />
          SDK
        </Link>
      </div>
    </div>
  );
};
