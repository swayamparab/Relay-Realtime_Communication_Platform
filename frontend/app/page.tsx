"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  MessageCircle,
  ShieldCheck,
  Zap,
  Video,
  Users,
  Image,
  Phone,
  Search,
  Mic,
  LoaderCircle,
} from "lucide-react";

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
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/15 blur-3xl sm:h-80 sm:w-80" />

        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Re<span className="text-blue-500">lay</span>
          </h1>

          <p className="mt-3 text-xs text-slate-500 sm:text-sm">
            Real-time communication platform
          </p>

          <LoaderCircle
            className="mt-12 size-12 animate-spin text-blue-500 sm:size-14"
            strokeWidth={2}
          />

          <p className="mt-7 text-base font-medium text-slate-200 sm:text-lg">
            Loading Relay
          </p>

          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Connecting to your chats...
          </p>

          <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600 sm:text-xs">
            <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
            Checking your session
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 px-5 text-white sm:px-6">
      <BackendWarmup />

      {/* Background */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="pointer-events-none absolute right-[-150px] top-[500px] h-96 w-96 rounded-full bg-cyan-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">

        {/* HERO */}
        <section className="flex min-h-[72vh] flex-col items-center justify-center text-center">

          <h1 className="text-7xl font-extrabold tracking-[-0.05em] sm:text-8xl lg:text-9xl">
            Re<span className="text-blue-500">lay</span>
          </h1>

          <div className="mt-5 flex flex-col items-center">
            <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-slate-500 sm:text-base">
              <span className="h-px w-8 bg-slate-700 sm:w-12" />
              <span>Talk. Connect. In real time.</span>
              <span className="h-px w-8 bg-slate-700 sm:w-12" />
            </div>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Messaging, group conversations, voice calls, video calls and
              AI-powered conversation tools — all in one place.
            </p>
          </div>

          {/* Original Login + Signup */}
          <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <LoginButton />

            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-slate-700 bg-slate-900 px-8 text-white hover:bg-slate-800 w-26"
              >
                Signup
              </Button>
            </Link>
          </div>

          {/* Mini feature row */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-500">
            <MiniFeature icon={<MessageCircle />} text="Messaging" />
            <MiniFeature icon={<Phone />} text="Voice calls" />
            <MiniFeature icon={<Video />} text="Video calls" />
            <MiniFeature icon={<Users />} text="Group chats" />
            <MiniFeature icon={<Zap />} text="Real-time sync" />
            <MiniFeature icon={<SparkleIcon />} text="AI features" />
          </div>
        </section>

        {/* PRODUCT PREVIEW */}
        <section className="pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl shadow-blue-950/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-cyan-500/[0.03]" />

            <div className="relative grid items-center gap-10 p-7 sm:p-10 lg:grid-cols-2 lg:p-14">
              {/* Text */}
              <div>
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <MessageCircle className="size-5" />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  One place for everything
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Conversations that stay connected.
                </h2>

                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
                  Send messages, share media, reply to conversations and
                  see updates instantly without refreshing the page.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <Feature icon={<Search />} text="Message search" />
                  <Feature icon={<Image />} text="Media sharing" />
                  <Feature icon={<Mic />} text="Voice messages" />
                  <Feature icon={<ShieldCheck />} text="Secure sessions" />
                </div>
              </div>

              {/* Chat preview */}
              <div className="relative mx-auto w-full max-w-md">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-400">
                      A
                    </div>

                    <div>
                      <p className="text-sm font-semibold">Alex</p>

                      <p className="text-xs text-emerald-400">
                        Online
                      </p>
                    </div>

                    <div className="ml-auto flex gap-2 text-slate-500">
                      <Phone className="size-4" />
                      <Video className="size-4" />
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3 py-5">
                    <div className="w-fit max-w-[75%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2.5 text-sm text-slate-300">
                      Hey! Are you free for a call?
                    </div>

                    <div className="ml-auto w-fit max-w-[75%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white">
                      Yep, give me a minute 👋
                    </div>

                    <div className="w-fit max-w-[75%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2.5 text-sm text-slate-300">
                      Perfect.
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5">
                    <div className="h-2 flex-1 rounded-full bg-slate-800" />
                    <div className="size-7 rounded-lg bg-blue-600/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI FEATURES */}
        <section className="pb-24">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Intelligent conversations
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              AI that works with your conversations.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Catch up faster and get answers without leaving the chat.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* AI Assistant */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="absolute right-0 top-0 size-40 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <SparkleIcon />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  AI Conversation Assistant
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Ask questions about your current conversation and get
                  context-aware answers from the messages in the chat.
                </p>

                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-400">
                      AI
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Ask about this conversation
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        “What did we decide about the project?”
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Zap className="size-3.5 text-violet-400" />
                  Streaming AI responses
                </div>
              </div>
            </div>

            {/* Unread Summary */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="absolute right-0 top-0 size-40 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Search className="size-5" />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  Unread Message Summaries
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Come back to a busy conversation and let AI quickly
                  summarize the messages you missed.
                </p>

                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      12 unread messages
                    </span>

                    <span className="rounded-lg bg-blue-600/15 px-2.5 py-1.5 text-xs font-medium text-blue-400">
                      Summarize
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-4/5 rounded-full bg-slate-800" />
                    <div className="h-2 w-3/5 rounded-full bg-slate-800" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1">
                    Topics
                  </span>

                  <span className="rounded-full bg-slate-800 px-2.5 py-1">
                    Decisions
                  </span>

                  <span className="rounded-full bg-slate-800 px-2.5 py-1">
                    Action items
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-5 text-slate-600">
            AI features use conversation messages to generate responses
            and summaries. Users are informed when messages may be shared
            with the AI provider.
          </p>
        </section>

        {/* CALLING */}
        <section className="pb-24">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Built for calls
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              More than just messages.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Move from a conversation to a voice or video call without
              leaving Relay.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-10">
            <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 sm:gap-6">
                <CallAvatar letter="R" />

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-blue-400" />
                  <span className="size-1.5 animate-pulse rounded-full bg-blue-400 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-blue-400 [animation-delay:300ms]" />
                </div>

                <CallAvatar letter="Y" emerald />
              </div>

              <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-800 bg-slate-950/90 px-4 py-2 text-xs text-slate-400 backdrop-blur">
                <Video className="size-3.5 text-blue-400" />
                WebRTC powered calling
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES */}
        <section className="pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            <SimpleCard
              icon={<Users />}
              title="Groups"
              description="Create conversations with your people and manage them in real time."
            />

            <SimpleCard
              icon={<Zap />}
              title="Instant"
              description="Messages, presence, typing and call state stay synchronized live."
            />

            <SimpleCard
              icon={<ShieldCheck />}
              title="Secure"
              description="Protected authentication with secure HttpOnly sessions."
            />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="pb-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to connect?
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Start chatting with Relay.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LoginButton />

              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-slate-700 bg-slate-900 px-8 text-white hover:bg-slate-800 sm:w-auto"
                >
                  Signup
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/70">
          <div className="flex flex-col items-center justify-between gap-3 py-7 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm text-slate-400">
                Built by{" "}
                <span className="font-semibold text-white">
                  Swayam Parab
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Relay • Real-Time Communication Platform
              </p>
            </div>

            <a
              href="https://github.com/swayamparab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-500 transition hover:text-blue-400"
            >
              GitHub →
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ---------------------------------- */
/* Small components                   */
/* ---------------------------------- */

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3Z" />
      <path d="m19 14-.75 2.25L16 17l2.25.75L19 20l.75-2.25L22 17l-2.25-.75L19 14Z" />
    </svg>
  );
}

function MiniFeature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-600">{icon}</span>
      {text}
    </div>
  );
}

function Feature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-xs text-slate-400">
      <span className="text-blue-400">{icon}</span>
      {text}
    </div>
  );
}

function CallAvatar({
  letter,
  emerald = false,
}: {
  letter: string;
  emerald?: boolean;
}) {
  return (
    <div
      className={`flex size-20 items-center justify-center rounded-full border text-2xl font-bold sm:size-24 ${emerald
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-blue-500/30 bg-blue-500/10 text-blue-400"
        }`}
    >
      {letter}
    </div>
  );
}

function SimpleCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
        {icon}
      </div>

      <h3 className="font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}