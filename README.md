# The C in Claude stands for Capybara

```
                        ╭──────┴──────╮
                       ╱              ╲
                      │   ✦        ✦   │
                      │    ╰──────╯    │
                      │   ·────────·   │
                       ╲     ◠◠◠     ╱
                        ╰────┬┬────╯
                       ╱╱╱╱  ││  ╲╲╲╲
                     🌿🌿   🌿🌿   🌿🌿
```

Claude Code's `/buddy` assigns you a pet based on `hash(yourID + SALT)`. The result is permanent — same ID always gives the same pet.

**This tool changes your fate.** It finds a new SALT that makes your account ID produce the pet you want, then patches it into the Claude binary. One command. Permanent (until Claude updates).

## How it works

```
yourAccountUUID + SALT("friend-2026-401")
        │
        ▼
   Bun.hash() → Mulberry32 PRNG → rarity → species → shiny → ...
```

You can't change your UUID (server-assigned). But the SALT is a 15-character string hardcoded in the binary. Change it, and the same UUID produces a completely different pet.

## Quick Start

```bash
git clone https://github.com/kizhu/The-C-in-Claude-stands-for-Capybara..git
cd The-C-in-Claude-stands-for-Capybara.
chmod +x patch.sh

# One command to change your fate:
./patch.sh --species capybara --shiny
```

That's it. The script auto-detects your UUID, searches for the right SALT, patches the binary, re-signs it, and clears the cache. Restart Claude and type `/buddy`.

## Usage

```bash
# Want a legendary shiny dragon?
./patch.sh --species dragon --rarity legendary --shiny

# Just want a specific species
./patch.sh --species cat

# Already have a SALT from a friend?
./patch.sh --salt "aBcDeFgHiJkLmNo"

# Check what your current UUID produces
bun find-salt.js --uuid "your-uuid" --check
```

### Options

```
./patch.sh [options]

  --species <name>    Target species
  --rarity <name>     Minimum rarity (common/uncommon/rare/epic/legendary)
  --shiny             Require shiny variant
  --eye <char>        Target eye (· ✦ × ◉ @ °)
  --hat <name>        Target hat (none/crown/tophat/propeller/halo/wizard/beanie/tinyduck)
  --salt <str>        Use a pre-computed 15-char SALT directly
  --uuid <id>         Override UUID auto-detection
```

## Pet Codex

| Category | Options |
|----------|---------|
| **18 Species** | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, **capybara**, cactus, robot, rabbit, mushroom, chonk |
| **5 Rarities** | ★ common(60%) · ★★ uncommon(25%) · ★★★ rare(10%) · ★★★★ epic(4%) · ★★★★★ legendary(1%) |
| **Shiny** | 1% chance on any pet |
| **6 Eyes** | `·` `✦` `×` `◉` `@` `°` |
| **8 Hats** | none, crown, tophat, propeller, halo, wizard, beanie, tinyduck |

## FAQ

**Will this break my Claude?**
No. It changes one 15-char string in the binary. A backup is created automatically. Worst case: restore the backup.

**Will it survive Claude updates?**
No. Updates replace the binary. Re-run `./patch.sh` with the same options — takes seconds. Tip: set `"autoUpdates": false` in `~/.claude.json`.

**Why does it need Bun?**
Native Claude uses `Bun.hash()` internally. To find the right SALT, we need the exact same hash function. The script auto-installs Bun if missing.

**Does it work on Linux/Windows?**
`find-salt.js` is cross-platform. `patch.sh` currently supports macOS only (needs `codesign`). PRs welcome for other platforms.

**Can I share my SALT with friends?**
No — each SALT is computed for YOUR specific UUID. Your friend needs to run the script with their own UUID.

## How the algorithm works

The buddy system uses deterministic randomness:

1. `Bun.hash(accountUuid + SALT)` → 32-bit seed
2. Seed → Mulberry32 PRNG
3. Sequential rolls: rarity(weighted) → species(1/18) → eye(1/6) → hat(1/8) → shiny(1%) → 5 stats

ID priority: `oauthAccount.accountUuid` > `userID` > `"anon"`

For OAuth users (Claude Max/Pro), the server always provides `accountUuid`, so changing `userID` locally has no effect. That's why we patch the SALT instead.

## Version

Based on **Claude Code 2.1.89**. Future versions may change the SALT or algorithm.

## Credits

- [linux.do](https://linux.do) community for the original reverse engineering
- A stubborn refusal to accept a robot when a capybara was clearly the right choice

## License

MIT
