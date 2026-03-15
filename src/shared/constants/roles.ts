/**
 * User Roles and Permissions
 * Centralized role definitions and permission mappings
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  MODERATOR: 'moderator',
  AGENT: 'agent',
  BROKER: 'broker',
  TENANT: 'tenant',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/**
 * Role permissions mapping
 * '*' means all permissions
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: ['*'],
  [USER_ROLES.ADMIN]: ['*'],
  [USER_ROLES.MODERATOR]: ['manage_content', 'manage_properties', 'view_analytics'],
  [USER_ROLES.BROKER]: ['create_listing', 'manage_agents', 'manage_listings', 'view_analytics'],
  [USER_ROLES.AGENT]: ['create_listing', 'manage_own_listings', 'view_own_analytics'],
  [USER_ROLES.TENANT]: ['view_properties', 'save_properties', 'contact_agents'],
} as const

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

/**
 * Check if user is an admin (any admin role)
 */
export function isAdminRole(role: UserRole): boolean {
  return [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.MODERATOR].includes(role)
}

/**
 * Check if user can manage agents
 */
export function canManageAgents(role: UserRole): boolean {
  return [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.BROKER].includes(role)
}

