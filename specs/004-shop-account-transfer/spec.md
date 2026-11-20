# Feature Specification: Shop Google Account Transfer & Ownership Management

**Feature Branch**: `004-shop-account-transfer`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Xuất phát 1 yêu cầu mới của shop: họ muốn đổi tài khoản google được liên kết với shop, do có sự thay đổi tổ chức. Case cụ thể: Chimit Studio (/stores/chimit-studio-d0af) muốn đổi cái gmail được dùng để đăng nhập từ cunconsunrang07032005@gmail.com sang 1 mail khác."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Reassigns/Transfers Shop Google Account (Priority: P1)

As an Admin in the Management Portal (`/portal` tab Shops), I want to reassign or change the Google account linked to an existing shop so that when a shop changes ownership or operating personnel, the new owner can log in seamlessly while the former owner loses administrative access to the shop.

**Why this priority**: Core operational requirement. Without this, shops cannot transfer management when staff changes occur, and admins cannot reassign shop ownership without manual database intervention.

**Independent Test**: In Admin Portal (`/portal`), locate an existing shop (e.g. `chimit-studio-d0af`), open the account management dialog, enter a new valid Gmail address, and submit. Verify:
1. Old email is revoked and removed from `shop_members`.
2. New email is granted a pending invite in `shop_invitations`.
3. `shops.contact_email` is updated.
4. Old user can no longer view or edit the shop; new user gains immediate access after Google OAuth login.

**Acceptance Scenarios**:

1. **Given** an existing shop currently linked to `old_email@gmail.com`, **When** the Admin enters `new_email@gmail.com` and confirms the transfer, **Then** the system revokes the old owner's record in `shop_members` and `shop_invitations`, creates a pending invite for `new_email@gmail.com`, updates `shops.contact_email`, and returns a success response.
2. **Given** `new_email@gmail.com` is already an Admin or already owns another shop, **When** Admin attempts the transfer, **Then** the system rejects the operation with a clear validation error (enforcing 1 Gmail = 1 Role / 1 Shop).
3. **Given** a successful transfer, **When** the former owner logs in with their old Google account, **Then** they are blocked with "Email chưa được cấp quyền quản lý shop nào" and cannot access the shop.

---

### User Story 2 - Seamless Onboarding for New Google Account via Auto-Linking (Priority: P1)

As the new shop manager with the newly invited Google account, I want to log into `/portal` using "Tiếp tục với Google" and immediately have full access to manage my shop and its products without entering tokens or setup passwords.

**Why this priority**: Guarantees zero-friction handover. The incoming shop owner only needs to click one button with their Google account to start managing products.

**Independent Test**: After admin reassigns the shop to `new_email@gmail.com`, log into `/portal` with `new_email@gmail.com`. Verify the session auto-links the user to the shop, creates the `shop_members` entry, and navigates straight into the shop dashboard with all existing products intact.

**Acceptance Scenarios**:

1. **Given** a pending invitation for `new_email@gmail.com` on `chimit-studio-d0af`, **When** the user logs into `/portal` via Google OAuth, **Then** the backend `authenticatePortalUser` links `auth.users.id` to `shop_members`, updates `shop_invitations.status = 'accepted'`, and returns the shop context.
2. **Given** the shop has existing products and data, **When** the new owner logs in, **Then** all existing draft, pending, and published products remain intact and manageable.

---

### User Story 3 - Immediate Emergency Operational Runbook (Priority: P2)

As a system engineer / developer, I want a standardized SQL / CLI procedure to immediately execute the ownership transfer in Supabase for urgent support cases (such as Chimit Studio) before the full Admin UI deployment.

**Why this priority**: Enables instantaneous fulfillment of the shop's urgent request within minutes, unblocking the partner immediately.

**Independent Test**: Execute the migration/runbook query on Supabase targeting `chimit-studio-d0af`, supply the new email, and verify the new email can log in immediately while the old email is blocked.

**Acceptance Scenarios**:

1. **Given** target shop slug `chimit-studio-d0af`, **When** executing the transfer SQL script, **Then** old invitations are marked `revoked`, existing `shop_members` links are cleared, and a new `shop_invitations` record is inserted with `status = 'pending'`.

---

## Edge Cases

- **New email already logged into Supabase before invite**: System MUST link the existing `auth.users` row to `shop_members` seamlessly upon next API call to `/api/portal/me`.
- **Cached JWT sessions**: Redis cache key `auth_session:<tokenHash>` for old owner MUST be invalidated or allowed to expire within its 60-second TTL.
- **Concurrent requests**: Database transaction / atomic operation ensures shop is never left in an orphaned state without a designated owner or invitation.
- **Vercel Hobby Serverless Function limit**: Must NOT add new files to `api/` (must stay <= 12 files). Logic MUST be merged into `api/admin/portal/invite.ts` under action `transfer_owner`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow Admins to change the Google account linked to any existing shop.
- **FR-002**: System MUST validate that the new email is a valid email, not already registered as an active Admin/Staff member, and not currently linked to another active shop (1 Gmail = 1 Shop).
- **FR-003**: System MUST revoke the previous Google account's access by updating `shop_invitations.status = 'revoked'` and deleting corresponding entries in `shop_members`.
- **FR-004**: System MUST create a new record in `shop_invitations` with `status = 'pending'` for the new email.
- **FR-005**: System MUST update `shops.contact_email` to the new email.
- **FR-006**: System MUST send an automated invitation notification email to the new email with the Portal URL.
- **FR-007**: API handler MUST be incorporated within `api/admin/portal/invite.ts` using `action = "transfer_owner"` to adhere to the <= 12 Serverless Functions limit.
- **FR-008**: UI in Admin Portal (`/portal` tab Shops) MUST include a "Đổi tài khoản Google" button on each shop card.

### Key Entities

- **shops**: Represents the brand/partner entity (`id`, `slug`, `name`, `contact_email`, `status`).
- **shop_invitations**: Represents authorization granted to a Google email (`shop_id`, `invited_email`, `status`, `shop_role`).
- **shop_members**: Represents active active membership linkage (`shop_id`, `user_id`, `shop_role`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can complete a shop Google account transfer in less than 30 seconds via Portal UI.
- **SC-002**: Immediate access revocation for former Google account (0 seconds after transfer execution).
- **SC-003**: 100% data preservation (zero product loss, zero profile data loss) during ownership handover.
- **SC-004**: Serverless function count in `api/` remains strictly <= 12.
