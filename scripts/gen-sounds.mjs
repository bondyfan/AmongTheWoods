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
  ['wolf_death',    'A wolf dying: a sharp high canine yelp breaking into a whimpering growl and a final wet snarl, purely a dog-like animal, no human voice, no words, short', 1.3],
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
  ['smith_forge',   'Blacksmith forging: rhythmic hammer strikes on anvil with metal ring and fire crackle, workshop ambience, loopable, no music, no voice', 4.0],
  ['eat_food',      'Eating food: quick bite crunch and chewing gulp, cartoonish, very short, no music, no voice', 0.8],
  ['human_attack',  'Male bandit warrior attack: short aggressive battle cry grunt with a weapon swing whoosh, no music', 0.9],
  ['human_death',   'Male bandit warrior dying: short pained death groan and body falling, no music', 1.1],
  // ---- 38 new sounds (distinct creature voices + nature ambience), designed via workflow ----
  ['horse_death', 'A wild horse\'s dying whinny: a high shrill neigh cracking mid-breath into a wet nasal shudder, forelegs buckling as the heavy body thuds sideways onto packed dirt with a final wheezing exhale through flaring nostrils, warm organic mammal. Single dry event, no music, no human voice', 1.4],
  ['ghost_attack', 'A bodiless spectral phantom lunging: a hollow airy moaning wail over a cold whooshing draft, breathy and weightless with a shivering reverberant echo, nothing solid or wet or guttural, unnaturally light. Single dry event, no music, no human speech, no words', 1.2],
  ['ghost_death', 'A ghost unravelling into nothing: a long mournful hollow moan thinning into a cold receding whisper and an airy reverberant sigh, weightless and disembodied, no wet gurgle and no solid impact. Single dry event, no music, no speech, no words', 1.6],
  ['griffin_attack', 'A griffin diving to strike: a shrill piercing eagle screech layered over a deep resonant lion growl, one huge feathered wingbeat thudding air, regal and immense and unmistakably part-eagle part-lion. Single dry event, no music, no human voice', 1.2],
  ['griffin_death', 'A griffin\'s dying cry: a proud eagle screech cracking and sinking into a low pained lion groan, heavy wings ruffling and collapsing, a majestic eagle-lion hybrid far grander than a plain bird. Single dry event, no music, no human voice', 1.6],
  ['panther_attack', 'A shadow panther exploding into a pounce: a sharp spitting hiss bursting into a short snarling big-cat roar, fast sleek and feline, higher and quicker and leaner than a bear\'s roar. Single dry event, no music, no human voice', 1.1],
  ['panther_death', 'A big cat\'s dying yowl: a rising strangled feline cry breaking into a wet fading growl and a soft final huffing breath as the sleek body slumps, cat-like. Single dry event, no music, no human voice', 1.3],
  ['zombie_attack', 'A rotting zombie lurching in: a wet guttural gurgling moan and a thick phlegmy snarl, sluggish and fleshy with a squelch of decayed muscle, undead but bodily and heavy, no airy whoosh. Single dry event, no music, no clear words, no speech', 1.1],
  ['zombie_death', 'A zombie collapsing: a wet gurgling death groan drowning in bubbling fluid, ending in a heavy soft squelching thud as the decayed body drops, bodily and wet. Single dry event, no music, no words, no speech', 1.4],
  ['wendigo_attack', 'A wendigo\'s savage attack: an ear-splitting demonic shriek tearing into a feral rasping roar, high jagged and rabid with a distorted snarl, unnatural and monstrous, sharper and far more demonic than any ape or bear. Single dry event, no music, no human voice', 1.2],
  ['wendigo_death', 'A wendigo dying: a shrill splitting screech buckling downward into a wet guttural death rattle and a cracking bony collapse, unnatural feral and monstrous. Single dry event, no music, no human voice', 1.5],
  ['yeti_attack', 'A colossal yeti\'s attack: an enormous deep booming ape bellow and chest-pounding roar rolling out and echoing off ice walls, immense lumbering and cavernous, far deeper and boomier than a bear and never shrill. Single dry event, no music, no human voice', 1.3],
  ['yeti_death', 'A giant yeti\'s death: a pained booming roar sagging into a deep groaning exhale, then a massive muffled body-fall thudding into packed snow with a low crunch, immense and ape-like. Single dry event, no music, no human voice', 1.6],
  ['treant_attack', 'A giant treant striking: deep groaning creaking timber under strain and thick branches cracking and whooshing through the air, all living wood with no animal voice or breath, purely woody and ligneous. Single dry event, no music, no human voice', 1.2],
  ['treant_death', 'A treant toppling: loud tearing splinter of fibrous wood, a groaning trunk-crack, then a ground-shaking timber crash with a broad rustling scatter of leaves and snapping twigs, pure wood with no animal voice. Single dry event, no music, no human voice', 1.6],
  ['bird_attack', 'A predatory desert bird swooping to strike: a harsh raspy scavenger\'s screeching caw and rapid buffeting wingbeats with talons striking, purely avian with no growl or roar, thinner and scrappier than a griffin. Single dry event, no music, no human voice', 0.9],
  ['bird_death', 'A large scavenger bird shot from the sky: a harsh strangled squawk breaking into a rasping screech, wings thrashing and feathers scattering, purely avian and shrill. Single dry event, no music, no human voice', 1.1],
  ['golem_attack', 'An ice-stone golem attacking: massive grinding stone slabs scraping and dry ice sheets cracking, a heavy mineral boulder impact with a low resonant boom, purely rock and frost with absolutely no voice or breath. Single dry event, no music, no human voice', 1.2],
  ['golem_death', 'An ice golem breaking apart: deep stone cracking and glassy ice sheets shattering as the whole colossus crumbles and clatters down into a heap of rubble and frozen shards, purely mineral. Single dry event, no music, no human voice', 1.6],
  ['wisp_attack', 'A frost wisp striking: a bright crystalline shimmering chime and a quick icy sparkling whoosh of frost crystals with a sharp frozen crackle on release, delicate ethereal and magical, glassy and weightless with no voice, moan or wail. Single dry event, no music, no human voice', 1.0],
  ['wisp_death', 'A frost wisp dissipating: a descending crystalline chime dissolving into faint tinkling ice shards and a soft airy sparkle fading to nothing, ethereal and delicate. Single dry event, no music, no human voice', 1.3],
  ['snapper_attack', 'A giant venus-flytrap striking: a wet leathery whump of huge leafy jaws slamming shut, a squelchy vine-lash snap and dripping sappy ooze, thick and fleshy-plant. Single dry event, no music, no human voice', 1.0],
  ['snapper_death', 'A giant carnivorous bloom dying: a wet deflating squelch as the huge jaws go slack, a limp sappy sag of collapsing vines and petals folding into a soft mushy slump. Single dry event, no music, no human voice', 1.3],
  ['scorpion_attack', 'A giant sand scorpion striking: rapid dry chittering pincer-clicks and clacks, then a sharp whipping stinger jab with a taut venomous flick, hard dry and insectoid. Single dry event, no music, no human voice', 0.9],
  ['scorpion_death', 'A giant scorpion dying: a dry crunching crack of splitting chitin, a few faltering leg-clicks and a final brittle collapse, hard and insectoid. Single dry event, no music, no human voice', 1.0],
  ['thornling_attack', 'A little thornling lashing out: dry whipping brambles cracking through the air and stiff thorny vines snapping and rustling, brittle prickly and dry with no wet squelch. Single dry event, no music, no human voice', 0.9],
  ['thornling_death', 'A small thorn creature dying: crisp snapping of brittle twigs and thorns apart and a dry crackling rustle of curling leaves crumpling to the ground, dry and papery. Single dry event, no music, no human voice', 1.0],
  ['boar_attack', 'A wild boar charging: a sharp aggressive snorting squeal and a deep guttural grunt with heavy huffing breath through the snout and a thud of trotters, blunt and piggish. Single dry event, no music, no human voice', 0.9],
  ['boar_death', 'A wild boar\'s death: a high piercing pained squeal cut abruptly short into a wet snorting wheeze as it drops, piggish. Single dry event, no music, no human voice', 1.1],
  ['elk_attack', 'A mad elk charging: a strident echoing bugling bellow rising to a nasal blaring call and a heavy hoof stomp on turf, hollow and horn-like, unmistakably a bull elk and never a predator\'s roar. Single dry event, no music, no human voice', 1.1],
  ['elk_death', 'A large elk falling: a wavering bugling bellow sinking into a wet groaning moan as the heavy body crashes down onto turf, hollow and antlered ungulate. Single dry event, no music, no human voice', 1.4],
  ['bear_attack', 'A grizzly bear rearing to swipe: a thick throaty roar rolling into a wet snarl and a gruff huffing bark with bared teeth, warm organic fur-and-flesh mammal, powerful but earthy and not as booming as a yeti. Single dry event, no music, no human voice', 1.1],
  ['bear_death', 'A grizzly bear\'s death: a pained booming roar sinking into a low rumbling groan and labored shuddering huffing breath as the bulk settles, warm organic and mammalian. Single dry event, no music, no human voice', 1.5],
  ['forest_ambience', 'Peaceful sunny broadleaf forest ambience: layered chirping songbirds and warbling calls near and distant, gentle leaves rustling in a soft warm breeze, an occasional light creak of branches, calm and bright. Seamless 18 second loop with no start or end and no sudden events, no music, no human voice', 18.0],
  ['wind_ambience', 'Open windswept highland ambience: steady whistling wind gusts rising and falling across dry grass and bare rock, lonely and vast with a hollow low drone underneath. Seamless loop with no start or end, no music, no human voice', 16.0],
  ['swamp_ambience', 'Murky humid swamp ambience: layered croaking frogs, buzzing insects and mosquitoes, slow dripping water and lazy bubbling mud plops, thick and damp. Seamless loop with no start or end, no music, no human voice', 16.0],
  ['cave_ambience', 'Dark cavern ambience: sparse echoing water drips into pools, a distant low earth rumble and hollow reverberant air, cold and damp and vast. Seamless loop with no start or end, no music, no human voice', 16.0],
  ['water_lapping', 'Calm lakeshore ambience: gentle water lapping and soft ripples washing against a pebbled shore, a light breeze over the surface, tranquil. Seamless loop with no start or end, no music, no human voice', 14.0],
  ['bee_attack', 'Angry bees attacking: a swarm of furious buzzing wings droning and darting sharply, insectoid, no music, no voice', 0.9],
  ['bee_death', 'A single bee squished: a short buzzing sputter cut off with a tiny wet pop, insect, no music, no voice', 0.6],
  ['cactus_attack', 'A living cactus creature attacking: dry woody creaking and a bristling rustle of sharp spines flicking out, arid and prickly, no music, no voice', 0.9],
  ['cactus_death', 'A cactus creature dying: a dry splitting crack of fibrous pulp and a soft collapsing thud of spines and flesh, arid, no music, no voice', 1.1],
  ['spear_throw', 'A wooden spear thrown hard: a short grunt-less whoosh of a heavy javelin cutting the air and a faint whistle as it flies, dry and physical, no music, no voice', 0.8],
  ['map_reveal', 'A magical parchment scroll unfurling: a soft papery whoosh and a warm shimmering sparkle chime as hidden land is revealed, gentle and pleasant, no music, no voice', 1.3],
  ['torch_equip', 'A torch being lit and raised: a quick scrape and a soft WHOOMP of catching flame flaring up, short and warm, no music, no voice', 0.8],
  ['torch_loop', 'A steady burning torch flame: continuous crackling fire and gently flapping flames, warm and close, seamless loop with no start or end, no music, no voice', 8.0],
  ['aggro', 'A sudden alert sting: a short sharp low growl-snarl with a quick tense whoosh as a beast notices its prey and charges, threatening and brief, no music, no voice', 0.7],
  ['equip_gear', 'Equipping gear: a crisp leather-and-buckle shuffle with a light metal clink as armor is strapped on, short and tactile, no music, no voice', 0.7],
  ['buy', 'A purchase confirmation: a pleasant bright coin-jingle and a soft wooden thunk as goods change hands, satisfying and short, no music, no voice', 0.8],
  ['night_crickets', 'Peaceful nighttime outdoor ambience: a chorus of chirping crickets and distant hooting owl, soft night breeze through grass, calm and nocturnal. Seamless loop with no start or end, no music, no human voice', 16.0],
  ['verdant_birds', 'Bright sunny forest daytime ambience: rich layered birdsong, chirping and warbling songbirds near and far, gentle rustling leaves and a warm breeze, lively and cheerful. Seamless loop with no start or end, no music, no human voice', 16.0],
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
