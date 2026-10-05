import "server-only";

import type {
  CloseMemberRequest,
  CloseMemberResponse,
  GetMemberRequest,
  GetMemberResponse,
  GetMemberStatusHistoryRequest,
  GetMemberStatusHistoryResponse,
  ListMembersRequest,
  ListMembersResponse,
  RegisterMemberRequest,
  RegisterMemberResponse,
  UpdateMemberProfileRequest,
  UpdateMemberProfileResponse,
  UpdateMemberStatusRequest,
  UpdateMemberStatusResponse,
} from "@/lib/go-api-client";
import {goApiPost} from "@/lib/server/go-api";

export const registerMember = (input: RegisterMemberRequest) =>
  goApiPost<RegisterMemberResponse>("/api/v1/members/register", input);

export const getMember = (input: GetMemberRequest) =>
  goApiPost<GetMemberResponse>("/api/v1/members/get", input);

export const listMembers = (input: ListMembersRequest) =>
  goApiPost<ListMembersResponse>("/api/v1/members/list", input);

export const updateMemberProfile = (input: UpdateMemberProfileRequest) =>
  goApiPost<UpdateMemberProfileResponse>(
    "/api/v1/members/update-profile",
    input,
  );

export const updateMemberStatus = (input: UpdateMemberStatusRequest) =>
  goApiPost<UpdateMemberStatusResponse>(
    "/api/v1/members/update-status",
    input,
  );

export const closeMember = (input: CloseMemberRequest) =>
  goApiPost<CloseMemberResponse>("/api/v1/members/close", input);

export const getMemberStatusHistory = (
  input: GetMemberStatusHistoryRequest,
) =>
  goApiPost<GetMemberStatusHistoryResponse>(
    "/api/v1/members/status-history",
    input,
  );
