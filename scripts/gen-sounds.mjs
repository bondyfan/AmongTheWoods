// Generate creature unit SFX via the ElevenLabs Sound Effects API.
//   ELEVENLABS_API_KEY=sk_... node scripts/gen-sounds.mjs
// Writes <family>_<kind>.mp3 into assets/sounds/. Skips files that already
// exist unless FORCE=1 is set. Sound families must match audio.js _family().

import { writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
const FORCE = process.env.FORCE === '1';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// [filename, prompt, duration seconds]
const SOUNDS = [
  ['spider_attack', 'Giant spider attack: sharp chittering hiss and clicking mandibles, dry, aggressive, no music', 1.0],
  ['spider_death',  'Giant spider dying: wet screeching hiss fading out, legs curling, short, no music', 1.2],
  ['snake_attack',  'Snake strike: sharp venomous hiss and quick bite lunge, short, no music', 0.9],
  ['snake_death',   'Large serpent dying: long falling hiss and death rattle, no music', 1.4],
  ['wolf_attack',   'Wolf attack: aggressive snarling growl and biting snap, short, no music', 1.0],
  ['wolf_death',    'Wolf dying: pained yelp and fading whimper howl, short, no music', 1.3],
  ['beast_attack',  'Large monster beast attack: deep guttural roaring growl, powerful, short, no music', 1.1],
  ['beast_death',   'Large beast dying: deep pained groaning roar collapsing, no music', 1.5],
  ['rat_attack',    'Giant rat attack: high pitched squeaking screech and bite, short, no music', 0.7],
  ['rat_death',     'Giant rat dying: high pitched squeal fading, short, no music', 0.8],
  ['bat_attack',    'Bat attack: shrill high pitched screech swoop, short, no music', 0.7],
  ['bat_death',     'Bat dying: shrill fading screech squeal, short, no music', 0.8],
  ['rabbit_death',  'Small rabbit dying: short soft high-pitched squeak and thump, very short, no music', 0.7],
  ['sheep_death',   'Sheep dying: short pained bleat baa cut off, falling over, no music', 1.0],
  ['mine_hit',      'Pickaxe striking solid rock: sharp metallic clink with stony impact and tiny debris, single hit, short, no music', 0.6],
  ['rock_crack',    'Boulder cracking apart: heavy stone crack and crumbling rubble collapse, short, no music', 1.1],
];

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

async function gen([name, text, duration]) {
  const path = join(OUT, name + '.mp3');
  if (!FORCE && await exists(path)) { console.log('skip (exists):', name); return; }
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, duration_seconds: duration, prompt_influence: 0.5 }),
  });
  if (!res.ok) { throw new Error(`${name}: ${res.status} ${await res.text()}`); }
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
  console.log('wrote', name + '.mp3');
}

await mkdir(OUT, { recursive: true });
for (const s of SOUNDS) {
  try { await gen(s); } catch (e) { console.error(String(e.message || e)); }
}
console.log('done.');
