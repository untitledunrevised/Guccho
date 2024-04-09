import { TRPCError } from '@trpc/server'
import { type ZodSchema, array, number, object, string, union } from 'zod'

import { hasLeaderboardRankingSystem, hasRuleset } from '../config'
import { GucchoError } from '../messages'
import { optionalUserProcedure } from '../middleware/optional-user'
import { sessionProcedure } from '../middleware/session'
import {
  zodHandle,
  zodLeaderboardRankingSystem,
  zodMode,
  zodRankingStatus,
  zodRelationType,
  zodRuleset,
} from '../shapes'
import { router as _router, publicProcedure as p } from '../trpc'
import { type MailTokenProvider as MBase } from '$base/server'
import { type Mode } from '~/def'
import { RankingStatus } from '~/def/beatmap'
import { type LeaderboardRankingSystem } from '~/def/common'
import { Mail } from '~/def/mail'
import { type RankingSystemScore } from '~/def/score'
import { Scope, type UserCompact, UserRole } from '~/def/user'
import type { GlobalI18n } from '~/locales/@types'
import { Constant } from '~/server/common/constants'
import { MapProvider, ScoreProvider, UserProvider, mail, mailToken, sessions, userRelations, users } from '~/server/singleton/service'
import ui from '~~/guccho.ui.config'
import { Logger } from '$base/logger'

const logger = Logger.child({ label: 'user' })

export const map = getPath<GlobalI18n>()()

function visible(user: Pick<UserCompact<any>, 'id' | 'roles'>, viewer?: Pick<UserCompact<any>, 'id' | 'roles'>) {
  const isSelf = user.id === viewer?.id
  return user.roles.includes(UserRole.Normal) || isSelf || viewer?.roles.includes(UserRole.Staff)
}

const userNotFoundError = createGucchoError(GucchoError.UserNotFound)

export const router = _router({
  uniqueIdent: p
    .input(zodHandle)
    .query(({ input: handle }) => {
      return users.uniqueIdent(handle)
    }),
  userpage: optionalUserProcedure
    .input(
      object({
        handle: zodHandle,
      }),
    )
    .query(async ({ input: { handle }, ctx }) => {
      const user = await users.getFull({
        handle,
        excludes: { relationships: true, secrets: true, email: true },
        includeHidden: true,
        scope: Scope.Self,
      })

      if (!visible(user, ctx.user)) {
        throw userNotFoundError
      }
      return mapId(user, UserProvider.idToString)
    }),
  best: optionalUserProcedure
    .input(
      object({
        handle: zodHandle,
        mode: zodMode,
        ruleset: zodRuleset,
        rankingSystem: zodLeaderboardRankingSystem,
        page: number().gte(0).lt(10),
        includes: array(zodRankingStatus).default([
          RankingStatus.Ranked,
          RankingStatus.Approved,
        ]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { mode, ruleset, rankingSystem } = input
      if (
        !hasRuleset(mode, ruleset)
        || !hasLeaderboardRankingSystem(mode, ruleset, rankingSystem)
      ) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'ranking system not supported',
        })
      }
      const user = await users.getCompact({ handle: input.handle, scope: Scope.Self })

      if (!visible(user, ctx.user)) {
        throw userNotFoundError
      }

      const returnValue = await users.getBests({
        id: user.id,
        mode,
        ruleset,
        rankingSystem,
        page: input.page,
        perPage: 10,
        rankingStatus: input.includes,
      })
      if (!returnValue) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
      // return mapId(returnValue, ScoreProvider.scoreIdToString)
      return returnValue.map(v => ({
        ...mapId(v, ScoreProvider.scoreIdToString),
        beatmap: beatmapIsVisible(v.beatmap)
          ? {
              ...isLocalMapOrMapset(v.beatmap)
                ? mapId(v.beatmap, MapProvider.idToString)
                : mapId(v.beatmap, MapProvider.idToString, ['id', 'foreignId']),
              beatmapset: isLocalMapOrMapset(v.beatmap.beatmapset)
                ? mapId(v.beatmap.beatmapset, MapProvider.idToString)
                : mapId(v.beatmap.beatmapset, MapProvider.idToString, ['id', 'foreignId']),
            }
          : v.beatmap,
      })) as RankingSystemScore<string, string, Mode, LeaderboardRankingSystem, RankingStatus>[]
    }),
  tops: optionalUserProcedure
    .input(
      object({
        handle: zodHandle,
        mode: zodMode,
        ruleset: zodRuleset,
        rankingSystem: zodLeaderboardRankingSystem,
        page: number().gte(0).lt(10),
        includes: array(zodRankingStatus).default([
          RankingStatus.Ranked,
          RankingStatus.Approved,
        ]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { mode, ruleset, rankingSystem } = input
      if (
        !hasRuleset(mode, ruleset)
        || !hasLeaderboardRankingSystem(mode, ruleset, rankingSystem)
      ) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'ranking system not supported',
        })
      }

      const user = await users.getCompact({ handle: input.handle, scope: Scope.Self })

      if (!visible(user, ctx.user)) {
        throw userNotFoundError
      }

      const returnValue = await users.getTops({
        id: user.id,
        mode: input.mode,
        ruleset: input.ruleset,
        rankingSystem: input.rankingSystem,
        page: input.page,
        perPage: 10,
        rankingStatus: input.includes,
      })
      if (!returnValue) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
      return {
        count: returnValue.count,
        scores: returnValue.scores.map(v => ({
          ...mapId(v, ScoreProvider.scoreIdToString),
          beatmap: beatmapIsVisible(v.beatmap)
            ? {
                ...isLocalMapOrMapset(v.beatmap)
                  ? mapId(v.beatmap, MapProvider.idToString)
                  : mapId(v.beatmap, MapProvider.idToString, ['id', 'foreignId']),
                beatmapset: isLocalMapOrMapset(v.beatmap.beatmapset)
                  ? mapId(v.beatmap.beatmapset, MapProvider.idToString)
                  : mapId(v.beatmap.beatmapset, MapProvider.idToString, ['id', 'foreignId']),
              }
            : v.beatmap,
        })) as RankingSystemScore<string, string, Mode, LeaderboardRankingSystem, RankingStatus>[],
      }
    }),
  essential: p
    .input(
      object({
        handle: zodHandle,
      }),
    )
    .query(async ({ input }) => {
      const user = await users.getCompact({ handle: input.handle })

      return mapId(user, UserProvider.idToString)
    }),
  countRelations: optionalUserProcedure
    .input(
      object({
        handle: zodHandle,
        type: zodRelationType,
      }),
    )
    .query(async ({ input: { handle, type }, ctx }) => {
      const user = await users.getCompact({ handle, scope: Scope.Self })

      if (!visible(user, ctx.user)) {
        raiseError(userNotFoundError)
      }

      const count = await userRelations.count({ user, type })
      return count
    }),
  status: p
    .input(object({
      id: string().trim(),
    })).query(async ({ input: { id } }) => {
      return await users.status({ id: UserProvider.stringToId(id) })
    }),

  register: _router({
    sendEmailCode: sessionProcedure
      .input(string().email()).mutation(async ({ ctx, input }) => {
        await ctx.session.getBinding() ?? throwGucchoError(GucchoError.SessionNotFound)

        // check if email is taken
        if (await users.getCompact({ handle: input, keys: ['email'], scope: Scope.Self }).catch(_ => undefined)) {
          throwGucchoError(GucchoError.ConflictEmail)
        }

        const { otp, token } = await mailToken.getOrCreate(input as MBase.Email)
        type Param = ReturnType<Mail.Param[Mail.Variant.Verify]>
        const t = await useTranslation(ctx.h3Event)
        const serverName = t(localeKey.root.server.name.__path__)

        const proto = getRequestProtocol(ctx.h3Event, { xForwardedProto: true })
        const baseURL = getRequestHost(ctx.h3Event, { xForwardedHost: true }) ?? `osu.${ui.baseUrl}`

        const _protoWithSlashes = `${proto}://` ?? ''

        const param: Param = {
          serverName,
          otp,
          link: `${_protoWithSlashes}${baseURL}/mail/verify?t=${token}`,
          ttl: Constant.EmailTokenTTLInMinutes as number,
        }

        const content = t(localeKey.mail(Mail.Variant.Verify), param)

        await mail.send({
          to: input,
          subject: `${serverName} - verification`,
          content,
        })
      }),

    getEmailToken: sessionProcedure
      .input(
        union([
          object({
            otp: string(),
            email: string().email(),
          }),
          object({
            token: string().uuid(),
          }),
        ]) as unknown as ZodSchema<MBase.Validation>)
      .query(async ({ input }) => {
        return await mailToken.get(input)
      }),
    createAccount: sessionProcedure
      .input(object({
        name: string().trim(),
        safeName: string().trim().optional(),
        emailToken: string().uuid(),
        // email: string().trim().email(),
        passwordMd5: string().trim(),
      })).mutation(async ({ input, ctx }) => {
        const rec = await mailToken.get({ token: input.emailToken as MBase.Token }) ?? throwGucchoError(GucchoError.EmailTokenNotFound)
        const { name, safeName, passwordMd5 } = input

        const user = await users.register({
          name,
          safeName,
          passwordMd5,
          email: rec.email,
        })

        // background jobs
        mailToken.deleteAll(rec.email).catch(e => logger.error({ message: `failed to delete mail token: ${e.message}` }))

        const sessionId = ctx.session.id
        await sessions.update(sessionId, { userId: UserProvider.idToString(user.id) })

        return user
      }),

  }),

})
