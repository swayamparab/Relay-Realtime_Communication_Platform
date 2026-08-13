"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

import LoginButton from "@/components/auth/LoginButton";
import BackendWarmup from "@/components/BackendWarmup";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const { data: currentUser, isLoading } =
    useCurrentUser();

  useEffect(() => {
    if (currentUser) {
      router.replace("/chat");
    }
  }, [currentUser, router]);

  // Don't show homepage while checking authentication
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950 px-6">

      <BackendWarmup />

      {/* Background glow */}
      <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl">

        <div className="text-center">

          <h1 className="mt-10 text-6xl font-extrabold tracking-tight text-white">
            Re<span className="text-blue-500">lay</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            A real-time modern communication platform built with
            <span className="text-white"> Next.js</span>,
            <span className="text-white"> Express</span>,
            <span className="text-white"> PostgreSQL</span>,
            <span className="text-white"> Drizzle ORM</span> and
            <span className="text-white"> Socket.IO</span>.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <LoginButton />

            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900 px-8 text-white hover:bg-slate-800"
              >
                Sign Up
              </Button>
            </Link>
          </div>

        </div>

        {/* Features */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <Zap className="mb-4 h-8 w-8 text-blue-500" />

            <h3 className="mb-2 text-lg font-semibold text-white">
              Real-Time Messaging
            </h3>

            <p className="text-sm text-slate-400">
              Instant messaging powered by Socket.IO with typing indicators.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <ShieldCheck className="mb-4 h-8 w-8 text-emerald-400" />

            <h3 className="mb-2 text-lg font-semibold text-white">
              Secure Authentication
            </h3>

            <p className="text-sm text-slate-400">
              JWT authentication with HttpOnly cookies for secure sessions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <MessageCircle className="mb-4 h-8 w-8 text-cyan-400" />

            <h3 className="mb-2 text-lg font-semibold text-white">
              Clean Experience
            </h3>

            <p className="text-sm text-slate-400">
              Responsive UI with conversations, typing status and message deletion.
            </p>
          </div>

        </div>

        <footer className="mt-24 border-t border-slate-800/80">
          <div className="mx-auto flex max-w-7xl flex-col items-center py-8 text-center text-sm text-slate-400">

            <p>
              Built by{" "}
              <span className="font-semibold text-white">
                Swayam Parab
              </span>
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Relay • Real-Time One-to-One Messaging Platform
            </p>

            <a
              href="https://github.com/swayamparab"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/50 px-5 py-2.5 font-medium text-blue-400 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-blue-300"
            >
              View on GitHub →
            </a>

          </div>
        </footer>

      </div>
    </main>
  );
}