import { and, eq, lte, or } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import { useDrizzle } from './source/drizzle'
import { MailTokenProvider as MBase } from '$base/server/mail-token'

export class MailTokenProvider extends MBase {
  drizzle = useDrizzle(schema)

  async getOrCreate(email: MBase.Email): Promise<{ otp: MBase.OTP; token: MBase.Token }> {
    return await this.getByEmail(email) ?? await this.create(email)
  }

  async get(input: MBase.Validation): Promise<{ email: MBase.Email; otp: MBase.OTP; token: MBase.Token } | undefined> {
    const tokens = await this.getTokens(input)

    return tokens?.at(-1)
  }

  async delete(email: MBase.Email) {
    await this.drizzle.delete(schema.emailToken).where(eq(schema.emailToken.email, email))
  }

  async getByEmail(email: MBase.Email): Promise<{ otp: MBase.OTP; token: MBase.Token } | undefined> {
    const tokens = await this.drizzle.query.emailToken.findMany({
      where: and(
        eq(schema.emailToken.email, email),
        lte(schema.emailToken.invalidAfter, this.getInvalidAfter())
      ),
    })

    const rec = tokens?.at(-1)
    if (!rec) {
      return undefined
    }

    return pick(rec, ['otp', 'token']) as { otp: MBase.OTP; token: MBase.Token } | undefined
  }

  protected async create(email: MBase.Email): Promise<{ otp: MBase.OTP; token: MBase.Token }> {
    const otp = this.generateOTP()
    const token = this.generateToken()

    await this.drizzle.insert(schema.emailToken).values({
      email,
      otp,
      token,
      invalidAfter: this.getInvalidAfter(),
    })

    return { otp, token }
  }

  protected getInvalidAfter(date: Date = new Date()) {
    const dt = new Date(date)
    dt.setMinutes(dt.getMinutes() + 15)
    return dt
  }

  protected async getTokens(input: MBase.Validation): Promise<{ email: MBase.Email; otp: MBase.OTP; token: MBase.Token }[]> {
    return await this.drizzle.query.emailToken.findMany({
      where: and(
        or(
          'email' in input && 'otp' in input
            ? and(
              eq(schema.emailToken.email, input.email),
              eq(schema.emailToken.otp, input.otp)
            )
            : undefined,

          'token' in input
            ? eq(schema.emailToken.token, input.token)
            : undefined
        ),

        lte(schema.emailToken.invalidAfter, this.getInvalidAfter())
      ),
      columns: {
        email: true,
        otp: true,
        token: true,
      },
    }) as { email: MBase.Email; otp: MBase.OTP; token: MBase.Token }[]
  }
}
