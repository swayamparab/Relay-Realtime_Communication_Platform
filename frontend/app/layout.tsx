import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

import QueryProvider from "@/providers/QueryProvider";
import SocketProvider from "@/providers/SocketProvider";

import { Toaster } from "sonner"
import { CallProvider } from "@/providers/CallProvider";
import { WebRTCProvider } from "@/providers/WebRTCProvider";
import { CallEvents } from "@/components/providers/CallEvents";
import { WebRTCEvents } from "@/components/providers/WebRTCEvents";
import { GroupCallProvider } from "@/providers/GroupCallProvider";
import { GroupWebRTCProvider } from "@/providers/GroupWebRTCProvider";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Relay",
    template: "%s | Relay",
  },

  description: "Real-time communication platform",

  icons: {
    icon: [
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <QueryProvider>
          <SocketProvider>
            <WebRTCProvider>
              <GroupWebRTCProvider>
                <GroupCallProvider>
                  <CallProvider>
                    <CallEvents />
                    <WebRTCEvents />
                    {children}
                    <Toaster
                      position="top-right"
                      richColors
                    />
                  </CallProvider>
                </GroupCallProvider>
              </GroupWebRTCProvider>
            </WebRTCProvider>
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}