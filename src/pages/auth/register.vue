<script setup lang="ts">
import type { MailTokenProvider } from '$base/server'

definePageMeta({
  layout: 'centered',
})
// eslint-disable-next-line antfu/no-const-enum
const enum Step {
  InputEmail,
  VerifyToken,
}
// eslint-disable-next-line antfu/no-const-enum
const enum State {
  ErrorState,
  Idle,
  SendingOTP,
  VerifyingOTP,
  Succeed,
}
const app = useNuxtApp()
const { t } = useI18n()
const params = useRoute().query

const error = ref<Error>()
const step = ref(params.token ? Step.VerifyToken : Step.InputEmail)
const state = ref(State.Idle)
const email = ref<MailTokenProvider.Email>()
const otp = ref<MailTokenProvider.OTP>()
const token = ref<MailTokenProvider.Token>()

async function go() {
  error.value = undefined

  if (!email.value) {
    return
  }
  try {
    state.value = State.SendingOTP
    await app.$client.user.register.sendEmailCode.mutate(email.value)
    step.value = Step.VerifyToken
  }
  catch (e) {
    error.value = e as any
    state.value = State.ErrorState
  }
  state.value = State.Idle
}
async function checkOTP() {
  if (!otp.value || !email.value) {
    return
  }
  const otpString = otp.value.toString() as MailTokenProvider.OTP

  if (otpString.length < 6) {
    return
  }

  const result = await app.$client.user.register.getEmailToken.query({ otp: otpString, email: email.value })

  if (!result) {
    return
  }
  token.value = result.token
  state.value = State.Succeed
}
</script>

<i18n lang="yaml">
en-GB:
  have-account: Have account?
  verify: Verify
zh-CN:
  have-account: 已经有一个账号了?
  verify: 发送验证码
fr-FR:
  have-account: Vous avez déjà un compte?
</i18n>

<template>
  <div class="container max-w-screen-md mx-auto">
    <div class="grid grid-cols-5 gap-12 w-full">
      <div class="col-span-3">
        <span v-if="error">{{ formatGucchoErrorWithT(t, error) }}</span>
        <form v-if="step === Step.InputEmail" action="#" method="post" @submit.prevent="go">
          <div class="form-control">
            <label for="email">Email</label>
            <input id="email" v-model="email" required="true" :placeholder="`cookiezi@${$config.public.baseUrl}`" type="email" class="input">
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4">
            <button type="button" class="stack-btn btn btn-secondary" @click="navigateTo({ name: 'auth-login' })">
              <span class="reveal">{{ $t('global.login') }}</span>
              <span class="surface">{{ t('have-account') }}</span>
            </button>
            <button
              type="submit" class="btn btn-primary"
            >
              <span>
                {{ t('verify') }}
              </span>
              <span
                :class="{
                  loading: state === State.SendingOTP,
                }"
              />
            </button>
          </div>
        </form>
        <template v-else-if="step === Step.VerifyToken">
          <div class="form-control">
            <label for="email">One time code</label>
            <input v-model="otp" type="number" class="input" @input="checkOTP">
            {{ token }}
            <button v-show="state === State.Succeed" class="btn btn-primary mt-4" @click="navigateTo({ name: 'auth-create-account', query: { t: token } })">
              LGTM!
            </button>
          </div>
        </template>
      </div>
      <div class="col-span-2">
        <ul class="steps steps-vertical">
          <li class="step step-primary">
            Verify Email
          </li>
          <li class="step">
            Create Account
          </li>
          <li class="step">
            Login with client
          </li>
          <li class="step">
            GLHF!
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.stack-btn {
  .reveal {
    @apply invisible absolute
  }
  .surface {
    @apply visible absolute
  }

  &:hover {
    .reveal {
      @apply visible absolute
    }
    .surface {
      @apply invisible absolute
    }
  }
}
</style>
