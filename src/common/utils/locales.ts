import type { GlobalI18n } from '../../locales/@types'
import type { Mode, Rank, Ruleset } from '~/def'
import { type CountryCode } from '~/def/country-code'
import type { Scope, UserRole } from '~/def/user'
import type { Mail } from '~/def/mail'

export const root = getPath<GlobalI18n>()()

export const title = root.title
export const server = root.server

const _role = root.role
const _scope = root.scope
const _mode = root.mode
const _ruleset = root.ruleset
const _rank = root.rank
const _service = root.service
const _country = root.country
const _mail = root.mail

/** @deprecated */
export function role<T extends UserRole>(priv: T) {
  return _role[priv].__path__
}

/** @deprecated */
export function scope<T extends Scope>(scope: T) {
  return _scope[scope].__path__
}

/** @deprecated */
export function mode<T extends Mode>(mode: T) {
  return _mode[mode].__path__
}

/** @deprecated */
export function ruleset<T extends Ruleset>(ruleset: T) {
  return _ruleset[ruleset].__path__
}

/** @deprecated */
export function rankingSystem<T extends Rank>(rs: T) {
  return _rank[rs].__path__
}

/** @deprecated */
export function service<T extends keyof GlobalI18n['service']>(srv: T) {
  return _service[srv].__path__
}

/** @deprecated */
export function country(cd: CountryCode) {
  return _country[cd].__path__
}

/** @deprecated */
export const mail = {

  /** @deprecated */
  content(variant: Mail.Variant) {
    return _mail[variant].content.__path__
  },

  /** @deprecated */
  subject(variant: Mail.Variant) {
    return _mail[variant].subject.__path__
  },
}
