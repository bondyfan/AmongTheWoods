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
  // This used to assert that sendCampSync began with `return;`. It no longer
  // exists: a stub whose body still assembles the old broadcast is one deleted
  // line away from shipping it again. See the server section at the bottom.
  ok(!/sendCampSync/.test(mp.replace(/\/\/.*$/gm, '')),
    'there is no sendCampSync, not even a neutered one');
  ok(!/'camp', lv:|type: 'camp'/.test(mp), 'and no code that could build the message');
  ok(/no camp push — the camp is personal/.test(mp),
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

console.log('\n-- and the SERVER no longer keeps one either --');
{
  // The client had been made personal at both ends, but the dedicated server
  // still pinned the last 'camp' event any client ever sent and replayed it to
  // every joiner. Rooms outlive sessions, so one player's base, chest and
  // furnace turned up in everybody's world and stayed there.
  const room = readFileSync('server/room.js', 'utf8');
  ok(!/lastCamp/.test(room), 'the room stores no camp at all');
  ok(!/MSG\.EVENT_UP, ev: this\.lastCamp/.test(room), 'and replays none to a joiner');
  ok(/if \(ev\?\.type === 'camp'\) return;/.test(room),
    "an incoming 'camp' event is DROPPED, not relayed — an old client cannot reintroduce one");
  // it must be dropped BEFORE the relay, or it would still reach everyone
  const on = room.slice(room.indexOf('onEvent('), room.indexOf('onSnap('));
  ok(on.indexOf("=== 'camp'") < on.indexOf('this.broadcast'),
    'and dropped ahead of the broadcast, not after it');
  ok(/PERSONAL/.test(room), 'with the reason recorded where the store used to be');

  // and the client-side sender is gone rather than neutered — a stub whose body
  // still builds the old message is an invitation to delete the `return`
  ok(!/sendCampSync\(toUid/.test(mp), 'sendCampSync no longer exists');
  ok(!/type: 'camp'/.test(mp), 'and nothing can construct a camp event');
  const main = readFileSync('js/main.js', 'utf8');
  ok(!/sendCampSync/.test(main), 'no call sites are left behind');
  ok(!/onCampSync: \(/.test(main), 'and no handler to apply one');
  // the things that used to sync now just save
  ok(/onChestChange: \(\) => requestAutosave\(\)/.test(main),
    'a chest deposit saves instead of broadcasting');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
