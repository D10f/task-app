const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: process.env.ACC_EMAIL,
    subject: 'Welcome!',
    text: `You are now part of the community, ${name}!`
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: process.env.ACC_EMAIL,
    subject: "We're sorry to see you go!",
    text: "Please let us know what we could improve"
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
}
