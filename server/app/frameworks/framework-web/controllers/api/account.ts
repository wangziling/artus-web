import { ArtusApplication, ArtusInjectEnum, Inject } from '@artus/core'
import { HTTPController, Post, Use } from '../../../../plugins/plugin-http/decorator'
import { AccountService } from '../../services/account'
import { ARTUS_FRAMEWORK_WEB_ACCOUNT_SERVICE } from '../../types'
import { initUser } from '../../middlewares/business/account'
import { HTTPMiddleware } from '../../../../plugins/plugin-http/types'
import { executionTimeMiddleware } from '../../middlewares/common/execution-time'
import _ from 'lodash'
import { PAGE_PROHIBIT_ACCOUNT_PROPERTIES } from '../../constants'

@HTTPController('/api/account')
@Use([executionTimeMiddleware(), initUser()])
export default class AccountController {
  @Inject(ARTUS_FRAMEWORK_WEB_ACCOUNT_SERVICE)
  accountService: AccountService

  @Inject(ArtusInjectEnum.Application)
  app: ArtusApplication

  @Post('/session')
  async session (...args: Parameters<HTTPMiddleware>) {
    const [ctx, _next] = args

    const { output: { data } } = ctx
    const ctxSession = await this.accountService.getCtxSession(ctx)

    if (!ctxSession) {
      data.status = 400
      data.body = {
        data: null,
        code: 'ERROR_SESSION_UNEXPECTED_ERROR',
        status: 'FAIL'
      }

      return
    }

    data.status = 200
    data.body = {
      data: _.omit(ctxSession, PAGE_PROHIBIT_ACCOUNT_PROPERTIES),
      code: 'SUCCESS_SESSION_FOUND',
      status: 'SUCCESS'
    }
  }

  @Post('/sign-in', { useBodyParser: true })
  async signIn (...args: Parameters<HTTPMiddleware>) {
    const [ctx, _next] = args

    const { input: { params: { req } }, output: { data } } = ctx
    const ctxSession = await this.accountService.getCtxSession(ctx)
    if (ctxSession.signedIn) {
      data.status = 400
      data.body = {
        code: 'ERROR_SIGN_IN_ALREADY_SIGNED_IN',
        status: 'FAIL'
      }

      return
    }

    /**
     * Sign in invoker.
     * Password should be a base64 encrypt string.
     *
     * Here only show an example. No matter password encrypted or not.
     *
     * fetch('/api/account/sign-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'i@test.com', password: '1qaz!QAZ' }) })
     */
    const result = await this.accountService.signIn(ctx, req.body, { passwordPreEncrypt: true })
    if (!result.account) {
      data.status = 400
      data.body = _.omit(result, 'account')

      return
    }

    // @ts-ignore
    await this.accountService.handleSessionCertificated(ctx, result.account)

    data.status = 200
    data.body = _.omit(result, 'account')

    return
  }

  @Post('/sign-up', { useBodyParser: true })
  async signUp (...args: Parameters<HTTPMiddleware>) {
    const [ctx, _next] = args

    const { input: { params: { req } }, output: { data } } = ctx
    const ctxSession = await this.accountService.getCtxSession(ctx)
    if (ctxSession.signedIn) {
      data.status = 400
      data.body = {
        code: 'ERROR_SIGN_UP_ALREADY_SIGNED_IN',
        status: 'FAIL'
      }

      return
    }

    /**
     * Sign up invoker.
     * Password should be a base64 encrypt string.
     *
     * Here only show an example. No matter password encrypted or not.
     *
     * fetch('/api/account/sign-up', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'i@test.com', password: '1qaz!QAZ', name: 'YouAreMySunShine' }) })
     */
    const result = await this.accountService.signUp(ctx, req.body, { passwordPreEncrypt: true })
      .catch(e => {
        this.app.logger.error('[Error] Failed to sign up.', e)
        return {
          account: null,
          code: 'ERROR_SIGN_IN_UNEXPECTED_ERROR',
          status: 'FAIL'
        }
      })

    if (!result.account) {
      data.status = 400
      data.body = _.omit(result, 'account')
      return
    }

    // @ts-ignore
    await this.accountService.handleSessionCertificated(ctx, result.account)

    data.status = 200
    data.body = {
      code: 'SUCCESS_SIGN_UP_SUCCESS',
      status: _.omit(result, 'account')
    }
  }

  // Need signed in.
  @Post('/change-pwd', { useBodyParser: true })
  // @Use([userAuthMiddleware()])
  async changePwd (...args: Parameters<HTTPMiddleware>) {
    const [ctx, _next] = args
    const { input: { params: { req } }, output: { data } } = ctx

    /**
     * Change pwd invoker.
     * Password should be a base64 encrypt string.
     * Currently, we tolerate that new password is the same as the old one.
     *
     * Here only show an example. No matter password encrypted or not.
     *
     * fetch('/api/account/change-pwd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'i@test.com', password: '1qaz!QAZ', oldPassword: '1qaz!QAZ' }) })
     */
    const result = await this.accountService.changePwd(ctx, req.body, { passwordPreEncrypt: true })
      .catch(e => {
        this.app.logger.error('[Error] Failed to change pwd.', e)
        return {
          account: null,
          code: 'ERROR_CHANGE_PWD_UNEXPECTED_ERROR',
          status: 'FAIL'
        }
      })

    if (!result.account) {
      data.status = 400
      data.body = _.omit(result, 'account')
      return
    }

    await this.accountService.handleCertificatedSessionTampered(ctx)
    data.status = 200
    data.body = _.omit(result, 'account')
  }
}
