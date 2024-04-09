import { v4 } from 'uuid'
import { type Tag } from '~/def/internal-utils'

export namespace MailTokenProvider {
  export type Email = Tag<string, 'email'>
  export type OTP = Tag<string, 'otp'>
  export type Token = Tag<string, 'token'>

  export type Validation =
  | {
    token: Token
  }
  | {
    email: Email
    otp: OTP
  }
}

export abstract class MailTokenProvider {
  abstract getOrCreate(email: MailTokenProvider.Email): Promise<{ otp: MailTokenProvider.OTP; token: MailTokenProvider.Token }>
  abstract get(input: MailTokenProvider.Validation): Promise<{ otp: MailTokenProvider.OTP; token: MailTokenProvider.Token; email: MailTokenProvider.Email } | undefined>
  abstract getByEmail(email: MailTokenProvider.Email): Promise<{ otp: MailTokenProvider.OTP; token: MailTokenProvider.Token } | undefined>
  abstract delete(input: MailTokenProvider.Validation): Promise<void>
  abstract deleteAll(email: MailTokenProvider.Email): Promise<void>

  protected generateOTP(): MailTokenProvider.OTP {
    return Math.floor(Math.random() * 900000 + 100000).toString() as MailTokenProvider.OTP
  }

  protected generateToken() {
    return v4() as MailTokenProvider.Token
  }
}
