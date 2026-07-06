import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediMate AI - Smart Medication Reminder & Drug-Interaction Checker",
  description:
    "An AI-powered health assistant that reminds you to take your medications, tracks treatment adherence, and automatically screens for dangerous drug interactions using openFDA data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/*
          Fonts loaded via <link> (not next/font) on purpose:
          - Be Vietnam Pro + Material Symbols match the MediMate design system.
          - Avoids next/font's build-time font fetch (which needs to spawn worker
            threads and fails on low-memory Windows machines).
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
