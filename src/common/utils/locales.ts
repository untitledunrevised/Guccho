import type { GlobalI18n } from '../../locales/@types'
import type { Mode, Rank, Ruleset } from '~/def'
import { type CountryCode } from '~/def/country-code'
import type { Scope, UserRole } from '~/def/user'
import type { Mail } from '~/def/mail'

export const root = getPath<GlobalI18n>()()

const _role = root.role
const _scope = root.scope
const _mode = root.mode
const _ruleset = root.ruleset
const _rank = root.rank
const _service = root.service
const _country = root.country
const _mail = root.mail

export function role<T extends UserRole>(priv: T) {
  return _role[priv].__path__
}

export function scope<T extends Scope>(scope: T) {
  return _scope[scope].__path__
}

export function mode<T extends Mode>(mode: T) {
  return _mode[mode].__path__
}
export function ruleset<T extends Ruleset>(ruleset: T) {
  return _ruleset[ruleset].__path__
}

export function rankingSystem<T extends Rank>(rs: T) {
  return _rank[rs].__path__
}

export function service<T extends keyof GlobalI18n['service']>(srv: T) {
  return _service[srv].__path__
}

export function country(cd: CountryCode) {
  return _country[cd].__path__
}

export const mail = {
  content(variant: Mail.Variant) {
    return _mail[variant].content.__path__
  },
  subject(variant: Mail.Variant) {
    return _mail[variant].subject.__path__
  },
}
