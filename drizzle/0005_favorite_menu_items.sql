CREATE TABLE IF NOT EXISTS "bf_v9"."favorite_menu_items" (
  "user_id" text NOT NULL,
  "menu_item_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bf_v9"."favorite_menu_items" ADD CONSTRAINT "favorite_menu_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "bf_v9"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bf_v9"."favorite_menu_items" ADD CONSTRAINT "favorite_menu_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "bf_v9"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "favorite_menu_items_user_item_idx" ON "bf_v9"."favorite_menu_items" USING btree ("user_id","menu_item_id");
