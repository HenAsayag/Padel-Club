# Padel Club

Landscape 3D padel for phones and desktop. Automatic running + swipe shots (optional manual movement and buttons). Two phones play **1 vs 1**, each controlling an opposing player. Local same-computer co-op remains a separate desktop option.

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

Default: your player automatically runs to intercept incoming balls and recovers after hitting. Swipe upward to choose direction and power. Choose DRIVE or LOB before a return; LOB is used once, then DRIVE is selected again. Tap your own court or use arrows to temporarily override running. Swipe angle selects direction, length selects depth, speed selects power. LOB selects a high, slower arc for the next return; serves remain underhand. Settings → Swipe controls (instead of buttons) turns this mode off. In optional button mode, joystick or arrow keys move and aim. Hold HIT / Z for a drive or serve, or LOB / X for a lob; release at the desired power. Desktop mouse buttons appear beside the meter. Local player 2 uses WASD + N / M. Neutral movement keeps the selected aim. Settings include a left-handed touch layout. Each phone has its own player-facing camera. The 120ms coyote window and bounded moving approach are retained.

## Edit and build

```sh
npm run build
npm test
```

padel-club-v4.html is the baseline. padel-android/src contains mobile, camera, animation and gameplay additions. padel-android/scripts applies them; scripts/export-web.cjs builds public/. assets/characters contains the CC0 Kenney characters. Do not edit the generated public/index.html directly. Dependency/model license notices ship alongside the game. No APK signing keys or personal files are included.


## Swipe gameplay and tactical AI

Swipe power uses a smooth speed curve (32% gentle floor, gradually approaching 96%) instead of a linear mapping that quickly saturated at 100%. A 150 CSS-pixel swipe in 180 ms at 844x390 now produces about 65%, with length and direction still independent. Controlled drives have longer flight time; the maximum additional overhit speed is 28%, previously 82%. Aim is frozen on release and buffered for 650 ms; contact requires actual reach. The small moving assist is capped at 45 cm and 160 ms. Ball flight never slows for human input and no player teleports. Weak shots can net/fall short; excessive power risks a wall before the bounce. Balance, movement, stretch, incoming speed and fatigue affect a bounded, deterministic human placement error. The ring is an estimated landing area, not a guaranteed result. A thin cyan direction arrow appears on court while swiping and briefly after release. The preview freezes when released instead of being recalculated from an already-moving ball. Power is a non-interactive 86x22 px edge readout, with no central panel. Rally view is an elevated, gently following camera that keeps both halves visible. Other camera choices remain in Settings. Serve preview depth is limited to the service box; actual contact, net, diagonal and floor rules still decide legality.

Automatic running follows the existing wall-aware predictor at 80 ms intervals. Players accelerate, brake and still need physical racket reach; a distant fast ball can pass them. Doubles assigns one receiver and separate partner recovery. The host simulates movement for both phones. Manual movement temporarily takes precedence. Tap movement accelerates and brakes; arrow/joystick input cancels the target. Bots also accelerate and brake. They predict legal wall rebounds, assign one doubles receiver, cover with their partner, evaluate open space/net pressure/recent shot history and choose between defensive, attacking, lob and overhead plans. Reaction and precision vary by difficulty. A pathological 100-shot / 150-second rally is replayed with no awarded point.

Automatic character progression is disabled. Existing saved attributes are ignored and no attributes or purchases are earned through play. Existing characters, scoring, singles, doubles, local co-op and two-phone matches remain available.

| Source under padel-android/src | Purpose |
| --- | --- |
| control-model.js | Central gesture, movement, contact, assistance, power and AI tuning |
| gesture-ui.js / .css | Touch/mouse gestures, tap targets, estimated landing, quiet power HUD and lob toggle |
| skill-game.js | Released intent, contact sampling, shot quality, flight and wall-aware prediction |
| tactics.js | AI candidates, coverage, styles, memory and rally safeguard |
| reach-game.js | Short animated approach and physical contact validation |
| mobile-engine.js / online.js | Far-court controls and version 4 network gesture packets |
| clubhouse.js | Preparation and contextual character animation |

Both phones must reload after this protocol update. Physics runs at 120 Hz with additional fast-ball contact samples. Reduced-motion preferences enable calm camera and hide the fast trail. Pause, resize and pointer cancellation discard unfinished gestures. iPhone mode plays in the browser without requiring fullscreen; rotate manually.

Validation: npm run build and npm test cover gesture normalization, independent length/speed/direction, pointer cancellation, target movement, bounded contact, physical power outcomes, wall/floor scoring, AI simulations, legacy keyboard/buttons, network packet replay protection, restart and iPhone fallback. Browser checks cover landscape mobile and desktop menus, tap/swipe feedback and lob control. Automated browser dragging is slow, so it does not establish fast-swipe feel or certify real iPhone/Android multitouch, latency or battery performance. Test those on target devices before a release tournament.

Reference for this control revision: the user-provided 10.77-second Tennis Clash recording was sampled across the full clip and more densely at 5–6 and 9–10 seconds. Visible design cues were an elevated court view, brief cyan directional feedback and a player-position ring. The clip does not establish the original game's internal power algorithm; the revised curve is our own padel tuning. No graphics or code were copied from the reference.

Automatic-run validation covers normal returns without movement input on both court sides, unreachable balls, manual overrides, pause/guest authority, doubles ownership, eight gesture-only returns, lob arc height and duration, and controlled versus overhit corner drives. Legacy /public/ links redirect to the published game root.

## Pre-game controls and eye view

Choose **Auto run** or **Joystick** in the Play menu before starting. Both use swipes for shot direction and power, with DRIVE / LOB selection. Joystick mode disables automatic pursuit for that player; the stick and a second finger's swipe work independently. The movement choice is saved locally and sent to the host in version 4 input packets so each phone can choose differently. Reload both phones before reconnecting. Desktop joystick mode also displays the stick and retains arrow keys.

**FULL SCREEN** is available directly in the Play menu on desktop and mobile. It requests fullscreen without starting a match. Browser restrictions still apply; the iPhone browser-play option remains available.

In **Settings → Player eyes**, the camera sits at player eye height, faces the opponent and follows the ball across the court. Only the player's obstructing meshes are hidden during that camera's render; the racket arm stays visible. Other players and other camera views retain complete characters. Local two-player eye view uses split screen. The camera cycle includes this fifth view.
