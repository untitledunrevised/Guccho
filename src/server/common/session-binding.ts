import { sessions } from '~/server/singleton/service'
import { type Session } from '$base/server/session'
import { GucchoError } from '~/def/messages'

export class SessionBinding {
  private session?: Readonly<Session>
  private updating?: Promise<any>
  id: string
  persist?: boolean

  constructor(id: string, opts: { persist?: boolean }) {
    this.id = id
    this.persist = opts.persist
  }

  populate(session: Session) {
    this.session = session
  }

  async getBinding({ raw }: { raw?: boolean } = {}): Promise<Readonly<Session> | undefined> {
    if (!this.id) {
      return undefined
    }

    if (this.updating) {
      await this.updating
    }

    if (this.session) {
      return this.session
    }

    if (raw) {
      return await sessions.get(this.id)
    }

    return this.session ?? (this.session = await sessions.get(this.id))
  }

  async update(data: Partial<Session>) {
    const _p = sessions.update(this.id, data)
    this.updating = _p.catch()

    const [id, updated] = await _p ?? throwGucchoError(GucchoError.UnableToRefreshSession)
    this.session = updated
    this.id = id

    return updated
  }
}
