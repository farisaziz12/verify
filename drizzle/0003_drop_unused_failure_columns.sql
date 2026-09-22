DROP INDEX "domains_next_check_at_idx";--> statement-breakpoint
CREATE INDEX "domains_next_check_at_idx" ON "domains" USING btree ("next_check_at") WHERE "domains"."status" in ('pending', 'verified');--> statement-breakpoint
ALTER TABLE "domains" DROP COLUMN "consecutive_failures";--> statement-breakpoint
ALTER TABLE "domains" DROP COLUMN "failing_since";