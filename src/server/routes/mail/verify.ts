// TODO have choice about how we handle star calc traffic

import { object, string } from 'zod'
import { type MailTokenProvider } from '$base/server'
import { mailToken } from '~/server/singleton/service'

const validator = object({
  t: string().uuid(),
})
export default defineEventHandler(async (event) => {
  const params = getQuery(event)
  const { t } = validator.parse(params)

  const res = await mailToken.get({ token: t as MailTokenProvider.Token })

  if (!res) {
    return sendRedirect(event, '/auth/register')
  }

  return sendRedirect(event, `/auth/create-account?t=${res.token}`)
})
