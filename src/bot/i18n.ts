import type { Context } from '#root/bot/context.js'
import path from 'node:path'
import process from 'node:process'
import { I18n } from '@grammyjs/i18n'

const i18n = new I18n<Context>({
  defaultLocale: 'ru',
  directory: path.resolve(process.cwd(), 'locales'),
  useSession: true,
  fluentBundleOptions: {
    useIsolating: false,
  },
})

export { i18n as localize }

export const isMultipleLocales = i18n.locales.length > 1
