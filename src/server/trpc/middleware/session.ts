import { publicProcedure } from '../trpc'
import { SessionBinding } from '../../common/session-binding'
import { GucchoError } from '~/def/messages'
import { Constant } from '~/server/common/constants'
import { haveSession } from '~/server/middleware/0.session'
import { sessions } from '~/server/singleton/service'

const config = {
  httpOnly: true,
}

export const sessionProcedure = publicProcedure
  .use(async ({ ctx, next }) => {
    const opt = {
      ...config,
      maxAge: ctx.session.persist ? Constant.PersistDuration as number : undefined,
    }
    if (!ctx.session.id) {
      const [sessionId, session] = await sessions.create(detectDevice(ctx.h3Event))
      setCookie(ctx.h3Event, Constant.SessionLabel, sessionId, opt)

      const sb = new SessionBinding(sessionId, {
        persist: ctx.session.persist,
      })

      sb.populate(session)
      return await next({
        ctx: Object.assign(ctx, {
          session: sb,
        }),
      })
    }

    if (haveSession(ctx.h3Event)) {
      const sb = new SessionBinding(ctx.session.id, { persist: ctx.session.persist })
      sb.populate(ctx.h3Event.context.session)

      return await next({
        ctx: Object.assign(ctx, {
          session: sb,
        }),
      })
    }
    else {
      const session = await sessions.get(ctx.session.id)
      if (session == null) {
        const [sessionId, session] = await sessions.create(detectDevice(ctx.h3Event))
        setCookie(ctx.h3Event, Constant.SessionLabel, sessionId, opt)

        const sb = new SessionBinding(sessionId, { persist: ctx.session.persist })
        sb.populate(session)

        return await next({
          ctx: Object.assign(ctx, {
            session: sb,
          }),
        })
      }
      else {
        const [refreshed, _session] = await sessions.refresh(ctx.session.id) ?? []
        if (!refreshed) {
          throwGucchoError(GucchoError.UnableToRefreshSession)
        }

        setCookie(ctx.h3Event, Constant.SessionLabel, refreshed, opt)

        const persist = ctx.session.persist
        if (persist) {
          setCookie(ctx.h3Event, Constant.Persist, 'yes', opt)
        }

        return await next({
          ctx: Object.assign(ctx, {
            session: new SessionBinding(refreshed, { persist }),
          }),
        })
      }
    }
  })
