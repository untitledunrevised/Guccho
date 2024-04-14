import type { ServerLocale } from './@types'
import { CountryCode } from '~/def/country-code'

export default {
  landing: {
    content: `欢迎来到 {title} ，一个面向全模式的osu!私服。我们有最先进的RX，AP算法，同时为全模式提供PP计算支持。
欢迎通过页面右下方的链接加入QQ群或Discord服务器，和其他玩家一起享受游戏生活！
我们拥有全图排行榜，以及无限次数的改名机会。`,
  },
  country: {
    [CountryCode.HongKong]: '香港特别行政区',
    [CountryCode.Macao]: '澳门特别行政区',
    [CountryCode.Taiwan]: '台湾省',
  },
} satisfies ServerLocale
