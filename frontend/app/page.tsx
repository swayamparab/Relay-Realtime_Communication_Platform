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
  Database,
  Phone,
  Search,
  Mic,
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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading... May take upto 30 secs.
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-y-auto bg-slate-950 px-6">
      <BackendWarmup />

      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* HERO */}
        <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
          <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
            Re<span className="text-blue-500">lay</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Chat, connect and communicate in real time with messaging,
            group conversations, voice calls, video calls and more — all in
            one place.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <LoginButton />

            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-slate-700 bg-slate-900 px-8 text-white hover:bg-slate-800 sm:w-auto"
              >
                Signup
              </Button>
            </Link>
          </div>
        </section>

        {/* FEATURES */}
        <section className="pb-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-blue-500">
              Everything in one place
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Built for real-time communication
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Relay combines messaging, calling, groups and real-time
              synchronization into a single platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<MessageCircle />}
              iconClass="text-blue-400"
              title="Real-Time Messaging"
              description="Send messages instantly with typing indicators, read receipts, replies, editing, deletion and live conversation updates."
            />

            <FeatureCard
              icon={<Phone />}
              iconClass="text-emerald-400"
              title="Voice & Video Calls"
              description="Make one-to-one voice and video calls using WebRTC with mute, camera controls, call duration and responsive call interfaces."
            />

            <FeatureCard
              icon={<Users />}
              iconClass="text-purple-400"
              title="Group Calls"
              description="Connect multiple people in group voice and video calls with participant invitations, live synchronization and mesh WebRTC."
            />

            <FeatureCard
              icon={<Users />}
              iconClass="text-cyan-400"
              title="Group Chats"
              description="Create groups, manage members, assign administrators, rename groups and synchronize changes in real time."
            />

            <FeatureCard
              icon={<Image />}
              iconClass="text-pink-400"
              title="Media Sharing"
              description="Share images, videos, documents and voice messages with previews and Cloudinary-powered media storage."
            />

            <FeatureCard
              icon={<ShieldCheck />}
              iconClass="text-emerald-400"
              title="Secure Authentication"
              description="JWT-based authentication with secure HttpOnly cookies, protected routes and persistent login sessions."
            />

            <FeatureCard
              icon={<Zap />}
              iconClass="text-yellow-400"
              title="Real-Time Synchronization"
              description="Socket.IO keeps messages, presence, typing indicators, unread counts, group changes and call state synchronized."
            />

            <FeatureCard
              icon={<Search />}
              iconClass="text-orange-400"
              title="Smart Conversations"
              description="Search messages, restore scroll position, manage replies and keep conversations automatically synchronized."
            />

            <FeatureCard
              icon={<Database />}
              iconClass="text-indigo-400"
              title="Built for Performance"
              description="Redis caching, rate limiting, React Query caching, optimistic updates and cursor-based pagination keep Relay responsive."
            />
          </div>
        </section>

        {/* CALLING HIGHLIGHT */}
        <section className="mb-16 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Video className="size-5" />
              </div>

              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Calling that actually feels real-time
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                Relay uses WebRTC for peer-to-peer voice and video
                communication while Socket.IO handles signaling and
                real-time coordination.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <HighlightItem icon={<Mic />} text="Voice calling" />
                <HighlightItem icon={<Video />} text="Video calling" />
                <HighlightItem icon={<Users />} text="Group calling" />
                <HighlightItem icon={<Zap />} text="Live signaling" />
              </div>
            </div>

            <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-black/30">
              <div className="absolute size-52 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative flex items-center gap-3">
                <div className="flex size-20 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-2xl font-bold text-blue-400">
                  R
                </div>

                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-blue-400" />
                  <span className="size-1.5 rounded-full bg-blue-400" />
                  <span className="size-1.5 rounded-full bg-blue-400" />
                </div>

                <div className="flex size-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-2xl font-bold text-emerald-400">
                  Y
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className=" border-slate-800/80">
          <div className="flex flex-col items-center py-8 text-center text-sm text-slate-400">
            <p>
              Built by{" "}
              <span className="font-semibold text-white">Swayam Parab</span>
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Relay • Real-Time Communication Platform
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

function FeatureCard({
  icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900">
      <div
        className={`mb-4 flex size-10 items-center justify-center rounded-xl bg-slate-800 ${iconClass}`}
      >
        {icon}
      </div>

      <h3 className="text-base font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function HighlightItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-300">
      <span className="text-emerald-400">{icon}</span>
      {text}
    </div>
  );
}