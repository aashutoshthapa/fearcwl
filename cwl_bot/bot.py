import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
from flask import Flask
import threading

# Load environment variables
load_dotenv()

TOKEN = os.environ.get("DISCORD_BOT_TOKEN")

class CWLBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        # intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)

    async def setup_hook(self):
        # Load cogs
        await self.load_extension("cogs.signup")
        # Sync commands
        await self.tree.sync()
        print("Commands synced")

    async def on_ready(self):
        print(f'Logged in as {self.user} (ID: {self.user.id})')
        print('------')

# Flask health check server
app = Flask(__name__)

@app.route('/')
def health_check():
    return {'status': 'ok', 'bot': 'CWL Signup Bot'}, 200

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

def run_flask():
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)

# Main execution
if __name__ == "__main__":
    # Start Flask in a background thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Start Discord bot
    bot = CWLBot()
    if not TOKEN or TOKEN == "your_discord_bot_token_here":
        print("Error: DISCORD_BOT_TOKEN is not set in .env")
    else:
        bot.run(TOKEN)
