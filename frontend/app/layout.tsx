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
  description: "Real-time one-to-one chat application",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
              <CallProvider>
                <GroupWebRTCProvider>
                  <GroupCallProvider>
                    <CallEvents />
                    <WebRTCEvents />
                    {children}
                    <Toaster
                      position="top-right"
                      richColors
                    />
                  </GroupCallProvider>
                </GroupWebRTCProvider>
              </CallProvider>
            </WebRTCProvider>
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}