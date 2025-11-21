import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

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

bot = CWLBot()

if __name__ == "__main__":
    if not TOKEN or TOKEN == "your_discord_bot_token_here":
        print("Error: DISCORD_BOT_TOKEN is not set in .env")
    else:
        bot.run(TOKEN)
