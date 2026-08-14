import {
    pgTable,
    uuid,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const pushSubscriptions = pgTable(
    "push_subscriptions",
    {
        id: uuid("id")
            .defaultRandom()
            .primaryKey(),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        endpoint: text("endpoint")
            .notNull(),

        p256dh: text("p256dh")
            .notNull(),

        auth: text("auth")
            .notNull(),

        createdAt: timestamp("created_at")
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at")
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex(
            "push_subscriptions_endpoint_idx"
        ).on(table.endpoint),
    ]
);