export enum GucchoError {
  UnknownError = 1,
  MissingServerAvatarConfig,

  ModeNotSupported = 1000,

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

  RelationTypeNotFound = 4000,

  ConflictRelation,
  AtLeastOneUserNotExists,

  UnableToRetrieveSession = 5000,
  UnableToRefreshToken,
  YouNeedToLogin,
  SessionNotFound,

  RequireAdminPrivilege = 6000,
}
