import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { menuItemsTable } from "../../db/schema.ts";
import type { MenuItem } from "../../shared/contracts.ts";

type MenuRow = typeof menuItemsTable.$inferSelect;

function toMenuItem(row: MenuRow): MenuItem {
  return {
    id: row.id,
    logicalId: row.logicalId,
    version: row.version,
    name: row.name,
    price: row.price,
    category: row.category,
    description: row.description,
    image_url: row.imageUrl,
    isCurrentVersion: row.isCurrentVersion,
    supersedes: row.supersedes ?? undefined,
    changeReason: row.changeReason ?? undefined,
  };
}

export class MenuRepository {
  async getCurrentMenu(): Promise<MenuItem[]> {
    const rows = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.isCurrentVersion, true))
      .orderBy(asc(menuItemsTable.id));

    return rows.map(toMenuItem);
  }

  async getMenuVersionHistory(logicalId: string): Promise<MenuItem[]> {
    const rows = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.logicalId, logicalId))
      .orderBy(asc(menuItemsTable.version));

    return rows.map(toMenuItem);
  }

  async createMenuItem(input: {
    name: string;
    price: number;
    category: string;
    description: string;
    image_url: string;
    createdBy?: string;
  }): Promise<MenuItem> {
    const [inserted] = await db
      .insert(menuItemsTable)
      .values({
        logicalId: "pending",
        version: 1,
        name: input.name,
        price: input.price,
        category: input.category,
        description: input.description,
        imageUrl: input.image_url,
        isCurrentVersion: true,
        changeReason: "Initial creation",
        createdBy: input.createdBy,
      })
      .returning();

    if (!inserted) throw new Error("Failed to insert menu item");

    const logicalId = `menu-${inserted.id}`;
    const [updated] = await db
      .update(menuItemsTable)
      .set({ logicalId })
      .where(eq(menuItemsTable.id, inserted.id))
      .returning();

    return toMenuItem(updated ?? { ...inserted, logicalId });
  }

  async updateMenuItem(
    menuId: number,
    patch: {
      name?: string;
      price?: number;
      category?: string;
      description?: string;
      image_url?: string;
      changeReason?: string;
      createdBy?: string;
    },
  ): Promise<MenuItem | null> {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(menuItemsTable)
        .where(
          and(
            eq(menuItemsTable.id, menuId),
            eq(menuItemsTable.isCurrentVersion, true),
          ),
        )
        .limit(1);

      if (!current) return null;

      await tx
        .update(menuItemsTable)
        .set({ isCurrentVersion: false })
        .where(eq(menuItemsTable.id, current.id));

      const [next] = await tx
        .insert(menuItemsTable)
        .values({
          logicalId: current.logicalId,
          version: current.version + 1,
          name: patch.name ?? current.name,
          price: patch.price ?? current.price,
          category: patch.category ?? current.category,
          description: patch.description ?? current.description,
          imageUrl: patch.image_url ?? current.imageUrl,
          isCurrentVersion: true,
          supersedes: current.id,
          changeReason: patch.changeReason ?? "Menu item updated",
          createdBy: patch.createdBy ?? current.createdBy,
        })
        .returning();

      if (!next) throw new Error("Failed to insert menu item version");
      return toMenuItem(next);
    });
  }

  async deleteMenuItem(menuId: number): Promise<MenuItem | null> {
    const [removed] = await db
      .update(menuItemsTable)
      .set({ isCurrentVersion: false, changeReason: "Menu item removed" })
      .where(eq(menuItemsTable.id, menuId))
      .returning();

    return removed ? toMenuItem(removed) : null;
  }

  async validateMenuItemsAreCurrent(menuItemIds: number[]): Promise<{
    valid: boolean;
    outdatedIds: number[];
  }> {
    if (menuItemIds.length === 0) return { valid: true, outdatedIds: [] };

    const rows = await db
      .select({
        id: menuItemsTable.id,
        isCurrentVersion: menuItemsTable.isCurrentVersion,
      })
      .from(menuItemsTable)
      .where(inArray(menuItemsTable.id, menuItemIds));

    const currentById = new Map(rows.map((row) => [row.id, row.isCurrentVersion]));
    const outdatedIds = menuItemIds.filter((id) => currentById.get(id) !== true);

    return { valid: outdatedIds.length === 0, outdatedIds };
  }

  async backfillVersionColumns(): Promise<void> {
    await db.execute(sql`
      update ${menuItemsTable}
      set logical_id = concat('menu-', id)
      where logical_id = 'pending'
    `);
  }
}

export const menuRepository = new MenuRepository();
