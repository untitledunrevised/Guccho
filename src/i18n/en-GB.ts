import type { GlobalI18n } from '.'
import { Mode, Rank, Ruleset } from '~/def'

export default {
  mode: {
    [Mode.Osu]: 'Osu',
    [Mode.Taiko]: 'Taiko',
    [Mode.Fruits]: 'CTB',
    [Mode.Mania]: 'Mania',
  },
  ruleset: {
    [Ruleset.Standard]: 'Standard',
    [Ruleset.Relax]: 'Relax',
    [Ruleset.Autopilot]: 'Autopilot',
  },
  rank: {
    [Rank.PPv2]: 'Performance(v2)',
    [Rank.PPv1]: 'Performance(v1)',
    [Rank.RankedScore]: 'Ranked Score',
    [Rank.TotalScore]: 'Total Score',
    [Rank.Score]: 'Score',
  },
  titles: {
    'leaderboard': 'Leaderboard',
    'status': 'Status',
    'beatmap': 'Beatmaps',
    'beatmapset': 'Beatmapet',
    'settings': 'Settings',
    'relations': 'Friends & Blocks',
    'userpage': 'My Profile',
    'admin-panel': 'Admin Panel',
  },
  logout: 'Sign out',
  login: 'Sign in',
  register: 'Sign up',
} as GlobalI18n
