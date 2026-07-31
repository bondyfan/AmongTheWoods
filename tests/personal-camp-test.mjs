// ==========================================================================
// THE CAMP IS PERSONAL — regression test.
//
// Reported from a live server: "why do I see a furnace and a chest I never
// built?" The camp was BROADCAST, and every camp building sits at a FIXED
// offset (camp.js SPOTS — furnace at 11,11, tower at 13,17), so a shared world
// painted everyone's structures onto the same spot. You walked home and found
// someone else's camp on top of yours.
//
// It is personal now: never sent, and an inbound 'camp' event is ignored so an
// old client or a replayed server event cannot overwrite yours either.
//
// Run: node tests/personal-camp-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const mp = readFileSync('js/multiplayer.js', 'utf8');
const camp = readFileSync('js/camp.js', 'utf8');

console.log('\n-- the camp is never sent --');
{
  const fn = mp.slice(mp.indexOf('sendCampSync(toUid = null) {'));
  const body = fn.slice(0, fn.indexOf('\n  }'));
  ok(/^\s*return;/m.test(body), 'sendCampSync returns immediately');
  ok(body.indexOf('return;') < body.indexOf('sendEvent'),
    'before it can reach sendEvent');
  ok(!/this\.sendCampSync\(uid\)/.test(mp),
    'and nothing pushes it to a joining peer any more');
}

console.log('\n-- nor accepted --');
{
  ok(/case 'camp': break;/.test(mp), "an inbound 'camp' event is ignored");
  ok(!/ctx\.onCampSync\?\.\(/.test(mp),
    'onCampSync is never invoked — a replayed server event cannot overwrite yours');
}

console.log('\n-- and there is nothing to upgrade --');
{
  ok(/canUpgrade\(\) \{ return false; \}/.test(camp), 'canUpgrade() is false');
  const b = camp.slice(camp.indexOf('build(id) {'), camp.indexOf('placeItem'));
  ok(/return false;/.test(b), 'build() refuses');
  ok(!/this\.levels\[id\]\+\+/.test(b), 'and cannot raise a level');
  ok(/nothing to upgrade/.test(b), 'it says so rather than failing silently');
  // the seam is kept, not deleted, so callers do not break
  ok(/build\(id\) \{/.test(camp), 'the method still exists for its callers');
}

console.log('\n-- but a crafted chest can still be placed --');
ok(/placeItem\(id, spot\) \{/.test(camp),
  'placeItem is untouched — putting down a chest you made is not an upgrade');

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
