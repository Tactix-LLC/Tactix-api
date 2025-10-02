import sgMail from '@sendgrid/mail';
import configs from '../configs';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const msg = {
      to: options.to,
      from: configs.email.from,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    await sgMail.send(msg);
  } catch (error: any) {
    console.error('SendGrid Error:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

