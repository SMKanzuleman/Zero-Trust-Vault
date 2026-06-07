const nodemailer = require('nodemailer');


const sendVerificationEmail = async (email, code) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Zero-Trust Vault" <no-reply@zerotrustvault.com>';

  // Fallback to Mock console logging if SMTP settings are missing
  if (!host || !user || !pass) {
    console.log('\n======================================================');
    console.log(`✉️  [MAIL MOCK] Verification Code for: ${email}`);
    console.log(`   👉 CODE: ${code}`);
    console.log('   (Configure SMTP in .env for real email delivery)');
    console.log('======================================================\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10) || 587,
      secure: parseInt(port, 10) === 465, // True for port 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: email,
      subject: 'Zero-Trust Vault — Email Verification Code',
      text: `Your verification code is: ${code}\nThis code is valid for 15 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a;">
          <h2 style="text-align: center; color: #000; font-size: 24px; margin-bottom: 24px; letter-spacing: -0.5px;">Zero-Trust Vault</h2>
          <p style="font-size: 15px; line-height: 1.5;">Hello,</p>
          <p style="font-size: 15px; line-height: 1.5; margin-bottom: 24px;">To finish setting up your identity and activate your vault features, please verify your email address by entering this 6-digit code:</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; padding: 16px; font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0; color: #0f172a;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This code will expire in 15 minutes. If you did not request this verification code, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">This is an automated security transmission from Zero-Trust Vault.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️  [Mailer] Verification email sent to: ${email}`);
  } catch (err) {
    console.error(`❌ [Mailer] SMTP sending failed: ${err.message}`);
    console.log('\n======================================================');
    console.log(`✉️  [FALLBACK MOCK] Verification Code for: ${email}`);
    console.log(`   👉 CODE: ${code}`);
    console.log('======================================================\n');
  }
};

module.exports = { sendVerificationEmail };
