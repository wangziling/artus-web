import { WebsocketController, WebsocketEvent, WebsocketUse } from '../../../../plugins/plugin-websocket/decorator'
import {
  ARTUS_PLUGIN_WEBSOCKET_CLIENT,
  WebSocketEventNames,
  WebsocketMiddleware
} from '../../../../plugins/plugin-websocket/types'
import { websocketExecutionTimeMiddleware } from '../../middlewares/common/execution-time'
import { WebsocketClient } from '../../../../plugins/plugin-websocket/client'

@WebsocketController('/ws/account')
@WebsocketUse([websocketExecutionTimeMiddleware()])
export default class AccountWsController {
  @WebsocketEvent(WebSocketEventNames.CONNECTION, { path: '/observe' })
  async handleConnection (...args: Parameters<WebsocketMiddleware>) {
    const [ctx, next] = args

    await ctx.input.params.trigger.response(ctx, 'Connected!')

    await next()
  }

  @WebsocketEvent(WebSocketEventNames.MESSAGE, { path: '/observe' })
  async handleMessage (...args: Parameters<WebsocketMiddleware>) {
    const [ctx, next] = args

    await ctx.input.params.trigger.response(ctx, { receiveMessage: '' })

    await next()
  }

  @WebsocketEvent(WebSocketEventNames.MESSAGE, { path: '/observe' })
  async handleMessageAndBroadcast (...args: Parameters<WebsocketMiddleware>) {
    const [ctx, next] = args

    const { input: { params: { trigger, socket, app, eventArgs } } } = ctx

    const websocketClient = app.container.get(ARTUS_PLUGIN_WEBSOCKET_CLIENT) as WebsocketClient

    const receivedMessage = eventArgs[0];
    if (receivedMessage) {
      websocketClient.getWsServerSameReqPathSockets(socket).forEach(s => {
        trigger.send(s, receivedMessage)
      })
    }

    await next()
  }
}
