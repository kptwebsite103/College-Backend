require('dotenv').config();
const cloudinary = require('cloudinary').v2;

async function check() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Missing Cloudinary env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  try {
    console.log('Checking Cloudinary account...');
    // Attempt to list a small number of resources. If credentials are invalid you'll get an error.
    const res = await cloudinary.api.resources({ max_results: 1 });
    console.log('✅ Cloudinary credentials are valid.');
    console.log(`Found ${res.total_count || (res.resources && res.resources.length) || 0} resources (or access allowed).`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Cloudinary check failed:', err.message);
    if (err.http_code) console.error('HTTP code:', err.http_code);
    process.exit(1);
  }
}

check();
