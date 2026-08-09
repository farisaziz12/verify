CREATE TYPE "public"."check_trigger" AS ENUM('manual', 'sweep');--> statement-breakpoint
CREATE TYPE "public"."check_verdict" AS ENUM('pass', 'fail', 'indeterminate');--> statement-breakpoint
CREATE TABLE "checks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"domain_id" uuid NOT NULL,
	"trigger" "check_trigger" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone NOT NULL,
	"lookups" jsonb NOT NULL,
	"verdict" "check_verdict" NOT NULL,
	"diagnosis_code" text NOT NULL,
	"evidence" jsonb,
	"notes" jsonb
);
--> statement-breakpoint
ALTER TABLE "checks" ADD CONSTRAINT "checks_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checks_domain_id_started_at_idx" ON "checks" USING btree ("domain_id","started_at" DESC NULLS LAST);