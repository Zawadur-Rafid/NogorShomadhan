$files = @(
    "src/app/(public)/_layout.tsx",
    "src/app/(public)/home.tsx",
    "src/app/(public)/about.tsx",
    "src/app/(public)/impact.tsx",
    "src/app/(public)/contact.tsx",
    "src/app/(public)/sign-in.tsx",
    "src/app/(public)/register.tsx",
    "src/app/(resident)/_layout.tsx",
    "src/app/(resident)/dashboard.tsx",
    "src/app/(resident)/complaints/create.tsx",
    "src/app/(resident)/complaints/index.tsx",
    "src/app/(resident)/complaints/all.tsx",
    "src/app/(resident)/complaints/[complaintId].tsx",
    "src/app/(resident)/analytics.tsx",
    "src/app/(resident)/profile.tsx",
    "src/app/(authority)/_layout.tsx",
    "src/app/(authority)/dashboard.tsx",
    "src/app/(authority)/complaints/pending/[complaintId].tsx",
    "src/app/(authority)/complaints/in-progress/[complaintId].tsx",
    "src/app/(authority)/complaints/resolved/[complaintId].tsx",
    "src/app/(authority)/feedback-center.tsx",
    "src/app/(authority)/analytics.tsx",
    "src/app/(admin)/_layout.tsx",
    "src/app/(admin)/dashboard.tsx",
    "src/app/(admin)/accounts/pending.tsx",
    "src/app/(admin)/accounts/registered.tsx",
    "src/app/(admin)/accounts/[accountId].tsx",
    "src/app/(admin)/complaints/unverified.tsx",
    "src/app/(admin)/complaints/verified.tsx",
    "src/app/(admin)/complaints/all.tsx",
    "src/app/(admin)/complaints/[complaintId]/verify.tsx",
    "src/app/(admin)/complaints/[complaintId]/report.tsx",
    "src/app/(admin)/analytics.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/modal.tsx",
    "src/components/ui/skeleton.tsx",
    "src/components/ui/toast.tsx",
    "src/components/map/issue-map-view.tsx",
    "src/components/map/map-marker.tsx",
    "src/components/map/location-picker.tsx",
    "src/components/complaint/complaint-card.tsx",
    "src/components/complaint/complaint-form.tsx",
    "src/components/complaint/complaint-status-badge.tsx",
    "src/components/complaint/complaint-timeline.tsx",
    "src/components/complaint/urgency-counter.tsx",
    "src/components/complaint/image-uploader.tsx",
    "src/components/complaint/comments-section.tsx",
    "src/components/dashboard/stat-card.tsx",
    "src/components/dashboard/recent-complaints-list.tsx",
    "src/components/dashboard/map-preview.tsx",
    "src/components/analytics/category-distribution-chart.tsx",
    "src/components/analytics/area-distribution-chart.tsx",
    "src/components/analytics/monthly-trend-chart.tsx",
    "src/components/analytics/resolution-ratio-chart.tsx",
    "src/components/analytics/resolution-time-chart.tsx",
    "src/components/notifications/notification-bell.tsx",
    "src/components/notifications/notification-list.tsx",
    "src/constants/routes.ts",
    "src/constants/complaint-status.ts",
    "src/constants/roles.ts",
    "src/hooks/use-auth.ts",
    "src/hooks/use-complaints.ts",
    "src/hooks/use-complaint.ts",
    "src/hooks/use-notifications.ts",
    "src/hooks/use-analytics.ts",
    "src/services/api-client.ts",
    "src/services/auth.service.ts",
    "src/services/public.service.ts",
    "src/services/resident.service.ts",
    "src/services/authority.service.ts",
    "src/services/admin.service.ts",
    "src/services/ai.service.ts",
    "src/store/auth-store.ts",
    "src/store/complaint-store.ts",
    "src/store/notification-store.ts",
    "src/types/resident.ts",
    "src/types/complaint.ts",
    "src/types/category.ts",
    "src/types/image.ts",
    "src/types/timeline.ts",
    "src/types/urgency.ts",
    "src/types/rating.ts",
    "src/types/comment.ts",
    "src/types/community-authority.ts",
    "src/types/api.ts",
    "src/utils/validators.ts",
    "src/utils/formatters.ts",
    "src/utils/geo.ts",
    "src/utils/storage.ts"
)

$directories = @(
    "assets/images/tabIcons",
    "assets/images/categories",
    "assets/images/markers"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

foreach ($file in $files) {
    $dir = Split-Path $file
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Force -Path $file | Out-Null
        Set-Content -Path $file -Value "// $file" -Encoding UTF8
    }
}
