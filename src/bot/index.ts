import type { Context, ConversationContext } from '#root/bot/context.js'

import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { BotConfig } from 'grammy'
import type pg from 'pg'
import { adminFeature } from '#root/bot/features/admin.js'
import { unhandledFeature } from '#root/bot/features/unhandled.js'
import { welcomeFeature } from '#root/bot/features/welcome.js'
import { errorHandler } from '#root/bot/handlers/error.js'
import { localize } from '#root/bot/i18n.js'
import { session } from '#root/bot/middlewares/session.js'
import { updateLogger } from '#root/bot/middlewares/update-logger.js'
import { autoChatAction } from '@grammyjs/auto-chat-action'
import { conversations } from '@grammyjs/conversations'
import { hydrate } from '@grammyjs/hydrate'
import { hydrateReply, parseMode } from '@grammyjs/parse-mode'
import { sequentialize } from '@grammyjs/runner'
import { MemorySessionStorage, Bot as TelegramBot } from 'grammy'

interface Dependencies {
  config: Config
  logger: Logger
}

function getSessionKey(ctx: Omit<Context, 'session'>) {
  return ctx.chat?.id.toString()
}

export function createBot(token: string, dependencies: Dependencies, botConfig?: BotConfig<Context>, dbClient?: pg.Client) {
  const {
    config,
    logger,
  } = dependencies

  const bot = new TelegramBot<Context>(token, botConfig)

  bot.use(async (ctx, next) => {
    ctx.config = config
    ctx.logger = logger.child({
      update_id: ctx.update.update_id,
    })

    await next()
  })

  const protectedBot = bot.errorBoundary(errorHandler)

  // Middlewares
  bot.api.config.use(parseMode('HTML'))

  if (config.isPollingMode)
    protectedBot.use(sequentialize(getSessionKey))
  if (config.isDebug)
    protectedBot.use(updateLogger())
  protectedBot.use(autoChatAction(bot.api))
  protectedBot.use(hydrateReply)
  protectedBot.use(hydrate())
  protectedBot.use(session({
    getSessionKey,
    // @ts-expect-error not possible to set generic type of PsqlAdapter
    storage: dbClient ? (await PsqlAdapter.create({ client: dbClient, tableName: 'psycho-session' })) : new MemorySessionStorage<SessionData>(),
  }))
  protectedBot.use(localize)
  protectedBot.use(conversations<Context, ConversationContext>({
    plugins: [autoChatAction(bot.api), hydrateReply, hydrate()],
  }))

  // Handlers
  protectedBot.use(welcomeFeature)
  protectedBot.use(adminFeature)

  // must be the last handler
  protectedBot.use(unhandledFeature)

  return bot
}

export type Bot = ReturnType<typeof createBot>
