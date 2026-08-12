CREATE TYPE "public"."domain_status" AS ENUM('pending', 'verified', 'expired', 'temporarily_failed', 'revoked');--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"status" "domain_status" DEFAULT 'pending' NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"next_check_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"failing_since" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	CONSTRAINT "domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "domains_next_check_at_idx" ON "domains" USING btree ("next_check_at") WHERE "domains"."status" in ('pending', 'verified', 'temporarily_failed');