import { type ZodSchema, object, string } from 'zod'
import { type MailTokenProvider } from '$base/server'
import { mailToken } from '~/server/singleton/service'
import { Mail, type VerifyRouterQuery } from '~/def/mail'

const validator = object({
  t: string().uuid(),
  a: string(),
}) as unknown as ZodSchema<VerifyRouterQuery>

const jumpMap: Record<Mail.Variant, { failed(t: string): string; succeed(t: string): string }> = {
  [Mail.Variant.Registration]: {
    failed(_t: string): string {
      return '/auth/register'
    },
    succeed(t: string): string {
      return `/auth/create-account?t=${t}`
    },
  },
  [Mail.Variant.AccountRecovery]: {
    failed(_t: string): string {
      return 'auth/login'
    },
    succeed(t: string): string {
      return `/auth/account-recovery?t=${t}`
    },
  },
  [Mail.Variant.ChangeMail]: {
    failed(_t: string): string {
      throw new Error('/me-settings')
    },
    succeed(_t: string): string {
      throw new Error('Function not implemented. Please use one time code instead.')
    },
  },
}
export default defineEventHandler(async (event) => {
  const params = getQuery(event)
  const { t, a } = validator.parse(params)

  const res = await mailToken.get({ token: t as MailTokenProvider.Token })

  const jump = jumpMap[a]

  if (!res) {
    return sendRedirect(event, jump.failed(t))
  }

  return sendRedirect(event, jump.succeed(t))
})
