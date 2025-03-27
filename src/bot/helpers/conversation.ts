import type { Context, SessionData } from '#root/bot/context.js'
import type { MaybeArray } from '@grammyjs/commands/out/utils/array.js'
import type { Conversation } from '@grammyjs/conversations'

import type { InlineKeyboardMarkup, Message } from '@grammyjs/types'
import type { Context as DefaultContext } from 'grammy'
import { removeAndReplyWithInlineKeyboard, removeInlineKeyboard } from '#root/bot/helpers/keyboard.js'

export async function updateSession<SessionField extends keyof SessionData>(conversation: Conversation<Context, DefaultContext>, field: SessionField, value: SessionData[SessionField]) {
  return await conversation.external((ctx) => {
    const session = ctx.session
    session[field] = value
    ctx.session = session
  })
}

export function splitLongText(text?: string | null, maxLenght: number = 4000): string[] | undefined {
  if (!text) {
    return undefined
  }
  if (text.length < maxLenght) {
    return [text]
  }
  text = text!
  let index = Number.MAX_SAFE_INTEGER
  let firstPart = text
  while (index > maxLenght) {
    index = firstPart.lastIndexOf('\n\n')
    if (index === -1) {
      index = firstPart.lastIndexOf('\n')
    }
    if (index === -1) {
      throw new Error('Could not split text by next line symbol')
    }
    firstPart = text.substring(0, index)
  }
  const rest: string[] = []
  if (text.length - firstPart.length > maxLenght) {
    const restSplit = splitLongText(text.substring(index))
    if (!restSplit) {
      throw new Error('Could not split text by next line symbol')
    }
    rest.push(...restSplit)
  }
  else {
    rest.push(text.substring(index))
  }
  return [firstPart, ...rest]
}

export interface CallbackQueryWithMessage {
  data: string
  message_id?: number
}

export async function waitForCallbackQuery(conversation: Conversation<Context, DefaultContext>, waitFor: MaybeArray<string | RegExp>, keyboard: InlineKeyboardMarkup, message_id?: number, otherwise?: string): Promise<CallbackQueryWithMessage> {
  while (true) {
    const loopCtx = await conversation.wait()

    if (loopCtx.hasCallbackQuery(waitFor)) {
      if (message_id && loopCtx.callbackQuery.message?.message_id && (loopCtx.callbackQuery.message?.message_id !== message_id)) {
        await removeInlineKeyboard(loopCtx, loopCtx.callbackQuery.message?.message_id)
      }
      return { data: loopCtx.callbackQuery.data, message_id }
    }
    message_id = (await removeAndReplyWithInlineKeyboard(loopCtx, otherwise ?? 'Пожалуйста, выберите вариант из меню', keyboard, message_id, true))?.message_id ?? message_id
  }
}

export const MOON_STICKER = 'CAACAgEAAxkBAAIFIWfcRxyL42fa4HP0Bq22t5UVdWwHAAKtCAAC43gEAAGElvTjoS7KWjYE'
export const STAR_STICKER = 'CAACAgEAAxkBAAIFKmfcSOGmLyvHVl8gG6Na1sAQ9tOwAAI2AwACE6IYRClEzyvOgctkNgQ'
export const EYE_STICKER = 'CAACAgEAAxkBAAIFLGfcSSFn7dE97-15Lhx2gO_Lg8x6AAIlAwACj-vZRmFFqOOdC6ugNgQ'

const randomStickers = [MOON_STICKER, STAR_STICKER]

export function sendRandomSticker(ctx: DefaultContext, seed: number): Promise<Message> {
  return ctx.replyWithSticker(randomStickers[Math.floor(seed * randomStickers.length)])
}
// "sticker": {
//           "width": 512,
//           "height": 512,
//           "emoji": "⏳",
//           "set_name": "Cat2O",
//           "is_animated": true,
//           "is_video": false,
//           "type": "regular",
//           "thumbnail": {
//             "file_id": "AAMCAgADGQEAAgT_Z9rD27HR3R3ehCn6sMq9VJhUFNgAAiMAAygPahQnUSXnjCCkBgEAB20AAzYE",
//             "file_unique_id": "AQADIwADKA9qFHI",
//             "file_size": 6112,
//             "width": 128,
//             "height": 128
//           },
//           "thumb": {
//             "file_id": "AAMCAgADGQEAAgT_Z9rD27HR3R3ehCn6sMq9VJhUFNgAAiMAAygPahQnUSXnjCCkBgEAB20AAzYE",
//             "file_unique_id": "AQADIwADKA9qFHI",
//             "file_size": 6112,
//             "width": 128,
//             "height": 128
//           },
//           "file_id": "CAACAgIAAxkBAAIE_2faw9ux0d0d3oQp-rDKvVSYVBTYAAIjAAMoD2oUJ1El54wgpAY2BA",
//           "file_unique_id": "AgADIwADKA9qFA",
//           "file_size": 47982
//         }
