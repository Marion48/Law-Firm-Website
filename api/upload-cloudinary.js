// /api/upload-cloudinary.js
import cloudinary from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📤 Cloudinary upload started...');
    
    // Get the image data from the request
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Convert to base64 for Cloudinary
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    
    console.log('Uploading to Cloudinary, size:', buffer.length, 'bytes');
    
    // Upload to Cloudinary with optimization
    const uploadResult = await cloudinary.v2.uploader.upload(base64Image, {
      folder: 'byron-insights',
      public_id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
        { quality: 'auto:good' }
      ],
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Cloudinary upload successful:', {
      url: uploadResult.secure_url,
      size: uploadResult.bytes,
      format: uploadResult.format
    });
    
    // Return the secure URL (HTTPS)
    res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes
    });

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Image upload failed',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
}