# 🌸 (w) OwO Bot & Web Companion App

> **The ultimate Discord economy, zoo, and gambling game — 100,000x better, ultra-smooth, zero errors, and persistent!**

---

## ✨ Features

- 🎮 **100% Accurate OwO Bot & Mechanics**:
  - **Animal Hunting & Zoo**: Over 70+ animals across 8 rarities (*Common, Uncommon, Rare, Epic, Mythic, Legendary, Fabled, Gem*), drop rates, display mascots, selling duplicates, and animal sacrifices.
  - **Gambling & Casino**:
    - `owo coinflip <bet> [h/t]` — Double or nothing coin toss
    - `owo slots <bet>` — 3-reel slot machine with animated payouts up to 10x
    - `owo blackjack <bet>` — Interactive Discord Blackjack with `[🃏 Hit]`, `[🛑 Stand]`, and `[⚡ Double Down]` buttons
    - `owo roulette <bet> <space>` — Roulette wheel betting
  - **Economy & Daily**:
    - `owo daily` — Daily Cowoncy rewards + daily streak multipliers + bonus mystery crates & gems
    - `owo balance` / `cash` — Check your Cowoncy balance
    - `owo give @user <amount>` — Safe player-to-player transfers
    - `owo quest` / `cl` — Daily checklists with claimable bonus rewards
    - `owo pray` / `curse` — Luck buffs and blessings
  - **Battles & RPG**:
    - `owo battle` — Turn-based dungeon battles with team champions
    - `owo team` — 3-slot animal team roster with levels and stats
    - `owo weapon` — Armory weapons (Daggers, Swords, Bows, Wands, Scythes)
  - **Social & Marriage**:
    - `owo marry @user` — Interactive proposals with `[💍 Accept]` and `[💔 Decline]` buttons (requires Love Ring)
    - `owo divorce` — End marriage
    - `owo hug`, `kiss`, `pat`, `slap`, `bite`, `cuddle`, `poke`, `blush`, `cry`, `dance`
    - `owo owoify <text>` — Classic cute OwO speak converter
  - **Shop & Inventory**:
    - `owo shop` — Love Rings, Common Crates, Rare Crates, Armory Crates, Luck Gems, Golden Baits, EXP Elixirs
    - `owo inv` — Inventory viewer
    - `owo use <item>` — Animated unboxing and consumable buffs
- 🌐 **Modern Web Companion & Playground**:
  - Play in browser with the **Virtual Discord Lounge Terminal (`#owo-lounge`)**
  - **Interactive Zoo Compendium**: Pokédex-style browser for all 70+ animals with rarity filters
  - **Live Leaderboards**: Track top Cowoncy tycoons and master hunters
  - **Web Audio Sound Effects**: Zero-latency synthesized coin clinks, victory fanfares, and hunt chirps
  - **Discord Bot Manager**: 1-Click invite link generator and instant token connection!

---

## 🚀 Quick Start Guide

### 1. Install & Run Locally

Open terminal in this directory and start the server:

```powershell
cmd /c npm start
```
Or:
```powershell
node server.js
```

Then open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

You can immediately play every single game directly in the browser!

---

### 2. Connecting the Bot to Discord (3 Easy Steps)

1. **Create Bot on Discord**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications).
   - Click **New Application**, name it **(w) OwO**, and go to the **Bot** tab.
   - Click **Reset Token** to copy your bot token.
   - Under **Privileged Gateway Intents**, enable:
     - ✅ **Message Content Intent**
     - ✅ **Server Members Intent**
     - ✅ **Presence Intent**
2. **Configure Token**:
   - Option A: Paste your token into the `.env` file:
     ```env
     DISCORD_TOKEN=your_token_here
     DISCORD_CLIENT_ID=your_client_id_here
     ```
   - Option B: Paste your token into the **⚙️ Bot Setup** tab in the web app and click **Connect Bot**!
3. **Invite to Your Server**:
   - Click the **➕ Add to Discord Server** button in the dashboard or open:
     ```
     https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=277025508416
     ```
   - Select your server and authorize!

---

## 📜 Full Command Reference

| Command | Aliases | Description |
| :--- | :--- | :--- |
| `owo help` | - | Displays full interactive command handbook |
| `owo hunt` | `owo h` | Catches 1-3 wild animals (15s cooldown) |
| `owo zoo` | `owo z` | View animal collection, counts, and completion % |
| `owo display <animal>` | - | Set animal as your profile mascot |
| `owo sell <all/tier/name>` | - | Sell duplicate animals for Cowoncy |
| `owo sacrifice <all/name>` | `owo sc` | Convert duplicate animals into Magical Essence |
| `owo daily` | - | Claim daily Cowoncy reward + streak bonus |
| `owo cash` | `owo bal`, `owo money` | View your Cowoncy balance |
| `owo give @user <amt>` | `owo send` | Send Cowoncy to another user |
| `owo quest` | `owo cl` | View and claim daily checklist |
| `owo slots <bet>` | `owo s` | 3-reel slot machine (up to 10x jackpot) |
| `owo cf <bet> [h/t]` | `owo coinflip` | Coinflip double or nothing |
| `owo bj <bet>` | `owo blackjack` | Interactive Blackjack with Hit/Stand buttons |
| `owo roulette <bet> <space>`| - | Bet on Red, Black, Green, Even, Odd, Numbers |
| `owo battle` | `owo b` | Dungeon fight with your animal champions |
| `owo team` | - | Configure your 3-slot battle team |
| `owo weapon` | - | View, equip, and upgrade armory weapons |
| `owo marry @user` | - | Propose marriage with Love Ring |
| `owo divorce` | - | End marriage |
| `owo hug/kiss/pat/slap @user`| - | Anime action interactions |
| `owo owoify <text>` | - | Convert English text to cute OwO speak |
| `owo shop` | - | Browse crates, rings, and buffs |
| `owo buy <item> [qty]` | - | Buy items from the shop |
| `owo inv` | `owo inventory` | View backpack items |
| `owo use <item>` | `owo crate` | Open crates or activate buffs |
| `owo profile` | `owo my` | View complete stylized player card |
| `owo top` | `owo lb` | Global Cowoncy and Hunter leaderboards |
| `owo prefix <new>` | - | Set custom server prefix |
| `owo ping` / `owo stats` | - | System latency & uptime |

---

## 🛠️ Architecture

- **Runtime**: Node.js v24+
- **Discord Engine**: `discord.js` v14 with modular command handlers & message component collectors
- **Database**: SQLite with `better-sqlite3` in WAL mode for persistent, ACID transactions
- **Server**: Express.js + WebSockets
- **Web App**: Vanilla CSS with glassmorphism, responsive layout, and Web Audio API synthesized SFX
