#!/usr/bin/env tsx
/* eslint-disable antfu/no-top-level-await */

import type { Bot } from '#root/bot/index.js'
import type { Config, PollingConfig, WebhookConfig } from '#root/config.js'
import type { RunnerHandle } from '@grammyjs/runner'
import process from 'node:process'
import { createBot } from '#root/bot/index.js'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import { createServer, createServerManager } from '#root/server/index.js'
import { run } from '@grammyjs/runner'
import pg from 'pg'

async function createPostgreClient(config: Config) {
  if (config.databaseString) {
    try {
      const client = new pg.Client({
        connectionString: config.databaseString,
      })
      await client.connect()
      logger.info('Successfully connected to database')
      return client
    }
    catch (error) {
      logger.error(error, 'Error connection to postgres')
    }
  }
  return undefined
}

async function startServer(bot: Bot, config: Config) {
  const server = createServer({
    bot,
    config,
    logger,
  })
  const serverManager = createServerManager(server, {
    host: config.serverHost,
    port: config.serverPort,
  })

  // graceful shutdown
  onShutdown(async () => {
    logger.info('Shutdown')
    await serverManager.stop()
  })

  // start server
  const info = await serverManager.start()
  logger.info({
    msg: 'Server started',
    url: info.url,
  })
}

async function startPolling(config: PollingConfig) {
  const bot = await createBot(config.botToken, {
    config,
    logger,
  }, undefined, await createPostgreClient(config))
  let runner: undefined | RunnerHandle

  // graceful shutdown
  onShutdown(async () => {
    logger.info('Shutdown')
    await runner?.stop()
  })

  await Promise.all([
    bot.init(),
    bot.api.deleteWebhook(),
  ])

  // start bot
  runner = run(bot, {
    runner: {
      fetch: {
        allowed_updates: config.botAllowedUpdates,
      },
    },
  })

  logger.info({
    msg: 'Bot running...',
    username: bot.botInfo.username,
  })

  await startServer(bot, config)
}

async function startWebhook(config: WebhookConfig) {
  const bot = await createBot(config.botToken, {
    config,
    logger,
  }, undefined, await createPostgreClient(config))

  await bot.init()

  await startServer(bot, config)

  // set webhook
  await bot.api.setWebhook(config.botWebhook, {
    allowed_updates: config.botAllowedUpdates,
    secret_token: config.botWebhookSecret,
  })
  logger.info({
    msg: 'Webhook was set',
    url: config.botWebhook,
  })
}

try {
  if (config.isWebhookMode)
    await startWebhook(config)
  else if (config.isPollingMode)
    await startPolling(config)
  // testNetwork()
}
catch (error) {
  logger.error(error)
  process.exit(1)
}

// Utils

function onShutdown(cleanUp: () => Promise<void>) {
  let isShuttingDown = false
  const handleShutdown = async () => {
    if (isShuttingDown)
      return
    isShuttingDown = true
    await cleanUp()
  }
  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}
