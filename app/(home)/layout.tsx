import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { auth } from "@/auth";
// import "@liveblocks/react-comments/styles.css";
// import "@liveblocks/react-comments/styles/dark/media-query.css";
import "./normalize.css";
import "./layout.css";
// import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liveblocks Starter Kit",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
//   const session = await auth();
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
