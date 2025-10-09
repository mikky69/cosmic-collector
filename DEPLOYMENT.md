# Cosmic Collector - Vercel Deployment Guide

## 🚀 Deploy to Vercel in 3 Steps

### Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to [GitHub](https://github.com) and sign in as `mikk69`
   - Click "New Repository"
   - Name: `cosmic-collector`
   - Make it public
   - Don't initialize with README (we have one)

2. **Upload your game files:**
   
   **Option A: GitHub Web Interface**
   - Click "uploading an existing file"
   - Drag and drop all game files
   - Commit with message: "Initial commit - Cosmic Collector game"
   
   **Option B: Git Command Line**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Cosmic Collector game"
   git branch -M main
   git remote add origin https://github.com/mikk69/cosmic-collector.git
   git push -u origin main
   ```

### Step 2: Connect to Vercel

1. **Sign up/Login to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign up" or "Login"
   - **Use your GitHub account** (`mikk69`) to sign in

2. **Import your project:**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose `cosmic-collector` repository
   - Click "Import"

### Step 3: Configure Deployment

1. **Project Settings:**
   - Project Name: `cosmic-collector`
   - Framework Preset: **Other**
   - Root Directory: `./` (default)
   - Build Command: Leave empty
   - Output Directory: Leave empty

2. **Environment Variables:**
   - No environment variables needed for this static game

3. **Deploy:**
   - Click "Deploy"
   - Wait 30-60 seconds for deployment
   - Your game will be live at: `https://cosmic-collector.vercel.app`

## 🎯 Your Live Game URL

After deployment, your game will be accessible at:
**`https://cosmic-collector-[random-id].vercel.app`**

Vercel will provide the exact URL after deployment.

## 🔧 Automatic Updates

Once connected:
- Every push to GitHub `main` branch automatically deploys
- Changes go live in ~30 seconds
- No manual redeployment needed

## 📱 Mobile Optimization

The game is already optimized for mobile with:
- Responsive canvas sizing
- Touch-friendly UI
- Mobile-optimized controls

## 🛠 Troubleshooting

### Common Issues:

**Build Failed:**
- Ensure all files are uploaded
- Check `vercel.json` is in root directory

**Scripts Not Loading:**
- Verify file paths in `index.html`
- Check browser developer console for errors

**Game Not Working:**
- Open browser developer tools
- Check console for JavaScript errors
- Verify all script files loaded successfully

### Need Help?
- Check Vercel deployment logs
- Contact: mikailu29@gmail.com
- GitHub Issues: Create issue in your repo

## 🌟 Custom Domain (Optional)

To use your own domain:
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Follow DNS configuration instructions

---

**🚀 Ready to launch your space adventure to the world!**

*Once deployed, share your game URL with friends and start building your cosmic empire!*