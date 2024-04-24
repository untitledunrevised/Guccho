import { sessionProcedure } from '../middleware/session'
import { zodEmailValidation } from '../shapes'
import { router as _router } from '../trpc'
import { mailToken } from '~/server/singleton/service'

export const router = _router({
  getToken: sessionProcedure
    .input(zodEmailValidation)
    .query(async ({ input }) => {
      return await mailToken.get(input)
    }),
})
