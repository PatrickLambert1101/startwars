# HerdTrackr Website

This folder contains the complete HerdTrackr website ready to upload to Afrihost.

## Files Structure

```
website/
├── index.html              # Main landing page
├── privacy-policy.html     # Privacy Policy (required for Google Play)
├── terms-of-service.html   # Terms of Service
├── data-deletion.html      # Data Deletion Request (required for Google Play)
├── assets/
│   └── images/
│       └── herdtrackr-logo.png  # App logo
└── README.md              # This file
```

## How to Upload to Afrihost

### Option 1: Using FTP/SFTP (Recommended)

1. **Get your Afrihost hosting credentials:**
   - Log into your Afrihost account at https://my.afrihost.com
   - Go to your hosting service
   - Find FTP/SFTP credentials

2. **Using FileZilla (Free FTP Client):**
   - Download FileZilla: https://filezilla-project.org/
   - Connect using your Afrihost FTP details:
     - Host: ftp.yourdomain.co.za (or as provided by Afrihost)
     - Username: your FTP username
     - Password: your FTP password
     - Port: 21 (FTP) or 22 (SFTP)

3. **Upload the files:**
   - Navigate to `public_html` or `www` folder on the server
   - Upload all files from the `website/` folder:
     - index.html
     - privacy-policy.html
     - terms-of-service.html
     - assets/ folder (with the images inside)

### Option 2: Using Afrihost File Manager

1. Log into https://my.afrihost.com
2. Go to your hosting control panel (cPanel)
3. Open File Manager
4. Navigate to `public_html` or `www` directory
5. Upload all website files

### Option 3: Using Command Line (Mac/Linux)

If you have SFTP access:

```bash
# Navigate to the website folder
cd /Users/pat/Documents/startwars/website

# Upload using SFTP (replace with your actual credentials)
sftp username@yourdomain.co.za
> cd public_html
> put index.html
> put privacy-policy.html
> put terms-of-service.html
> mkdir assets
> cd assets
> mkdir images
> cd images
> put assets/images/herdtrackr-logo.png
> quit
```

## After Upload

### Set Privacy Policy URL in Google Play Console

1. Go to https://play.google.com/console
2. Select HerdTrackr app
3. Navigate to: **Policy** → **App content**
4. Find **Privacy Policy** section
5. Enter: `https://herdtrackr.co.za/privacy-policy.html`
   (Replace with your actual domain)
6. Save changes

### Set Data Deletion URL in Google Play Console

1. In the same **App content** section
2. Find **Data safety** section
3. Click **Start** or **Manage**
4. Under **Data types**, when asked about data deletion
5. Enter: `https://herdtrackr.co.za/data-deletion.html`
6. Save changes
7. Retry your app submission

### Verify the Upload

Visit these URLs to confirm everything works:
- https://herdtrackr.co.za/ (or your domain)
- https://herdtrackr.co.za/privacy-policy.html
- https://herdtrackr.co.za/terms-of-service.html
- https://herdtrackr.co.za/data-deletion.html

## Domain Setup

If you haven't set up your domain yet:

1. **Domain Registration:**
   - Register `herdtrackr.co.za` through Afrihost or another registrar
   - Point domain to your Afrihost hosting

2. **DNS Settings:**
   - A Record: Point to your Afrihost server IP
   - Wait 24-48 hours for DNS propagation

## URLs for Google Play Console

Once uploaded, use these URLs in Google Play Console:

**Privacy Policy URL:**
```
https://herdtrackr.co.za/privacy-policy.html
```

**Data Deletion Request URL:**
```
https://herdtrackr.co.za/data-deletion.html
```

Replace `herdtrackr.co.za` with your actual domain.

## Need Help?

- **Afrihost Support:** https://www.afrihost.com/site/en/contact-us
- **Afrihost Help Center:** https://help.afrihost.com/
- **FTP Issues:** Contact Afrihost support for FTP credentials

## Updates

To update the privacy policy or website in the future:

1. Edit the HTML files in this folder
2. Re-upload using FTP/File Manager
3. Clear your browser cache to see changes

## Logo Missing in App?

If the logo is missing in your mobile app, check:

1. **App Configuration:**
   - Look at `app.json` or `app.config.js`
   - Ensure icon path is correct

2. **Rebuild the app:**
   ```bash
   eas build --platform android
   ```

3. The logo file is already in: `website/assets/images/herdtrackr-logo.png`

---

**Created:** March 18, 2026
**Contact:** info@herdtrackr.co.za
