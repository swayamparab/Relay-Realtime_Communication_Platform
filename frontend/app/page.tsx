"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Video,
  Users,
  Phone,
  Mic,
  LoaderCircle,
  ArrowRight,
  Sparkles,
  Bot,
  Radio,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import LoginButton from "@/components/auth/LoginButton";
import BackendWarmup from "@/components/BackendWarmup";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";

export default function HomePage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (currentUser) {
      router.replace("/chat");
    }
  }, [currentUser, router]);

  if (isLoading) {
    return (
      <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-950 px-5 text-white">
        <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-blue-600/10 blur-[120px]" />
        
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-900/80 shadow-2xl backdrop-blur-xl">
            <Radio className="size-5 text-blue-400 animate-pulse" />
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            Re<span className="text-blue-500">lay</span>
          </h1>

          <div className="mt-6 flex items-center gap-2.5 rounded-full bg-slate-900/70 px-3.5 py-1.5 text-xs text-slate-400 backdrop-blur-md">
            <LoaderCircle className="size-3.5 animate-spin text-blue-400" />
            <span>Establishing secure session...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-100 antialiased selection:bg-blue-500/20 selection:text-blue-300">
      <BackendWarmup />

      {/* Atmospheric Ambient Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute right-[-50px] top-[30%] h-[350px] w-[350px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        
        {/* TOP BAR */}
        <header className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Radio className="size-4" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              Re<span className="text-blue-500">lay</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-24 [&>button]:h-full [&>button]:w-full [&>button]:border-0 [&>button]:rounded-full">
              <LoginButton />
            </div>
            <Link href="/signup">
              <Button
                size="sm"
                className="h-9 w-24 rounded-full border-0 bg-white font-medium text-slate-950 shadow-sm hover:bg-slate-200"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="flex flex-col items-center pt-10 pb-8 text-center sm:pt-14">
          
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <span className="flex size-1.5 rounded-full bg-blue-400 animate-pulse" />
            WebRTC Calls & Real-Time Sync Active
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Real-time conversations,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              elevated by intelligence.
            </span>
          </h1>

          <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            High-fidelity messaging, HD voice and video rooms, and inline AI tools configured to summarize, extract actions, and keep you in sync.
          </p>

          {/* Equal Size CTA Group (Zero Borders) */}
          <div className="mt-6 flex w-full flex-col items-center justify-center gap-2.5 sm:flex-row">
            <div className="h-10 w-full sm:w-40 [&>button]:h-full [&>button]:w-full [&>button]:border-0 [&>button]:rounded-xl [&>button]:bg-blue-600 [&>button]:hover:bg-blue-500 [&>button]:text-sm [&>button]:font-medium">
              <LoginButton />
            </div>
            <Link href="/signup" className="h-10 w-full sm:w-40">
              <Button
                size="lg"
                className="group h-full w-full gap-2 rounded-xl border-0 bg-slate-900 px-6 text-sm font-medium text-white shadow-lg hover:bg-slate-800"
              >
                Create Account
                <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </Button>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            {[
              { icon: <MessageSquare className="size-3.5" />, text: "Direct Messaging" },
              { icon: <Phone className="size-3.5" />, text: "Audio Bridge" },
              { icon: <Video className="size-3.5" />, text: "WebRTC Video" },
              { icon: <Users className="size-3.5" />, text: "Channels & Groups" },
              { icon: <Bot className="size-3.5" />, text: "Conversation AI" },
            ].map((feature, idx) => (
              <span
                key={idx}
                className="flex items-center gap-2 rounded-lg bg-slate-900/60 px-2.5 py-1"
              >
                <span className="text-blue-400">{feature.icon}</span>
                {feature.text}
              </span>
            ))}
          </div>
        </section>

        {/* APP PREVIEW (Seamless Dark Glass) */}
        <section className="relative pb-12">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-slate-900/40 p-2 shadow-2xl shadow-black/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-slate-700" />
                <span className="size-2 rounded-full bg-slate-700" />
                <span className="size-2 rounded-full bg-slate-700" />
              </div>
            </div>

            <div className="grid gap-4 p-3 md:grid-cols-12">
              {/* Left: Chat */}
              <div className="space-y-3 md:col-span-7">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-[11px] font-semibold text-indigo-400">
                    AK
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300">Alex Kim</span>
                      <span className="text-[10px] text-slate-600">10:42 AM</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-800/70 px-3.5 py-2 text-sm text-slate-300">
                      Did you review the WebRTC signaling flow diagrams?
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-2.5">
                  <div className="space-y-0.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-slate-600">10:43 AM</span>
                      <span className="text-xs font-medium text-blue-400">You</span>
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-3.5 py-2 text-sm text-white shadow-md shadow-blue-600/15">
                      Yes, latencies look solid under 40ms. Ready to push to staging 🚀
                    </div>
                  </div>
                </div>

                {/* Copilot Bubble */}
                <div className="mt-1.5 rounded-xl bg-violet-950/25 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-violet-400">
                    <Sparkles className="size-3.5" />
                    <span>Relay Copilot</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    Action item created: <span className="font-mono text-slate-100">Deploy staging signaling cluster</span> assigned to team.
                  </p>
                </div>
              </div>

              {/* Right: Call */}
              <div className="flex flex-col justify-between rounded-xl bg-slate-950/80 p-3.5 md:col-span-5">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-slate-300">Call in progress</span>
                  </div>
                  <span className="font-mono text-xs text-slate-500">14:20</span>
                </div>

                <div className="my-3 grid grid-cols-2 gap-2">
                  <div className="relative flex aspect-video items-center justify-center rounded-lg bg-slate-900">
                    <span className="text-xs font-semibold text-slate-400">Alex</span>
                    <span className="absolute bottom-1.5 left-1.5 flex size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="relative flex aspect-video items-center justify-center rounded-lg bg-slate-900">
                    <span className="text-xs font-semibold text-slate-400">You</span>
                    <span className="absolute bottom-1.5 left-1.5 flex size-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-slate-300">
                    <Mic className="size-3.5" />
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-slate-300">
                    <Video className="size-3.5" />
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                    <Phone className="size-3.5 rotate-[135deg]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-8">
          <div className="mb-6 text-center">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
              Capabilities
            </h2>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Engineered for seamless collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900/40 p-5 backdrop-blur-sm transition-colors hover:bg-slate-900/60">
              <div className="mb-3 inline-flex rounded-lg bg-violet-500/10 p-2 text-violet-400">
                <Sparkles className="size-4" />
              </div>
              <h3 className="text-base font-semibold text-white">Contextual Copilot</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Ask questions about ongoing threads or generate summaries of unread messages without leaving the room.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/40 p-5 backdrop-blur-sm transition-colors hover:bg-slate-900/60">
              <div className="mb-3 inline-flex rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Zap className="size-4" />
              </div>
              <h3 className="text-base font-semibold text-white">WebRTC Infrastructure</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Direct peer-to-peer audio and video streaming with fallback relays to keep connections smooth.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/40 p-5 backdrop-blur-sm transition-colors hover:bg-slate-900/60">
              <div className="mb-3 inline-flex rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <ShieldCheck className="size-4" />
              </div>
              <h3 className="text-base font-semibold text-white">Guarded Sessions</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                HttpOnly session management, CSRF protection, and strictly authorized WebSocket connection states.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="relative my-4 overflow-hidden rounded-2xl bg-slate-900/50 p-8 text-center backdrop-blur-sm">
          <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-60 -translate-x-1/2 rounded-full bg-blue-500/15 blur-2xl" />
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to connect?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Sign up in seconds and experience streamlined real-time messaging.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <div className="h-10 w-full sm:w-36 [&>button]:h-full [&>button]:w-full [&>button]:border-0 [&>button]:rounded-xl [&>button]:bg-blue-600 [&>button]:hover:bg-blue-500 [&>button]:text-sm [&>button]:font-medium">
              <LoginButton />
            </div>
            <Link href="/signup" className="h-10 w-full sm:w-36">
              <Button className="h-full w-full rounded-xl border-0 bg-white px-5 font-medium text-slate-950 hover:bg-slate-200">
                Get Started
              </Button>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 sm:flex-row">
          <p>
            Designed & developed by{" "}
            <span className="font-medium text-slate-300">Swayam Parab</span>
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/swayamparab"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              GitHub
            </a>
            <span>•</span>
            <span>Relay Platform</span>
          </div>
        </footer>
      </div>
    </main>
  );
}