// api/upload-image.js
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Uploading image to Vercel Blob...');
    
    const blob = await put(req.query.filename || 'image.jpg', req, {
      access: 'public',
      addRandomSuffix: true
    });

    console.log('Image uploaded:', blob.url);
    
    res.status(200).json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message 
    });
  }
}
