import type { JSONContent } from '@tiptap/core'
import { Score } from './score'
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Scope,
  RankingSystem,
  Mode,
  Ruleset,
  AutopilotAvailable,
  RelaxAvailable,
  StandardAvailable,
  Relationship,
  MutualRelationship
} from './common'
import { Maybe } from './frontend-common'

export type UserOfflineStatus = 'offline'
export type UserOnlineStatus = 'playing' | 'idle' | 'modding' | 'multiplaying'
export type UserWebsiteStatus = 'website-online'
export type UserActivityStatus =
  | UserOfflineStatus
  | UserOnlineStatus
  | UserWebsiteStatus

export type UserPrivilegeString =
  // restricted type
  | 'disabled'
  | 'restricted'

  // registered without login
  | 'registered'

  // normal users
  | 'inactive'
  | 'normal'
  | 'supported'
  | 'supporter'

  // bancho.py privileges
  | 'bypassAntiCheat'

  // bancho privileges
  | 'alumni'

  // users that has privileges
  | 'tournamentStuff'
  | 'channelModerator'
  | 'moderator'
  | 'beatmapNominator'
  | 'staff'
  | 'admin'

  // dangerous
  | 'owner'

  // misc
  | 'bot'

export interface BaseRank<
  Id,
  _Mode extends Mode,
  _Ruleset extends Ruleset,
  _RankingSystem extends RankingSystem
> {
  rank?: number
  rankHistory?: Record<string, number>

  countryRank?: number
  // countryRankHistory: number[]

  accuracy?: number

  // TODO: Score
  bests?: Score<Id, _Mode, _Ruleset, _RankingSystem>[]
  recent?: Score<Id, _Mode, _Ruleset, _RankingSystem>[]
}

export type PPRank<
  Id,
  _Mode extends Mode,
  _Ruleset extends Ruleset,
  _RankingSystem extends RankingSystem
> = BaseRank<Id, _Mode, _Ruleset, _RankingSystem> & {
  performance: number
  performanceHistory?: Record<string, number>

  // TODO: BP
  // bests: Score[]
}

export type ScoreRank<
  Id,
  _Mode extends Mode,
  _Ruleset extends Ruleset,
  _RankingSystem extends RankingSystem
> = BaseRank<Id, _Mode, _Ruleset, _RankingSystem> & {
  score: bigint | null
  scoreHistory?: Record<string, bigint>
}

export type UserModeRulesetStatistics<
  Id,
  _Mode extends Mode,
  _Ruleset extends Ruleset,
  RS extends RankingSystem
> = {
  // TODO: Achievement
  // achievements: Achievement[]
  ranking: {
    [R in RS]: BaseRank<Id, _Mode, _Ruleset, R>
  }
  playCount: number
  playTime: number
  totalHits: number
}

export interface UserHistoricalName {
  from: Date
  to: Date
  name: string
}

export interface UserSecrets {
  password: string
  apiKey?: string
}
export interface BaseUser<Id> {
  id: Id
  ingameId: number
  name: string
  safeName: string
  flag: string
  avatarUrl: string

  roles: UserPrivilegeString[]
}

export interface UserOptional<Id = unknown> {
  reachable: boolean
  oldNames: UserHistoricalName[]
  email: string
  secrets: UserSecrets
  status: UserActivityStatus
}

export interface UserPreferences {
  scope: Record<
    Exclude<keyof UserOptional | 'privateMessage', 'secrets'>,
    Scope
  >
}
export interface UserRelationship<Id> extends BaseUser<Id> {
  relationship: Relationship[]
  relationshipFromTarget: Relationship[]
  mutualRelationship: MutualRelationship[]
}

export type UserStatistic<
  Id,
  IncludeMode extends Mode = Mode,
  IncludeRuleset extends Ruleset = Ruleset,
  Ranking extends RankingSystem = RankingSystem
> ={
    [M in IncludeMode]: {
      [R in Ruleset as R extends IncludeRuleset
      ? M extends StandardAvailable
      ? R extends 'standard'
      ? R
      : M extends RelaxAvailable
      ? R extends 'relax'
      ? R
      : M extends AutopilotAvailable
      ? R extends 'autopilot'
      ? R
      : never
      : never
      : never
      : never
      : never]: UserModeRulesetStatistics<Id, M, R, Ranking>
    }
  }

export type ComponentUserStatistic<
  Id,
  IncludeMode extends Mode = Mode,
  IncludeRuleset extends Ruleset = Ruleset,
  Ranking extends RankingSystem = RankingSystem
> = {
    [M in Mode as M extends IncludeMode ? M : never]: {
      [R in Ruleset as R extends IncludeRuleset
      ? M extends StandardAvailable
      ? R extends 'standard'
      ? R
      : M extends RelaxAvailable
      ? R extends 'relax'
      ? R
      : M extends AutopilotAvailable
      ? R extends 'autopilot'
      ? R
      : never
      : never
      : never
      : never
      : never]: Maybe<UserModeRulesetStatistics<Id, M, R, Ranking>, 'ranking'>
    }
  }
export interface UserExtra<
  Id,
  IncludeMode extends Mode = Mode,
  IncludeRuleset extends Ruleset = Ruleset,
  Ranking extends RankingSystem = RankingSystem
> {
  statistics: UserStatistic<Id, IncludeMode, IncludeRuleset, Ranking>

  profile?: JSONContent
  relationships: UserRelationship<Id>[]
  preferences: UserPreferences
}

export type ComponentUserExtra<
  Id,
  IncludeMode extends Mode = Mode,
  IncludeRuleset extends Ruleset = Ruleset,
  Ranking extends RankingSystem = RankingSystem
> = Maybe<UserExtra<
  Id,
  IncludeMode,
  IncludeRuleset,
  Ranking
>, 'statistics'>

export interface UserFull<
  Id,
  IncludeMode extends Mode = Mode,
  IncludeRuleset extends Ruleset = Ruleset,
  Ranking extends RankingSystem = RankingSystem
> extends BaseUser<Id>,
  Partial<UserOptional<Id>>,
  Partial<UserExtra<Id, IncludeMode, IncludeRuleset, Ranking>> { }
