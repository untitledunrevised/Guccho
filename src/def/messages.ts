export enum GucchoError {
  UnknownError = 1,
  MissingServerAvatarConfig,

  // basic
  ModeNotSupported = 1000,
  InvalidId,

  // user
  UserNotFound = 2000,
  UserExists,
  ConflictEmail,
  UpdateUserSettingsFailed,
  UpdateUserpageFailed,
  MimeNotImage,
  HackerTryingToDeleteAllAvatars,
  DeletingMoreThanOneAvatars,

  // auth
  IncorrectPassword = 3000,

  PasswordNotMatch,
  OldPasswordMismatch,
  EmailTokenNotFound,

  // relation
  RelationTypeNotFound = 4000,

  ConflictRelation,
  AtLeastOneUserNotExists,

  // session
  UnableToRetrieveSession = 5000,
  UnableToRefreshToken,
  YouNeedToLogin,
  SessionNotFound,

  // admin
  RequireAdminPrivilege = 6000,

  // beatmap
  BeatmapNotFound = 7000,
}
