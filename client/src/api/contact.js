import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, subject, message, category } = req.body;

  // Create transporter (use your email service)
  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your sending email
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  // HTML email template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .ticket-id { background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 10px; display: inline-block; }
        .content { padding: 30px; }
        .field { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea; }
        .field-label { font-weight: bold; color: #4a5568; font-size: 14px; margin-bottom: 5px; }
        .field-value { color: #2d3748; font-size: 16px; }
        .message-box { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .priority-high { border-left-color: #e53e3e; }
        .priority-medium { border-left-color: #dd6b20; }
        .priority-low { border-left-color: #38a169; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 New Support Ticket</h1>
          <div class="ticket-id">Ticket #${Date.now()
            .toString()
            .slice(-6)}</div>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="field-label">👤 Customer Name</div>
            <div class="field-value">${name}</div>
          </div>
          
          <div class="field">
            <div class="field-label">📧 Email Address</div>
            <div class="field-value">${email}</div>
          </div>
          
          <div class="field">
            <div class="field-label">🏷️ Category</div>
            <div class="field-value">${
              category.charAt(0).toUpperCase() + category.slice(1)
            }</div>
          </div>
          
          <div class="field">
            <div class="field-label">📋 Subject</div>
            <div class="field-value">${subject}</div>
          </div>
          
          <div class="message-box">
            <div class="field-label">💬 Message</div>
            <div class="field-value">${message.replace(/\n/g, "<br>")}</div>
          </div>
          
          <div style="background: #e6fffa; padding: 15px; border-radius: 8px; border: 1px solid #81e6d9;">
            <strong>⏰ Received:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div class="footer">
          <strong>Groupify Support System</strong><br>
          This ticket was automatically generated from the contact form.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "groupify.ltd@gmail.com",
      subject: `🎫 New Contact Form: ${subject}`,
      html: htmlTemplate,
      replyTo: email,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
}
