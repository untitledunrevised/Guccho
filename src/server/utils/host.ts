import { type H3Event } from 'h3'

export function host(uri: string, ev: H3Event, opt: { fallbackURL: string }) {
  const proto = getRequestProtocol(ev, { xForwardedProto: true })
  const baseURL = getRequestHost(ev, { xForwardedHost: true }) ?? opt.fallbackURL

  const _proto = proto ? `${proto}://` : ''
  return `${_proto}${baseURL}${uri}`
}
