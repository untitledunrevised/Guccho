import { and, eq, gte, lte, or } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import { useDrizzle } from './source/drizzle'
import { MailTokenProvider as MBase } from '$base/server/mail-token'
import { Constant } from '~/server/common/constants'

export class MailTokenProvider extends MBase {
  drizzle = useDrizzle(schema)

  async getOrCreate(email: MBase.Email): Promise<{ otp: MBase.OTP; token: MBase.Token }> {
    return await this.getByEmail(email) ?? await this.create(email)
  }

  async get(input: MBase.Validation): Promise<{ email: MBase.Email; otp: MBase.OTP; token: MBase.Token } | undefined> {
    const tokens = await this.getTokens(input)

    return tokens?.at(-1)
  }

  async deleteAll(email: MBase.Email) {
    await this.drizzle.delete(schema.emailToken).where(eq(schema.emailToken.email, email))
  }

  async delete(input: MBase.Validation) {
    const date = new Date()
    await this.drizzle.delete(schema.emailToken).where(and(
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

      lte(schema.emailToken.invalidAfter, date),
    ))
  }

  async getByEmail(email: MBase.Email): Promise<{ otp: MBase.OTP; token: MBase.Token } | undefined> {
    const date = new Date()
    const tokens = await this.drizzle.query.emailToken.findMany({
      where: and(
        eq(schema.emailToken.email, email),

        gte(schema.emailToken.invalidAfter, date),
        lte(schema.emailToken.invalidAfter, this.offsetByMinutes(Constant.EmailTokenTTLInMinutes, date))
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
      invalidAfter: this.offsetByMinutes(+15),
    })

    return { otp, token }
  }

  protected offsetByMinutes(offset: number, date: Date = new Date()) {
    const dt = new Date(date)
    dt.setMinutes(dt.getMinutes() + offset)
    return dt
  }

  protected async getTokens(input: MBase.Validation): Promise<{ email: MBase.Email; otp: MBase.OTP; token: MBase.Token }[]> {
    const date = new Date()
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

        gte(schema.emailToken.invalidAfter, date),
        lte(schema.emailToken.invalidAfter, this.offsetByMinutes(Constant.EmailTokenTTLInMinutes, date))
      ),
      columns: {
        email: true,
        otp: true,
        token: true,
      },
    }) as { email: MBase.Email; otp: MBase.OTP; token: MBase.Token }[]
  }
}
