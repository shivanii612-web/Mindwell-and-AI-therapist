import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `http://localhost:5173/reset-password/${token}`;
  const mailOptions = {
    from: `"MindWell Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'MindWell - Password Reset Request',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your MindWell account. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
        <hr />
        <p style="font-size: 0.8em; color: #666;">MindWell AI Therapist - Your Wellness Companion</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('MindWell: Reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('MindWell: Email sending failed:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"MindWell Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to MindWell!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to MindWell, ${name}!</h2>
        <p>We're honored to accompany you on your wellness journey. MindWell is here to provide support, guidance, and a safe space for reflection.</p>
        <p>You can start talking to your AI Therapist right now.</p>
        <a href="http://localhost:5173/chat" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Start Your First Session</a>
        <hr />
        <p style="font-size: 0.8em; color: #666;">MindWell AI Therapist - Your Wellness Companion</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('MindWell: Welcome email failed (likely credentials missing):', error.message);
    return false;
  }
};

export const sendAppointmentRequestEmail = async (details) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'mindwell.healthai@gmail.com';
  const mailOptions = {
    from: `"MindWell System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: 'New Therapy Session Request - MindWell',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #6366f1;">New Therapy Session Request</h2>
        <p>A new session request has been submitted with the following details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">User Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.userName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">User Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Session Type:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.sessionType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Preferred Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.preferredDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Preferred Time:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.preferredTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Reason:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.reason}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Notes:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${details.notes || 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">Pending Review</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Submitted Time:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin-top: 20px;" />
        <p style="font-size: 0.8em; color: #718096; text-align: center;">MindWell Platform - Automated Notification</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('MindWell: Admin notification sent to:', adminEmail);
    return true;
  } catch (error) {
    console.error('MindWell: Admin notification failed:', error.message);
    return false;
  }
};

export const sendSupportEmail = async (details) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'mindwell.healthai@gmail.com';
  const mailOptions = {
    from: `"MindWell Support System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `MindWell Support Request - [${details.category}] - ${details.subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #6366f1;">New Support Request</h2>
        <p>A new support message has been received from a user:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #edf2f7; width: 140px;">User Name:</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${details.userName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #edf2f7;">User Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${details.userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Category:</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${details.category}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Subject:</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${details.subject}</td>
          </tr>
          <tr>
            <td style="padding: 20px 10px; font-weight: bold; border-bottom: 1px solid #edf2f7; vertical-align: top;">Message:</td>
            <td style="padding: 20px 10px; border-bottom: 1px solid #edf2f7; line-height: 1.6; white-space: pre-wrap;">${details.message}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Submitted Time:</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        <div style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 0.85em; color: #64748b;">
                This request was sent from the MindWell Settings Support portal.
            </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin-top: 20px;" />
        <p style="font-size: 0.8em; color: #718096; text-align: center;">MindWell Platform - Support System</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('MindWell: Support email sent to admin:', adminEmail);
    return true;
  } catch (error) {
    console.error('MindWell: Support email sending failed:', error.message);
    return false;
  }
};
