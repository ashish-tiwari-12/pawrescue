import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.EMAIL_USER || "";
  // Remove whitespace from App Password
  const pass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send 6-Digit Email Verification Code to new users
 */
export const sendVerificationEmail = async (
  to: string,
  name: string,
  otp: string
): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const fromUser = process.env.EMAIL_USER || "no-reply@pawconnect.in";

    const mailOptions = {
      from: `"PawConnect India" <${fromUser}>`,
      to,
      subject: "🐾 Verify Your Email - PawConnect India",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8ff; border-radius: 16px; overflow: hidden; border: 1px solid #eaedff;">
          <div style="background: linear-gradient(135deg, #9d4300 0%, #f97316 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🐾 PawConnect India</h1>
            <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">Stray Animal Rescue & NGO Coordination Network</p>
          </div>

          <div style="padding: 32px 28px; background: #ffffff;">
            <h2 style="font-size: 20px; color: #131b2e; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="font-size: 14px; color: #584237; line-height: 1.6;">
              Thank you for joining India's dedicated civic network to protect and rescue stray animals. Please enter the verification code below to activate your account:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <div style="display: inline-block; background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 16px 36px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #9d4300; font-family: monospace;">
                  ${otp}
                </span>
              </div>
              <p style="font-size: 12px; color: #8c7164; margin-top: 8px;">Valid for 15 minutes. Do not share this code.</p>
            </div>

            <p style="font-size: 13px; color: #584237; line-height: 1.5;">
              Once verified, you will be able to file emergency rescue sighting reports, receive real-time ambulance tracking alerts, and coordinate with nearby partner NGOs.
            </p>
          </div>

          <div style="padding: 20px 28px; background: #faf8ff; border-top: 1px solid #eaedff; text-align: center; font-size: 12px; color: #8c7164;">
            <p style="margin: 0;">© 2026 PawConnect India. Helping Every Animal Find Safety.</p>
            <p style="margin: 4px 0 0 0;">If you did not request this email, please ignore it.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
};

/**
 * Send 6-Digit Password Reset Code
 */
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  otp: string
): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const fromUser = process.env.EMAIL_USER || "no-reply@pawconnect.in";

    const mailOptions = {
      from: `"PawConnect India Security" <${fromUser}>`,
      to,
      subject: "🔒 Password Reset Code - PawConnect India",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8ff; border-radius: 16px; overflow: hidden; border: 1px solid #eaedff;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">🔒 Password Reset Request</h1>
            <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">PawConnect India Account Security</p>
          </div>

          <div style="padding: 32px 28px; background: #ffffff;">
            <h2 style="font-size: 20px; color: #131b2e; margin-top: 0;">Hello ${name},</h2>
            <p style="font-size: 14px; color: #584237; line-height: 1.6;">
              We received a request to reset your password. Use the 6-digit verification code below to set a new password:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <div style="display: inline-block; background: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 16px 36px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3730a3; font-family: monospace;">
                  ${otp}
                </span>
              </div>
              <p style="font-size: 12px; color: #8c7164; margin-top: 8px;">This code will expire in 15 minutes.</p>
            </div>

            <p style="font-size: 13px; color: #584237; line-height: 1.5;">
              If you didn't ask to reset your password, you can safely ignore this email. Your current password will remain unchanged.
            </p>
          </div>

          <div style="padding: 20px 28px; background: #faf8ff; border-top: 1px solid #eaedff; text-align: center; font-size: 12px; color: #8c7164;">
            <p style="margin: 0;">© 2026 PawConnect India Security Center</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return false;
  }
};

/**
 * Send Automated Rescue Status Update Email to Citizen
 */
export const sendRescueNotificationEmail = async (
  to: string,
  citizenName: string,
  trackingId: string,
  status: string,
  note?: string
): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const fromUser = process.env.EMAIL_USER || "no-reply@pawconnect.in";

    const mailOptions = {
      from: `"PawConnect India" <${fromUser}>`,
      to,
      subject: `🚨 Status Update: Complaint #${trackingId} is now "${status}"`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8ff; border-radius: 16px; overflow: hidden; border: 1px solid #eaedff;">
          <div style="background: linear-gradient(135deg, #006c49 0%, #10b981 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Rescue Status Update</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Tracking ID: #${trackingId}</p>
          </div>

          <div style="padding: 28px; background: #ffffff;">
            <h2 style="font-size: 18px; color: #131b2e; margin-top: 0;">Dear ${citizenName},</h2>
            <p style="font-size: 14px; color: #584237; line-height: 1.6;">
              The rescue team has updated the status of your reported complaint:
            </p>

            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #065f46;">
                <strong>Current Status:</strong> <span style="font-weight: 800; text-transform: uppercase;">${status}</span>
              </p>
              ${
                note
                  ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;"><strong>Team Note:</strong> ${note}</p>`
                  : ""
              }
            </div>

            <p style="font-size: 13px; color: #584237;">
              You can track real-time progress on your citizen dashboard anytime.
            </p>
          </div>

          <div style="padding: 16px; background: #faf8ff; text-align: center; font-size: 12px; color: #8c7164;">
            © 2026 PawConnect India. Thank you for caring for community animals.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("❌ Error sending status update email:", error);
    return false;
  }
};
