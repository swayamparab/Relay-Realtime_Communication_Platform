# Relay - Real-Time Communication Platform

A modern full-stack real-time communication platform built with **Next.js**, **Express**, **PostgreSQL**, **Drizzle ORM**, **Redis**, **Socket.IO**, **WebRTC**, and **Web Push notifications**.

Relay is a production-style communication platform featuring secure JWT authentication, one-to-one and group messaging, role-based group administration, media and voice messages, voice and video calling, group calls, dynamic 1-to-1 → group call promotion, participant invitations, presence, Web Push notifications, Redis caching and rate limiting, AI-powered conversation assistance and unread-message summarization using Google Gemini, and real-time synchronization powered by Socket.IO and React Query.

---

# Architecture

- **Frontend:** Next.js 16 + React + TypeScript
- **Backend:** Express.js + Socket.IO + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Cache & Rate Limiting:** Redis
- **Media Storage:** Cloudinary
- **AI:** Google Gemini
- **Real-Time Communication:** Socket.IO
- **Voice & Video Calls:** WebRTC
- **Push Notifications:** Web Push + VAPID
- **NAT Traversal:** STUN
- **Containerization:** Docker + Docker Compose

## Architecture Highlights

- Next.js frontend on Vercel; Express + Socket.IO backend on Render
- Vercel rewrites proxy `/api` and `/socket.io` for same-origin HttpOnly cookie authentication
- Layered backend with service-based business logic
- Cursor-based message pagination with React Query caching
- Redis caching and rate limiting
- Socket.IO room-based real-time synchronization
- Google Gemini integration for conversation-aware AI features
- Authenticated and rate-limited AI endpoints
- Backend-generated AI context from recent conversation messages
- Streaming Gemini responses through backend endpoints
- AI unread-message summarization using the preserved unread-message boundary
- WebRTC peer-to-peer media with Socket.IO signaling and STUN
- Separate 1-to-1 and group-call WebRTC architectures using mesh networking
- Dynamic 1-to-1 → group call promotion with local `MediaStream` reuse
- Per-participant `RTCPeerConnection` management and runtime call/invitation state

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
- Text, image, video, and document messages
- Reply, edit, and delete messages
- Message search with navigation
- Typing indicators
- Read receipts and unread counts
- Live conversation previews and automatic reordering
- Optimistic UI updates
- Cursor-based infinite scrolling
- Automatic scroll position restoration
- Reply and media previews
- Automatic read synchronization
- Real-time message editing and deletion

---

## Real-Time Synchronization

- Socket.IO room-based architecture
- Live messaging, conversation, and group updates
- Real-time member and admin changes
- Live conversation ordering and unread counts
- Typing indicators and read receipt synchronization
- Online user and presence synchronization

---

## AI Features

### AI Assistant

- AI assistant available in every conversation
- Ask natural-language questions about the current conversation
- Summarize the conversation
- Identify important decisions
- Extract action items
- Free-form prompts
- Quick actions for common tasks
- Streaming Gemini responses

### Unread Message AI Summary

- AI summary available when 5+ messages are unread
- "Summarize X messages with AI" directly inside the message timeline
- Summarizes missed topics, decisions, and action items
- Preserves the original unread-message boundary
- Works correctly even after messages are marked as read
- Streaming summary generation

### AI Infrastructure

- Google Gemini integration
- Authenticated AI endpoints
- Conversation-aware context generation
- Rate-limited AI endpoints
- AI privacy disclosure for external model processing

---

## Group Chats

- Create, rename, and delete groups
- Add, remove, and leave groups
- Multiple administrators with role-based permissions
- Promote and demote administrators
- Real-time group and member synchronization
- Automatic Socket.IO room management

---

## Voice Messages

- Record and send voice messages
- Playback with play/pause and seek
- Adjustable playback speed
- Recording timer
- Automatic pause when another voice message starts

---

## Media Sharing

- Image, video, and document uploads
- Cloudinary media storage
- Image, video, and file previews
- Attachment downloads

---

# Voice Calling

## One-to-One Voice Calling

- Real-time voice calls
- Incoming and outgoing call UI
- Busy-state handling
- Call timeout and duration tracking
- Microphone mute controls
- Ongoing call state
- WebRTC peer-to-peer communication
- ICE candidate exchange
- Socket.IO WebRTC signaling
- Real-time call state synchronization

## Group Voice Calling

- Multi-participant voice calls for up to 6 participants
- Real-time participant and call-state synchronization
- Join, leave, and call termination handling
- Microphone mute with remote mute synchronization
- Incoming group call notifications
- Participant invitations with accept/decline support
- WebRTC mesh architecture with per-participant peer connections
- Dynamic 1-to-1 → group call promotion

---

# Video Calling

## One-to-One Video Calling

- Real-time video calls with camera and microphone controls
- Mobile camera switching and responsive calling UI
- Remote camera/mute state synchronization
- Camera-off participant placeholders
- Picture-in-Picture and draggable video window
- Fullscreen / restore support
- ICE candidate exchange and Socket.IO WebRTC signaling
- Call state synchronization

## Group Video Calling

- Multi-participant video calls with up to 6 participants
- Responsive participant grid for desktop and mobile
- Real-time participant, camera, and microphone state synchronization
- Camera toggle and camera-off participant avatars
- Participant usernames and mute indicators
- Incoming call notifications and participant invitations
- Accept / decline invitations
- Join / leave and call termination synchronization
- Dynamic 1-to-1 → group call promotion
- WebRTC peer-to-peer media with mesh architecture
- Per-participant `RTCPeerConnection` management
- Socket.IO WebRTC signaling
- STUN-based connection establishment
- Local `MediaStream` reuse during call promotion

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

- Next.js 16
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
- Google Gemini
- JWT
- bcrypt
- Web Push

---

## Infrastructure & Services

- Vercel
- Render
- Neon PostgreSQL
- Redis
- Cloudinary
- Google Gemini
- STUN

---

## Technical Highlights

- Layered backend architecture with service-based business logic
- Event-driven Socket.IO architecture with room-based communication
- WebRTC peer-to-peer calling with mesh architecture for group calls
- Dynamic 1-to-1 → group call promotion with local `MediaStream` reuse
- Per-participant `RTCPeerConnection` and remote media stream management
- Deterministic WebRTC offerer selection and queued ICE candidate handling
- Socket.IO signaling with STUN-based NAT traversal
- Persistent group-call records with runtime participant and invitation state
- Redis caching and API rate limiting
- Google Gemini integration for conversation-aware AI assistance
- Backend-generated conversation context from recent messages
- Streaming Gemini responses through authenticated backend endpoints
- Quick-action and free-form AI prompting
- Conversation summarization, decision extraction, and action-item extraction
- Unread-message summarization using a preserved unread boundary
- AI privacy disclosure for external model processing
- Rate-limited AI endpoints for controlled API usage
- Cursor-based infinite pagination with React Query cache synchronization
- Optimistic UI updates and real-time state synchronization
- Secure JWT authentication with HttpOnly cookies
- Web Push notifications with VAPID authentication
- Role-based group permissions and Zod request validation
- Drizzle ORM with PostgreSQL
- Cloudinary media storage
- Fully typed TypeScript codebase with modular React hooks
- Responsive mobile-first UI
- Dockerized frontend and backend