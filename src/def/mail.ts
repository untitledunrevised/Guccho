/* eslint-disable antfu/no-const-enum */
export namespace Mail {
  export const enum Variant {
    Registration,
    ChangeMail,
    AccountRecovery,
  }

  interface Subject {
    serverName: string
  }

  interface Template extends Record<string, unknown> {
    serverName: string
    link: string
    otp: string
    ttl: number
  }

  interface WithName extends Template {
    name: string
  }

  export interface Param {
    [Variant.ChangeMail]: {
      subject: Subject
      content: WithName
    }
    [Variant.AccountRecovery]: {
      subject: Subject
      content: WithName
    }
    [Variant.Registration]: {
      subject: Subject
      content: Template
    }
  }

}

export interface VerifyRouterQuery {
  t: string
  a: Mail.Variant
}
