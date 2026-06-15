import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mix Techniques",
  description: "Show Us Your Mix — A music production show celebrating the art of mixing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#1A0F0A] text-[#F0E6D3]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
