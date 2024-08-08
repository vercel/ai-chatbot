import { z } from 'zod'

const InkeepRecordTypes = z.enum([
  'documentation',
  'site',
  'discourse_post',
  'github_issue',
  'github_discussion',
  'stackoverflow_question',
  'discord_forum_post',
  'discord_message',
  'custom_question_answer'
])

const LinkType = z.union([
  InkeepRecordTypes,
  z.string() // catch all
])

const LinkSchema = z
  .object({
    label: z.string().nullish(), // what it's referenced as in the message body, e.g. '1'
    url: z.string(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    type: LinkType.nullish(),
    breadcrumbs: z.array(z.string()).nullish()
  })
  .passthrough()

export const LinksSchema = z.array(LinkSchema).nullish()

export const FollowUpQuestionsSchema = z
  .array(
    z
      .string()
      .describe(
        "A follow up question that the user might want to ask. These should have a tone that matches the user's past messages."
      )
  )
  .nullish()
  
export const LinksToolSchema = z.object({
  links: LinksSchema,
})

export const LinksObj = z.object({
  parameters: LinksToolSchema
}).describe("Retrieve links related to the assistant's response")

export const IsProspectObj = z.object({
  parameters: z.object({
    subjectMatter: z.string().describe('The subject matter of the user\'s question.')
  })
}).describe('Tool call when the user is a prospect.')

export const NeedsHelpObj = z.object({
  parameters: z.object({
    subjectMatter: z.string().describe('The subject matter of the user\'s question.')
  })
}).describe('Tool call when the user needs help.')