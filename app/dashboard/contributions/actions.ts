"use server";

import { z } from "zod";

import type {
  CashAllocationInput,
  CashAllocationType,
  CashContributionReceipt,
  CashierSession,
  Loan,
  Member,
  RepaymentSchedule,
  ShareAccount,
  ShareMoney,
  ContributionCharge,
  CashDeposit,
} from "@/lib/go-api-client";
import {
  closeCashierSession,
  createCashContribution,
  openCashierSession,
  getCashContext,
  getContributionQuote,
  listContributionCharges,
  getCashReceipt,
  listCashierSessions,
  listCashDeposits,
  getCashDeposit,
  acceptCashHandover,
  recordCashDeposit,
  verifyCashDeposit,
  createContributionCharge,
} from "@/lib/server/contributions-api";
import { GoApiError } from "@/lib/server/go-api";
import { getLoan, listLoans } from "@/lib/server/loans-api";
import { getMember } from "@/lib/server/members-api";
import { getRepaymentSchedule } from "@/lib/server/repayments-api";
import { getShareAccount, getShareBalance } from "@/lib/server/shares-api";

const moneySchema = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/, "Enter a valid KES amount.");
const positiveMoneySchema = moneySchema.refine(
  (value) => minorUnits(value) > 0,
  "Amount must be greater than zero.",
);
const allocationSchema = z.object({
  type: z.enum([
    "CONTRIBUTION_ALLOCATION_TYPE_COM",
    "CONTRIBUTION_ALLOCATION_TYPE_LGOM",
    "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE",
    "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL",
    "CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE",
    "CONTRIBUTION_ALLOCATION_TYPE_PENALTY",
  ]),
  targetId: z.uuid().optional(),
  amount: positiveMoneySchema,
});

// CashErrorState gives every action the same retry and field-error contract.
export type CashErrorState = {
  ok: false;
  message: string;
  retry?: boolean;
  // Only a posting-endpoint rejection can release a saved uncertain request; a failed read cannot.
  definitive?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
};

// CashMutationState carries the authoritative receipt or till returned by a successful mutation.
export type CashMutationState =
  | null
  | CashErrorState
  | {
      ok: true;
      message: string;
      session?: CashierSession;
      receipt?: CashContributionReceipt;
      member?: Member;
      shareBalance?: ShareMoney;
      deposit?: CashDeposit;
    };

// CashLoanDetails keeps each payable loan beside its authoritative installment schedule.
export type CashLoanDetails = {
  loan: Loan;
  schedule: RepaymentSchedule[];
  scheduleError?: string;
};

// CashMemberState contains the member and authoritative reads required by the entry form.
export type CashMemberState =
  | null
  | CashErrorState
  | {
      ok: true;
      member: Member;
      shareAccount?: ShareAccount;
      shareBalance?: ShareMoney;
      loans: CashLoanDetails[];
      warnings: string[];
      loansUnavailable?: boolean;
      sharesUnavailable?: boolean;
    };

// ValidatedAllocation names the checked JSON shape used during target ownership verification.
type ValidatedAllocation = {
  type: CashAllocationType;
  targetId?: string;
  amount: string;
};

// minorUnits compares and totals validated KES values as safe integer cents.
function minorUnits(value: string) {
  const [units, fraction = ""] = value.split(".");
  return Number(units) * 100 + Number(fraction.padEnd(2, "0"));
}

// moneyFrom converts validated decimal input to the protobuf Money JSON shape.
function moneyFrom(value: string): ShareMoney {
  const [units, fraction = ""] = value.split(".");
  return { currencyCode: "KES", units, nanos: Number(fraction.padEnd(9, "0")) };
}

// parseAllocations rejects malformed browser JSON before it reaches the contribution API.
function parseAllocations(value: FormDataEntryValue | null) {
  try {
    return allocationSchema
      .array()
      .min(1, "Add at least one allocation.")
      .safeParse(JSON.parse(String(value)));
  } catch {
    return allocationSchema.array().safeParse(null);
  }
}

// targetsBelongToMember prevents a crafted server-action request from paying another member's ledger.
async function targetsBelongToMember(
  memberId: string,
  branchId: string,
  allocations: ValidatedAllocation[],
) {
  const checks = allocations.map(async (allocation) => {
    if (allocation.type === "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE") {
      if (!allocation.targetId) return false;
      const result = await getShareAccount({
        branchId,
        accountId: allocation.targetId,
      });
      return (
        result.account?.memberId === memberId &&
        result.account.status === "SHARE_ACCOUNT_STATUS_ACTIVE"
      );
    }
    if (allocation.type === "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL") {
      if (!allocation.targetId) return false;
      const result = await getLoan({ loanId: allocation.targetId });
      return (
        result.loan?.memberId === memberId &&
        [
          "LOAN_STATUS_DISBURSED",
          "LOAN_STATUS_ACTIVE",
          "LOAN_STATUS_DELINQUENT",
        ].includes(result.loan.status)
      );
    }
    if (
      [
        "CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE",
        "CONTRIBUTION_ALLOCATION_TYPE_PENALTY",
      ].includes(allocation.type)
    )
      return Boolean(allocation.targetId);
    return !allocation.targetId;
  });
  return (await Promise.all(checks)).every(Boolean);
}

// failure maps transport outcomes without exposing internal backend details.
function failure(error: unknown, postingRejected = false): CashErrorState {
  if (error instanceof GoApiError) {
    const messages: Record<number, string> = {
      400: "Check the details and try again.",
      401: "Your session has expired.",
      403: "You do not have permission for this cash operation.",
      404: "The requested cash record was not found.",
      409: "This operation conflicts with the current cash state.",
      504: "The cash service took too long to respond.",
    };
    return {
      ok: false,
      definitive: postingRejected && [3, 5, 6, 9].includes(error.code ?? 0),
      retry:
        ![3, 5, 6, 9].includes(error.code ?? 0) &&
        ![400, 401, 403, 404, 409, 422].includes(error.status),
      message: `${error.detail ?? messages[error.status] ?? "The cash service is unavailable."} Reference: ${error.requestId}`,
    };
  }
  console.error("Unexpected cash contribution failure", error);
  return {
    ok: false,
    retry: true,
    message: "Something went wrong. Please try again.",
  };
}

// findCashMemberAction verifies one exact identifier and loads the member's contribution position.
export async function findCashMemberAction(
  _previous: CashMemberState,
  formData: FormData,
): Promise<CashMemberState> {
  const parsed = z
    .object({
      lookupBy: z.enum(["memberNumber", "nationalId"]),
      lookup: z.string().trim().min(1, "Enter a member number or national ID."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: "Check the member search.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  if (
    parsed.data.lookupBy === "memberNumber" &&
    !/^\d+$/.test(parsed.data.lookup)
  )
    return {
      ok: false,
      message: "Check the member number.",
      fieldErrors: { lookup: ["Enter a valid member number."] },
    };
  let member: Member;
  let branchId: string;
  try {
    branchId = (await getCashContext()).branchId;
    const identifier =
      parsed.data.lookupBy === "memberNumber"
        ? { branchId, memberNumber: parsed.data.lookup }
        : { branchId, nationalId: parsed.data.lookup };
    const result = await getMember(identifier);
    if (!result.member)
      return { ok: false, message: "No member matched that identifier." };
    member = result.member;
    if (member.status !== "MEMBER_STATUS_ACTIVE")
      return {
        ok: false,
        message: "Cash contributions can only be recorded for active members.",
      };
  } catch (error) {
    if (error instanceof GoApiError && error.status === 404)
      return { ok: false, message: "No member matched that identifier." };
    return failure(error);
  }
  const warnings: string[] = [];
  const [shares, loans] = await Promise.allSettled([
    getShareAccount({ branchId, nationalId: member.nationalId }),
    (async () => {
      const rows: Loan[] = [];
      let pageToken = "";
      do {
        const page = await listLoans({
          memberId: member.id,
          pageSize: 100,
          pageToken,
        });
        rows.push(...(page.loans ?? []));
        pageToken = page.nextPageToken ?? "";
      } while (pageToken);
      return rows.filter((loan) =>
        [
          "LOAN_STATUS_DISBURSED",
          "LOAN_STATUS_ACTIVE",
          "LOAN_STATUS_DELINQUENT",
        ].includes(loan.status),
      );
    })(),
  ]);
  const sharesUnavailable =
    shares.status === "rejected" &&
    !(shares.reason instanceof GoApiError && shares.reason.status === 404);
  const loansUnavailable = loans.status === "rejected";
  if (sharesUnavailable)
    warnings.push(
      `Share account unavailable. ${failure(shares.reason).message}`,
    );
  if (loansUnavailable)
    warnings.push(`Loan list unavailable. ${failure(loans.reason).message}`);
  const account =
    shares.status === "fulfilled" ? shares.value.account : undefined;
  const shareAccount =
    account?.status === "SHARE_ACCOUNT_STATUS_ACTIVE" ? account : undefined;
  const [balance, details] = await Promise.all([
    shareAccount
      ? getShareBalance({ accountId: shareAccount.id, consistencyStrong: true })
          .then((r) => r.balance)
          .catch((error) => {
            warnings.push(
              `Share balance unavailable. ${failure(error).message}`,
            );
            return undefined;
          })
      : undefined,
    Promise.all(
      (loans.status === "fulfilled" ? loans.value : []).map(async (loan) => {
        try {
          return {
            loan,
            schedule:
              (await getRepaymentSchedule({ loanId: loan.id })).schedule ?? [],
          };
        } catch (error) {
          return { loan, schedule: [], scheduleError: failure(error).message };
        }
      }),
    ),
  ]);
  return {
    ok: true,
    member,
    shareAccount,
    shareBalance: balance,
    loans: details,
    warnings,
    sharesUnavailable,
    loansUnavailable,
  };
}

// loadCashObligationsAction refreshes month-specific fees and charges independently of member identity.
// Removing it would turn a financial read failure into a misleading member-not-found result.
export async function loadCashObligationsAction(
  memberId: string,
  period: string,
) {
  const parsed = z
    .object({
      memberId: z.uuid(),
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    })
    .safeParse({ memberId, period });
  if (!parsed.success)
    return {
      ok: false as const,
      message: "Choose a valid contribution month.",
    };
  try {
    const [quote, charges] = await Promise.all([
      getContributionQuote(memberId, `${period}-01`),
      (async () => {
        const rows: ContributionCharge[] = [];
        let pageToken = "";
        do {
          const page = await listContributionCharges(memberId, pageToken);
          rows.push(...(page.charges ?? []));
          pageToken = page.nextPageToken ?? "";
        } while (pageToken);
        return rows;
      })(),
    ]);
    return { ok: true as const, fees: quote.fees ?? [], charges };
  } catch (error) {
    return failure(error);
  }
}

// openCashierSessionAction explicitly starts or resumes the authenticated cashier's till.
export async function openCashierSessionAction(): Promise<CashMutationState> {
  try {
    const result = await openCashierSession();
    if (!result.session)
      return { ok: false, message: "The backend returned no cashier session." };
    return {
      ok: true,
      message: "Till is open and ready.",
      session: result.session,
    };
  } catch (error) {
    return failure(error);
  }
}

// recordCashContributionAction validates one allocation plan and preserves its idempotency key.
export async function recordCashContributionAction(
  _previous: CashMutationState,
  formData: FormData,
): Promise<CashMutationState> {
  const form = z
    .object({
      idempotencyKey: z.uuid(),
      sessionId: z.uuid(),
      memberId: z.uuid(),
      contributionPeriod: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      amount: positiveMoneySchema,
    })
    .safeParse(Object.fromEntries(formData));
  const allocations = parseAllocations(formData.get("allocations"));
  if (!form.success || !allocations.success)
    return {
      ok: false,
      message: "Check the contribution details.",
      fieldErrors: {
        ...form.error?.flatten().fieldErrors,
        allocations: allocations.error?.issues.map((issue) => issue.message),
      },
    };
  const input: CashAllocationInput[] = allocations.data.map((item) => ({
    ...item,
    amount: moneyFrom(item.amount),
  }));
  let posting = false;
  try {
    const context = await getCashContext();
    // A committed retry must reach backend idempotency even if the member or targets have since changed state.
    // Removing this lookup lets frontend eligibility checks block recovery of already received cash.
    const existing = await getCashReceipt({
      idempotencyKey: form.data.idempotencyKey,
    }).catch((error) => {
      if (error instanceof GoApiError && error.status === 404) return undefined;
      throw error;
    });
    if (!existing?.receipt) {
      const member = await getMember({
        branchId: context.branchId,
        memberId: form.data.memberId,
      });
      if (member.member?.status !== "MEMBER_STATUS_ACTIVE")
        return {
          ok: false,
          message: "The member is no longer eligible for contributions.",
        };
      if (
        !(await targetsBelongToMember(
          form.data.memberId,
          context.branchId,
          allocations.data,
        ))
      )
        return {
          ok: false,
          message: "Check the selected share, loan, or charge targets.",
        };
    }
    posting = true;
    const result = await createCashContribution({
      ...form.data,
      contributionPeriod: `${form.data.contributionPeriod}-01`,
      amount: moneyFrom(form.data.amount),
      allocations: input,
    });
    if (
      !result.receipt?.id ||
      !result.receipt.amount ||
      !result.receipt.sessionId
    )
      return {
        ok: false,
        retry: true,
        message:
          "The receipt could not be confirmed. Check or retry the same contribution.",
      };
    const messages = {
      completed: "Cash received and allocations completed.",
      manual_review:
        "Cash was received, but its allocations require manual review.",
    };
    const member = await getMember({
      branchId: context.branchId,
      memberId: result.receipt.memberId,
    })
      .then((response) => response.member)
      .catch(() => undefined);
    const shareTarget = result.receipt.allocations?.find(
      (row) => row.type === "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE",
    )?.targetId;
    const shareBalance =
      result.receipt.status === "completed" && shareTarget
        ? await getShareBalance({
            accountId: shareTarget,
            consistencyStrong: true,
          })
            .then((response) => response.balance)
            .catch(() => undefined)
        : undefined;
    return {
      ok: true,
      receipt: result.receipt,
      member,
      shareBalance,
      message:
        messages[result.receipt.status as keyof typeof messages] ??
        `Cash receipt returned with status ${result.receipt.status}.`,
    };
  } catch (error) {
    return failure(error, posting);
  }
}

// closeCashierSessionAction lets the backend calculate and return the authoritative variance.
export async function closeCashierSessionAction(
  _previous: CashMutationState,
  formData: FormData,
): Promise<CashMutationState> {
  const parsed = z
    .object({
      sessionId: z.uuid(),
      countedAmount: moneySchema,
      varianceReason: z.string().trim().max(500),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: "Check the till count.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  try {
    const result = await closeCashierSession({
      ...parsed.data,
      countedAmount: moneyFrom(parsed.data.countedAmount),
    });
    if (!result.session)
      return { ok: false, message: "The backend returned no closed session." };
    return {
      ok: true,
      message: "Till closed and reconciled.",
      session: result.session,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function loadCashWorkspaceAction() {
  try {
    return { ok: true as const, context: await getCashContext() };
  } catch (error) {
    return failure(error);
  }
}

export async function recoverCashReceiptAction(input: {
  receiptId?: string;
  idempotencyKey?: string;
}): Promise<CashMutationState> {
  const parsed = z
    .object({
      receiptId: z.uuid().optional(),
      idempotencyKey: z.uuid().optional(),
    })
    .safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Invalid receipt reference." };
  try {
    const context = await getCashContext();
    const result = await getCashReceipt(parsed.data);
    if (!result.receipt) return { ok: false, message: "No receipt returned." };
    const member = await getMember({
      branchId: context.branchId,
      memberId: result.receipt.memberId,
    })
      .then((response) => response.member)
      .catch(() => undefined);
    const shareTarget = result.receipt.allocations?.find(
      (row) => row.type === "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE",
    )?.targetId;
    const shareBalance =
      result.receipt.status === "completed" && shareTarget
        ? await getShareBalance({
            accountId: shareTarget,
            consistencyStrong: true,
          })
            .then((response) => response.balance)
            .catch(() => undefined)
        : undefined;
    return {
      ok: true,
      receipt: result.receipt,
      member,
      shareBalance,
      message: "Cash receipt recovered.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function loadCashCustodyAction(
  sessionToken = "",
  depositToken = "",
) {
  try {
    const [context, sessions, deposits] = await Promise.all([
      getCashContext(),
      listCashierSessions(sessionToken),
      listCashDeposits(depositToken),
    ]);
    return {
      ok: true as const,
      context,
      sessions: sessions.sessions ?? [],
      deposits: deposits.deposits ?? [],
      sessionToken: sessions.nextPageToken,
      depositToken: deposits.nextPageToken,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function cashCustodyAction(
  _previous: CashMutationState,
  data: FormData,
): Promise<CashMutationState> {
  const operation = String(data.get("operation"));
  try {
    if (operation === "handover") {
      const id = z.uuid().safeParse(data.get("sessionId"));
      if (!id.success) return { ok: false, message: "Select a valid till." };
      const result = await acceptCashHandover(id.data);
      if (!result.session?.id)
        return {
          ok: false,
          retry: true,
          message: "Handover could not be confirmed. Refresh custody or retry.",
        };
      return {
        ok: true,
        session: result.session,
        message: "Cash handover accepted.",
      };
    }
    if (operation === "deposit") {
      const parsed = z
        .object({
          sessionIds: z.array(z.uuid()).min(1),
          amount: positiveMoneySchema,
          bankReference: z.string().trim().min(1).max(200),
        })
        .safeParse({
          sessionIds: data.getAll("sessionIds"),
          amount: data.get("amount"),
          bankReference: data.get("bankReference"),
        });
      if (!parsed.success)
        return {
          ok: false,
          message:
            "Select tills, enter the deposited amount and bank reference.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        };
      const result = await recordCashDeposit({
        ...parsed.data,
        amount: moneyFrom(parsed.data.amount),
      });
      if (!result.deposit?.id)
        return {
          ok: false,
          retry: true,
          message:
            "The deposit could not be confirmed. Retry the same details.",
        };
      return {
        ok: true,
        deposit: result.deposit,
        message: "Bank deposit recorded; independent verification is required.",
      };
    }
    const id = z.uuid().safeParse(data.get("depositId"));
    if (!id.success) return { ok: false, message: "Select a valid deposit." };
    if (operation === "verify") {
      const result = await verifyCashDeposit(id.data);
      if (!result.deposit?.id)
        return {
          ok: false,
          retry: true,
          message:
            "Verification could not be confirmed. Refresh custody or retry.",
        };
      return {
        ok: true,
        deposit: result.deposit,
        message: "Bank deposit verified.",
      };
    }
    if (operation === "details") {
      const result = await getCashDeposit(id.data);
      return {
        ok: true,
        deposit: result.deposit,
        message: "Deposit details loaded.",
      };
    }
    return { ok: false, message: "Unknown cash operation." };
  } catch (error) {
    return failure(
      error,
      operation === "deposit" ||
        operation === "handover" ||
        operation === "verify",
    );
  }
}

export async function assessCashChargeAction(
  _previous: CashMutationState,
  data: FormData,
): Promise<CashMutationState> {
  const parsed = z
    .object({
      idempotencyKey: z.uuid(),
      memberId: z.uuid(),
      category: z.enum([
        "literature",
        "caritas_registration",
        "lsf",
        "laptop",
        "penalty",
        "other",
      ]),
      amount: positiveMoneySchema,
      reason: z.string().trim().min(1).max(500),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return {
      ok: false,
      message: "Choose a category and enter a positive amount and reason.",
    };
  try {
    const result = await createContributionCharge({
      ...parsed.data,
      amount: moneyFrom(parsed.data.amount),
    });
    if (!result.charge?.id)
      return {
        ok: false,
        retry: true,
        message:
          "The assessment could not be confirmed. Retry the same details.",
      };
    return {
      ok: true,
      message: "Charge assessed. Reload obligations to select it for payment.",
    };
  } catch (error) {
    return failure(error, true);
  }
}
