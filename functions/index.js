const {onCall, HttpsError} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const {defineString} = require('firebase-functions/params');

// Initialize Firebase Admin
admin.initializeApp();

// Define config parameters
const emailUser = defineString('EMAIL_USER');
const emailPassword = defineString('EMAIL_PASSWORD');
const appUrl = defineString('APP_URL');

// Configure email transporter (lazy initialization)
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser.value(),
      pass: emailPassword.value()
    }
  });
}

// Email template loader
async function loadEmailTemplate(templateName, variables) {
  try {
    const templatePath = path.join(__dirname, 'email-templates', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key]);
    });
    
    return template;
  } catch (error) {
    console.error('Email template error:', error);
    throw new Error('Failed to load email template');
  }
}

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
exports.sendVerificationEmail = onCall(async (request) => {
  try {
    const { email, name } = request.data;
    
    if (!email || !name) {
      throw new HttpsError('invalid-argument', 'Email and name are required');
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store verification code in Firestore
    await admin.firestore().collection('verificationCodes').doc(email).set({
      code: verificationCode,
      expires: verificationExpires,
      email: email,
      name: name,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Load verification email template
    const verificationEmailHtml = await loadEmailTemplate('verification', {
      USER_NAME: name,
      VERIFICATION_CODE: verificationCode,
      VERIFICATION_LINK: `${appUrl.value()}/confirm-email?code=${verificationCode}&email=${encodeURIComponent(email)}`,
      UNSUBSCRIBE_LINK: `${appUrl.value()}/unsubscribe`,
      PRIVACY_LINK: `${appUrl.value()}/privacy-policy`
    });

    // Send verification email
    await getTransporter().sendMail({
      from: '"Groupify Team" <noreply@groupify.com>',
      to: email,
      subject: 'Verify Your Email - Groupify',
      html: verificationEmailHtml
    });

    console.log(`Verification email sent to: ${email}`);
    return { success: true, message: 'Verification email sent' };

  } catch (error) {
    console.error('Send verification error:', error);
    throw new HttpsError('internal', 'Failed to send verification email');
  }
});

// Verify email code
exports.verifyEmailCode = onCall(async (request) => {
  try {
    const { email, verificationCode } = request.data;

    if (!email || !verificationCode) {
      throw new HttpsError('invalid-argument', 'Email and verification code are required');
    }

    // Get verification code from Firestore
    const verificationDoc = await admin.firestore().collection('verificationCodes').doc(email).get();
    
    if (!verificationDoc.exists) {
      throw new HttpsError('not-found', 'Verification code not found');
    }

    const verificationData = verificationDoc.data();

    // Check if already verified
    if (verificationData.verified) {
      throw new HttpsError('already-exists', 'Email already verified');
    }

    // Check if code matches and hasn't expired
    if (verificationData.code !== verificationCode) {
      throw new HttpsError('invalid-argument', 'Invalid verification code');
    }

    if (Date.now() > verificationData.expires) {
      throw new HttpsError('deadline-exceeded', 'Verification code has expired');
    }

    // Mark email as verified
    await admin.firestore().collection('verificationCodes').doc(email).update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send welcome email
    const welcomeEmailHtml = await loadEmailTemplate('welcome', {
      USER_NAME: verificationData.name,
      DASHBOARD_LINK: `${appUrl.value()}/dashboard`,
      HELP_CENTER_LINK: `${appUrl.value()}/help`,
      FACEBOOK_LINK: 'https://facebook.com/groupify',
      INSTAGRAM_LINK: 'https://instagram.com/groupify',
      TWITTER_LINK: 'https://twitter.com/groupify',
      LINKEDIN_LINK: 'https://linkedin.com/company/groupify',
      UNSUBSCRIBE_LINK: `${appUrl.value()}/unsubscribe`,
      PRIVACY_LINK: `${appUrl.value()}/privacy-policy`,
      TERMS_LINK: `${appUrl.value()}/terms`
    });

    await getTransporter().sendMail({
      from: '"Groupify Team" <welcome@groupify.com>',
      to: email,
      subject: 'Welcome to Groupify! 🎉',
      html: welcomeEmailHtml
    });

    console.log(`Email verified and welcome email sent to: ${email}`);
    return { success: true, message: 'Email verified successfully' };

  } catch (error) {
    console.error('Verify email error:', error);
    throw new HttpsError('internal', 'Email verification failed');
  }
});

// Resend verification code
exports.resendVerificationCode = onCall(async (request) => {
  try {
    const { email } = request.data;

    if (!email) {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    // Get existing verification data
    const verificationDoc = await admin.firestore().collection('verificationCodes').doc(email).get();
    
    if (!verificationDoc.exists) {
      throw new HttpsError('not-found', 'No verification request found for this email');
    }

    const verificationData = verificationDoc.data();

    // Check if already verified
    if (verificationData.verified) {
      throw new HttpsError('already-exists', 'Email already verified');
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Update verification code in Firestore
    await admin.firestore().collection('verificationCodes').doc(email).update({
      code: verificationCode,
      expires: verificationExpires,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Load verification email template
    const verificationEmailHtml = await loadEmailTemplate('verification', {
      USER_NAME: verificationData.name,
      VERIFICATION_CODE: verificationCode,
      VERIFICATION_LINK: `${appUrl.value()}/confirm-email?code=${verificationCode}&email=${encodeURIComponent(email)}`,
      UNSUBSCRIBE_LINK: `${appUrl.value()}/unsubscribe`,
      PRIVACY_LINK: `${appUrl.value()}/privacy-policy`
    });

    // Send verification email
    await getTransporter().sendMail({
      from: '"Groupify Team" <noreply@groupify.com>',
      to: email,
      subject: 'Verify Your Email - Groupify',
      html: verificationEmailHtml
    });

    console.log(`Verification email resent to: ${email}`);
    return { success: true, message: 'Verification email resent' };

  } catch (error) {
    console.error('Resend verification error:', error);
    throw new HttpsError('internal', 'Failed to resend verification email');
  }
});