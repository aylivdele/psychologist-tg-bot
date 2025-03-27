import type { Context } from '#root/bot/context.js'
import { isAdmin } from '#root/bot/filters/is-admin.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { chatAction } from '@grammyjs/auto-chat-action'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer
  .chatType('private')
  .filter(isAdmin)

feature.command(
  'setcommands',
  logHandle('command-setcommands'),
  chatAction('typing'),
  () => {},
)

export { composer as adminFeature }
