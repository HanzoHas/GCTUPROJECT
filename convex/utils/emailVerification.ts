"use node";

// Using the Brevo (Sendinblue) REST API directly via fetch to avoid extra Node built-in dependencies
import { action } from '../_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

// Define Brevo (Sendinblue) email payload interface for clarity
type BrevoEmailPayload = {
  sender: { email: string; name?: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
};




// Generate a random 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email using Brevo (Sendinblue)
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

                  const fromEmail = process.env.BREVO_FROM_EMAIL || 'no-reply@gctu.app';

      const payload: BrevoEmailPayload = {
        sender: { email: fromEmail, name: 'GCTU App' },
        to: [{ email, name: username }],
        subject: 'Verify Your Email Address',
        htmlContent: htmlContent,
        textContent: `Your verification code is ${code}`,
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY as string,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brevo API error:', errorText);
        throw new Error('Brevo API request failed');
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
