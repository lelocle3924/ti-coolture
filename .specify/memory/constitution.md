# Tí Coolture Constitution

## Core Principles

### I. Strict Type Safety & Clean Architecture
- **TypeScript Strictness**: Codebase MUST maintain strict TypeScript verification. Any bypass (`any`, `@ts-ignore`) is prohibited unless accompanied by an explicit inline architectural justification.
- **Separation of Concerns**: Views (`src/views`), reusable UI components (`src/components`), and data/API services (`src/lib`, `api/`) MUST remain modular and decoupled. Business and query logic MUST NOT be entangled directly within presentational components.
- **Single Source of Truth**: Data contracts, shared interfaces, and database entities MUST be defined in dedicated contract files (`src/lib/types.ts`) and aligned strictly with Supabase schemas.

### II. Verification & Test-First Quality Gates
- **Typecheck Gate**: `npm run lint` (`tsc --noEmit`) MUST pass with zero compilation errors before any code merge or deployment.
- **End-to-End Verification**: Critical user journeys (catalog browse, shop onboarding `/open-shop`, portal dashboard `/portal`, product detail view, and lightbox preview) MUST be verified with Playwright tests.
- **Runtime Health**: Production and preview builds MUST maintain zero runtime console errors and zero unhandled failed network requests.
- **Performance Verification**: Assets and queries MUST meet performance budgets (LCP < 2.5s, no multi-megabyte uncompressed images).

### III. Schema Evolution & Resilient Fallbacks
- **Non-Breaking Evolution**: All database schema changes in `supabase/migrations/` MUST be backwards-compatible. New database columns or relations MUST NOT break existing live production code.
- **Defensive Fallback Mechanism**: API handlers and client queries MUST handle missing columns or delayed migration states gracefully (e.g., using safe column queries or fallback fields) to prevent fatal 400/500 API responses during production rollouts.
- **Migration Auditability**: Every schema modification MUST be captured in an incremental SQL migration file following the naming convention `000XX_<feature_name>.sql`.

### IV. Ubiquitous Domain Terminology (Enforce "shop")
- **Forbidden Terminology**: Cấm dùng từ "xưởng" dưới mọi hình thức (code, comments, documentation, UI strings, commits, devlogs).
- **Mandatory Entity Naming**: Luôn luôn dùng từ "shop" đại diện cho đối tác sáng tạo / nhà bán lẻ trên toàn bộ hệ thống (bảng `shops`, route `/stores/:slug`, component `ShopDisplay`, v.v.).

### V. Infrastructure & Resource Guardrails (Vercel & Cache Limits)
- **Vercel Hobby Limit**: Tối đa 12 Serverless Functions. Luôn gom endpoint/router để không vượt quá 12 files trong thư mục `api/`.
- **Client-Side Asset Compression**: Toàn bộ ảnh do người dùng hoặc shop tải lên MUST được nén và chuẩn hóa phía client qua `src/lib/imageCompression.ts` (định dạng WebP, trần kích thước: 1440px cho sản phẩm, 1920px cho hero/cover, 512px cho avatar/logo) trước khi đẩy lên Cloudflare R2.
- **Multi-Tier Caching**: Tuyệt đối tránh để Client SPA truy vấn liên tục trực tiếp vào Supabase database. Bắt buộc áp dụng kiến trúc cache nhiều tầng: Upstash Redis + Vercel Edge Cache headers (`s-maxage`, `stale-while-revalidate`) cho API và SWR in-memory/session storage cho client.

### VI. Continuous DevLog & Self-Correction
- **Mandatory DevLog**: Mọi thay đổi kiến trúc, tính năng lớn, tái cấu trúc hoặc fix bug quan trọng MUST được ghi nhận chi tiết tại `devlog/YYYY-MM-DD.md`.
- **Root Cause & Retrospective**: Mỗi devlog bắt buộc phải có mục "Rút kinh nghiệm & Sai lầm" (Root Cause Analysis, bài học kỹ thuật, giải pháp phòng ngừa tái diễn).

## UI & Public Navigation Constraints

### 1. Protection of Incomplete Pages (`/about`)
- Trang `/about` hiện tại còn đang rất tạm bợ. Tuyệt đối không để người dùng nhìn thấy liên kết đến trang này trên giao diện người dùng công khai (Header, Footer, menu navigation, banner, v.v.).
- Không được chủ động thêm lại nút "Về Tí" hay link tới `/about` vào các thanh điều hướng công khai trừ khi người dùng yêu cầu rõ ràng.

### 2. Layout Stacking & Portals
- Các thành phần overlay toàn màn hình (Modal, Lightbox, Toaster) MUST sử dụng React Portal (`createPortal(..., document.body)`) để thoát khỏi CSS stacking context và không bị che khuất bởi floating navbars hoặc containers có transform/overflow.

## Development Workflow & Quality Gates

### 1. Pre-Change Verification
- Review existing devlogs and architectural constraints before initiating major changes.
- Ensure any planned API additions respect the `<= 12` serverless functions constraint.

### 2. Implementation Standards
- Follow standard formatting, maintain clean component hierarchies, and enforce domain naming ("shop").
- Apply asset and query caching by default when introducing new data queries.

### 3. Pre-Commit / Pre-Deploy Gates
1. Run `npm run lint` (`tsc --noEmit`) to verify strict type safety.
2. Confirm file count in `api/` does not exceed 12.
3. Validate zero occurrences of forbidden terminology ("xưởng").
4. Update `devlog/YYYY-MM-DD.md` with implementation summary and retrospectives.

## Governance

- **Supremacy**: This Constitution supersedes all informal coding conventions and serves as the authoritative standard for all contributors and automated agents.
- **Amendment Procedure**: Principles may only be modified through deliberate documentation and review.
- **Versioning Policy**: Semantic versioning applies to this Constitution:
  - MAJOR: Incompatible governance rule removals or principle reversals.
  - MINOR: New principles, sections, or substantial rule expansions.
  - PATCH: Clarifications, typo fixes, and non-semantic refinements.
- **Compliance Enforcement**: All Pull Requests, code edits, and development plans MUST adhere strictly to these principles.

**Version**: 1.0.0 | **Ratified**: 2026-11-11 | **Last Amended**: 2026-11-11
