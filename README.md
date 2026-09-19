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

Joystick: move. HIT: normal shot / serve. LOB: high shot. Aim and shot power are automatic. Each phone has its own player-facing camera. The 120ms coyote window and bounded moving approach are retained.

## Edit and build

```sh
npm run build
npm test
```

padel-club-v4.html is the baseline. padel-android/src contains mobile, camera, animation and gameplay additions. padel-android/scripts applies them; scripts/export-web.cjs builds public/. assets/characters contains the CC0 Kenney characters. Do not edit the generated public/index.html directly. Dependency/model license notices ship alongside the game. No APK signing keys or personal files are included.
