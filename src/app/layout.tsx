import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { AuthProvider } from "../lib/authContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Portal",
  description: "Your one-stop portal for HR needs.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
