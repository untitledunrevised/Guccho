/* eslint-disable antfu/no-const-enum */
export namespace Mail {
  export const enum Variant {
    Verify,
    AccountRecovery,
  }

  interface Verify {
    serverName: string
    link: string
    otp: string
  }

  interface AccountRecovery {
    serverName: string
    name: string
    link: string
    otp: string
  }
  interface Template extends Record<string, unknown> {
    serverName: string
    link: string
    otp: string
  }

  export interface Param {
    [Variant.AccountRecovery]: (input: AccountRecovery) => Template
    [Variant.Verify]: (input: Verify) => Template
  }

}
