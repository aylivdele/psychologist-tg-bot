import type { Context, ConversationContext } from '#root/bot/context.js'
import type { QuestionsAnswer } from '#root/neural-network/prompts/first.js'
import type { Conversation } from '@grammyjs/conversations'
import { splitLongText } from '#root/bot/helpers/conversation.js'
import { askAI } from '#root/neural-network/index.js'
import { getFirstPrompt } from '#root/neural-network/prompts/first.js'

export async function askConversation(conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext) {
  await ctx.reply(ctx.t('ask.start'))

  const problem = await conversation.form.text({
    otherwise: octx => octx.reply(octx.t('only-text')),
  })

  const rawQuestionsAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), problem).catch(() => null)))

  if (!rawQuestionsAnswer) {
    await ctx.reply(ctx.t('ai-error'))
    return
  }

  const questionsAnswer = JSON.parse(rawQuestionsAnswer) as QuestionsAnswer

  await ctx.reply(ctx.t('ask.questions'))
  const userAnswers = []
  for (const question of questionsAnswer.questions) {
    await ctx.reply(question)
    const userAnswer = await conversation.form.text({
      otherwise: octx => octx.reply(octx.t('only-text')),
    })
    userAnswers.push({ question, answer: userAnswer })
  }

  const answersMessage = userAnswers.reduce((acc, ans, ind) => `${acc}${ind + 1}. ${ans}\n`, '')

  const aiAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), problem, rawQuestionsAnswer, answersMessage).then(result => splitLongText(result)).catch(() => null))) ?? [ctx.t('ask.questions')]

  for (const message of aiAnswer) {
    await ctx.reply(message)
  }
}
