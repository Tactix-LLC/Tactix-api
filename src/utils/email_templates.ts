export const generateOTPEmailTemplate = (otp: string, firstName: string, type: 'verification' | 'reset' = 'verification') => {
  const isVerification = type === 'verification';
  const title = isVerification ? 'Email Verification' : 'Password Reset';
  const message = isVerification 
    ? 'Welcome to Tactix Football Fantasy! Please verify your email address to complete your account setup.'
    : 'You requested a password reset for your Tactix Football Fantasy account.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Tactix Football Fantasy</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1E7177 0%, #176B5E 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .otp-container {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px dashed #9ca3af;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #1E7177;
            letter-spacing: 8px;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .otp-expiry {
            font-size: 14px;
            color: #ef4444;
            margin-top: 15px;
            font-weight: 600;
        }
        .instructions {
            background-color: #f0f9ff;
            border-left: 4px solid #1E7177;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .instructions h3 {
            margin: 0 0 10px 0;
            color: #1E7177;
            font-size: 16px;
        }
        .instructions p {
            margin: 0;
            color: #1E7177;
            font-size: 14px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0 0 10px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #1E7177;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .social-links {
            margin-top: 20px;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
        }
        .security-notice {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .security-notice p {
            margin: 0;
            color: #dc2626;
            font-size: 13px;
            text-align: center;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/ddkybdc5n/image/upload/v1758252759/Tactix_name_yqfmgg.png" alt="Tactix Football Fantasy" class="logo" onerror="this.style.display='none'">
            <h1>Tactix Football Fantasy</h1>
            <p>Your Ultimate Fantasy Football Experience</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${firstName}! 👋
            </div>
            
            <div class="message">
                ${message}
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">⏰ Expires in 5 minutes</div>
            </div>
            
            <div class="instructions">
                <h3>📋 How to use this code:</h3>
                <p>1. Copy the 5-digit code above<br>
                2. Return to the Tactix app<br>
                3. Paste the code in the verification field<br>
                4. Complete your ${isVerification ? 'account setup' : 'password reset'}</p>
            </div>
            
            <div class="security-notice">
                <p>🔒 Never share this code with anyone. Tactix will never ask for your verification code.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent to you because you ${isVerification ? 'created an account' : 'requested a password reset'} on Tactix Football Fantasy.</p>
            <p>If you didn't ${isVerification ? 'create an account' : 'request this reset'}, please ignore this email.</p>
            
            <div class="social-links">
                <a href="https://jointactix.app/privacy-policy">Privacy Policy</a>
                <a href="mailto:support@jointactix.app">Support</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                © 2025 Tactix Football Fantasy. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

export const generatePasswordResetEmailTemplate = (otp: string, firstName: string) => {
  return generateOTPEmailTemplate(otp, firstName, 'reset');
};
