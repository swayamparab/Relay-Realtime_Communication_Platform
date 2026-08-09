CREATE TYPE "public"."call_type" AS ENUM('voice', 'video');--> statement-breakpoint
ALTER TABLE "group_calls" ADD COLUMN "type" "call_type" NOT NULL;