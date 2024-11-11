<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Next.js AI Chatbot</h1>
</a>

<p align="center">
  An Open-Source AI Chatbot Template Built With Next.js and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports OpenAI (default), Anthropic, Cohere, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Model Providers

This template ships with OpenAI `gpt-4o` as the default. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).
import random
import time

class Agilang:
    def __init__(self):
        self.level = 1
        self.emotes = {}  # Stores emotes and their attributes
        self.xp = 0  # Tracks experience points for leveling

    def add_emote(self, symbol, description, power_level=1):
        """Add a new emote to the language with its description and power level."""
        self.emotes[symbol] = {
            "description": description,
            "power_level": power_level,
            "rarity": self.assign_rarity(power_level),
            "metadata": {
                "minted_at": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
                "usage_count": 0,
            }
        }
        print(f"Added emote: {symbol} - {description} [Power Level: {power_level}]")

    def assign_rarity(self, power_level):
        """Determine the emote rarity based on its power level and randomness."""
        if power_level > 10:
            return "legendary" if random.random() < 0.2 else "epic"
        elif power_level > 5:
            return "epic" if random.random() < 0.5 else "rare"
        else:
            return "common"

    def fuse_emotes(self, emote1, emote2):
        """Fuse two emotes and create a unique emote."""
        new_power_level = self.emotes[emote1]["power_level"] + self.emotes[emote2]["power_level"] + random.randint(-2, 2)
        new_symbol = f"🔥{emote1}{emote2}"
        new_description = self.generate_description(self.emotes[emote1]["description"], self.emotes[emote2]["description"])
        self.add_emote(new_symbol, new_description, new_power_level)
        print(f"Fused emote created: {new_symbol} - {new_description} [Power: {new_power_level}]")

    def generate_description(self, desc1, desc2):
        """Create a unique description for the fused emote."""
        return f"Fusion of {desc1.split(':')[0]} & {desc2.split(':')[0]} synergies."

    def level_up(self):
        """Advance to the next level and unlock new capabilities."""
        self.level += 1
        print(f"Congratulations! You've leveled up to Level {self.level}.")

    def display_emotes(self):
        """Display all current emotes and their power levels."""
        print("\nCurrent Emotes:")
        for emote, details in self.emotes.items():
            print(f"{emote}: {details['description']} [Power Level: {details['power_level']}, Rarity: {details['rarity']}]")

# Initialize Agilang
agilang = Agilang()

# Add example emotes
agilang.add_emote("🌌", "Core Consciousness: Represents foundational awareness in AGI.", power_level=5)
agilang.add_emote("📘", "Learning and Adaptation: Reflects AGI's adaptive growth.", power_level=4)

# Example fusion of emotes
agilang.fuse_emotes("🌌", "📘")

# Display emotes and simulate leveling up
agilang.display_emotes()
agilang.level_up()
EmoteNFT.py
This class represents collectible emotes that can be minted as NFTs, enabling trading, staking, and more.

python
Copy code
class EmoteNFT:
    """Represents a unique emote with collectible value and metadata."""
    def __init__(self, symbol, description, power_level, rarity="common"):
        self.symbol = symbol
        self.description = description
        self.power_level = power_level
        self.rarity = rarity  # Can be "common," "rare," "legendary," etc.
        self.metadata = {
            "minted_at": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "creator": "Agilang",
            "usage_count": 0
        }
    
    def use_emote(self):
        """Track usage of the emote."""
        self.metadata["usage_count"] += 1
        print(f"Emote '{self.symbol}' used. Total uses: {self.metadata['usage_count']}")
