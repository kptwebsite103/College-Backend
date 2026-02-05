// ImageKit Authentication Endpoint
// This endpoint should be added to your backend at /api/imagekit/auth

const ImageKit = require('imagekit');

// Initialize ImageKit with your credentials
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

exports.getImageKitAuth = async (req, res) => {
  try {
    const { fileName, fileSize, fileType } = req.body;
    
    // Generate authentication parameters for ImageKit upload
    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    console.log('🔐 ImageKit auth requested for:', { fileName, fileSize, fileType });
    
    res.json({
      token: authenticationParameters.token,
      expire: authenticationParameters.expire,
      signature: authenticationParameters.signature,
      publicKey: authenticationParameters.publicKey
    });
    
  } catch (error) {
    console.error('❌ ImageKit auth error:', error);
    res.status(500).json({ 
      message: 'Failed to generate ImageKit authentication' 
    });
  }
};

// Example Express.js route:
// app.post('/api/imagekit/auth', authenticateToken, getImageKitAuth);

// Example with authentication middleware:
// const authenticateToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ message: 'Authentication required' });
//   }
//   // Verify your JWT token here
//   next();
// };
