import { RequestHandler } from "express";
import { sendEmail } from "../../utils/sendgrid_email";
import AppError from "../../utils/app_error";

// Send contact form email
export const sendContactEmail: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return next(new AppError("All fields are required", 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError("Invalid email address", 400));
    }

    // Create email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #84cc16 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: bold;
              color: #059669;
              margin-bottom: 5px;
            }
            .field-value {
              background: white;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #10b981;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 New Contact Form Submission</h1>
              <p>Tactix Fantasy Football</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">👤 From:</div>
                <div class="field-value">${name}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📧 Email:</div>
                <div class="field-value">${email}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📋 Subject:</div>
                <div class="field-value">${subject}</div>
              </div>
              
              <div class="field">
                <div class="field-label">💬 Message:</div>
                <div class="field-value">${message}</div>
              </div>
              
              <div class="footer">
                <p>This message was sent from the Tactix website contact form</p>
                <p>Please reply directly to ${email}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
New Contact Form Submission - Tactix Fantasy Football

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent from the Tactix website contact form.
Please reply directly to ${email}
    `;

    // Send email to support
    await sendEmail({
      to: "support@jointactix.app",
      subject: `Contact Form: ${subject} - ${name}`,
      html: htmlContent,
      text: textContent,
    });

    // Send confirmation email to user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #84cc16 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .message {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Message Received!</h1>
              <p>Tactix Fantasy Football</p>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for contacting Tactix! We've received your message and our support team will get back to you within 2 hours.</p>
              
              <div class="message">
                <h3>Your Message:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
              </div>
              
              <p>In the meantime, feel free to explore our app and dominate your fantasy leagues!</p>
              
              <p>Best regards,<br>
              The Tactix Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: "We received your message - Tactix Support",
      html: confirmationHtml,
      text: `Hi ${name},\n\nThank you for contacting Tactix! We've received your message and our support team will get back to you within 2 hours.\n\nBest regards,\nThe Tactix Team`,
    });

    res.status(200).json({
      status: "SUCCESS",
      message: "Message sent successfully. Check your email for confirmation.",
    });
  } catch (error) {
    next(error);
  }
};

