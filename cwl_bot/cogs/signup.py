import discord
from discord.ext import commands
from discord import app_commands
from utils.coc_api import fetch_player_data
from utils.supabase_client import get_supabase_client
import datetime

class Signup(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.supabase = get_supabase_client()

    def normalize_tag(self, tag: str) -> str:
        """
        Normalizes a player tag:
        - Converts to uppercase
        - Replaces 'O' with '0'
        - Ensures it starts with '#'
        """
        tag = tag.upper().replace("O", "0")
        if not tag.startswith("#"):
            tag = f"#{tag}"
        return tag

    @app_commands.command(name="signup", description="Signup for CWL with your Clash of Clans player tag")
    @app_commands.describe(player_tag="Your Clash of Clans Player Tag (e.g. #8VJLQPUYR)")
    async def signup(self, interaction: discord.Interaction, player_tag: str):
        await interaction.response.defer(ephemeral=True)

        try:
            # 1. Normalize Tag
            normalized_tag = self.normalize_tag(player_tag)
            
            # 2. Fetch Data from CoC API
            player_data = fetch_player_data(normalized_tag)
            
            if not player_data:
                await interaction.followup.send(f"❌ Could not find a player with tag `{normalized_tag}`. Please check the tag and try again.", ephemeral=True)
                return

            # Extract necessary data
            name = player_data.get("name")
            town_hall_level = player_data.get("townHallLevel")
            
            # 3. Store in Supabase
            user_id = str(interaction.user.id)
            username = interaction.user.name
            
            data = {
                "discord_user_id": user_id,
                "discord_username": username,
                "player_tag": normalized_tag,
                "player_name": name,
                "town_hall_level": town_hall_level,
                "signup_date": datetime.datetime.utcnow().isoformat()
            }

            # Insert into Supabase
            # The unique constraint on player_tag will raise an error if it already exists
            try:
                self.supabase.table("signups").insert(data).execute()
                
                embed = discord.Embed(title="✅ Signup Successful!", color=discord.Color.green())
                embed.add_field(name="Player", value=f"{name} ({normalized_tag})", inline=False)
                embed.add_field(name="Town Hall", value=str(town_hall_level), inline=True)
                embed.set_footer(text="You have been added to the CWL roster.")
                
                await interaction.followup.send(embed=embed, ephemeral=True)
                
            except Exception as e:
                # Check for unique constraint violation
                # Supabase-py / postgrest-py might return error details in a specific way
                # Usually it raises a postgrest.exceptions.APIError
                error_msg = str(e)
                if "unique_player_tag" in error_msg or "duplicate key value" in error_msg:
                     await interaction.followup.send(f"⚠️ The player tag `{normalized_tag}` is already signed up.", ephemeral=True)
                else:
                    print(f"Supabase Error: {e}")
                    await interaction.followup.send("❌ An error occurred while saving your signup. Please try again later.", ephemeral=True)

        except Exception as e:
            print(f"Signup Error: {e}")
            await interaction.followup.send("❌ An unexpected error occurred.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Signup(bot))
