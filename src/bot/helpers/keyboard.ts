import type { InlineKeyboardMarkup, Message, ReplyKeyboardRemove } from '@grammyjs/types'
import type { Context as DefaultContext } from 'grammy'
import { InlineKeyboard } from 'grammy'

export function chunk<T>(array: T[], size: number) {
  const result = []
  for (let index = 0; index < array.length; index += size)
    result.push(array.slice(index, index + size))

  return result
}

export const removeKeyboard: ReplyKeyboardRemove = { remove_keyboard: true }

export function removeInlineKeyboard(ctx: DefaultContext, message_id?: number, removeBoth?: boolean): Promise<unknown> {
  if (ctx.chat?.id) {
    const chatId = ctx.chat.id
    if (message_id) {
      return ctx.api.editMessageReplyMarkup(chatId, message_id, { reply_markup: new InlineKeyboard() })
        .finally(() => (removeBoth && ctx.callbackQuery?.message?.message_id && (ctx.callbackQuery?.message?.message_id !== message_id)) && ctx.api.editMessageReplyMarkup(chatId, ctx.callbackQuery.message.message_id, { reply_markup: new InlineKeyboard() }))
    }
    if (ctx.callbackQuery?.message?.message_id) {
      return ctx.api.editMessageReplyMarkup(ctx.chat.id, ctx.callbackQuery.message.message_id, { reply_markup: new InlineKeyboard() })
    }
  }
  return Promise.resolve()
}

export function removeAndReplyWithInlineKeyboard(ctx: DefaultContext, text: string, keyboard?: InlineKeyboardMarkup, message_id?: number, removeBoth?: boolean): Promise<Message.TextMessage> {
  return removeInlineKeyboard(ctx, message_id, removeBoth).then(() => ctx.reply(text, { reply_markup: keyboard }))
}

export function editOrReplyWithInlineKeyboard(ctx: DefaultContext, text: string, keyboard?: InlineKeyboardMarkup, message_id?: number): Promise<undefined | Message.TextMessage> {
  if (ctx.chat?.id && message_id) {
    return ctx.api.editMessageText(ctx.chat.id, message_id, text, { reply_markup: keyboard }).then()
  }
  return removeInlineKeyboard(ctx, message_id).then(() => ctx.reply(text, { reply_markup: keyboard }))
}

export async function deleteAndReplyWithInlineKeyboard(ctx: DefaultContext, text: string, keyboard?: InlineKeyboardMarkup, message_id?: number[]): Promise<undefined | Message.TextMessage> {
  if (ctx.chat?.id && message_id) {
    for (const id of message_id) {
      await ctx.api.deleteMessage(ctx.chat.id, id)
    }
  }
  return await ctx.reply(text, { reply_markup: keyboard })
}
