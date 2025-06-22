CREATE SCHEMA IF NOT EXISTS "f3";

CREATE TABLE
	IF NOT EXISTS "f3"."Backblast" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
		"sk" varchar(255) NOT NULL,
		"ingestedAt" timestamp DEFAULT now () NOT NULL,
		"date" date NOT NULL,
		"ao" varchar(64) NOT NULL,
		"q" varchar(64) NOT NULL,
		"pax_count" integer NOT NULL,
		"fngs" varchar(255) NOT NULL,
		"fng_count" integer NOT NULL,
		"backblast" text NOT NULL,
		CONSTRAINT "Backblast_sk_unique" UNIQUE ("sk")
	);