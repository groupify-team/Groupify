const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: [
    'http://localhost:5173',
    'https://groupify-77202.web.app',
    'https://groupify-77202.firebaseapp.com'
  ]
});
const axios = require('axios');

admin.initializeApp();

// Verify reCAPTCHA token
exports.verifyCaptcha = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA token is required'
      });
    }

    try {
        const secretKey = functions.config().recaptcha?.secret_key;      
      if (!secretKey) {
        console.error('RECAPTCHA_SECRET_KEY environment variable not set');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      // Verify with Google reCAPTCHA
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token,
            remoteip: req.ip
          }
        }
      );

      const { success, score, action } = response.data;

      // For reCAPTCHA v2: just check success
      // For reCAPTCHA v3: check success and score (0.0 to 1.0)
      const isValid = success && (score === undefined || score > 0.5);

      if (isValid) {
        // Log successful verification (optional)
        console.log('CAPTCHA verified successfully', {
          ip: req.ip,
          timestamp: new Date().toISOString(),
          score: score || 'N/A'
        });

        return res.json({
          success: true,
          message: 'CAPTCHA verified successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'CAPTCHA verification failed',
          score: score || null
        });
      }
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during CAPTCHA verification'
      });
    }
  });
});