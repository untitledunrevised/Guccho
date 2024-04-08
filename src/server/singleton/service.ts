import {
  AdminProvider,
  ArticleProvider,
  ClanProvider,
  FileProvider,
  LogProvider,
  MailProvider,
  MailTokenProvider,
  MapProvider,
  MonitorProvider,
  RankProvider,
  ScoreProvider,
  SessionProvider,
  UserProvider,
  UserRelationProvider,
} from '$active/server'

export const articles = new ArticleProvider()
export const admin = new AdminProvider()
export const files = new FileProvider()
export const logs = new LogProvider()
export const maps = new MapProvider()
export const monitor = new MonitorProvider()
export const ranks = new RankProvider()
export const scores = new ScoreProvider()
export const sessions = new SessionProvider()
export const users = new UserProvider()
export const userRelations = new UserRelationProvider()
export const clanProvider = new ClanProvider()
export const mail = new MailProvider()
export const mailToken = new MailTokenProvider()

export {
  AdminProvider,
  ArticleProvider, ClanProvider, FileProvider,
  LogProvider, MailTokenProvider, MapProvider,
  MonitorProvider,
  RankProvider,
  ScoreProvider,
  SessionProvider,
  UserProvider,
  UserRelationProvider,
} from '$active/server'
