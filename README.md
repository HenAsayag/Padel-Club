# Padel Club

Landscape 3D padel for phones and desktop. Touch joystick + HIT / LOB. Two phones play **1 vs 1**, each controlling an opposing player. Local same-computer co-op remains a separate desktop option.

## Play on the same Wi-Fi (no internet matchmaking)

Install Node.js 20 or newer on a computer connected to the same Wi-Fi as both phones. In this folder run:

```sh
npm ci
npm start
```

Open the printed **Both phones** address on each phone (not localhost). Phone 1 taps **TWO PHONES · 1 VS 1 → Create room**. Phone 2 enters that room code and taps **Join room**. Keep the computer running. The computer serves the files and room signalling; the host phone runs the match and sends state directly over WebRTC. Bundled assets and local signalling allow LAN play without internet after installation. Guest Wi-Fi/client isolation can prevent peer connections; use a normal shared Wi-Fi network. Allow Node on your private network if your OS prompts.

## GitHub Pages

Repository Settings → Pages → Source: GitHub Actions. Push to main (or run Publish game). The workflow publishes public/. Both phones can then open https://henasayag.github.io/Padel-Club/ and use the same room-code flow. On Pages, internet is required for initial loading and PeerJS public room signalling; this mode does not run the local server. Some networks require a TURN service: configure iceServers in padel-android/app/src/main/assets/network-config.js and rebuild for those networks.

## Full screen and controls

Tap Play or FULL SCREEN to request full screen and landscape lock. Portrait blocks play and pauses an active match. Android browsers with supported APIs can lock orientation; browser/OS restrictions mean a website cannot force full screen or landscape on every iPhone/browser. If unavailable, add the HTTPS site to your home screen and rotate the phone manually. The native Android app has its own landscape/full-screen settings. Safe-area padding keeps controls clear of notches. Returning from a background app leaves the match paused.

Joystick or arrow keys: move and aim. Hold HIT / Z for a drive or serve, or LOB / X for a lob; release at the desired power. Desktop mouse buttons appear beside the meter. Local player 2 uses WASD + N / M. Neutral movement keeps the selected aim. Settings include a left-handed touch layout. Each phone has its own player-facing camera. The 120ms coyote window and bounded moving approach are retained.

## Edit and build

```sh
npm run build
npm test
```

padel-club-v4.html is the baseline. padel-android/src contains mobile, camera, animation and gameplay additions. padel-android/scripts applies them; scripts/export-web.cjs builds public/. assets/characters contains the CC0 Kenney characters. Do not edit the generated public/index.html directly. Dependency/model license notices ship alongside the game. No APK signing keys or personal files are included.


## Tactical AI and skill progression

The old bot chose almost the same opponent-relative target and depth every time, while trajectories were automatically corrected to clear the net. Held human input also repeatedly queued a fixed-power shot. Together these made exchanges unusually repetitive.

The new decision layer scores short/middle/deep targets in three lanes against predicted opponent movement. Per-player and team history discourage repeats. Bots use Recover, Track, Prepare, Defend, Attack and Perform Action states, reaction delays and action cooldowns. Four player styles favor different choices. Fatigue, movement strain and rally pressure affect errors; difficulty changes speed, reaction time and precision. After 100 shots or 150 seconds, a pathological rally is replayed without awarding a point.

Hold/release power applies to all human shots, including serves, and is sent with the aim in online packets. Controlled shots use the existing gravity/drag/spin integrator. Quick taps use a slower, net-clearing nominal arc for beginners. Excessive power still adds velocity and risks a wall-first fault. Collision rules remain physical. Bots use the same trajectory code. The short moving reach assist remains capped at 65 cm.

Successful legal, controlled shots build ten saved character attributes with diminishing returns, a 100-point cap and a four-return reward limit per player per point. Misses and uncontrolled shots earn nothing. Power control, accuracy, timing and stamina grant small bounded benefits; online matches normalize those benefits for fairness while still saving earned progress. Clearing browser storage removes progression. The match result lists earned gains.

Implementation map:

| File under padel-android/src | Purpose |
| --- | --- |
| tactics.js | Tactical candidate scoring, bot state, fatigue and rally safeguard |
| skill-game.js | Hold/release input, power trajectories, legal-shot rewards |
| progression.js | Per-character storage, diminishing gains and caps |
| skill-ui.js / .html / .css | Meter, mouse/keyboard bindings, handedness and result summary |
| mobile-ui.js / .html | Multitouch joystick and hold/release shot buttons |
| mobile-engine.js / online.js | Remote controls and version 2 power/aim packets |
| clubhouse.js / experience.js | Charge windup and updated in-game instructions |

The build scripts combine these with the existing game and export public/. Both phones must reload after this protocol update. Physics still advances at a fixed 120 Hz, independently of render size. Camera aspect and renderer size update on resize; portrait mobile play pauses under the rotate overlay. Safe areas and pointer capture protect the controls.

Validation: `npm run build && npm test` covers seeded AI-vs-AI at all difficulties, a simulated human-input player against AI, charged keyboard/touch inputs, independent co-op charge, network replay rejection, opposite-court serving, beginner tap returns, physical net collisions and strong/wall faults, legal wall rebounds, bounded reach, saved progression, pause/rotation and generated-module syntax. Browser layout checks use 844x390 and 390x844 phones, 1024x768 tablet and 1366x768 desktop. These are browser viewport checks, not physical iPhone/Android certification.

Mobile cleanup: one home panel with Play now; court/match setup opens separately. During play only score, joystick, HIT/LOB and pause remain. Power appears while charging and briefly after release. Camera selection is in pause; handedness remains in Settings.
