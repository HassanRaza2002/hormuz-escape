# Hormuz Escape

![Hormuz Escape start screen](assets/Start%20Screen.webp)

**Outrun the danger. Navigate the strait. Survive the escape.**

Hormuz Escape is a fast-paced pixel-art survival game set on the waters of the Strait of Hormuz. Pilot your tanker through a shifting field of sea mines and patrol boats, collect power-ups, and chase a new high score before your luck runs out.

## Play your way

- Keyboard controls for classic desktop play
- Touch and tilt controls for mobile
- Single- and dual-hand camera tracking powered by MediaPipe
- Easy, Normal, and Hard difficulty modes
- Boost and cease-fire power-ups
- Local high scores with an optional online leaderboard

## Run locally

This is a dependency-free static web game. Serve the directory with any local web server, then open it in a modern browser:

```bash
npx serve .
```

Camera controls require permission and work on `localhost` or over HTTPS. Keyboard and touch controls work without camera access.

## Deploy to Vercel

The included `vercel.json` makes the project ready for a zero-build static deployment. Import the GitHub repository into Vercel and leave the framework preset as **Other**; no build command or output directory is required.

## Controls

Choose a control style on the start screen, select a difficulty, then tap or click the game to begin. Use the on-screen sound button to mute or unmute the soundtrack.

## Tech

HTML5 Canvas, vanilla JavaScript, CSS, MediaPipe Hands, and Web Audio.
