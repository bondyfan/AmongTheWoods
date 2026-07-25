> **Balance audit — Among The Woods**  
> Generated 2026-07-22 via a 33-agent fan-out audit (17 domain reviewers → adversarial verification → synthesis). Every current number was read from source; the four headline *code bugs* below were then independently re-verified by hand against `js/player.js`, `js/camp.js`, and `js/config.js`.
>
> **Verified code defects (not tuning opinions):** (1) bows permanently fire at 0.85× listed damage — `player.js:2760` passes `charge=0`, `L3134` `drawMult=0.85+charge*1.05`; the `weakPoint` crit branch is unreachable. (2) `player.pet` is always null (no item carries a `.pet` block) → Stampede/Mend/Hunt/Pet-Training are dead. (3) `chargeLunge` is read nowhere. (4) guardTower dmg hard-coded to 25 (`camp.js:238`).

---

# Among The Woods — Final Balance Audit

*Synthesis of 15 domain reviews, each adversarially verified. Findings below are only those the verification pass marked CONFIRMED or downgraded-but-real; overstated claims are softened and "missed" items folded in. All numbers are source-verified.*

---

## 1. Executive Summary — the things hurting the game most

- **Two of five classes have no scaling damage identity.** Mage spells grow ~×14 (linear `levelSpellMult` ×3.7 + one-time ×1.57 passives) against ×87 mob-HP growth, so a Fireball slides from 24%→4% of a mob's bar; a bow-plinking Mage (~1300-1500 DPS) out-damages the full spell rotation (~800). Priest has **zero** weapon-damage passives and one damage active (holy_nova, ~23 DPS vs 16,120 HP = ~12 min/kill). Both survive forever and kill glacially solo.
- **Crafted gear ends at the iron/furnace era (~L18).** Head, charm, and shield get **no** craftable upgrade for 26-36 levels; boots/chest freeze L18→L35/39. Three whole biomes (Swamp, Dark, Haunted) have a dead gear-chase, patched only by optional unique drops. The shield slot dead-ends at L14 for the final 36 levels.
- **The ranged (Beastmaster) weapon line has a 23-level drought** (crossbow L18 → serpentBow L41) plus a root bug: charging was ripped out, so **every bow permanently fires at 0.85× listed damage** and the weak-point crit branch is unreachable dead code, while all six tooltips still tell players to "charge."
- **The pet subsystem is entirely dead content.** No item with a `.pet` block exists anywhere; `player.pet` is always null. This silently kills the Pet Training stat track and 5 Beastmaster nodes including the **L50 capstone Stampede**, which can literally never fire.
- **A cluster of fast, no-telegraph ambushers have zero counterplay** and cluster in the Jungle entry band (panther dmg1.5/speed11.5, cheetah speed12.5, plus the un-flagged icewolf pack in Frozen). stormsnake stacks the game's longest stun (1.2s) onto its fastest projectile (30) with no stun immunity window → chain-lock death.
- **Skull-rank difficulty is meaningless at 3-skull** because flat boss hpMult ×4.5 multiplies an un-normalized archetype hpMult (0.55-2.6): a 3-skull bat dies in ~26s, a 3-skull yeti/icegolem in 108-160s. Lair bosses also double-dip reinforcement (continuous 2.5s waves + scripted brood) = solo death spiral.
- **Two must-strong outliers:** Warrior Rend's %-max-HP bleed sustains ~66% of any boss bar per fight from one L7 button; Rogue Shadowstep→Backstab double-dips the "behind" bonus multiplicatively (×10.71 weapon dmg, ~2.8× a PvP health bar) for a two-button gib.
- **Essence — not meat — is the real economy gate**, and it's mis-signaled: tooltips frame meat (near-free) as the cost while ~478 scarce essence is needed to fully train + kit, with a 70-essence spike stacked into L48-50.

---

## 2. Cross-Class Parity

| Rank | Class | Solo score | Scaling verdict |
|---|---|---|---|
| 1 | **Warrior** | ~8/10 | Over-baseline. Rend %maxHP bleed + multiplicative mitigation stack (Thick Skin × War Cry × Avatar × block) → ~3.3× naked EHP in cooldown windows, +50% HP, 8%/kill lifesteal. |
| 2 | **Rogue** | ~7.5/10 PvE, ~9 PvP | Feast-or-famine. Backstab double-dip gib ceiling; poison pillar is flat & dead; no meleeDmg passive so sustained/facing DPS is thin. |
| 3 | **Beastmaster** | ~6/10 | Strong ranged half bolted to a **dead pet tree**; bow charge bug + 23-level bow drought cap its ceiling. |
| 4 | **Mage** | ~6/10 | **Falls off.** Elite CC/sphere backbone, but flat-nuke damage cannot track quadratic HP. |
| 5 | **Priest** | solo ~6/10, co-op ~9/10 | **Non-viable damage solo.** Unkillable but ~12 min/kill; best-in-slot healer in groups. |

### The headline question: do Mage & Priest fall off solo? **Yes — structurally, not by tuning.**

**Root cause is identical for both:** damage/heal = `base × levelSpellMult(1+0.055(L-1), ×3.7 @L50) × passives`. This is a *linear* scalar on a *fixed* base, fighting a *quadratic* HP curve (`120+60L+5.2L²`, ×87 over the game). Martial classes keep pace only because their **weapon base escalates across crafted tiers** (32→520 = ×16) on top of powerTier ×1.75 and gearMult ×1.5 — casters have "no better Fireball to buy."

*(Note: the brief's fear that Priest **heals** are flat is factually wrong — heals DO use `levelSpellMult`, so Priest sustain is strong end-to-end. The trap is the total absence of damage, not fragility.)*

**Concrete fixes:**
- **Give the spell scalar curvature to match HP.** Replace `levelSpellMult` with `1 + 0.055(L-1) + 0.0016(L-1)²` (≈×7.5 @L50, ~doubles cap nuke output). Target ~1800-2500 fully-invested single-target DPS to land in the 7-11s kill band. *Alternative:* add gear-driven spell-power (arcane staff/focus items with `spellDmg%`) so casters scale on loot like martials scale on weapons.
- **Priest needs a kill path.** Buff holy_nova to `[70,115,175]` + cd 20→12 (≈75 DPS at cap), AND add a weapon-damage passive — repurpose the near-dead **high_priest** (L44, currently +21% of ~23 DPS ≈ +4 DPS) into +5%/rank *weapon* damage ("Smite"). Target equal-mob kill ~20-30s solo, not 10× slower.
- **Route sphere bolts through a crit roll** (companions.js:134 using `spellCrit`) so Mage's **Elemental Surge** (+12% spell crit, L37) stops being ~dead for the dominant sphere playstyle.
- **Rework Pyroblast** (see Ranged/Class notes): it currently does *less* DPS than Fireball spam.

**Balance the other direction too:** trim **Rend** to a flat weapon-scaled bleed (`dps = weapon.dmg × [0.6,0.9,1.3]`) or cap the HP it reads; make Rogue's behind-bonus **additive** (`3.5×(1+0.70+0.80)=×8.75`, ~18% cut) and apply the same to Assassinate. Warrior Renew/Priest Renew double-passive scaling (see Consumables) also needs one passive dropped.

---

## 3. Progression & Economy

### Dead zones (slot has NO craftable upgrade)

| Slot | Freezes at | Next craftable | Gap | Patch |
|---|---|---|---|---|
| **Head** | bearHelm L18 (+110) | *none* (unique ironhornCrown L44) | **26 lvl** | — |
| **Shield** | ironShield L14 (block 0.72) | *none, ever* | **36 lvl** | — |
| **Charm** | bloodAmulet L18 | *none* (unique shadeAmulet L37) | **19 lvl** | — |
| **Chest** | bearHide L18 (+170) | graveplate L35 | 17 lvl | widowShroud L31 |
| **Boots** | windBoots L18 | pantherBoots L39 | 21 lvl | mireBoots L24 |
| **Back** | stormcloak L29 | *none* (unique frostMantle L50) | 21 lvl | — |
| **Underlayer** | bogscaleLining L22 (−12%) | *none* | 28 lvl | — |
| **Bow** | crossbow L18 | serpentBow L41 | **23 lvl** | — |
| **Axe** | warAxe L16 | frostAxe L46 | **30 lvl** | — |
| **Melee (any style)** | highlandSpear L27 | frostAxe L46 | **19 lvl** (Haunted+Highlands: no new craftable melee at all) | — |

*Fix:* insert one craftable tier per stalled slot around **L24-26 (runic)** and **L31-32 (mountain)**, costed in hide+iron+modest essence (8-18). Interpolates cleanly (e.g. head +180 @L24, +230 @L31 between bearHelm 110 and ironhornCrown 290).

### Difficulty cliffs
- **Verdant→Desert** is gentle; **Desert→Jungle** is a wall — two unescapable ambushers (panther, cheetah) + long-stun stormsnake + snapper turret land right when foot speed is only 6.0-6.2 and boots/mount often aren't owned yet.
- Enemy DMG doubles L18→30 (71→137) while gear-HP is frozen — the middle third of the game gets harder as your gear stops improving. *(Enemy HP over that span ~2.3×, not "quadruples" as one review said.)*

### Essence affordability (the true gate)
- Meat is near-free (thousands bank passively); **essence is the binding currency.** Fully training power+swift = **364 essence**; +gather+range ≈ **478** (just under 500). Tooltips frame meat, which mis-signals cost.
- **Endgame spike:** ~415 essence for the summit kit + final two camp ages (iceplate 70, blizzard 70, Frosthold 105 all in L48-50) ≈ 157 Frozen kills. *Fix:* raise Frozen essence amount 4→5 (EV 2.64→3.3), or shave iceplate to ~50 and Frosthold to ~80.
- **Early squeeze:** essence only drops biome≥1 (EV 0.12-0.21 in Desert/Jungle), yet frostNova (e8), bloodAmulet (e10), torchember (e5/craft, burns out every 5 min) all demand it there. *Fix:* torchember essence 5→2 or push unlock to L25; bloodAmulet essence 10→6 or move to Swamp.

### Must-buy / never-buy
- **Never-buy:** guardTower (20.8 flat DPS, never scales — 116s/kill at L16, 13 min/kill at L50); heal/Mend Wounds spell (5.7% pool heal vs slot-free salve's 40%); Fleet Foot after Sprint unlocks; Pet Training track (does nothing).
- **Must-buy trivializers:** salve (40% heal, no cd, 5 berries — spammable full heal); Swimming (50 meat permanent, unconditional); verdantHeart (L5 unique = best damage charm for ~30 levels).
- **Bug:** iron-vein comment says "Dark Forest onward" but code is `biome≥1` (Desert onward) — fix the comment or the guard; it changes iron supply across the whole L10-24 iron age.

---

## 4. Melee Weapons

| Subject | Issue | Current → Suggested |
|---|---|---|
| **steelSword** (Knight's Sword) | Over-tuned; class-lowest cd scales so well it shadows the whole ladder (79% of L46 frostAxe at zero essence) | cd 1.2→**1.35** and/or 3rd combo 1.55→**1.35** (L18 TTK 6.66s→~7.8s) |
| **highlandSpear** | Runic+14-essence spear (455 DPS) *out-DPSed* by zero-essence steelSword (492) | dmg 420→**~600-610** (~640 DPS). Do NOT use cd-1.55 (only reaches ~509) |
| **chargeLunge** (both spears) | Defined in config, **read nowhere** — spear's signature mechanic is a dead stat | Wire it: charged spear hit ×chargeLunge + forced weak-point/armorPierce + lunge |
| **snapjawMaul** (unique) | 243 DPS — below craftable steelSword (433), barely above warAxe | dmg 270→**~360** (or cd 2.1→1.45) for ~320 DPS; keep 0.8s stun identity |
| **sunfangBlade** (L12 unique) | 254 DPS = 2.1× same-level steelAxe, beats L16 warAxe → hollows the crafted axe tier | trim dmg 190→**~155** (~215 DPS) |
| **Axe bleed** (all) | Flat & negligible: warAxe 9 dps (4%), frostAxe 15 dps (**1.9%**) | Make %-of-hit: `bleed dps = hitDmg × 0.15` over 4s |
| **Sword & club styles** | Only ONE craftable each (steelSword; Bone Club L3 → L18 unique maul) | Add mid-tier craftable club ~L10-12 (stun 0.5, armorBreak 0.25); consider a 2nd sword tier |

*(Correction folded in: the "every other style has multiple craftable tiers" claim is false — sword has one craftable, spear two. Club is not uniquely under-served.)*

---

## 5. Ranged Weapons

| Subject | Issue | Current → Suggested |
|---|---|---|
| **ALL bows** (root bug) | Charging ripped from fire path (`_doShoot(...,0,...)`) → permanent **0.85× damage**, weak-point crit branch is dead code, 6 tooltips lie about "charging" | Rebase every bow base dmg **×1.6-1.9**, delete dead weakPoint branch, rewrite all descs. *(Crossbow uniquely fires at 1.0× — only real bows eat the −15%.)* |
| **L18→L41 drought** | No bow for 23 levels; rapidBow @L40 = 132 DPS vs 11,020 HP = **83s/kill** | Add L27-30 tier (dmg 130-150, cd 1.3) + L34 tier; pull serpentBow earlier |
| **huntingBow** | 18.4 DPS at L7 = **3.3× weaker** than same-level stoneAxe; range 3.5 sits *inside* every mob's shoot range (no kiting) | range 3.5→**6**, dmg 32→46-50 or cd 2.14→1.7 |
| **longbow** | Obsoleted 2 levels later by recurveBow (out-ranges AND out-paces it) | Make it the true sniper: range 7→**10**, slower cd; keep recurve as fast/short |
| **serpentBow** desc | Tooltip says "95-damage" but dmg is **190** (2× undervalue) | Fix desc |
| **Bows vs melee** | Single-target sits at ~26-48% of same-level melee | After rebase, target ~60-65%; pierce pushes ahead only in packs |
| **Base-dmg inversion** | crossbow 180 @L18 vs serpentBow 190 @L41 — base moves +10 across the whole late game | Escalate late-bow base dmg |
| **Arrow-mode DoTs** | Scale off `tier` not damage → serpentBow bleed ~13 dps, cosmetic vs 11k+ HP | Scale off weapon.dmg |

---

## 6. Armor, Shields & Charms

| Subject | Issue | Current → Suggested |
|---|---|---|
| **Head/Chest/Boots/Shield/Charm/Back** | All freeze at L14-18 (see §3 table) | Insert L24 & L31 craftable tiers per slot |
| **wolfPendant vs hawkAmulet** | hawkAmulet (+11.1% DPS +0.3 regen) power-creeps wolfPendant (+10%) from L14 on | Differentiate wolfPendant: +18% dmg or on-hit lifesteal *(it IS exclusive L10-13, not "dead on arrival")* |
| **Underlayer** | Caps at bogscaleLining −12% @L22, never scales into L25-50 where hits hit 118-285 | Add a late underlayer tier |
| **copperRing** | Strictly obsoleted by bloodAmulet (4×); regen line has no mid step L18→L37 | Add a ~L28 craftable regen charm |

*(Note: the "gearMult never rises" argument in one review is wrong — forgeTier scales runic→primal 1.1→1.4, so bearHelm is +154 at the summit, not flat +110. The dead-slot gap is still real, just less severe.)*

---

## 7. Supplies, Placeables & Mounts

| Subject | Issue | Current → Suggested |
|---|---|---|
| **guardTower** | Hardcoded 25 dmg/1.2s = 20.8 DPS, never scales. 116s/kill @L16, ~13 min/kill @L50 — a 110-resource trap | Deal **~2.5-3% target maxHP/bolt** (or ~4×level flat) to land at 15-20% of player DPS; let it draw aggro |
| **torchember** | 5 essence + 4 iron **every 5 min**, unlocks where essence is scarcest (L16 Jungle) | essence 5→**2**, or push unlock to L25; consider relightable-not-destroyed torches |
| **Saddle** | +9 speed → mounted 17-22 outruns *every* mob (fastest is 12.5); trivializes overland danger from L7 | Add a real trade-off (dismount-on-hit, or cap speed) |
| **stormcloak** | rest 5 (+50%) < starter bedroll rest 6 (+60%) — non-monotonic | bump to rest 7 |
| **torch/shield slot** | Share offhand → can't see AND block in dark lairs; torch *deletes* on burnout | Leave a relightable "Spent Torch"; surface the tradeoff in tooltips |

---

## 8. Consumables & Legacy Spells

| Subject | Issue | Current → Suggested |
|---|---|---|
| **salve** | 40% heal, **no cooldown**, 5 berries (cheapest) — strongest AND cheapest, defeats slow OOC regen | Add 8-12s shared cd; drop to 30% or add meat cost. *(Applies to ALL heals — roast/honey have no cd either.)* |
| **heal / Mend Wounds** | 5.7% pool at cap, costs a slot + 60s cd + essence — dead vs salve | Make %maxHP (~25%) or remove |
| **venomRain** | Pure damage (~3.5% mob HP), no CC, 45-essence cost — dead the moment blizzard exists | Scale poison off weapon.dmg + add a slow |
| **venom / rogue poisons** | Flat dps, never scaled → rounding error past early zones | Multiply by levelSpellMult or weapon fraction |
| **Frost Nova** | Pure CC, zero damage; strictly obsoleted by blizzard (longer/larger freeze + 120 dmg) | Merge or differentiate |
| **Flat-damage spells** (shockwave/blizzard/dashes) | Damage negligible (0.6-2.7% mob HP); survive only on CC riders, but tooltips headline the damage | Relabel tooltips to headline CC, or weapon-scale like whirlwind. *(powerDash is mobility-only, no stun.)* |
| **roast** | The only *purchasable* heal is the *worst* (12%) | Cost inversion — reprice |

**Keep:** fractional-heal architecture, `levelSpellMult` retrofit, the whole buff/CC suite (haste/rage/stoneSkin/frostNova/stunDash), whirlwind's weapon-scaled model.

---

## 9. Unique Boss Drops

| Subject | Issue | Current → Suggested |
|---|---|---|
| **snapjawMaul vs sunfangBlade** | L12 unique (207 DPS+burn) *out-DPSes* L18 unique (160) and same-level steelSword (329) | Lift snapjaw to dmg ~340/cd 1.9 (~215 DPS) |
| **shadeAmulet** | +30% dmg +1.2 regen = strictly better than every craftable charm, mandatory pick | +20% (or strip regen), AND add a competing endgame craftable charm |
| **verdantHeart** | +10% dmg +1.0 regen at L5 = best damage charm for ~30 levels | Consider +0.6 regen; acceptable as "first trophy" |
| **widowShroud** | +235 HP, power-crept by graveplate (+275) just 4 levels later | Bump to +260 HP +1.4 regen or add Widow-flavored effect |
| **Stat-stick uniqueness** | 5 of 9 uniques are pure passive stats with no boss-flavored mechanic | Add signatures: verdantHeart regen-burst-on-kill, widowShroud poison-reflect, ironhornCrown knockback-immune |

**Models to copy:** mireBoots (bridges the boots gap perfectly), frostMantle, sunfangBlade's parry+burn.

---

## 10. Beast Mobs

| Subject | Issue | Current → Suggested |
|---|---|---|
| **panther** | dmg1.5 + speed11.5 + aggro24 + **no telegraph** → ~6s TTK, ~2.4× under design intent, un-outrunnable un-booted | Pick 2: dmg1.5→1.15, aggro24→18, speed→10, OR add 0.4s pounce windup |
| **cheetah** | speed **12.5** (fastest) + dmg1.25 + pack, unescapable | speed→10.5 OR dmg→1.0 |
| **icewolf** *(missed by review)* | speed10 + dmg1.1 + pack, **no telegraph** — 348 DPS/wolf, HIGHER than wendigo, worst no-counterplay beast in the game | Add telegraph or trim like cheetah |
| **wendigo** | speed11 + dmg1.35, no tell, 320 DPS @L50 | dmg→1.2 or speed→9.5 or add lunge tell |
| **stormsnake** | Longest stun (1.2s) on fastest projectile (30) on a filler snake, every 3s | projSpeed 30→20 + stun 1.2→0.8 (pick, don't stack) |
| **thornling** | Fully authored (stats/mesh/audio) but spawns **nowhere** — dead content | Add to Verdant/Jungle roster or delete. *(Not in TAMEABLE_BEASTS — no phantom tame entry.)* |
| **bee** | aggro 40 (1.6× next-highest) pulls whole swarm from off-screen | aggro→24 |

**Keep:** the heavy-brute telegraph system (yeti/bear/treant/croc, 0.55s windup) — the model fast ambushers should follow — plus stationary turrets (cactusman/snapper) and the level-scaled poison formula.

---

## 11. Humanoids & Ranged-Shot Pressure

| Subject | Issue | Current → Suggested |
|---|---|---|
| **applyStun** | `Math.max` with **no immunity window, no DR**; stun drops block & blocks dash | Add ~1.0-1.2s post-stun immunity, or DR. *(Real risk is a same-type cluster of 3+ stormsnakes/ghosts — cross-biome stun mixes are impossible; no biome holds two stun-shooter types.)* |
| **ghost** *(under-weighted)* | Flying + ranged + stun → a melee/no-dash build literally cannot close to interrupt while stun-locked | Weight the stun fix toward this case |
| **poacher** *(missed)* | shootRange **11** (longest, out-ranges player), projSpeed 26, dmg1.1, no downside; spawns solo | Trim range or add a cost |
| **Ranged camps** | 3-6 shooters, one homogeneous type; block is front-only so rear/flank shots are unblockable (~69 raw dps at L10) | Omni-directional block floor (~25% vs non-front), or cap all-ranged camps at 4 |
| **shaman** | The one caster-themed mob is the blandest shooter (plain damage bolt) | Add a hex (slow / −dmg debuff) or ally-heal — *requires new projectile-hit plumbing, not a config-only change* |
| **Humanoid meat drops** | You butcher bandits/shamans for 🍖 meat | Route to coin/scrap/iron instead |

*Counterplay to note:* shots need dist>2.2 — closing inside silences a shooter. "Standing and blocking does nothing" is true but pressing *in* is a real counter.

---

## 12. Bosses & Scaling

| Subject | Issue | Current → Suggested |
|---|---|---|
| **Skull hpMult** | Flat 2/3/4.5 × un-normalized arch hpMult (0.55-2.6) → 3-skull fight length swings **26s (bat) to 122s (icegolem)** | `effHp = boss.hpMult × clamp(1.15/archHpMult, 0.6, 1.6)` (yeti clamps to floor 0.6). Handle icegolem armor separately |
| **Flat packSize** (8/11/14) | 14 identical yetis = instant death; 14 rats = warm-up | `effCount = round(packSize × clamp(1/archHpMult, 0.45, 1.15))` → yeti 14→6, bat 14→16 |
| **Lair-boss reinforcement double-dip** | Spawned at bossRank 3 but **not** noReinforce → continuous 3-mob/2.5s waves (~56 waves in a Grimfrost fight) ON TOP of scripted brood | Set `noReinforce:true` in dressLairBoss |
| **Grimfrost** | yeti 2.3 × boss 4.5 × lair 1.5 = **250k HP** (~140s+), only ×1.5 lair HP mult on the bulkiest archetype; 1094/hit = 3-hit kill | lair hpMult 1.5→**1.15** (~107s); cap the range bump. *(Actually spawns ~L55, so real HP ~297k — figures are conservative.)* |
| **Reinforce cadence** | 3 mobs/2.5s full-strength, no taper → solo spiral for heavy archetypes | Cap ~5-6 concurrent living minions per boss; taper to ~0.7× level |
| **icegolem 3-skull** | Armored sponge, ~160s (longer than Grimfrost), no signal to bring armorBreak | Exclude armored archetypes from 3-skull, or halve armor when bossRank>0. *(It's a rare ~2% roll, not "50% of Frozen packs.")* |
| **Frozen skull table** [0,0.5,0.5] | No 1-skull relief in the skull tier | ~[0.25,0.45,0.30]. *(30% of Frozen packs are rank-0 plain, so relief does exist — reframe.)* |
| **Boss overcap** *(missed)* | enemyLevelFor adds bossRank×2 after the band cap → deep bosses spawn ~L55 | All "current" figures are understated by ~1.15-1.19× |

**Keep:** reward scaling (xp/meat/drop) is genuinely well-tuned; the griffin never-dies design; skull-as-compound-knob.

---

## 13. Stat Training

| Subject | Issue | Current → Suggested |
|---|---|---|
| **Pet Training track** | No companion item exists → `player.pet` always null → track + 5 Beastmaster nodes + L50 Stampede all dead. Wastes ~8160 meat + 144 hide + **~63 essence** *(not 126)* | Route Tame Beast to synthesize a `{pet:{}}` item, OR delete the track + PetWolf + petResurrect + pet skills. Must also **gate the UI** (track is still purchasable) |
| **Range track (melee half)** | +0.1 m/tier = +1.0 m total, same essence cost (72) as bow's +20 m; desc "reaches across the whole screen" is misleading for melee | Make bow-only (refund melee) or bump to +0.2-0.25 m/tier |
| **power + swift** | 182 essence each; meat cost near-decorative but tooltips frame meat | Retune around essence (lower cost or raise drops); surface essence in tooltips |
| **power vs swift** | Both must-max, no opportunity cost between them — not the "choices" the 5-track UI implies | Optional: soft-couple with DR so builds diverge |

---

## Originality & Fun

**Memorable / keep:**
- Heavy-brute telegraph brutes (yeti/bear/treant/croc), stationary turrets (cactusman radial ring, snapper ambush-plant), icegolem siege-brute — all fair, positional, distinct.
- Griffin flee-boss → placeable nest fast-travel network. Rogue Shadowstep (teleport-behind). Mage coexisting spheres + freeze suite. Marked-shot targeting. Broadheads "every arrow wounds." Guardian Spirit cheat-death.
- Sword parry, combo arrays, chop-only-axes tool identity, %-heal consumables.

**Bland reskins — starter archetypes stapled onto endgame:**
- "Cave Bat" (hp0.55) @L36, "Black Wolf" @L43, "Grass Snake" @L24, "Venom Spider" in **4 consecutive zones** (L19-43). "Forest Spider" @L30.
- Open-world packs are always the boss's own type → "Frostmaw + 14 identical yetis" reads as a cloning glitch.

**New flavor (cheap, low-risk):**
- Per-zone renames/tints reusing the same stat block: Haunted bat → "Wraithwing," Highlands wolf → "Direwolf," Bog snake → "Bog Adder." Cut venomspider from one of its 4 zones.
- Draw a fraction of pack minions from the zone's *lighter* roster (bear mother leads boars/wolves) — BIOME_LAIRS already models mixed broods.
- Boss-flavored unique signatures (poison-reflect shroud, knockback-immune crown, regen-burst heart).

---

## Prioritized Fix List

*Ranked by impact ÷ effort. Each is a concrete number/flag change.*

1. **Bow charge rebase** — multiply every bow base dmg ×1.6-1.9, delete the dead weakPoint branch, rewrite 6 tooltips. *(Highest impact: doubles ranged output, fixes root feel.)*
2. **Set `noReinforce:true` on lair bosses** in dressLairBoss — one flag, ends the solo death spiral double-dip.
3. **Give guardTower % scaling** — `dmg = max(25, round(0.025 × target.maxHp))` — turns a never-buy trap into a real turret.
4. **Add post-stun immunity window** — `stunImmuneT ≈ 1.2s` after stun ends — kills the chain-lock hole.
5. **Salve cooldown** — add 8-12s shared cd on all heal consumables; drop salve 40%→30%. Restores the attrition intent.
6. **Spell scalar curvature** — `levelSpellMult = 1+0.055(L-1)+0.0016(L-1)²` (≈×7.5 @L50) — makes Mage viable solo.
7. **Priest kill path** — holy_nova `[35,60,90]→[70,115,175]`, cd 20→12; repurpose high_priest to +5%/rank weapon damage.
8. **Pet subsystem decision** — either wire Tame Beast to grant a `{pet:{}}` item OR delete the Pet Training track + 5 nodes + Stampede requirement, and gate the UI.
9. **Normalize skull HP** — `boss.hpMult × clamp(1.15/archHpMult, 0.6, 1.6)` + bulk-scale packSize — makes 3-skull mean one thing.
10. **Insert L24 & L31 craftable head/chest/boots/charm** (+180/+230 head; +215 chest; etc.) — reopens the mid-game gear chase across 3 dead biomes.
11. **Add L24 & L40 shields** — block ~0.80 / ~0.86 (+hp) — ends the 36-level dead slot.
12. **Rogue backstab additive fix** — behind term `3.5×(1+0.70+0.80)=×8.75` (from ×10.71); apply to Assassinate too. Caps the PvP gib.
13. **Rend flat bleed** — `dps = weapon.dmg × [0.6,0.9,1.3]` instead of %maxHP — stops trivializing bosses.
14. **Nerf panther + cheetah + icewolf** — panther dmg 1.5→1.15 & aggro 24→18; cheetah speed 12.5→10.5; icewolf add 0.4s telegraph.
15. **stormsnake** — projSpeed 30→20, stun 1.2→0.8.
16. **Grimfrost lair hpMult 1.5→1.15**; stop multiplying melee range by extraScale.
17. **Fill bow (L27, dmg 130 / L34, dmg 160) & melee-weapon (L28 axe dmg 320 / L34 spear) gaps.**
18. **Essence smoothing** — Frozen amount 4→5 (EV→3.3); torchember essence 5→2; scale rogue/venom poison by levelSpellMult; Rewrite Pyroblast: windup 6s→3s, cd 18→10 (cd starts on impact, so this compounds).