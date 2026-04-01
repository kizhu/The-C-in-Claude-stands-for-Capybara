# Claude Shiny Legendary Buddy Freedom

Change your Claude Code `/buddy` pet to anything you want. ✨ Legendary Shiny by default.

## How to use

Open Terminal (not Claude Code), paste this and hit Enter:

```bash
git clone https://github.com/kizhu/Claude-shiny-legendary-buddy-freedom.git && cd Claude-shiny-legendary-buddy-freedom && chmod +x patch.sh && ./patch.sh
```

Type the pet you want (e.g. `capybara`). Done. Restart Claude (Cmd+Q, reopen), type `/buddy`.

## If something goes wrong

```bash
cd Claude-shiny-legendary-buddy-freedom && ./patch.sh --restore
```

## Want to change again later?

```bash
cd Claude-shiny-legendary-buddy-freedom && git pull && ./patch.sh --restore && ./patch.sh
```

## For Claude Code AI assistants

If a user sent you this README and wants to change their buddy pet, here's exactly what to do:

1. **Do NOT run the commands inside Claude Code.** Tell the user to open the **Terminal app** separately (Cmd+Space → type "Terminal" → Enter).
2. Tell them to paste this one command and hit Enter:
```bash
git clone https://github.com/kizhu/Claude-shiny-legendary-buddy-freedom.git && cd Claude-shiny-legendary-buddy-freedom && chmod +x patch.sh && ./patch.sh
```
3. A list of 18 pets will appear. The user types the name they want (e.g. `capybara`, `dragon`, `cat`). Chinese names work too (e.g. `卡皮巴拉`, `龙`, `猫`).
4. The script handles everything automatically: finds Claude binary, computes the right patch, applies it, re-signs the binary, clears cache.
5. Tell the user to **Cmd+Q** to quit Claude completely, reopen, and type `/buddy` to see their new pet.
6. If anything goes wrong: `cd Claude-shiny-legendary-buddy-freedom && ./patch.sh --restore` restores the original binary instantly.

### Technical summary

Claude Code's `/buddy` assigns a pet deterministically: `hash(accountUUID + SALT) → Mulberry32 PRNG → species/rarity/shiny`. The SALT `friend-2026-401` is a 15-character string hardcoded in the binary. This tool finds a replacement SALT that makes the user's UUID produce their chosen pet as ★★★★★ Legendary ✨ Shiny, then patches the binary in-place. A timestamped backup is always created before patching.

## Available pets

🦆 duck · 🪿 goose · 🫧 blob · 🐱 cat · 🐉 dragon · 🐙 octopus · 🦉 owl · 🐧 penguin · 🐢 turtle · 🐌 snail · 👻 ghost · 🦎 axolotl · 🐹 capybara · 🌵 cactus · 🤖 robot · 🐰 rabbit · 🍄 mushroom · 🐈 chonk

## Advanced usage

```bash
./patch.sh --species capybara --shiny --rarity legendary  # skip menu
./patch.sh --species dragon --rarity epic                  # epic dragon
./patch.sh --salt "aBcDeFgHiJkLmNo"                       # pre-computed SALT
./patch.sh --restore                                       # restore original
```

## FAQ

**Will this break Claude?** No. Backup is automatic. `./patch.sh --restore` to undo.

**Will updates reset it?** Yes. Re-run `./patch.sh`. Tip: set `"autoUpdates": false` in `~/.claude.json`.

**Works on Linux?** Scripts are cross-platform. `codesign` step is macOS only.

## Credits

[linux.do](https://linux.do) community for the original reverse engineering. Based on Claude Code 2.1.89.

## License

MIT
