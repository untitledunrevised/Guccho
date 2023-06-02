import PackageJSON from '../package.json'
import type {
  LeaderboardRankingSystem,
  Mode,
  RankingSystem,
  Ruleset,
} from '~/types/common'

interface AppConfigItemBase {
  name: string
  icon: string
}

const config: {
  baseUrl: string
  version: `${number}.${number}.${number}`
  title: string
  mode: Record<Mode, AppConfigItemBase>
  ruleset: Record<Ruleset, AppConfigItemBase>
  rankingSystem: Record<RankingSystem, { name: string }>
  leaderboardRankingSystem: Record<
    LeaderboardRankingSystem,
    AppConfigItemBase & {
      userpage: {
        show: 'tab' | 'dropdown'
      }
    }
  >
} = {
  baseUrl: 'dev.ppy.sb',
  version: PackageJSON.version as `${number}.${number}.${number}`,
  title: 'Guccho',
  mode: {
    osu: {
      name: 'Osu',
      icon: 'osu',
    },
    taiko: {
      name: 'Taiko',
      icon: 'taiko',
    },
    fruits: {
      name: 'CTB',
      icon: 'fruits',
    },
    mania: {
      name: 'Mania',
      icon: 'mania',
    },
  },
  ruleset: {
    standard: {
      name: 'Standard',
      icon: 'vn',
    },
    relax: {
      name: 'Relax',
      icon: 'relax',
    },
    autopilot: {
      name: 'Autopilot',
      icon: 'autopilot',
    },
  },
  leaderboardRankingSystem: {
    ppv2: {
      userpage: {
        show: 'tab',
      },
      name: 'Performance(v2)',
      icon: 'pp',
    },
    ppv1: {
      userpage: {
        show: 'dropdown',
      },
      name: 'Performance(v1)',
      icon: 'pp',
    },
    rankedScore: {
      userpage: {
        show: 'tab',
      },
      name: 'Ranked Score',
      icon: 'score',
    },
    totalScore: {
      userpage: {
        show: 'tab',
      },
      name: 'Total Score',
      icon: 'score',
    },
  },
  rankingSystem: {
    ppv2: {
      name: 'Performance(v2)',
    },
    ppv1: {
      name: 'Performance(v1)',
    },
    score: {
      name: 'Score',
    },
  },
}
export default defineAppConfig({
  ...config,
  appModalTeleportTargetId: 'app-modal-portal',
  needConfirmWebsite: false,
})
