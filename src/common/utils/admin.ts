import type { ComputedUserRole } from './roles'
import { type UserFull, UserRole, type UserSecrets } from '~/def/user'

// TODO server validation impl same logic
export function isRoleEditable(stat: Record<'admin' | 'owner' | 'staff', boolean>, role: UserRole) {
  switch (role) {
    case UserRole.Admin: {
      return stat.owner
    }
    case UserRole.Staff: {
      return stat.admin || stat.owner
    }
    case UserRole.Owner: {
      return stat.owner
    }
    case UserRole.Moderator:
      return stat.admin || stat.owner
    default:
      return true
  }
}

export function isUserFieldEditable(field: keyof (UserFull<any> & UserSecrets), computedRole: ComputedUserRole) {
  switch (field) {
    case 'profile':
    case 'preferredMode':
    case 'roles':
      return computedRole.staff || computedRole.admin || computedRole.owner
    default:
      return computedRole.admin
  }
}
