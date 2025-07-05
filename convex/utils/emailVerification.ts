"use node";

// Using the MailerSend REST API directly via fetch to avoid extra Node built-in dependencies
import { action } from '../_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

// Define Email payload interface for clarity
type MailerSendEmail = {
  from?: { email: string; name?: string };
  domain_id?: string;
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text: string;
};




// Generate a random 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email using MailerSend
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    code: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, code, username } = args;

    try {
      // Build email HTML
      const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p>Hello ${username},</p>
            <p>Thank you for registering with GCTU App. To complete your registration, please use the verification code below:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
              &copy; ${new Date().getFullYear()} GCTU App. All rights reserved.
            </p>
          </div>
        `;

                  const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'no-reply@mailersend.net';
      const domainId = process.env.MAILERSEND_DOMAIN_ID; // optional

      const payload: MailerSendEmail = {
        ...(domainId
          ? { domain_id: domainId }
          : { from: { email: fromEmail, name: 'GCTU App' } }),
        to: [{ email, name: username }],
        subject: 'Verify Your Email Address',
        html: htmlContent,
        text: `Your verification code is ${code}`,
      };

      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MailerSend API error:', errorText);
        throw new Error('MailerSend API request failed');
      }

      const data = await response.json();

      return { success: true, data };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new ConvexError('Failed to send verification email');
    }
  },
});

// Calculate expiration time (10 minutes from now)
export function getExpirationTime(): number {
  return Date.now() + 10 * 60 * 1000; // 10 minutes
} 
