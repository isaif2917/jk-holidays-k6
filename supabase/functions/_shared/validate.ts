// Input validation for admin-ops actions.
//
// PURE TypeScript on purpose: no Deno.*, npm:, jsr: or https:// imports, so vitest can
// import this file directly (src/test/admin-validate.test.ts) and the rules stay tested.
//
// Ported 1:1 from the inputValidator chains that used to live in src/lib/admin.functions.ts.
// Keep the error messages byte-identical: they are shown to admins in toasts.

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const STAFF_ROLES = ["manager", "supervisor", "operations_manager", "other"] as const;
export const ALL_ROLES = ["admin", ...STAFF_ROLES] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AnyRole = (typeof ALL_ROLES)[number];

const EMAIL = /^\S+@\S+\.\S+$/;
const UUID = /^[0-9a-f-]{36}$/i;

const isString = (v: unknown): v is string => typeof v === "string";

export type CreateAdminInput = { full_name: string; email: string; password: string };

export type CreateStaffInput = CreateAdminInput & { role: StaffRole; roleLabel?: string };

export type RemoveRoleInput = { userId: string; role: AnyRole };

export type UpdateRoleAccountInput = {
  userId: string;
  oldRole: AnyRole;
  role: AnyRole;
  roleLabel?: string;
  full_name: string;
  email: string;
  password?: string;
};

// deno-lint-ignore no-explicit-any
type Raw = any;

export function validateCreateAdmin(d: Raw): CreateAdminInput {
  if (!isString(d?.email) || !EMAIL.test(d.email)) throw new ValidationError("Valid email required");
  if (!isString(d.full_name) || !d.full_name || d.full_name.length > 100) throw new ValidationError("Name required");
  if (!isString(d.password) || d.password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters");
  }
  return { full_name: d.full_name, email: d.email, password: d.password };
}

export function validateCreateStaff(d: Raw): CreateStaffInput {
  const base = validateCreateAdmin(d);
  if (!(STAFF_ROLES as readonly unknown[]).includes(d.role)) throw new ValidationError("Choose a role");
  if (d.role === "other" && (!isString(d.roleLabel) || !d.roleLabel.trim() || d.roleLabel.trim().length > 60)) {
    throw new ValidationError("Type the staff role (60 characters max)");
  }
  return { ...base, role: d.role, roleLabel: isString(d.roleLabel) ? d.roleLabel : undefined };
}

export function validateRemoveRole(d: Raw): RemoveRoleInput {
  if (!isString(d?.userId) || !UUID.test(d.userId)) throw new ValidationError("Valid account required");
  if (!(ALL_ROLES as readonly unknown[]).includes(d.role)) throw new ValidationError("Invalid role");
  return { userId: d.userId, role: d.role };
}

export function validateUpdateRoleAccount(d: Raw): UpdateRoleAccountInput {
  if (!isString(d?.userId) || !UUID.test(d.userId)) throw new ValidationError("Valid account required");
  if (!(ALL_ROLES as readonly unknown[]).includes(d.oldRole)) throw new ValidationError("Invalid current role");
  if (!(ALL_ROLES as readonly unknown[]).includes(d.role)) throw new ValidationError("Choose a valid role");
  if (d.role === "other" && (!isString(d.roleLabel) || !d.roleLabel.trim() || d.roleLabel.trim().length > 60)) {
    throw new ValidationError("Type the role (60 characters max)");
  }
  if (!isString(d.full_name) || !d.full_name.trim() || d.full_name.length > 100) {
    throw new ValidationError("Name is required (100 characters max)");
  }
  if (!isString(d.email) || !EMAIL.test(d.email) || d.email.length > 255) {
    throw new ValidationError("Valid email required");
  }
  if (d.password !== undefined && d.password !== null && d.password !== "") {
    if (!isString(d.password) || d.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }
  }
  return {
    userId: d.userId,
    oldRole: d.oldRole,
    role: d.role,
    roleLabel: isString(d.roleLabel) ? d.roleLabel : undefined,
    full_name: d.full_name,
    email: d.email,
    password: d.password || undefined,
  };
}
