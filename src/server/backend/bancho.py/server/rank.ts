import { type Id, hasRuleset } from '..'
import { normal } from '../constants'
import {
  userCompacts,
} from '../db-query'
import { config as _config } from '../env'
import { Logger } from '../log'
import {
  fromBanchoMode,
  idToString,
  stringToId,
  toBanchoPyMode,
  toMods,
  toRoles,
  toUserCompact,
} from '../transforms'
import { getPrismaClient } from './source/prisma'
import { RedisNotReadyError, client as redisClient } from './source/redis'

import type { ComponentLeaderboard } from '~/def/leaderboard'
import type { CountryCode } from '~/def/country-code'
import type { ActiveMode, AvailableRuleset, LeaderboardRankingSystem, RankingSystem } from '~/def/common'
import { type Mode, Rank } from '~/def'
import { Monitored } from '$base/server/@extends'
import type { RankProvider as Base } from '$base/server'

const logger = Logger.child({ label: 'leaderboard', backend: 'bancho.py' })

const config = _config()

const leaderboardFields = {
  id: true,
  pp: true,
  accuracy: true,
  [Rank.TotalScore]: true,
  [Rank.RankedScore]: true,
  plays: true,
} as const

export class DatabaseRankProvider implements Base<Id> {
  static stringToId = stringToId
  static idToString = idToString

  /**
   * @deprecated prisma will be replaced by drizzle
   */
  db = getPrismaClient()

  config = config

  async leaderboard<M extends ActiveMode, RS extends LeaderboardRankingSystem>({
    mode,
    ruleset,
    rankingSystem,
    page,
    pageSize,
  }: {
    mode: M
    ruleset: AvailableRuleset<M>
    rankingSystem: RS
    page: number
    pageSize: number
  }): Promise<ComponentLeaderboard<Id>[]> {
    const start = page * pageSize
    const result = await this.db.stat.findMany({
      where: {
        pp: rankingSystem === Rank.PPv2 ? { gt: 0 } : undefined,
        rankedScore: rankingSystem === Rank.RankedScore ? { gt: 0 } : undefined,
        totalScore: rankingSystem === Rank.TotalScore ? { gt: 0 } : undefined,
        mode: toBanchoPyMode(mode, ruleset),
        user: {
          priv: { in: normal },
        },
      },
      select: {
        user: true,
        ...leaderboardFields,
      },
      orderBy: rankingSystem === Rank.PPv2
        ? {
            pp: 'desc',
          }
        : rankingSystem === Rank.RankedScore
          ? {
              [Rank.RankedScore]: 'desc',
            }
          : rankingSystem === Rank.TotalScore
            ? {
                [Rank.TotalScore]: 'desc',
              }
            : {},
      skip: start,
      take: pageSize,
    })

    return result.map(({ user, ...stat }, index) => ({
      user: toUserCompact(user, this.config),
      inThisLeaderboard: {
        [Rank.PPv2]: stat.pp,
        [Rank.RankedScore]: stat.rankedScore,
        [Rank.TotalScore]: stat.totalScore,
        accuracy: stat.accuracy,
        playCount: stat.plays,
        rank: BigInt(start + index + 1),
      },
    }) satisfies ComponentLeaderboard<Id>)
  }

  async countLeaderboard(query: Base.BaseQuery<Mode> & { rankingSystem: LeaderboardRankingSystem }) {
    const { mode, ruleset, rankingSystem } = query
    const result = await this.db.stat.count({
      where: {
        pp: rankingSystem === Rank.PPv2 ? { gt: 0 } : undefined,
        rankedScore: rankingSystem === Rank.RankedScore ? { gt: 0 } : undefined,
        totalScore: rankingSystem === Rank.TotalScore ? { gt: 0 } : undefined,
        mode: toBanchoPyMode(mode, ruleset),
        user: {
          priv: { in: normal },
        },
      },

    })

    return result
  }

  async determineBeatmapMode(md5: string) {
    const beatmap = await this.db.map.findFirst({ where: { md5 } })
    return fromBanchoMode(beatmap?.mode ?? raise(Error, 'beatmap not found'))
  }

  async beatmap(
    query: Base.BaseQueryOptionalMode & Base.Pagination & {
      rankingSystem: RankingSystem
      md5: string
    },
  ) {
    const { ruleset, rankingSystem, md5 } = query
    let { mode } = query
    if (!mode) {
      mode = await this.determineBeatmapMode(md5)
    }
    if (!hasRuleset(mode, ruleset)) {
      return []
    }

    let sort: { score: 'desc' } | { pp: 'desc' }
    if (rankingSystem === 'score') {
      sort = {
        score: 'desc',
      }
    }
    else if (rankingSystem === Rank.PPv2) {
      sort = {
        pp: 'desc',
      }
    }
    else {
      return []
    }

    const scores = await this.db.score.findMany({
      include: {
        user: true,
      },
      where: {
        beatmap: {
          md5,
        },
        user: {
          priv: { in: normal },
        },
        mode: toBanchoPyMode(mode, ruleset),
        status: {
          in: [2, 3],
        },
      },
      orderBy: sort,
    })
    return scores.map((item, index) => ({
      user: toUserCompact(item.user, this.config),
      score: {
        id: item.id.toString(),
        [Rank.PPv2]: item.pp,
        accuracy: item.acc,
        score: item.score,
        playedAt: item.playTime,
        mods: toMods(item.mods),
      },
      rank: index,
    }))
  }

  async countBeatmap(query: Base.BaseQueryOptionalMode<Mode> & { rankingSystem: RankingSystem; md5: string }): Promise<number> {
    const { ruleset, rankingSystem, md5 } = query
    let { mode } = query
    if (!mode) {
      mode = await this.determineBeatmapMode(md5)
    }
    if (!hasRuleset(mode, ruleset)) {
      return 0
    }

    const scores = await this.db.score.count({
      where: {
        pp: rankingSystem === Rank.PPv2 ? { gt: 0 } : undefined,
        score: rankingSystem === Rank.Score ? { gt: 0 } : undefined,
        beatmap: {
          md5,
        },
        user: {
          priv: { in: normal },
        },
        mode: toBanchoPyMode(mode, ruleset),
        status: {
          in: [2, 3],
        },
      },
    })
    return scores
  }
}

export class RedisRankProvider extends DatabaseRankProvider implements Monitored {
  redisClient = redisClient()

  get [Monitored.status](): Monitored[typeof Monitored.status] {
    return this.redisClient?.isReady ? [Monitored.Status.Up, 'Providing Realtime data 🔥'] : [Monitored.Status.Degraded, 'Leaderboards may differ from real results.']
  }

  async getPPv2LiveLeaderboard(
    banchoPyMode: number,
    start: number,
    end: number,
    country?: string,
  ) {
    if (this.redisClient?.isReady) {
      return await this.redisClient.zRange(
        country
          ? `bancho:leaderboard:${banchoPyMode}:${country}`
          : `bancho:leaderboard:${banchoPyMode}`,
        '+inf',
        1,
        {
          BY: 'SCORE',
          REV: true,
          LIMIT: {
            offset: start,
            count: end,
          },
        },
      )
    }
    raise(RedisNotReadyError, 'redis is not ready')
  }

  async countLeaderboard(query: Base.BaseQuery<Mode> & { rankingSystem: LeaderboardRankingSystem }): Promise<number> {
    const { mode, ruleset, rankingSystem } = query

    if (!this.redisClient.isReady || rankingSystem !== Rank.PPv2) {
      return super.countLeaderboard(query)
    }

    try {
      const bPyMode = toBanchoPyMode(mode, ruleset)
      if (bPyMode === undefined) {
        raise(Error, 'no mode')
      }
      // TODO: banned players are included
      const rank = await this.getPPv2LiveLeaderboard(
        bPyMode,
        0,
        500,
      ).then(res => res.map(Number))

      if (!rank.length) {
        raise(RedisRankProvider.RedisNoDataError, 'redis leaderboard is empty, fallback to database..')
      }

      return this.db.stat.count({
        where: {
          id: {
            in: rank,
          },
          mode: bPyMode,
          pp: { gt: 0 },
        },
      })
    }
    catch (e) {
      switch (true) {
        case e instanceof RedisRankProvider.RedisNoDataError: {
          logger.info(e)
          break
        }
        case e instanceof RedisNotReadyError: {
          logger.warn(e)
          break
        }
        default: {
          logger.error(e)
        }
      }
      return super.countLeaderboard(query)
    }
  }

  async leaderboard<M extends ActiveMode, RS extends LeaderboardRankingSystem>({
    mode,
    ruleset,
    rankingSystem,
    page,
    pageSize,
  }: {
    mode: M
    ruleset: AvailableRuleset<M>
    rankingSystem: RS
    page: number
    pageSize: number
  }): Promise<ComponentLeaderboard<Id>[]> {
    if (!this.redisClient.isReady || rankingSystem !== Rank.PPv2) {
      return super.leaderboard({ mode, ruleset, rankingSystem, page, pageSize })
    }

    try {
      const start = page * pageSize
      const bPyMode = toBanchoPyMode(mode, ruleset)

      if (bPyMode === undefined) {
        // throw new Error('no mode')
        raise(Error, 'no mode')
      }

      const rank = await this.getPPv2LiveLeaderboard(bPyMode, 0, start + pageSize * 2).then(res => res.map(Number))

      const [users, stats] = await this.db.$transaction([
        /* optimized */
        this.db.user.findMany({
          where: {
            id: {
              in: rank,
            },
          },
          ...userCompacts,
        }),
        /* optimized */
        this.db.stat.findMany({
          where: {
            id: {
              in: rank,
            },
            mode: bPyMode,
          },
          select: leaderboardFields,
        }),
      ])

      const result: ComponentLeaderboard<Id>[] = []

      for (const index in rank) {
        if (result.length >= start + pageSize) {
          break
        }

        const id = rank[index]
        const user = users.find(u => u.id === id)
        const stat = stats.find(s => s.id === id)

        if (!user || !stat || user.priv <= 2) {
          continue
        }

        result.push({
          user: {
            id: user.id,
            stableClientId: user.id,
            name: user.name,
            safeName: user.safeName,
            flag: user.country.toUpperCase() as CountryCode,
            avatarSrc: (this.config.avatar.domain && `https://${this.config.avatar.domain}/${user.id}`) || undefined,
            roles: toRoles(user.priv),
          },
          inThisLeaderboard: {
            [Rank.PPv2]: stat.pp,
            [Rank.TotalScore]: stat[Rank.TotalScore],
            [Rank.RankedScore]: stat[Rank.RankedScore],
            accuracy: stat.accuracy,
            playCount: stat.plays,
            // rank: item._rank,
            // order is correct but rank contains banned user, since we didn't check user priv before when selecting count.
            // calculate rank based on page size * index of this page.
            rank: BigInt(start + Number.parseInt(index) + 1),
          },
        })
      }

      if (!result.length) {
        return super.leaderboard({ mode, ruleset, rankingSystem, page, pageSize })
      }

      return result.slice(start, start + pageSize)
    }
    catch (e) {
      logger.error(e)
      return super.leaderboard({ mode, ruleset, rankingSystem, page, pageSize })
    }
  }
}

export namespace RedisRankProvider {
  export class RedisNoDataError extends Error { name = 'RedisNoDataError' }
}

function reveal() {
  switch (config.leaderboardSource) {
    case 'database': {
      return DatabaseRankProvider
    }
    case 'redis': {
      return RedisRankProvider
    }
  }
}

export const RankProvider = reveal()
