# Deploy Discord Bot to Render.com

## Prerequisites
- GitHub repository with your bot code (already done ✅)
- Render.com account (free tier available)

## Step 1: Commit Bot Code to GitHub

First, let's add the bot code and deployment files to GitHub:

```bash
# This will be done automatically
git add cwl_bot render.yaml start.sh
git commit -m "feat: add Discord bot for deployment"
git push origin main
```

## Step 2: Create a New Web Service on Render

1. Go to [Render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the repository: **`aashutoshthapa/fearcwl`**
5. Click **"Connect"**

## Step 3: Configure the Service

Fill in the following settings:

- **Name**: `cwl-signup-bot` (or any name you prefer)
- **Region**: Choose closest to you (e.g., Oregon)
- **Branch**: `main`
- **Root Directory**: Leave blank
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r cwl_bot/requirements.txt`
- **Start Command**: `python cwl_bot/bot.py`
- **Plan**: `Free`

## Step 4: Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token from `.env` |
| `SUPABASE_URL` | `https://ovaqlplyxpiffnbjlejf.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon key from `.env` |
| `COC_API_KEY` | Your CoC API key from `.env` |

**IMPORTANT**: Copy these values from your local `.env` file!

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your bot
3. Wait for the deployment to complete (you'll see logs in real-time)
4. Once it shows **"Live"**, your bot is running 24/7!

## Step 6: Verify

Go to your Discord server and test the `/signup` command. It should work!

## Troubleshooting

### Bot shows as offline
- Check the logs in Render dashboard
- Verify all environment variables are set correctly
- Make sure the Discord bot token is valid

### Commands not showing up
- Wait a few minutes for Discord to sync commands
- Try running the bot locally first to ensure commands are registered

### Build fails
- Check that `requirements.txt` is in the `cwl_bot` folder
- Verify the build command path is correct

## Keeping the Bot Alive

Render's free tier keeps your service running 24/7, but it may sleep after 15 minutes of inactivity. Since Discord bots need to stay connected, Render will keep it alive as long as it's actively listening to Discord events.

## Notes

- Free tier has 750 hours/month (enough for 24/7 operation)
- Bot will auto-restart if it crashes
- Logs are available in the Render dashboard
