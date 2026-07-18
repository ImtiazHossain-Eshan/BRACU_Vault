import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { rolePermissions, userRoles } from "../db/schema";

/** Resolves a user's roles and effective permissions from the RBAC tables.
 *  Permissions are read from the DB (role_permissions), never hardcoded. */
export class RbacRepository {
  constructor(private readonly db: Db) {}

  async rolesForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    return rows.map((r) => r.roleId);
  }

  async permissionsForUser(userId: string): Promise<Set<string>> {
    const rows = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.userId, userId));
    return new Set(rows.map((r) => r.permissionId));
  }
}
