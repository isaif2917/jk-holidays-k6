import { describe, expect, it } from "vitest";
import {
  ValidationError,
  validateCreateAdmin,
  validateCreateStaff,
  validateRemoveRole,
  validateUpdateRoleAccount,
  validateSettleReferral,
  validateRejectReferral,
  validateCreateCustomReward,
} from "../../supabase/functions/_shared/validate";

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const msg = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ValidationError);
    return (e as Error).message;
  }
  return null;
};

describe("createAdmin validation", () => {
  const ok = { full_name: "Test", email: "t@example.com", password: "123456" };

  it("accepts valid input", () => {
    expect(validateCreateAdmin(ok)).toEqual(ok);
  });
  it("rejects a bad email", () => {
    expect(msg(() => validateCreateAdmin({ ...ok, email: "nope" }))).toBe("Valid email required");
    expect(msg(() => validateCreateAdmin({ ...ok, email: undefined }))).toBe("Valid email required");
  });
  it("rejects a missing or over-long name", () => {
    expect(msg(() => validateCreateAdmin({ ...ok, full_name: "" }))).toBe("Name required");
    expect(msg(() => validateCreateAdmin({ ...ok, full_name: "x".repeat(101) }))).toBe("Name required");
  });
  it("rejects a short password", () => {
    expect(msg(() => validateCreateAdmin({ ...ok, password: "12345" }))).toBe("Password must be at least 6 characters");
  });
  it("rejects a non-object payload", () => {
    expect(msg(() => validateCreateAdmin(null))).toBe("Valid email required");
  });
  it("drops unexpected fields", () => {
    expect(validateCreateAdmin({ ...ok, role: "admin", isAdmin: true })).toEqual(ok);
  });
});

describe("createStaff validation", () => {
  const ok = { full_name: "Test", email: "t@example.com", password: "123456", role: "manager" };

  it("accepts the staff roles but not admin", () => {
    expect(validateCreateStaff(ok).role).toBe("manager");
    expect(msg(() => validateCreateStaff({ ...ok, role: "admin" }))).toBe("Choose a role");
    expect(msg(() => validateCreateStaff({ ...ok, role: "member" }))).toBe("Choose a role");
  });
  it("requires a label for the 'other' role, max 60 characters", () => {
    const other = { ...ok, role: "other" };
    expect(msg(() => validateCreateStaff(other))).toBe("Type the staff role (60 characters max)");
    expect(msg(() => validateCreateStaff({ ...other, roleLabel: "  " }))).toBe("Type the staff role (60 characters max)");
    expect(msg(() => validateCreateStaff({ ...other, roleLabel: "x".repeat(61) }))).toBe(
      "Type the staff role (60 characters max)",
    );
    expect(validateCreateStaff({ ...other, roleLabel: "Field Executive" }).roleLabel).toBe("Field Executive");
  });
  it("still applies the account checks", () => {
    expect(msg(() => validateCreateStaff({ ...ok, password: "1" }))).toBe("Password must be at least 6 characters");
  });
});

describe("removeRole validation", () => {
  it("accepts a uuid and a known role", () => {
    expect(validateRemoveRole({ userId: UUID, role: "supervisor" })).toEqual({ userId: UUID, role: "supervisor" });
  });
  it("rejects a bad id or role", () => {
    expect(msg(() => validateRemoveRole({ userId: "abc", role: "admin" }))).toBe("Valid account required");
    expect(msg(() => validateRemoveRole({ userId: UUID, role: "root" }))).toBe("Invalid role");
  });
});

describe("updateRoleAccount validation", () => {
  const ok = {
    userId: UUID,
    oldRole: "manager",
    role: "supervisor",
    full_name: "Test",
    email: "t@example.com",
  };

  it("accepts input without a password and treats an empty one as absent", () => {
    expect(validateUpdateRoleAccount(ok).password).toBeUndefined();
    expect(validateUpdateRoleAccount({ ...ok, password: "" }).password).toBeUndefined();
  });
  it("rejects a short new password", () => {
    expect(msg(() => validateUpdateRoleAccount({ ...ok, password: "123" }))).toBe(
      "Password must be at least 6 characters",
    );
  });
  it("rejects bad roles, ids, names and emails", () => {
    expect(msg(() => validateUpdateRoleAccount({ ...ok, userId: "x" }))).toBe("Valid account required");
    expect(msg(() => validateUpdateRoleAccount({ ...ok, oldRole: "x" }))).toBe("Invalid current role");
    expect(msg(() => validateUpdateRoleAccount({ ...ok, role: "x" }))).toBe("Choose a valid role");
    expect(msg(() => validateUpdateRoleAccount({ ...ok, full_name: "  " }))).toBe(
      "Name is required (100 characters max)",
    );
    expect(msg(() => validateUpdateRoleAccount({ ...ok, email: "bad" }))).toBe("Valid email required");
  });
  it("requires a label when the new role is 'other'", () => {
    expect(msg(() => validateUpdateRoleAccount({ ...ok, role: "other" }))).toBe("Type the role (60 characters max)");
    expect(validateUpdateRoleAccount({ ...ok, role: "other", roleLabel: "Driver" }).roleLabel).toBe("Driver");
  });
});

describe("referral action validation", () => {
  it("settleReferral needs a uuid and a positive number", () => {
    expect(validateSettleReferral({ referralId: UUID, amount: 100 })).toEqual({ referralId: UUID, amount: 100 });
    expect(msg(() => validateSettleReferral({ referralId: "x", amount: 100 }))).toBe("Valid referral required");
    expect(msg(() => validateSettleReferral({ referralId: UUID, amount: 0 }))).toBe("Enter the reward amount to settle");
    expect(msg(() => validateSettleReferral({ referralId: UUID, amount: "100" }))).toBe(
      "Enter the reward amount to settle",
    );
    expect(msg(() => validateSettleReferral({ referralId: UUID, amount: Infinity }))).toBe(
      "Enter the reward amount to settle",
    );
  });
  it("rejectReferral needs a uuid", () => {
    expect(validateRejectReferral({ referralId: UUID })).toEqual({ referralId: UUID });
    expect(msg(() => validateRejectReferral({}))).toBe("Valid referral required");
  });
  it("createCustomReward checks member, amount and note length", () => {
    expect(validateCreateCustomReward({ userId: UUID, amount: 50 })).toEqual({
      userId: UUID,
      amount: 50,
      note: undefined,
    });
    expect(msg(() => validateCreateCustomReward({ userId: "x", amount: 50 }))).toBe("Choose a member first");
    expect(msg(() => validateCreateCustomReward({ userId: UUID, amount: -1 }))).toBe(
      "Enter a reward amount greater than zero",
    );
    expect(msg(() => validateCreateCustomReward({ userId: UUID, amount: 5, note: "x".repeat(201) }))).toBe(
      "Note is limited to 200 characters",
    );
    expect(validateCreateCustomReward({ userId: UUID, amount: 5, note: "x".repeat(200) }).note).toHaveLength(200);
  });
});
