# Project Structure

```text
NogorShomadhan/
├── AGENTS.md
├── app.json
├── CLAUDE.md
├── expo-env.d.ts
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
├── scripts/
│   └── reset-project.js
├── src/
│   ├── global.css
│   │
│   ├── app/                                # Expo Router — file-based routes
│   │   ├── _layout.tsx                     # Root layout (theme, auth provider, fonts)
│   │   ├── index.tsx                       # Redirects to (public)/home
│   │   │
│   │   ├── (public)/                       # 5.1 Public Pages
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx                    # Homepage
│   │   │   ├── about.tsx                   # About Page
│   │   │   ├── impact.tsx                  # Impact Page
│   │   │   ├── contact.tsx                 # Contact Page
│   │   │   ├── sign-in.tsx                 # Sign In Page (role select)
│   │   │   └── register.tsx                # Citizen Registration Page
│   │   │
│   │   ├── (resident)/                     # 5.2 Resident/User Module
│   │   │   ├── _layout.tsx                 # Auth guard: resident role
│   │   │   ├── dashboard.tsx               # Resident Dashboard
│   │   │   ├── complaints/
│   │   │   │   ├── create.tsx              # Create Complaint Page
│   │   │   │   ├── index.tsx               # My Complaints Page (status filters)
│   │   │   │   ├── all.tsx                 # All Complaints Page (public feed)
│   │   │   │   └── [complaintId].tsx       # Complaint Details Page (+ Feedback Section)
│   │   │   ├── analytics.tsx               # Resident Analytics Page
│   │   │   └── profile.tsx                 # Profile Page
│   │   │
│   │   ├── (authority)/                    # 5.3 Community Authority Module
│   │   │   ├── _layout.tsx                 # Auth guard: authority role
│   │   │   ├── dashboard.tsx               # Community Authority Dashboard
│   │   │   ├── complaints/
│   │   │   │   ├── pending/[complaintId].tsx     # Pending Complaint Details Page
│   │   │   │   ├── in-progress/[complaintId].tsx # In-Progress Complaint Details Page
│   │   │   │   └── resolved/[complaintId].tsx    # Resolved Complaint Details Page
│   │   │   ├── feedback-center.tsx         # Feedback Center Page
│   │   │   └── analytics.tsx               # Community Authority Analytics Page
│   │   │
│   │   ├── (admin)/                        # 5.4 Admin Module
│   │   │   ├── _layout.tsx                 # Auth guard: admin role
│   │   │   ├── dashboard.tsx               # Admin Dashboard
│   │   │   ├── accounts/
│   │   │   │   ├── pending.tsx             # Pending Accounts Page
│   │   │   │   ├── registered.tsx          # Registered Accounts Page
│   │   │   │   └── [accountId].tsx         # Account details (approve/reject/delete)
│   │   │   ├── complaints/
│   │   │   │   ├── unverified.tsx          # Unverified Complaints Page
│   │   │   │   ├── verified.tsx            # Verified Complaints Page
│   │   │   │   ├── all.tsx                 # All Complaints Page
│   │   │   │   ├── [complaintId]/
│   │   │   │   │   ├── verify.tsx          # Complaint Verification Details Page
│   │   │   │   │   └── report.tsx          # Complaint Report Page
│   │   │   └── analytics.tsx               # Admin Analytics Page
│   │   │
│   │   └── explore.tsx                     # (kept from default Expo template / dev sandbox)
│   │
│   ├── components/
│   │   ├── animated-icon.module.css
│   │   ├── animated-icon.tsx
│   │   ├── animated-icon.web.tsx
│   │   ├── app-tabs.tsx
│   │   ├── app-tabs.web.tsx
│   │   ├── back-button.tsx             # Global back navigation component
│   │   ├── logo.tsx                    # Reusable app logo with optional text
│   │   ├── external-link.tsx
│   │   ├── hint-row.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   ├── web-badge.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── collapsible.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── map/
│   │   │   ├── issue-map-view.tsx          # 3.3 Issue Map View
│   │   │   ├── map-marker.tsx
│   │   │   └── location-picker.tsx
│   │   │
│   │   ├── complaint/
│   │   │   ├── complaint-card.tsx
│   │   │   ├── complaint-form.tsx          # title, category, description, location, image
│   │   │   ├── complaint-status-badge.tsx  # Pending / In-Progress / Resolved
│   │   │   ├── complaint-timeline.tsx      # 3.4 Issue Status Tracking history
│   │   │   ├── urgency-counter.tsx         # 3.7 urgency increment control
│   │   │   ├── image-uploader.tsx
│   │   │   └── comments-section.tsx        # 3.7 Comments & Feedback
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── recent-complaints-list.tsx
│   │   │   └── map-preview.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── category-distribution-chart.tsx
│   │   │   ├── area-distribution-chart.tsx
│   │   │   ├── monthly-trend-chart.tsx
│   │   │   ├── resolution-ratio-chart.tsx
│   │   │   └── resolution-time-chart.tsx
│   │   │
│   │   └── notifications/
│   │       ├── notification-bell.tsx
│   │       └── notification-list.tsx
│   │
│   ├── constants/
│   │   ├── theme.ts
│   │   ├── routes.ts                       # centralized route path constants
│   │   ├── complaint-status.ts             # Pending | InProgress | Resolved
│   │   └── roles.ts                        # resident | authority | admin
│   │
│   ├── hooks/
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   ├── use-theme.ts
│   │   ├── use-auth.ts                     # session, role, token
│   │   ├── use-complaints.ts               # fetch/filter complaints
│   │   ├── use-complaint.ts                # single complaint + timeline
│   │   ├── use-notifications.ts            # 3.9 Notifications
│   │   └── use-analytics.ts
│   │
│   ├── services/                           # 6. Tentative APIs — one client module per group
│   │   ├── api-client.ts                   # base fetch/axios instance, interceptors
│   │   ├── auth.service.ts                 # 6.1 Authentication APIs
│   │   ├── public.service.ts               # 6.2 Public APIs (home stats, about, impact, contact)
│   │   ├── resident.service.ts             # 6.3 Resident/User APIs
│   │   ├── authority.service.ts            # 6.4 Community Authority APIs
│   │   ├── admin.service.ts                # 6.5 Admin APIs
│   │   └── ai.service.ts                   # 3.8 auto-categorization & duplicate detection
│   │
│   ├── store/                              # global state (e.g. Zustand/Redux)
│   │   ├── auth-store.ts
│   │   ├── complaint-store.ts
│   │   └── notification-store.ts
│   │
│   ├── types/                              # derived from ER diagram (Section 4)
│   │   ├── resident.ts
│   │   ├── complaint.ts
│   │   ├── category.ts
│   │   ├── image.ts
│   │   ├── timeline.ts
│   │   ├── urgency.ts
│   │   ├── rating.ts
│   │   ├── comment.ts
│   │   ├── community-authority.ts
│   │   └── api.ts                          # shared request/response envelopes
│   │
│   └── utils/
│       ├── validators.ts                   # NID, email, password rules
│       ├── formatters.ts                   # date (day/month/year), status labels
│       ├── geo.ts                          # coordinates helpers for map/location
│       └── storage.ts                      # secure token storage
│
├── assets/
│   ├── expo.icon/
│   │   ├── icon.json
│   │   └── Assets/
│   └── images/
│       ├── tabIcons/
│       ├── categories/                     # icons per complaint category
│       └── markers/                        # map marker icons per status
│
├── tsconfig.json
└── .vscode/
```

Notes on mapping to the report:

*   Route groups `(public)`, `(resident)`, `(authority)`, `(admin)` mirror Sections 5.1–5.4 of the report, with per-group `_layout.tsx` files handling role-based access guards.
*   `services/` is split to mirror Section 6's five API groups (Auth, Public, Resident, Authority, Admin) plus a separate `ai.service.ts` for the two AI-powered features in 3.8 (auto-categorization, duplicate detection).
*   `types/` files map 1:1 to the ER diagram entities in Section 4 (resident, Complaint, Category, Image, Timeline, Urgency, Ratings, comments, Community_Authority).
*   `components/complaint/` groups the reusable pieces shared across resident/authority/admin complaint-detail screens (status badge, timeline, urgency counter, comments) to avoid duplicating UI per module.
*   `components/analytics/` charts back Section 3.6 (category distribution, area distribution, monthly trend, resolved vs pending ratio, resolution time).
