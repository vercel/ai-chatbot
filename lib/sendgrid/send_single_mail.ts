const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const send_single_mail = async ({
  to,
  subject,
  text,
  html
}: {
  to: string
  subject: string
  text: string
  html: string
}) => {
  const msg = {
    from: 'mails@edgen.ai', // Change to your verified sender
    to,
    subject,
    text,
    html
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error: any) => {
      console.error(error)
    })
}
export default send_single_mail
