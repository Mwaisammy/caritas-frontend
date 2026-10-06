export type StaffRole =
  | "system_admin"
  | "manager"
  | "loan_officer"
  | "cashier"
  | "auditor"
  | "chairperson"
  | "secretary"

export interface StaffUser {
  id: string
  authUserId: string
  branchId: string
  email: string
  name: string
  role: StaffRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateStaffUserRequest {
  authUserId: string
  branchId: string
  email: string
  name: string
  role: StaffRole
}

export interface CreateStaffUserResponse {
  staffUser?: StaffUser
}

export type MemberStatus =
  | "MEMBER_STATUS_UNSPECIFIED"
  | "MEMBER_STATUS_PENDING"
  | "MEMBER_STATUS_ACTIVE"
  | "MEMBER_STATUS_SUSPENDED"
  | "MEMBER_STATUS_CLOSED"
  | "MEMBER_STATUS_REJECTED"

export type RelationshipType =
  | "RELATIONSHIP_TYPE_UNSPECIFIED"
  | "RELATIONSHIP_TYPE_SPOUSE"
  | "RELATIONSHIP_TYPE_CHILD"
  | "RELATIONSHIP_TYPE_PARENT"
  | "RELATIONSHIP_TYPE_SIBLING"
  | "RELATIONSHIP_TYPE_FRIEND"
  | "RELATIONSHIP_TYPE_OTHER"

export interface MemberProfile {
  personal?: {
    fullName: string
    phone: string
    email: string
    dateOfBirth: string
    address: string
  }
  employment?: {
    occupation: string
    employer: string
    monthlyIncome?: {
      currencyCode: string
      units: string
      nanos: number
    }
  }
  idDocument?: {
    type: string
    number: string
  }
  nextOfKin?: {
    name: string
    phone: string
    relationship: RelationshipType
  }
}

export interface Member {
  id: string
  branchId: string
  memberNumber: string
  nationalId: string
  status: MemberStatus
  profile?: MemberProfile
  registeredAt: string
  lastUpdated: string
}

export interface RegisterMemberRequest {
  branchId: string
  nationalId: string
  profile: MemberProfile
}

export interface RegisterMemberResponse {
  memberId: string
  memberNumber: string
  status: MemberStatus
}

export type GetMemberRequest =
  | { branchId: string; memberId: string; nationalId?: never; memberNumber?: never }
  | { branchId: string; nationalId: string; memberId?: never; memberNumber?: never }
  | { branchId: string; memberNumber: string; memberId?: never; nationalId?: never }

export interface GetMemberResponse {
  member?: Member
}

export interface ListMembersRequest {
  branchId: string
  pageSize?: number
  pageToken?: string
  statusFilter?: MemberStatus
}

export interface ListMembersResponse {
  members: Member[]
  nextPageToken: string
}

export interface UpdateMemberProfileRequest {
  memberId: string
  profile: MemberProfile
}

export interface UpdateMemberProfileResponse {
  lastUpdated: string
}

export interface UpdateMemberStatusRequest {
  memberId: string
  newStatus: MemberStatus
  reason: string
}

export interface UpdateMemberStatusResponse {
  newStatus: MemberStatus
  updatedAt: string
}

export interface CloseMemberRequest {
  memberId: string
  reason: string
}

export interface CloseMemberResponse {
  success: boolean
}

export interface GetMemberStatusHistoryRequest {
  memberId: string
  pageSize?: number
  pageToken?: string
}

export interface GetMemberStatusHistoryResponse {
  transitions: Array<{
    fromStatus: string
    toStatus: string
    reason: string
    occurredAt: string
  }>
  nextPageToken: string
}

// Share money is named because balances and transaction forms use the same protobuf shape.
export interface ShareMoney {
  currencyCode: string
  units: string
  nanos: number
}

// CashierSessionStatus mirrors the custody transitions returned by contribution endpoints.
export type CashierSessionStatus = "open" | "closed" | "handed_over" | "deposited"

// CashierSession is the authoritative till state used when opening and closing cash custody.
export interface CashierSession {
  id: string
  branchId: string
  cashierId: string
  status: CashierSessionStatus
  expectedAmount?: ShareMoney
  countedAmount?: ShareMoney
  variance?: ShareMoney
  varianceReason?: string
  openedAt?: string
  closedAt?: string
  handedOverAt?: string
  depositedAt?: string
}

// CashAllocationType intentionally excludes contribution types the backend cannot process yet.
export type CashAllocationType =
  | "CONTRIBUTION_ALLOCATION_TYPE_COM"
  | "CONTRIBUTION_ALLOCATION_TYPE_LGOM"
  | "CONTRIBUTION_ALLOCATION_TYPE_SHARE_PURCHASE"
  | "CONTRIBUTION_ALLOCATION_TYPE_LOAN_PRINCIPAL"
  | "CONTRIBUTION_ALLOCATION_TYPE_OTHER_CHARGE"

// CashAllocationInput keeps each amount tied to its owning share or loan target when required.
export interface CashAllocationInput {
  type: CashAllocationType
  targetId?: string
  amount: ShareMoney
}

// CashContributionReceipt distinguishes completed posting from accepted cash awaiting review.
export interface CashContributionReceipt {
  id: string
  internalReceiptReference: string
  sessionId: string
  status: "pending" | "processing" | "completed" | "failed" | "manual_review"
  amount: ShareMoney
  receivedAt?: string
}

// The status union keeps filters and badges aligned with the share service contract.
export type ShareAccountStatus =
  | "SHARE_ACCOUNT_STATUS_UNSPECIFIED"
  | "SHARE_ACCOUNT_STATUS_ACTIVE"
  | "SHARE_ACCOUNT_STATUS_DORMANT"
  | "SHARE_ACCOUNT_STATUS_CLOSED"

// The transaction union prevents the UI from inventing unsupported transaction categories.
export type ShareTransactionType =
  | "SHARE_TRANSACTION_TYPE_UNSPECIFIED"
  | "SHARE_TRANSACTION_TYPE_PURCHASE"
  | "SHARE_TRANSACTION_TYPE_WITHDRAWAL"
  | "SHARE_TRANSACTION_TYPE_DIVIDEND"
  | "SHARE_TRANSACTION_TYPE_REVERSAL"
  | "SHARE_TRANSACTION_TYPE_ADJUSTMENT"

// ShareAccount includes the small member summary needed to identify rows without extra member requests.
export interface ShareAccount {
  id: string
  memberId: string
  memberNumber?: string
  memberName?: string
  branchId: string
  status: ShareAccountStatus
  openedAt: string
  createdAt: string
  updatedAt: string
}

// ShareTransaction is shared by transaction tables, charts, and reversal actions.
export interface ShareTransaction {
  id: string
  shareAccountId: string
  type: ShareTransactionType
  amount: ShareMoney
  balanceAfter: ShareMoney
  referenceId: string
  reversalOf: string
  reason: string
  originatorId: string
  createdAt: string
}

// LoanStatus mirrors the complete backend lifecycle so the UI never invents transitions.
export type LoanStatus = "LOAN_STATUS_UNSPECIFIED" | "LOAN_STATUS_PENDING" | "LOAN_STATUS_APPROVED" | "LOAN_STATUS_REJECTED" | "LOAN_STATUS_DISBURSED" | "LOAN_STATUS_RESTRUCTURING" | "LOAN_STATUS_ACTIVE" | "LOAN_STATUS_DELINQUENT" | "LOAN_STATUS_CLOSED" | "LOAN_STATUS_WRITTEN_OFF" | "LOAN_STATUS_MANUAL_REVIEW"

// GuarantorStatus keeps guarantor decisions aligned with the loan service contract.
export type GuarantorStatus = "GUARANTOR_STATUS_UNSPECIFIED" | "GUARANTOR_STATUS_PENDING" | "GUARANTOR_STATUS_APPROVED" | "GUARANTOR_STATUS_REJECTED"

// CreditStatus limits credit actions to states supported by the credit service.
export type CreditStatus = "CREDIT_STATUS_UNSPECIFIED" | "CREDIT_STATUS_AVAILABLE" | "CREDIT_STATUS_FROZEN" | "CREDIT_STATUS_WITHDRAWN"

// RepaymentStatus provides the exact schedule states used by badges and analytics.
export type RepaymentStatus = "REPAYMENT_STATUS_UNSPECIFIED" | "REPAYMENT_STATUS_UPCOMING" | "REPAYMENT_STATUS_DUE" | "REPAYMENT_STATUS_PAID" | "REPAYMENT_STATUS_MISSED" | "REPAYMENT_STATUS_PARTIAL"

// ProposedGuarantor is the compact shape submitted with a new loan application.
export interface ProposedGuarantor {guarantorId: string; guaranteedAmount: string}

// Loan contains backend data plus optional member display fields supplied by an enriched list response.
export interface Loan {id: string; memberId: string; memberNumber?: string; memberName?: string; branchId: string; principal: string; interestRate: string; repaymentPeriodMonths: number; status: LoanStatus; disbursedAt?: string; createdAt: string; updatedAt: string; updatedBy: string; previousStatus: string}

// LoanGuarantor identifies a guarantee and optionally carries its member-facing labels.
export interface LoanGuarantor {loanId: string; guarantorId: string; guarantorNumber?: string; guarantorName?: string; guaranteedAmount: string; status: GuarantorStatus; approvedAt?: string; approvedBy: string; createdAt: string}

// CreditBalance describes withdrawable or restricted overpayment credit returned by the backend.
export interface CreditBalance {id: string; memberId: string; loanId?: string; amount: string; source: string; status: CreditStatus; createdAt: string; lastActivityAt: string}

// RepaymentSchedule represents one authoritative installment in the loan schedule.
export interface RepaymentSchedule {id: string; loanId: string; installmentNo: number; dueDate: string; amountDue: string; status: RepaymentStatus}

// LoanTransaction represents one immutable entry in payment history.
export interface LoanTransaction {type: string; amount: string; referenceId: string; paymentGatewayTransactionId: string; createdAt: string; createdBy: string; loanId: string; transactionId: string}
