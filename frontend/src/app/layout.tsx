import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Ease | College Event Management",
  description: "Discover, register and manage college events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
