import { UserRole } from '~/def/user'

export type ComputedUserRole = Record<'admin' | 'owner' | 'staff', boolean>

export function computeUserRoles(user: { roles: UserRole[] }): ComputedUserRole {
  const admin = isAdmin(user)
  const staff = isStaff(user)
  const owner = user.roles.includes(UserRole.Owner)

  return {
    admin,
    owner,
    staff,
  }
}

export function isStaff(user: { roles: UserRole[] }) {
  return user.roles.some(role =>
    role === UserRole.Admin
    || role === UserRole.Moderator
    || role === UserRole.Owner
  )
}

export function isAdmin(user: { roles: UserRole[] }) {
  return user.roles.some(role =>
    role === UserRole.Admin
    || role === UserRole.Owner
  )
}
