export type StaffRole =
  | "system_admin"
  | "manager"
  | "loan_officer"
  | "cashier"
  | "auditor"
  | "chairperson"
  | "secretary"

  export type Guarantor =  {
    guarantorId: string;
    guaranteedAmount: string;

  }

export interface ApplyForLoanRequest {
  memberId: string;
  branchId: number;
  principal: string;
  interestRate: string;
  repaymentPeriodMonths: number;
  guarantors: Guarantor[];
  applicantSharePledgeAmount: number;


}

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
  | { branchId: string; memberId: string; nationalId?: never }
  | { branchId: string; nationalId: string; memberId?: never }

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

export interface GetMemberStatusHistoryResponse {
  transitions: Array<{
    fromStatus: string
    toStatus: string
    reason: string
    occurredAt: string
  }>
  nextPageToken: string
}
