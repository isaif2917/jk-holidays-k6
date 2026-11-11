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
  validateCreateMember,
  validateSetMemberPassword,
  validateDeleteMember,
  validateSaveMemberDetails,
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

describe("member action validation", () => {
  const member = {
    userId: UUID,
    full_name: "Asha",
    email: "a@example.com",
    phone: "999",
    city: "Goa",
    plan: "Gold",
    status: "Active",
    membership_start: "2026-01-01",
    membership_end: "2027-01-01",
    nights_total: 10,
    nights_used: 2,
  };

  it("createMember reuses the account rules and keeps optional text fields", () => {
    const ok = validateCreateMember({ full_name: "Asha", email: "a@example.com", password: "123456", city: "Goa" });
    expect(ok.city).toBe("Goa");
    expect(ok.phone).toBeUndefined();
    expect(msg(() => validateCreateMember({ full_name: "Asha", email: "a@example.com", password: "1" }))).toBe(
      "Password must be at least 6 characters",
    );
    expect(msg(() => validateCreateMember({ full_name: "A", email: "a@example.com", password: "123456", city: 5 }))).toBe(
      "City must be text",
    );
  });

  it("setMemberPassword needs a uuid and a 6+ character password", () => {
    expect(validateSetMemberPassword({ userId: UUID, password: "123456" })).toEqual({ userId: UUID, password: "123456" });
    expect(msg(() => validateSetMemberPassword({ userId: "", password: "123456" }))).toBe("Member required");
    expect(msg(() => validateSetMemberPassword({ userId: UUID, password: "12" }))).toBe(
      "Password must be at least 6 characters",
    );
  });

  it("deleteMember needs a uuid", () => {
    expect(validateDeleteMember({ userId: UUID })).toEqual({ userId: UUID });
    expect(msg(() => validateDeleteMember({ userId: "nope" }))).toBe("Valid member required");
  });

  it("saveMemberDetails accepts a full member and rejects bad fields", () => {
    expect(validateSaveMemberDetails(member).status).toBe("Active");
    expect(msg(() => validateSaveMemberDetails({ ...member, userId: "x" }))).toBe("Valid member required");
    expect(msg(() => validateSaveMemberDetails({ ...member, full_name: " " }))).toBe(
      "Name is required (100 characters max)",
    );
    expect(msg(() => validateSaveMemberDetails({ ...member, email: "bad" }))).toBe("Valid email required");
    expect(msg(() => validateSaveMemberDetails({ ...member, phone: "9".repeat(41) }))).toBe("Mobile number is too long");
    expect(msg(() => validateSaveMemberDetails({ ...member, city: "c".repeat(101) }))).toBe("City is too long");
    expect(msg(() => validateSaveMemberDetails({ ...member, status: "Banned" }))).toBe("Invalid member status");
    expect(msg(() => validateSaveMemberDetails({ ...member, nights_total: -1 }))).toBe(
      "Nights must be zero or greater",
    );
    expect(msg(() => validateSaveMemberDetails({ ...member, nights_used: 1.5 }))).toBe(
      "Nights must be zero or greater",
    );
  });

  it("saveMemberDetails turns missing optional fields into null", () => {
    const out = validateSaveMemberDetails({ ...member, phone: undefined, plan: undefined, membership_end: undefined });
    expect(out.phone).toBeNull();
    expect(out.plan).toBeNull();
    expect(out.membership_end).toBeNull();
  });
});