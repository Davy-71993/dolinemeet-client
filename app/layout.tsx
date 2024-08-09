import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RoomContextProvider from "@/context/RoomContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DolineMeet",
  description: "A audio/video streaming platform that consumes doline-sfu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RoomContextProvider>
          {children}
        </RoomContextProvider>
      </body>
    </html>
  );
}
