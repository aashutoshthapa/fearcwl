import os
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

COC_API_KEY = os.environ.get("COC_API_KEY")
# Using the proxy URL as requested
BASE_URL = "https://cocproxy.royaleapi.dev/v1"

def fetch_player_data(player_tag: str):
    """
    Fetches player data from Clash of Clans API via proxy.
    Handles tag normalization (adding # if missing, URL encoding).
    """
    # Normalize tag: Ensure it starts with #, then URL encode it
    if not player_tag.startswith("#"):
        player_tag = f"#{player_tag}"
    
    # URL encode the tag (e.g., #TAG -> %23TAG)
    encoded_tag = urllib.parse.quote(player_tag)
    
    url = f"{BASE_URL}/players/{encoded_tag}"
    
    headers = {
        "Authorization": f"Bearer {COC_API_KEY}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return None
    else:
        response.raise_for_status()
