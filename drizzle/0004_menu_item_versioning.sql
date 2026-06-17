ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "logical_id" text;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "is_current_version" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "supersedes" integer;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "change_reason" text;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ADD COLUMN IF NOT EXISTS "created_by" text;
--> statement-breakpoint
UPDATE "bf_v9"."menu_items" SET "logical_id" = concat('menu-', "id") WHERE "logical_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "bf_v9"."menu_items" ALTER COLUMN "logical_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bf_v9"."menu_items" ADD CONSTRAINT "menu_items_supersedes_menu_items_id_fk" FOREIGN KEY ("supersedes") REFERENCES "bf_v9"."menu_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bf_v9"."menu_items" ADD CONSTRAINT "menu_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "bf_v9"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_logical_version_idx" ON "bf_v9"."menu_items" USING btree ("logical_id","version");
