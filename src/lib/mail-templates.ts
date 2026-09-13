
export const getOTPEmailTemplate = (name: string, otp: string, type: 'Verification' | 'Password Reset' | 'Account Update' = 'Verification', details?: { phone?: string, email?: string }) => {
  const isRegistration = type === 'Verification';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Kravy POS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; min-height: 100vh; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0f0f0f; border-radius: 24px; overflow: hidden; border: 1px solid #1a1a1a;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #1a1a1a;">
                  <h1 style="margin: 0; color: #22c55e; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">Kravy POS</h1>
                  <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Restaurant Management</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <!-- Welcome Header -->
                  <div style="text-align: center; margin-bottom: 35px;">
                    <div style="display: inline-block; width: 48px; height: 48px; background-color: #1a1a1a; border-radius: 50%; margin-bottom: 15px; border: 1px solid #22c55e33; line-height: 48px;">
                      <span style="color: #22c55e; font-size: 20px;">👤</span>
                    </div>
                    <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Welcome to Kravy POS!</h2>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Your account verification is pending</p>
                  </div>

                  <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 15px; font-weight: 700;">Hello ${name || 'User'}, 👋</p>
                  <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                    ${isRegistration 
                      ? 'You recently tried to create a new account on Kravy POS. To complete your registration, please enter the OTP provided below.'
                      : `You recently requested to <strong>${type.toLowerCase()}</strong> your account. Use the verification code below:`
                    }
                  </p>

                  <!-- OTP Card -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161616; border-radius: 16px; margin-bottom: 25px; border: 1px solid #1a1a1a;">
                    <tr>
                      <td style="padding: 25px; text-align: center;">
                        <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Email Verification Code</p>
                        <div style="background-color: #22c55e; border-radius: 12px; padding: 18px; margin-bottom: 12px;">
                          <span style="color: #000000; font-size: 42px; font-weight: 900; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                        </div>
                        <p style="margin: 0; color: #4b5563; font-size: 11px;">🕒 This code will expire in <strong style="color: #6b7280;">10 minutes</strong></p>
                      </td>
                    </tr>
                  </table>

                  <!-- Registration Details -->
                  ${isRegistration && details ? `
                  <div style="background-color: #161616; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #1a1a1a;">
                    <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 11px; font-weight: 800; text-transform: uppercase;">Registration details:</p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Name</td>
                        <td style="padding: 4px 0; color: #ffffff; font-size: 13px; text-align: right;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Phone</td>
                        <td style="padding: 4px 0; color: #ffffff; font-size: 13px; text-align: right;">${details.phone || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Email</td>
                        <td style="padding: 4px 0; color: #22c55e; font-size: 13px; text-align: right;">${details.email || 'N/A'}</td>
                      </tr>
                    </table>
                  </div>
                  ` : ''}

                  <!-- Security Notice -->
                  <div style="border-left: 3px solid #f87171; background-color: #1a1a1a; padding: 20px; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0 0 5px 0; color: #ef4444; font-size: 12px; font-weight: 800;">Security Notice</p>
                    <p style="margin: 0; color: #6b7280; font-size: 11px; line-height: 1.5;">
                      If you did not request this, please ignore this email and contact us. Never share your OTP with anyone — Kravy team never asks for OTP.
                    </p>
                  </div>

                  <!-- Support Links -->
                  <div style="margin-top: 35px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
                    <p style="margin: 0; color: #4b5563; font-size: 11px;">
                      For any help, contact: <a href="mailto:support@kravy.in" style="color: #22c55e; text-decoration: none; font-weight: 700;">support@kravy.in</a> &bull; kravy.in
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 25px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #1a1a1a;">
                  <p style="margin: 0; color: #374151; font-size: 10px; font-weight: 700;">
                    &copy; 2026 Kravy POS &bull; Main Branch &bull; kravy.in
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getWelcomeEmailTemplate = (name: string, details: { phone: string, email: string }) => {
  const memberSince = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Kravy POS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; min-height: 100vh; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0f0f0f; border-radius: 24px; overflow: hidden; border: 1px solid #1a1a1a;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(to bottom, #111827, #0f0f0f);">
                  <h1 style="margin: 0; color: #22c55e; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">Kravy POS</h1>
                  <p style="margin: 5px 0 25px 0; color: #4b5563; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Restaurant Management</p>
                  
                  <div style="display: inline-block; width: 64px; height: 64px; background-color: rgba(34, 197, 94, 0.1); border-radius: 50%; border: 2px solid #22c55e; line-height: 64px; margin-bottom: 20px;">
                    <span style="color: #22c55e; font-size: 32px;">✓</span>
                  </div>
                  
                  <h2 style="margin: 0; color: #22c55e; font-size: 24px; font-weight: 800;">Account Successfully Created!</h2>
                  <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 14px;">You are now a member of Kravy POS</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: 700;">Welcome aboard, ${name}! 🎉</p>
                  <p style="margin: 0 0 35px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Your Kravy POS account has been successfully created and your email is verified. You can now manage your entire restaurant efficiently from one place.
                  </p>

                  <!-- Account Details Card -->
                  <div style="background-color: #161616; border-radius: 16px; padding: 25px; margin-bottom: 35px; border: 1px solid #1a1a1a;">
                    <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Your Account Details</p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Name</td>
                        <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Phone</td>
                        <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${details.phone}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Email</td>
                        <td style="padding: 6px 0; color: #22c55e; font-size: 13px; text-align: right;">${details.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Member since</td>
                        <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${memberSince}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">What you can do</p>

                  <!-- Feature Cards -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161616; border-radius: 12px; border: 1px solid #1a1a1a;">
                          <tr>
                            <td style="padding: 15px; width: 40px; text-align: center;">
                              <div style="width: 32px; height: 32px; background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; line-height: 32px; text-align: center; color: #22c55e;">田</div>
                            </td>
                            <td style="padding: 15px 15px 15px 0;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 700;">Table Management</p>
                              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;">Track dining tables and manage orders</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161616; border-radius: 12px; border: 1px solid #1a1a1a;">
                          <tr>
                            <td style="padding: 15px; width: 40px; text-align: center;">
                              <div style="width: 32px; height: 32px; background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; line-height: 32px; text-align: center; color: #22c55e;">$</div>
                            </td>
                            <td style="padding: 15px 15px 15px 0;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 700;">Billing & Payments</p>
                              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;">Create bills and track payments seamlessly</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161616; border-radius: 12px; border: 1px solid #1a1a1a;">
                          <tr>
                            <td style="padding: 15px; width: 40px; text-align: center;">
                              <div style="width: 32px; height: 32px; background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; line-height: 32px; text-align: center; color: #22c55e;">🛒</div>
                            </td>
                            <td style="padding: 15px 15px 15px 0;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 700;">Menu Management</p>
                              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;">Add items and update prices in real-time</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 35px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161616; border-radius: 12px; border: 1px solid #1a1a1a;">
                          <tr>
                            <td style="padding: 15px; width: 40px; text-align: center;">
                              <div style="width: 32px; height: 32px; background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; line-height: 32px; text-align: center; color: #22c55e;">📊</div>
                            </td>
                            <td style="padding: 15px 15px 15px 0;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 700;">Sales Reports</p>
                              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;">View daily, weekly, and monthly reports</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 40px;">
                    <a href="https://billing.kravy.in" style="display: inline-block; background-color: #22c55e; color: #000000; padding: 16px 40px; border-radius: 14px; font-size: 15px; font-weight: 900; text-decoration: none; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2);">Go to Dashboard</a>
                  </div>

                  <!-- Support Box -->
                  <div style="border-left: 3px solid #22c55e; background-color: #161616; padding: 20px; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0 0 5px 0; color: #22c55e; font-size: 13px; font-weight: 800;">Need Help?</p>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      If you have any issues, please contact us at <a href="mailto:support@kravy.in" style="color: #22c55e; text-decoration: none; font-weight: 700;">support@kravy.in</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #1a1a1a;">
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 11px; line-height: 1.5;">
                    This email was sent automatically because you created an account on Kravy POS.<br>
                    If this wasn't you, report to <a href="mailto:support@kravy.in" style="color: #ef4444; text-decoration: none;">support@kravy.in</a>
                  </p>
                  <p style="margin: 0; color: #374151; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                    &copy; 2026 Kravy POS &bull; Main Branch &bull; kravy.in
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
