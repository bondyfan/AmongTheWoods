// Server-side onKill — mirrors js/main.js onKill DROPS for a server that has no
// host "player". The loot (meat + hides/wool/venom/essence + lair item) is
// server-owned and spawned into the shared Pickups so every guest sees it; the
// shared kill XP / quest progress is handed to game-room's awardKill (which
// knows the connected guests). Boss unique tables (rollBossDrop, main.js) stay
// a client-only refinement — bosses drop a fat essence cache here for now.
import { HIDE_BEARING, VERDANT_HIDE_DROP, hideForLevel, essenceDropFor, biomeIndexAt } from '../../js/config.js';

export function makeOnKill({ pickups, awardKill }) {
  return (enemy) => {
    // meat falls in a few piles (magnet-collected client-side)
    const piles = Math.min(4, Math.max(1, Math.round(enemy.meat / 2)));
    let left = enemy.meat;
    for (let i = 0; i < piles; i++) {
      const amount = i === piles - 1 ? left : Math.ceil(enemy.meat / piles);
      left -= amount;
      pickups.spawn('meat', amount, enemy.pos, 0.9 * enemy.sizeMult);
    }
    if (enemy.type === 'sheep') pickups.spawn('wool', 1 + (Math.random() < 0.5 ? 1 : 0), enemy.pos, 0.8);
    if (enemy.type === 'snapper' && Math.random() < 0.65) pickups.spawn('venom', 1, enemy.pos, 0.7);
    const bi = biomeIndexAt(enemy.pos.x, enemy.pos.z);
    if (HIDE_BEARING.has(enemy.type)) {
      pickups.spawn('hide', hideForLevel(enemy.level), enemy.pos, 1.1 * enemy.sizeMult);
    } else if (bi === 0 || enemy.type === 'bat') {
      pickups.spawn('hide', Math.random() < 0.1 ? 1 : VERDANT_HIDE_DROP, enemy.pos, 0.9);
    }
    if (!enemy.cfg.passive) {
      const ess = essenceDropFor(bi);
      if (ess > 0) pickups.spawn('essence', ess, enemy.pos, 0.8);
    }
    if (enemy.lairDrop) {
      pickups.spawn('item', enemy.lairDrop, enemy.pos, 0.4);
      pickups.spawn('essence', 5, enemy.pos, 1.2);
    } else if (enemy.bossRank > 0) {
      pickups.spawn('essence', 3, enemy.pos, 1.0); // simplified (rollBossDrop is client-only)
    }
    // shared kill XP + quest progress to eligible guests
    awardKill(enemy);
  };
}
