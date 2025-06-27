const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const cors = require("cors")({
  origin: [
    "http://localhost:5173",
    "https://groupify-77202.web.app",
    "https://groupify-77202.firebaseapp.com",
  ],
});
const axios = require("axios");

admin.initializeApp();

// Configure your email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true, // Enable debug logs
  logger: true, // Enable logger
});

// Send Contact Email Function
exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  console.log("sendContactEmail called with data:", data);

  // Validate input data
  if (!data || typeof data !== "object") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request data must be an object"
    );
  }

  const { name, email, subject, message, category } = data;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: name, email, subject, message"
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid email format"
    );
  }

  let htmlTemplate;
  try {
    const templatePath = path.join(
      __dirname,
      "email-templates",
      "contactus.html"
    );

    if (fs.existsSync(templatePath)) {
      htmlTemplate = fs.readFileSync(templatePath, "utf8");
    } else {
      // Fallback template
      htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .field { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5; }
            .field-label { font-weight: bold; color: #4a5568; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; }
            .field-value { color: #2d3748; font-size: 16px; line-height: 1.5; }
            .message-box { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
            .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .alert { background: #ef4444; color: white; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-weight: 600; text-align: center; }
            .category-badge { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block; }
            .action-buttons { text-align: center; margin-top: 20px; }
            .btn { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 0 5px; display: inline-block; }
            .btn-whatsapp { background: #25d366; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📸 New Contact Message - Groupify</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">You have received a new message from your website</p>
            </div>
            
            <div class="content">
              <div class="alert">
                🚨 URGENT: New customer inquiry requires your attention
              </div>
              
              <div class="field">
                <div class="field-label">From</div>
                <div class="field-value">{{name}} &lt;{{email}}&gt;</div>
              </div>
              
              <div class="field">
                <div class="field-label">Category</div>
                <div class="field-value">
                  <span class="category-badge">{{category}}</span>
                </div>
              </div>
              
              <div class="field">
                <div class="field-label">Subject</div>
                <div class="field-value">{{subject}}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Message</div>
                <div class="field-value message-box">{{message}}</div>
              </div>
              
              <div style="background: #e6fffa; padding: 15px; border-radius: 8px; border: 1px solid #81e6d9; margin-top: 20px;">
                <strong>⏰ Received:</strong> {{timestamp}}
              </div>
              
              <div class="action-buttons">
                <a href="mailto:{{email}}?subject=Re: {{subject}}" class="btn">📧 Reply via Email</a>
                <a href="https://wa.me/972532448624?text=Hi {{name}}, thanks for contacting Groupify!" class="btn btn-whatsapp">💬 WhatsApp Reply</a>
              </div>
            </div>
            
            <div class="footer">
              <strong>Groupify Support System</strong><br>
              This message was automatically generated from the contact form.<br>
              © 2025 Groupify. Made with ❤️ for photo lovers.
            </div>
          </div>
        </body>
        </html>
      `;
    }
  } catch (error) {
    console.error("Error reading template:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Template processing error"
    );
  }

  // Replace template variables
  const finalHtml = htmlTemplate
    .replace(/{{name}}/g, name || "Unknown")
    .replace(/{{email}}/g, email || "")
    .replace(/{{subject}}/g, subject || "No Subject")
    .replace(/{{message}}/g, (message || "").replace(/\n/g, "<br>"))
    .replace(
      /{{category}}/g,
      (category || "general").charAt(0).toUpperCase() +
        (category || "general").slice(1)
    )
    .replace(/{{timestamp}}/g, new Date().toLocaleString())
    .replace(/{{whatsapp_number}}/g, "972532448624");

  try {
    // Test the transporter first
    console.log("Testing email transporter...");
    await transporter.verify();
    console.log("Email transporter verified successfully");

    const mailOptions = {
      from: `"Groupify Contact Form" <${functions.config().email.user}>`,
      to: "groupify.ltd@gmail.com",
      subject: `🎫 New Contact Form: ${subject}`,
      html: finalHtml,
      replyTo: email,
    };

    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Email sending error details:", {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
    });

    // Provide specific error messages
    if (error.code === "EAUTH" || error.responseCode === 535) {
      throw new functions.https.HttpsError(
        "internal",
        "Email authentication failed. Please check email credentials."
      );
    } else if (error.code === "ECONNECTION") {
      throw new functions.https.HttpsError(
        "internal",
        "Could not connect to email server. Please try again later."
      );
    } else {
      throw new functions.https.HttpsError(
        "internal",
        `Failed to send email: ${error.message}`
      );
    }
  }
});

// Send Job Application Email Function
exports.sendJobApplicationEmail = functions.https.onCall(
  async (data, context) => {
    console.log("sendJobApplicationEmail called with data:", data);

    const {
      firstName,
      lastName,
      email,
      phone,
      experience,
      coverLetter,
      portfolio,
      availableDate,
      position,
      department,
      cvFile,
    } = data;

    if (!firstName || !lastName || !email || !position) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: firstName, lastName, email, position"
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid email format"
      );
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .applicant-info { background: #f0f9ff; padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #3b82f6; }
        .field { margin-bottom: 15px; display: flex; }
        .field-label { font-weight: bold; color: #374151; min-width: 140px; font-size: 14px; }
        .field-value { color: #4b5563; flex: 1; }
        .position-banner { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 25px; }
        .cover-letter { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; white-space: pre-wrap; border-left: 4px solid #6366f1; }
        .actions { background: #fef3c7; padding: 20px; border-radius: 10px; text-align: center; margin-top: 25px; }
        .btn { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 0 10px; display: inline-block; font-weight: 600; }
        .btn-secondary { background: #10b981; }
        .alert { background: #ef4444; color: white; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-weight: 600; text-align: center; }
        .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e5e7eb; }
        .skills-badge { background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💼 New Job Application - Groupify</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Someone applied for a position at your company!</p>
        </div>
        
        <div class="content">
          <div class="alert">
            🎯 NEW APPLICATION: Review candidate details below
          </div>
          
          <div class="position-banner">
            <h2 style="margin: 0;">Applied for: {{position}}</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">{{department}} Department</p>
          </div>
          
          <div class="applicant-info">
            <h3 style="margin-top: 0; color: #1e40af;">👤 Applicant Information</h3>
            <div class="field">
              <div class="field-label">Full Name:</div>
              <div class="field-value"><strong>{{firstName}} {{lastName}}</strong></div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value">{{email}}</div>
            </div>
            <div class="field">
              <div class="field-label">Phone:</div>
              <div class="field-value">{{phone}}</div>
            </div>
            <div class="field">
              <div class="field-label">Experience:</div>
              <div class="field-value"><span class="skills-badge">{{experience}}</span></div>
            </div>
            <div class="field">
              <div class="field-label">Portfolio:</div>
              <div class="field-value">{{portfolio}}</div>
            </div>
            <div class="field">
              <div class="field-label">Available From:</div>
              <div class="field-value">{{availableDate}}</div>
            </div>
          </div>
          
          {{#if coverLetter}}
          <div>
            <h3 style="color: #374151;">📝 Cover Letter</h3>
            <div class="cover-letter">{{coverLetter}}</div>
          </div>
          {{/if}}
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #10b981; margin-top: 20px;">
            <strong>📎 CV/Resume:</strong> {{#if cvFile}}Attached to this email{{else}}Not provided{{/if}}
          </div>
          
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #3b82f6; margin-top: 20px;">
            <strong>⏰ Applied on:</strong> {{timestamp}}
          </div>
          
          <div class="actions">
            <h3 style="margin-top: 0;">🚀 Quick Actions</h3>
            <a href="mailto:{{email}}?subject=Re: Application for {{position}}" class="btn">📧 Email Candidate</a>
            <a href="https://wa.me/{{whatsappNumber}}?text=Hi {{firstName}}, thanks for applying to {{position}} at Groupify!" class="btn btn-secondary">💬 WhatsApp</a>
          </div>
        </div>
        
        <div class="footer">
          <strong>Groupify HR System</strong><br>
          Application received via careers page<br>
          © 2025 Groupify. Building the future of photo sharing.
        </div>
      </div>
    </body>
    </html>
  `;

    const finalHtml = htmlTemplate
      .replace(/{{firstName}}/g, firstName || "")
      .replace(/{{lastName}}/g, lastName || "")
      .replace(/{{email}}/g, email || "")
      .replace(/{{phone}}/g, phone || "Not provided")
      .replace(/{{experience}}/g, experience || "Not specified")
      .replace(/{{coverLetter}}/g, coverLetter || "")
      .replace(/{{portfolio}}/g, portfolio || "Not provided")
      .replace(/{{availableDate}}/g, availableDate || "Not specified")
      .replace(/{{position}}/g, position || "")
      .replace(/{{department}}/g, department || "")
      .replace(/{{timestamp}}/g, new Date().toLocaleString())
      .replace(/{{whatsappNumber}}/g, "972532448624");

    try {
      const mailOptions = {
        from: `"Groupify Careers" <${functions.config().email.user}>`,
        to: "groupify.ltd@gmail.com",
        subject: `🎯 New Application: ${position} - ${firstName} ${lastName}`,
        html: finalHtml,
        replyTo: email,
      };

      if (cvFile) {
        mailOptions.attachments = [
          {
            filename: `${firstName}_${lastName}_CV.pdf`,
            content: cvFile,
            encoding: "base64",
          },
        ];
      }

      const result = await transporter.sendMail(mailOptions);
      console.log("Job application email sent successfully:", result.messageId);

      return {
        success: true,
        message: "Application submitted successfully",
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("Job application email error:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to submit application: ${error.message}`
      );
    }
  }
);
