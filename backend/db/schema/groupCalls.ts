import {
    pgTable,
    uuid,
    timestamp,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversations";
import { users } from "./users";
import { pgEnum } from "drizzle-orm/pg-core";

export const callTypeEnum = pgEnum(
    "call_type",
    [
        "voice",
        "video",
    ]
);

export const groupCalls = pgTable("group_calls", {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    conversationId: uuid("conversation_id")
        .notNull()
        .references(() => conversations.id, {
            onDelete: "cascade",
        }),

    startedBy: uuid("started_by")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),

    type: callTypeEnum("type")
        .notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    endedAt: timestamp("ended_at"),
});