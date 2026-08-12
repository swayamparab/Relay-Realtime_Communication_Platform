# Relay - Real-Time Communication Platform

A modern full-stack real-time communication platform built with **Next.js**, **Express**, **PostgreSQL**, **Drizzle ORM**, **Redis**, **Socket.IO**, and **WebRTC**.

Relay is a production-style communication platform featuring secure authentication, one-to-one messaging, group chats with role-based administration, media sharing, voice and video calling, group voice and video calling, dynamic 1-to-1 call promotion, participant invitations, presence, caching, rate limiting, and live synchronization powered by Socket.IO and React Query.

---

# Architecture

- **Frontend:** Next.js 15 + React + TypeScript
- **Backend:** Express.js + Socket.IO + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Cache & Rate Limiting:** Redis
- **Media Storage:** Cloudinary
- **Real-Time Communication:** Socket.IO
- **Voice & Video Calls:** WebRTC
- **NAT Traversal:** STUN

## Architecture Highlights

- Next.js frontend deployed on Vercel
- Express + Socket.IO backend deployed on Render
- API & WebSocket traffic proxied through Vercel rewrites (`/api` and `/socket.io`)
- Same-origin architecture for secure HttpOnly cookie authentication
- Layered backend architecture
- Service-based business logic
- Cursor-based message pagination
- Redis-based caching
- Redis-backed rate limiting
- WebRTC peer-to-peer media communication
- Socket.IO-based WebRTC signaling
- Room-based real-time communication
- Separate WebRTC architecture for one-to-one and group calls
- WebRTC mesh architecture for multi-participant calls
- Dynamic 1-to-1 → group call promotion
- Reuse of existing microphone/camera MediaStream during call promotion
- Per-participant RTCPeerConnection management for group calls
- Runtime group-call participant and invitation state management

---

# Features

## Authentication

- JWT Authentication
- Secure HttpOnly Cookies
- Protected Routes
- Persistent Login Sessions

---

## Messaging

- One-to-one real-time messaging
- Text messages
- Image messages
- Video messages
- Document sharing
- Reply to messages
- Edit messages
- Delete messages
- Typing indicators
- Read receipts
- Unread message counts
- Live conversation preview updates
- Automatic conversation reordering
- Optimistic UI updates
- Cursor-based infinite scrolling
- Automatic scroll position restoration
- Message search
- Reply previews
- Media previews
- Automatic read synchronization
- Live message editing
- Live message deletion

---

## Real-Time Synchronization

- Socket.IO room architecture
- Live conversation updates
- Real-time group synchronization
- Live member join/leave
- Live admin promotion/demotion
- Live group rename
- Live conversation ordering
- Live unread count updates
- Live typing indicators
- Read receipt synchronization
- Online user synchronization

---

## Group Chats

- Create groups
- Rename groups
- Add members
- Remove members
- Leave groups
- Delete groups
- Multiple administrators
- Promote members to admin
- Demote admins
- Real-time group updates
- Live member synchronization
- Automatic room management
- Role-based permissions

---

## Voice Messages

- Record voice messages
- Voice message playback
- Play / Pause
- Seek support
- Playback speed controls
- Recording timer
- Auto pause when another voice message starts

---

## Media Sharing

- Image uploads
- Video uploads
- Document sharing
- Cloudinary integration
- Image preview
- Video preview
- File preview
- Download attachments

---

# Voice Calling

## One-to-One Voice Calling

- Real-time voice calling
- Incoming call screen
- Outgoing call screen
- Busy state handling
- Call timeout
- Call duration
- Mute microphone
- Ongoing call card
- ICE candidate exchange
- WebRTC signaling through Socket.IO
- Call state synchronization

## Group Voice Calling

- Multi-participant voice calls
- Up to 6 participants
- Real-time participant synchronization
- Join / leave group calls
- Active call state management
- Group call participant limits
- Mute microphone
- Remote mute state synchronization
- Incoming group call notifications
- Participant invitations
- Accept / decline group call invitations
- Call termination synchronization
- WebRTC mesh peer connections
- Per-participant WebRTC peer connections
- Dynamic 1-to-1 → group call promotion

---

# Video Calling

## One-to-One Video Calling

- Real-time video calls
- Camera toggle
- Camera switching on mobile
- Mute microphone
- Remote camera status
- Camera-off placeholder
- Picture-in-Picture support
- Draggable floating video window
- Fullscreen / Restore
- Responsive mobile experience
- Camera state synchronization

## Group Video Calling

- Multi-participant video calls
- Up to 6 participants
- Responsive participant grid
- Desktop and mobile layouts
- Real-time participant synchronization
- Camera toggle
- Remote camera state synchronization
- Camera-off participant avatars
- Mute microphone
- Remote mute indicators
- Participant usernames
- Incoming group call notifications
- Participant invitations
- Accept / decline group call invitations
- Join / leave group calls
- Group call termination
- Dynamic 1-to-1 → group call promotion
- WebRTC peer-to-peer media
- WebRTC mesh architecture
- Per-participant WebRTC peer connections
- Socket.IO signaling
- STUN-based connection establishment
- Local MediaStream reuse during call promotion

---

# Dynamic 1-to-1 → Group Call Promotion

An active one-to-one voice or video call can be converted into a group call by inviting another conversation participant.

The existing microphone/camera MediaStream is preserved during the transition, while the old one-to-one WebRTC peer connection is replaced by the group-call WebRTC architecture.

## Promotion Flow

1-to-1 Call
    │
    │ Add Participant
    ▼
group_call:promote
    │
    ▼
Create Group Call
    │
    ├── Create group_calls record
    ├── Move existing participants
    ├── Join group-call Socket.IO room
    └── Invite new participant
              │
              ▼
       Participant accepts
              │
              ▼
         Group Call

## Call State Transition

One-to-one calls use runtime Socket.IO/in-memory call state through `activeCalls`.

When a call is promoted, the backend creates a persistent `group_calls` record and moves the existing participants into the group-call runtime state.

The group call then uses:

- `group_calls` for persistent group-call lifecycle state
- `group-call-state` for runtime participant tracking
- `group-call-invites` for pending invitation state
- Socket.IO rooms for real-time group communication
- WebRTC for peer-to-peer media
- Reusable local `MediaStream` across call transitions
- Per-participant `RTCPeerConnection` management
- Socket.IO signaling for WebRTC
- STUN-based NAT traversal

The PostgreSQL `group_calls` record tracks the group-call lifecycle; audio and video media are transmitted through WebRTC and are not stored in the database.

---

## Chat Requests

- Send request
- Accept request
- Reject request
- Cancel outgoing request

---

## Presence & Activity

- Single persistent Socket.IO connection per browser tab
- Online / Offline status
- Last seen
- Typing indicators
- Live unread counts
- Live online users
- Last seen updates
- Read receipts
- Live unread counters

---

# User Experience

- Responsive UI
- Desktop & Mobile support
- Mobile-first design
- React Query caching
- Modern UI with Tailwind CSS
- shadcn/ui components
- Toast notifications
- Optimistic updates
- Responsive calling interface
- Real-time call controls
- Participant status indicators

---

# Performance

- Cursor-based pagination
- Infinite message loading
- React Query caching
- Redis-based caching
- Redis-backed rate limiting
- Optimistic UI updates
- Cache synchronization via Socket.IO
- Minimal API refetching
- Efficient room-based broadcasts
- Modular React hooks
- WebRTC peer-to-peer media communication

---

# Tech Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack React Query
- Socket.IO Client
- Axios
- React Hook Form
- Zod
- Sonner
- Lucide React

---

## Backend

- Express.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- Redis
- Socket.IO
- WebRTC signaling
- JWT
- bcrypt

---

## Infrastructure & Services

- Vercel
- Render
- Neon PostgreSQL
- Redis
- Cloudinary
- STUN

---

# Technical Highlights

- Layered backend architecture
- Service-based business logic
- Socket.IO event-driven architecture
- Room-based real-time communication
- WebRTC peer-to-peer calling
- WebRTC mesh architecture for group calls
- Dynamic 1-to-1 → group call promotion
- Persistent group-call records using PostgreSQL
- Runtime group-call participant tracking
- Group-call invitation state management
- Reusable local MediaStream across call transitions
- Per-participant RTCPeerConnection management
- Group-call Socket.IO room architecture
- Socket.IO signaling for WebRTC
- STUN-based NAT traversal
- Redis caching
- Redis-based API rate limiting
- Cursor-based infinite pagination
- React Query cache synchronization
- Optimistic UI updates
- Secure HttpOnly cookie authentication
- Role-based group permissions
- Zod request validation
- Drizzle ORM with PostgreSQL
- Cloudinary media storage
- Fully typed TypeScript codebase
- Modular React hooks architecture
- Responsive mobile-first UI
- Deterministic WebRTC offerer selection using participant user IDs
- Queued ICE candidate handling until remote descriptions are available
- Remote media stream management using per-participant Maps

---

# Project Structure

frontend/
├── app/
├── components/
│   ├── call/
│   └── group-call/
├── hooks/
│   ├── call/
│   ├── group-call/
│   └── webrtc/
├── providers/
│   ├── CallProvider.tsx
│   ├── GroupCallProvider.tsx
│   ├── WebRTCProvider.tsx
│   └── GroupWebRTCProvider.tsx
├── services/
├── lib/
└── types/

backend/
├── modules/
├── sockets/
│   ├── events/
│   └── helpers/
│       ├── active-calls.ts
│       ├── group-call-state.ts
│       └── group-call-invites.ts
├── middleware/
├── routes/
├── db/
├── services/
│   └── group-call.service.ts
└── lib/