import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: config.networkToken,
})

export function askAI(systemPrompt: string, userPrompt: string, ...history: string[]): Promise<string | null> {
  const messages: ChatCompletionMessageParam[] = [{ role: 'developer', content: systemPrompt }]
  if (history && history.length) {
    messages.push(...(history?.map((content, ind) => ({ role: (ind % 2 === 0 ? 'user' : 'assistant'), content })) as ChatCompletionMessageParam[]))
  }
  messages.push({ role: 'user', content: userPrompt })
  return openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages,
  }).then(
    (result) => {
      logger.info(result, 'Answer of gpt-4o-mini')
      return result.choices[0].message.content
    },
  )
}

export function testNetwork() {
  const completion = openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages: [
      { role: 'system', content: 'Сделай предсказание на ближающую неделю для козерога' },
      { role: 'user', content: 'Сделай предсказание на ближающую неделю для козерога' },
    ],
  })

  completion.then(result => logger.info(result.choices[0].message))
}
