// eslint-disable-next-line import/default
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { zodHandle } from '../shapes'
import { procedureWithSession as pSession } from '../middleware/session'
import { router as _router } from '../trpc'
import { getBaseUser } from '$/client'

// eslint-disable-next-line import/no-named-as-default-member
const { compare } = bcrypt

export const router = _router({
  login: pSession.input(z.object({
    handle: zodHandle,
    md5HashedPassword: z.string()
  })).query(async ({ input: { handle, md5HashedPassword }, ctx }) => {
    try {
      const user = await getBaseUser({ handle, includes: { secrets: true } })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'user not found'
        })
      }
      const result = await compare(md5HashedPassword, user.secrets.password)
      if (!result) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'password mismatch'
        })
      }
      const session = await ctx.session.getBinding()
      if (!session) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'unable to retrieve session'
        })
      }
      session.userId = user.id
      return {
        user
      }
    } catch (err) {
      if (err instanceof TRPCError) {
        throw err
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'unknown error occurred'
      })
    }
  }),
  retrieve: pSession.query(async ({ ctx }) => {
    const session = await ctx.session.getBinding()
    if (!session) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'session not found.'
      })
    }
    return {
      user: (session.userId && await getBaseUser({ handle: session.userId })) ?? undefined
    }
  })
})
