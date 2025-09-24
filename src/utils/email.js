const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `${process.env.FROM_NAME || 'Mara App'} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const message = `
    Welcome to Mara App, ${user.name}!
    
    Your account has been successfully created.
    
    Best regards,
    Mara Team
  `;

  const html = `
    <h1>Welcome to Mara App!</h1>
    <p>Hello ${user.name},</p>
    <p>Your account has been successfully created.</p>
    <p>Best regards,<br>Mara Team</p>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Welcome to Mara App',
    message,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
};
