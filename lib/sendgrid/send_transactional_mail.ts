const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const send_transactional_mail = async ({
  to,
  templateId,
  data
}: {
  to: string
  templateId: string
  data: object
}) => {
  const msg = {
    to,
    from: 'mail@edgen.ai',
    templateId,
    dynamicTemplateData: {
      name: 'Testing Templates'
    }
  }
  sgMail.send(msg)
}
export default send_transactional_mail
