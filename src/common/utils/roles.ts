import { UserRole } from '~/def/user'

export function computeUserRoles(user: { roles: UserRole[] }) {
  const admin = user.roles.includes(UserRole.Admin)
  const owner = user.roles.includes(UserRole.Owner)
  const staff = isStaff(user)

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
