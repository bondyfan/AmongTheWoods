# Among The Woods

Top-down 3D game built with Three.js, with two modes:

- **Survival** — you wake NAKED (well, with a leaf) in a dark cave at the
  center of a huge RADIAL world: five biome rings expand outward in every
  direction, separated by ring barriers (boulder ridges & ring rivers with
  gate/bridge chokepoints). Punch trees for wood, mine rocks for stone, skin
  big animals for hides, and build up the camp at the cave mouth: **Hide Tent
  → Wooden Cabin → Stone House** advance you through the ages (Stone Age →
  Settlement → Timber Age → Iron Age) and unlock gear tiers (club → stone axe
  → iron axe; bows need the cabin, iron needs the **Stone Furnace** which
  smelts 4 stone → 1 iron every 20 s). A **Storage Chest** keeps resources
  safe through death (dying spills half of everything you carry where you
  fell), the **Log Boat** lets you paddle to treasure islands in the lakes,
  and the **Guard Tower** defends home. Reach 520 m from home to win.
- **MOBA** — a three-lane Dota-style map. Farm jungle camps, buy the same
  gear/spells as survival, then build **Creep Dens** (a wave marches down the
  lane every 60 s, 5 levels of bigger/stronger waves), **Watchtowers** (bolt
  turrets on your half of each lane), **War Forge** (+15% creep dmg/hp per
  level), **Hunting Lodge** (passive meat income) and **Base Walls** (+base HP)
  from the shop's 🏰 Base tab. Destroy the enemy base to win. Solo plays
  against a scripted AI opponent; multiplayer is 1v1 (host-authoritative,
  the guest plays the red team).

## Run

Any static file server works (ES modules need http, not file://):

```
python3 -m http.server 8137
# open http://localhost:8137
```

Three.js is vendored locally in `libs/three.module.js` (mapped via importmap) —
no build step, no CDN dependency.

## Controls

- **WASD / arrows** — move · **Mouse** — aim
- **Left click / Space** — attack with the equipped weapon
- **Q** — cycle owned weapons (fists / axes / bows — only one wielded at a time)
- **1–6** — cast slotted spells
- **U** — upgrade shop · **C** — character sheet · **N** — bestiary
- **Esc** — pause · **M** — mute

## Gameplay

- Kills give **XP**; **meat** (and chopped **wood**) drop on the ground as
  floating loot that flies to you when you come close.
- **Aiming**: a normal free mouse cursor — you face wherever it points. A short
  amber arc (blue for bows) shows a slice of your current weapon's reach in the
  direction you're facing, so you can gauge range at a glance. Bows start very
  short-ranged — train **Range / Power / Swift Hands** (10 tiers each, shop →
  Training) to extend reach (level-10 Range reaches across the whole screen),
  damage and attack speed. Tier N requires player level N and the meat cost
  scales quadratically (tier 1 ≈ 25 meat, tier 10 ≈ 2500), so it's a long-term
  investment, not a rush. Item and spell prices are steep too.
- The world is carved into rooms by **rock ridges with gates** and **rivers
  with wooden bridges** — chokepoints where packs can corner you. Some
  creatures (storm serpents, ice golems) fire shots that **stun** you.
- **Equipment slots** (WoW-style): weapon, head, chest, boots, pet, orb.
  Items are bought in the grouped shop (Weapons / Clothing / Companions /
  Spells) or looted from bosses. Manage them in the Character sheet (C).
- **Spells** (haste, power dash, stun dash, heal, shockwave, frost nova, rage)
  go into max 6 spell slots, cast with 1–6, each with its own cooldown.
- Enemy tiers going north: Verdant Forest (spiders) → Dark Forest (+wolves) →
  Highlands (+boars) → Snowfall Woods (+ice wolves, bears) → Frozen Peak
  (+yetis). Difficulty also scales with distance. Reach 1500 m to win.
- From the Dark Forest onward, **packs (smečky)** spawn — a burst of one
  creature type, usually led by a **boss mother** marked with 1–3 💀 (stronger
  per skull). Bosses can drop an item near your level: 10% / 25% / 50% drop
  chance for 1 / 2 / 3 skulls.
- First sighting of each creature logs it in the **Bestiary** (N).
- The **minimap** (bottom-left) reveals the world as you explore it.

## Audio

All sounds and music are reused from the `era-battle` project
(`assets/sounds/`, `assets/music/`): main-menu theme, in-game track (switches
to the snow track from Snowfall Woods onward), attack/hit/kill/purchase/level
SFX, victory & defeat stingers.

## Code layout

| File | Responsibility |
|---|---|
| `js/config.js` | biomes, enemy stats & boss ranks, XP curve, items, spells, shop groups |
| `js/models.js` | procedural low-poly meshes (player, animals, trees, decor, pickups) |
| `js/world.js` | heightfield terrain, vertex-colored ground, chunked trees/decor, chopping |
| `js/player.js` | movement, aiming, equipment/inventory, weapon attacks, spells |
| `js/enemies.js` | spawning (singles + packs/bosses), AI, stuns, damage |
| `js/companions.js` | pet wolf + guardian spheres, synced from equipment |
| `js/projectiles.js` | arrows & homing bolts |
| `js/pickups.js` | ground loot (meat/wood/items) with magnet collection |
| `js/minimap.js` | fog-of-war minimap canvas |
| `js/ui.js` | HUD, spellbar, boss skull labels, toasts, floating combat text |
| `js/panels.js` | shop tabs (incl. MOBA Base tab), character sheet, bestiary |
| `js/mobaworld.js` | square three-lane jungle map (subclasses World) |
| `js/moba.js` | MOBA units, buildings, waves, camps, AI opponent |
| `js/net.js` / `js/multiplayer.js` | Firebase transport & session (co-op, PvP, MOBA) |
| `js/main.js` | scene setup, game loop, mode + state wiring |

## Multiplayer

Uses the **same Firebase project as era-battle** (`firebase-config.js`), with
rooms namespaced `games/woods-<CODE>` in the shared Realtime Database so the
existing security rules cover them and codes can't collide with era-battle.
From the main menu: **🌐 Multiplayer** → create a game (share the 4-letter
code) or join one.

Three modes:

- **🏰 MOBA 1v1** — one shared three-lane map; the host simulates all units
  (creeps, neutrals, towers, bases) and streams a snapshot; the guest plays
  the red team, hits/builds travel as events.
- **🤝 Co-op** — one shared world (same seed). The host simulates enemies and
  pickups and streams a snapshot (~7/s); the guest renders shadow copies and
  sends hit/collect events. XP goes to whoever lands the killing blow, meat
  drops magnet to whichever player is closer, tree chopping is mirrored.
  Death = respawn at the meadow with −25% meat.
- **⚔️ PvP** — each player farms their **own world** fully locally (zero
  network lag). Every 1/2/3/4/5/10 minutes (chosen at creation) both players
  teleport into a boulder arena and duel with their current gear, spells and
  companions until one dies. The winner earns `50 + 15×loserLevel` meat and
  `120 + 50×loserLevel` XP; after 5 s both return exactly where they were
  (the loser revived at 50% hp) and the next duel starts ticking.

Both players are authoritative over their own HP — attacks travel as events
and the receiving client applies the damage to itself. `js/net.js` is the
transport (state channels, event inboxes, world snapshots, presence),
`js/multiplayer.js` is the session orchestration (remote avatar, co-op shadow
world, arena flow). Note: the game runs on requestAnimationFrame, so a
backgrounded tab freezes — keep the game window visible while playing.
