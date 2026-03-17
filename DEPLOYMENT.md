# Vercel Deployment Guide

## Essential Files Created:

1. **vercel.json** - Deployment configuration (FIXED: functions only)
2. **.vercelignore** - Files to exclude from deployment
3. **api/index.js** - Serverless function entry point

## Environment Variables Required in Vercel:

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```
MYSQL_HOST=193.203.184.197
MYSQL_USER=u789801030_KPT_CMS_ADMIN
MYSQL_PASSWORD=Admin@mng103
MYSQL_DATABASE=u789801030_KPT_CMS
MYSQL_PORT=3306
JWT_SECRET=your-jwt-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=AdminPass123
NODE_ENV=production
```

## Deployment Steps:

1. **Commit all files** to Git
2. **Push to GitHub**
3. **Check Vercel deployment logs** for any errors
4. **Test deployed backend** at: `https://college-backend-gold.vercel.app/api/health`

## Troubleshooting:

- If deployment fails, check Vercel Function Logs
- Ensure all environment variables are set
- Verify MySQL credentials are correct
- Check for any build errors in deployment logs

## Files Structure:

```
College-Backend/
├── vercel.json          # ✅ Deployment config
├── .vercelignore        # ✅ Exclude files
├── api/index.js         # ✅ Serverless entry
├── server.js           # Main server file
└── ...other files
```
