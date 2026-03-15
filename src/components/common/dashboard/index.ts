/**
 * @deprecated Most exports re-export from @/shared/components/dashboard for backward compatibility.
 * Please use @/shared/components/dashboard instead.
 */

export { default as AppSidebar } from '@/shared/components/dashboard/AppSidebar'
export { default as AppHeader } from '@/shared/components/dashboard/AppHeader'
export { default as DashboardHeader } from '@/shared/components/dashboard/DashboardHeader'
export { default as AccountSettings } from './AccountSettings' // Keep local version (different implementation)
export * from '@/shared/components/dashboard'
export type { ProfileData, EditFormData, PasswordFormData, AccountSettingsProps } from './AccountSettings'
export { default as ProtectedRoute } from '@/shared/components/dashboard/ProtectedRoute'
