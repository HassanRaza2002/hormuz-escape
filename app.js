const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreNameInput = document.getElementById('score-name-input');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ==========================================
// 1. CAMERA & PERSPECTIVE SETTINGS
// ==========================================
// [HOW TO EDIT]: 
// 'fov' (Field of View): Controls how much 3D stretching happens. 
//      - Lower number (e.g., 100) = Extreme stretching, objects fly past you very fast.
//      - Higher number (e.g., 500) = Flatter, looking straight down.
const fov = 400;

// 'cameraHeight': How high up the camera is placed above the water.
//      - Lower number (e.g., 50) = Very low to the water.
//      - Higher number (e.g., 300) = Bird's eye view.
const cameraHeight = 400;

// 'horizonY': The line on the screen where the sky meets the water.
//      - It is calculated based on screen height. 
//      - 'canvas.height / 2' is exactly in the middle. 'canvas.height / 1.2' is lower down.
let horizonY = canvas.height / 3;

// ==========================================
// 2. LOAD YOUR IMAGES
// ==========================================
const imgPaths = {
    sky: './assets/background_middle_east_horizon.webp',
    skyMobile: './assets/background_middle_east_horizon_mobile.webp',
    water: './assets/water_tile_seamless.webp',
    playerBoat: './assets/player_tanker_straight.webp',
    playerBoatLeft: './assets/player_tanker_soft_Left.webp',
    playerBoatRight: './assets/player_tanker_soft_right.webp',
    enemyBoatCenter: './assets/obstacle_patrol_boat Center.webp',
    enemyBoatLeft: './assets/obstacle_patrol_boat_left.webp',
    enemyBoatRight: './assets/obstacle_patrol_boat_right.webp',
    mine: './assets/obstacle_sea_mine.webp',
    buoy: './assets/buoy_marker.webp',
    speedDial: './assets/Speedometer Frame Meter.webp',
    speedNeedle: './assets/Speedometer Frame Pointer.webp',
    compassDial: './assets/Small Indicator.webp',
    compassNeedle: './assets/Speedometer Frame Pointer.webp',
    lifeIcon: './assets/player_tanker_life.webp',
    startScreen: './assets/Start Screen.webp',
    namePlate: './assets/Name Plate.webp',
    gameOverScreen: './assets/Game Over.webp',
    highScoreScreen: './assets/HIgh Score.webp',
    iconSingleHand: './assets/single hand.webp',
    iconDualHand: './assets/Dual Hand.webp',
    iconKeyboard: './assets/Keyboard.webp',
    iconMobileTilt: './assets/Mobile Tilt.webp',
    navFrame: './assets/nav frame.webp',
    videoFrame: './assets/Video Frame.webp',
    difficultyEasy: './assets/Easy.webp',
    difficultyNormal: './assets/Normal.webp',
    difficultyHard: './assets/Hard.webp',
    boostPowerup: './assets/boost_powerup.webp',
    ceaseFirePowerup: './assets/cease_fire.webp',
    boostLines: './assets/boost_lines.webp',
    boostLinesMobile: './assets/boost_lines_mobile_view.webp',
    playerBoatCease: './assets/player_tanker_soft_center-cease_fire.webp',
    playerBoatLeftCease: './assets/player_tanker_soft_left-cease_fire.webp',
    playerBoatRightCease: './assets/player_tanker_soft_right-cease_fire.webp',
    muteButton: './assets/Mute.webp',
    unmuteButton: './assets/Unmute.webp',
    loading: './assets/Loading.webp'
};

const images = {};
let assetsLoaded = 0;
let assetsFailed = 0;
const totalAssets = Object.keys(imgPaths).length;
const criticalAssets = [
    'sky',
    'skyMobile',
    'water',
    'playerBoat',
    'startScreen',
    'gameOverScreen',
    'highScoreScreen',
    'loading'
];
for (const [key, path] of Object.entries(imgPaths)) {
    images[key] = new Image();
    images[key].onload = () => {
        assetsLoaded++;
    };
    images[key].onerror = () => {
        assetsFailed++;
        console.error(`Missing or failed asset: ${path}`);
    };
    images[key].src = `${path}?v=449043b`;
}

function areCriticalAssetsReady() {
    const processedAssets = assetsLoaded + assetsFailed;
    if (processedAssets >= totalAssets && assetsLoaded > 0) return true;

    return criticalAssets.every((key) => {
        const img = images[key];
        return img && img.complete && img.naturalHeight !== 0;
    });
}

function drawLoadingScreen(currentTime = Date.now()) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#071320';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = images.loading;
    const size = Math.min(canvas.width, canvas.height) * 0.18;
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const steps = 12;
    const angle = Math.floor(currentTime / 110) % steps * ((Math.PI * 2) / steps);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
        ctx.fillStyle = '#ffcf65';
        ctx.fillRect(-size / 2, -size / 2, size, size);
    }
    ctx.restore();

    ctx.font = `22px 'PixelGame'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff7d7';
    ctx.fillText(`LOADING ${assetsLoaded}/${totalAssets}`, canvas.width / 2, y + size * 0.72);
}

// ==========================================
// 3. PLACE YOUR STATIC OBSTACLES
// ==========================================
// [HOW TO EDIT]: This list controls everything on the water.
// Each line is one object. You can copy-paste lines to add more objects!
// 
// x (LANE): -300 is the Left lane, 0 is the Center lane, 300 is the Right lane. 
//           The code will automatically pick the Left, Right, or Center boat sprite based on this number!
// z (DEPTH): How far away the object is. 
//           - Small numbers (e.g., 100) are very close to the player.
//           - Large numbers (e.g., 4000) are far away near the horizon.
// width/height: How big the object appears *before* 3D scaling is applied.
//           [HINT]: Increase width and height for mines and enemy boats here to make them 
//           feel larger and more threatening when they get close to your boat!
const obstacles = [];

// Add Buoys along the left and right track borders
const leftBorderX = -1300;
const rightBorderX = 1300;
const buoySpacingZ = 600;
const maxBuoyZ = 2500;

for (let z = 200; z <= maxBuoyZ; z += buoySpacingZ) {
    // Left buoy
    obstacles.push({ type: 'buoy', x: leftBorderX, z: z, width: 90, height: 100 });
    // Right buoy
    obstacles.push({ type: 'buoy', x: rightBorderX, z: z, width: 90, height: 100 });
}

// ==========================================
// 4. GAME MECHANICS & CONTROLS
// ==========================================
let speed = 0;
let maxSpeed = 80;       // Top speed of the boat
let acceleration = 1.5;  // How quickly the boat speeds up
let friction = 0.8;      // Coasting slowdown when you let go of the gas

let playerX = 0;         // Tracks horizontal position
let isCrashed = false;
let crashTimer = 0;
let screenShake = 0;

let waterOffset = 0;     // For water scrolling illusion
let lives = 3;           // Player lives
let score = 0;
let highScore = 0;
let difficulty = 1;
let difficultyProgress = 0;
let difficultyMode = 'NORMAL';
let lastRunWasTopScore = false;
let lastHighScoreName = '---';
let lastHighScoreValue = 0;
let scoreEntryActive = false;
let scoreEntrySaved = false;
let scoreEntrySubmitting = false;
let scoreSubmissionId = "";
let scoreEntryRect = null;
let scoreSaveRect = null;
let gameOverCanContinueAt = 0;
let namePlateY = -240;
let namePlateTargetY = 18;
let boostTimer = 0;
let ceaseFireTimer = 0;
let isMuted = false;
let wasPlayingBeforeHidden = false;

// Game State Machine Variables
let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
let uiTransitioning = false;
let uiYOffset = 0;
let uiVelocity = 0;
let spawnTimer = 0;      // For procedural obstacle generation

// MediaPipe Setup Variables
let controlMode = 'KEYBOARD'; // 'KEYBOARD', 'TOUCH', 'TILT', 'SINGLE_HAND', 'DUAL_HAND'
let normalizedSteering = 0;
let actionState = "COAST";
let cameraStarted = false;
let cameraError = "";
let pipRenderLoopStarted = false;
let handTrackingLoopStarted = false;
let handProcessing = false;
let latestHandLandmarks = [];
let handDebug = {
    hands: 0,
    status: 'idle',
    thumb: null
};
let topScores = [
    { name: '---', score: 0 },
    { name: '---', score: 0 },
    { name: '---', score: 0 }
];
let touchControl = {
    active: false,
    id: null,
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0
};
let tiltControl = {
    active: false,
    supported: false,
    calibrated: false,
    base: 0,
    value: 0
};
let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let musicStarted = false;
const gameMusic = new Audio('./assets/brutaldesign-pixel-art-481480.mp3?v=449043b');
gameMusic.loop = true;
gameMusic.volume = 0.68;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const showPipDebug = false;
const isHandControlMode = () => controlMode === 'SINGLE_HAND' || controlMode === 'DUAL_HAND';
const leaderboardApiBase = window.HORMUZ_API_BASE_URL || 'https://hormuz-escape-410512753511.us-central1.run.app';
const difficultySettings = {
    EASY: { gain: 0.007, decay: 0.018, maxLevel: 5, minSpawnTimer: 16, spawnBase: 58, enemyBoost: 1 },
    NORMAL: { gain: 0.013, decay: 0.032, maxLevel: 7, minSpawnTimer: 12, spawnBase: 48, enemyBoost: 1.35 },
    HARD: { gain: 0.023, decay: 0.052, maxLevel: 10, minSpawnTimer: 8, spawnBase: 38, enemyBoost: 1.9 }
};
const scoreMultipliers = {
    EASY: 1,
    NORMAL: 1.35,
    HARD: 1.85
};
const autoScoreNames = [
    "MINECOLLECT",
    "CEASEFIRE",
    "JUSTPASSIN",
    "CAPTGHABRA",
    "OILORDIE",
    "USTAAD",
    "CHEETA",
    "SEA ACE",
    "WAVE RIDER",
    "HORMUZ HERO"
];

function getAutoScoreName() {
    return autoScoreNames[Math.floor(Math.random() * autoScoreNames.length)];
}

function getControlIconLayout() {
    const compact = canvas.width < 700;
    const iconW = compact ? 44 : 58;
    const space = compact ? 8 : 18;
    const left = compact ? 18 : 30;
    const lifeHeight = compact ? 39 : 52;
    const lifeStartY = compact ? 78 : 126;
    const lifeSpacing = compact ? 6 : 8;
    const iconY = lifeStartY + (lifeHeight * 3) + (lifeSpacing * 2) + (compact ? 12 : 18);

    return {
        iconW,
        iconY,
        singleX: left,
        dualX: left + iconW + space,
        keyX: left + (iconW + space) * 2
    };
}

function isCompactControlLayout() {
    return canvas.width < 700 || navigator.maxTouchPoints > 0;
}

function isTiltSlotMode() {
    return isCompactControlLayout();
}

function isMobileView() {
    return canvas.width < 700 || canvas.height > canvas.width || navigator.maxTouchPoints > 0;
}

function getMobileDifficultyFactor() {
    return isMobileView() ? 0.72 : 1;
}

function getMuteButtonLayout() {
    const buttons = getDifficultyButtonLayout();
    const last = buttons[buttons.length - 1];
    const size = canvas.width < 700 ? 42 : 42;
    return {
        x: last.x + last.w - size,
        y: last.y + last.h + 8,
        w: size,
        h: size
    };
}

function getDifficultyButtonLayout() {
    const right = canvas.width - 30;
    const buttonW = canvas.width < 700 ? 48 : 66;
    const buttonH = canvas.width < 700 ? 22 : 30;
    const gap = 6;
    const y = canvas.width < 700 ? 224 : 304;
    const labels = ['EASY', 'NORMAL', 'HARD'];

    return labels.map((mode, index) => ({
        mode,
        x: right - (buttonW * (3 - index)) - (gap * (2 - index)),
        y,
        w: buttonW,
        h: buttonH
    }));
}

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!musicStarted) {
        musicStarted = true;
        gameMusic.play().catch((err) => {
            musicStarted = false;
            console.warn("Game music could not start yet:", err);
        });
    }

    gameMusic.muted = isMuted;
}

function playCrashSound() {
    if (!audioCtx || isMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

function playPowerupSound() {
    if (!audioCtx || isMuted) return;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
    gain.connect(audioCtx.destination);

    [520, 780, 1040].forEach((frequency, index) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + index * 0.055);
        osc.connect(gain);
        osc.start(audioCtx.currentTime + index * 0.055);
        osc.stop(audioCtx.currentTime + 0.16 + index * 0.055);
    });
}

function updateEngineSound() {
    if (!audioCtx || gameState !== 'PLAYING' || isMuted) {
        if (engineGain) engineGain.gain.setTargetAtTime(0, audioCtx ? audioCtx.currentTime : 0, 0.08);
        return;
    }

    if (!engineOsc) {
        engineOsc = audioCtx.createOscillator();
        engineGain = audioCtx.createGain();
        engineOsc.type = 'sawtooth';
        engineGain.gain.value = 0;
        engineOsc.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
    }

    engineOsc.frequency.setTargetAtTime(70 + speed * 2.2, audioCtx.currentTime, 0.08);
    engineGain.gain.setTargetAtTime(0.015 + (speed / maxSpeed) * 0.025, audioCtx.currentTime, 0.08);
}

function setMuted(muted) {
    isMuted = muted;
    gameMusic.muted = muted;
    if (engineGain && audioCtx) {
        engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    }
}

if (scoreNameInput) {
    scoreNameInput.addEventListener('input', () => {
        const clean = sanitizePlayerName(scoreNameInput.value, '');
        if (scoreNameInput.value !== clean) scoreNameInput.value = clean;
        lastHighScoreName = clean || 'CAPT';
    });

    scoreNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveScoreEntry();
        }
    });
}

function setTouchInput(clientX, clientY) {
    const dx = clientX - touchControl.baseX;
    const dy = clientY - touchControl.baseY;
    const maxDistance = Math.min(82, canvas.width * 0.16);

    touchControl.x = touchControl.baseX + clamp(dx, -maxDistance, maxDistance);
    touchControl.y = touchControl.baseY + clamp(dy, -maxDistance, maxDistance);
    normalizedSteering = clamp(dx / maxDistance, -1, 1);

    if (dy < -12) actionState = "ACCELERATE";
    else if (dy > 28) actionState = "BRAKE";
    else actionState = "COAST";
}

async function enableTiltControl() {
    controlMode = 'TILT';
    pipContainer.style.display = 'none';
    touchControl.active = false;
    tiltControl.active = true;
    tiltControl.calibrated = false;
    tiltControl.value = 0;
    actionState = "ACCELERATE";

    try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') {
                tiltControl.active = false;
                controlMode = 'TOUCH';
                actionState = "COAST";
            }
        }
    } catch (err) {
        console.warn("Tilt permission was not granted:", err);
        tiltControl.active = false;
        controlMode = 'TOUCH';
        actionState = "COAST";
    }
}

function handleDeviceTilt(e) {
    if (!tiltControl.active || controlMode !== 'TILT') return;

    const rawTilt = e.gamma;
    if (typeof rawTilt !== 'number') return;

    tiltControl.supported = true;
    if (!tiltControl.calibrated) {
        tiltControl.base = rawTilt;
        tiltControl.calibrated = true;
    }

    const relativeTilt = rawTilt - tiltControl.base;
    tiltControl.value = clamp(relativeTilt / 22, -1, 1);
    normalizedSteering = tiltControl.value;
    actionState = "ACCELERATE";
}

window.addEventListener('deviceorientation', handleDeviceTilt);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        wasPlayingBeforeHidden = gameState === 'PLAYING';
        if (gameState === 'PLAYING') gameState = 'PAUSED';
        actionState = "COAST";
        speed = 0;
        gameMusic.pause();
        if (engineGain && audioCtx) engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    } else if (gameState === 'PAUSED' && wasPlayingBeforeHidden) {
        gameState = 'PLAYING';
        if (musicStarted && !isMuted) gameMusic.play().catch(() => {});
    }
});

function drawTouchJoystick() {
    if (!touchControl.active) return;

    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff4d0';
    ctx.fillStyle = 'rgba(7, 19, 32, 0.45)';
    ctx.beginPath();
    ctx.arc(touchControl.baseX, touchControl.baseY, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffcf65';
    ctx.strokeStyle = '#08131f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(touchControl.x, touchControl.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawDifficultyMeter(x, y, width, level) {
    const maxLevel = difficultySettings[difficultyMode].maxLevel;
    const fillWidth = width * ((level - 1) / (maxLevel - 1));
    ctx.save();
    ctx.fillStyle = 'rgba(7, 19, 32, 0.62)';
    ctx.fillRect(x - width, y, width, 12);
    ctx.strokeStyle = '#fff4d0';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width, y, width, 12);
    ctx.fillStyle = '#ffcf65';
    ctx.fillRect(x - width + 2, y + 2, Math.max(0, fillWidth - 4), 8);
    ctx.restore();
}

function drawDifficultyButtons() {
    ctx.save();
    for (const button of getDifficultyButtonLayout()) {
        const active = difficultyMode === button.mode;
        const img = button.mode === 'EASY' ? images.difficultyEasy : (button.mode === 'NORMAL' ? images.difficultyNormal : images.difficultyHard);

        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, button.x, button.y, button.w, button.h);
        } else {
            ctx.fillStyle = 'rgba(7, 19, 32, 0.68)';
            ctx.fillRect(button.x, button.y, button.w, button.h);
        }

        if (active && images.navFrame && images.navFrame.complete) {
            ctx.drawImage(images.navFrame, button.x - 4, button.y - 4, button.w + 8, button.h + 8);
        }
    }
    ctx.restore();
}

function drawGameNamePlate() {
    const img = images.namePlate;
    const loaded = img && img.complete && img.naturalHeight !== 0;
    const visible = gameState === 'PLAYING' || gameState === 'PAUSED';
    const mobile = isMobileView();
    const targetY = visible ? (mobile ? 48 : namePlateTargetY) : -260;

    namePlateY += (targetY - namePlateY) * 0.08;
    if (!loaded || namePlateY < -230) return;

    const maxWidth = canvas.width * (mobile ? 0.38 : 0.28);
    const scale = Math.min(maxWidth / img.naturalWidth, mobile ? 0.29 : 0.38);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (canvas.width - w) / 2;

    ctx.save();
    ctx.drawImage(img, x, namePlateY, w, h);
    ctx.restore();
}

function drawImageCover(img, dx, dy, dw, dh, anchorY = 0.5) {
    const imageRatio = img.naturalWidth / img.naturalHeight;
    const destRatio = dw / dh;
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;

    if (imageRatio > destRatio) {
        sw = img.naturalHeight * destRatio;
        sx = (img.naturalWidth - sw) / 2;
    } else {
        sh = img.naturalWidth / destRatio;
        sy = (img.naturalHeight - sh) * anchorY;
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

window.addEventListener('keydown', (e) => {
    if (scoreEntryActive && document.activeElement === scoreNameInput) return;
    if (startUiTransition()) {
        e.preventDefault();
        return;
    }

    let key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        controlMode = 'KEYBOARD';
    }
    if (key === 'w' || key === 'arrowup') {
        actionState = "ACCELERATE";
    }
    if (key === 's' || key === 'arrowdown') {
        actionState = "BRAKE";
    }
    if (key === 'a' || key === 'arrowleft') {
        normalizedSteering = -1;
    }
    if (key === 'd' || key === 'arrowright') {
        normalizedSteering = 1;
    }
});

window.addEventListener('keyup', (e) => {
    if (scoreEntryActive && document.activeElement === scoreNameInput) return;
    let key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown') {
        if (controlMode === 'KEYBOARD') actionState = "COAST";
    }
    if (key === 'a' || key === 'arrowleft' || key === 'd' || key === 'arrowright') {
        if (controlMode === 'KEYBOARD') normalizedSteering = 0;
    }
});

// UI Click/Tap Transition Listener & Mode Selection
function handleInteract(clientX, clientY) {
    ensureAudio();
    
    // Mode UI Selection bounds check
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clickX = (clientX - rect.left) * scaleX;
    let clickY = (clientY - rect.top) * scaleY;

    if (gameState === 'GAMEOVER' && scoreEntryActive) {
        if (scoreSaveRect &&
            clickX >= scoreSaveRect.x && clickX <= scoreSaveRect.x + scoreSaveRect.w &&
            clickY >= scoreSaveRect.y && clickY <= scoreSaveRect.y + scoreSaveRect.h) {
            saveScoreEntry();
        } else {
            showScoreNameInput();
        }
        return;
    }

    const muteButton = getMuteButtonLayout();
    if (clickX >= muteButton.x && clickX <= muteButton.x + muteButton.w && clickY >= muteButton.y && clickY <= muteButton.y + muteButton.h) {
        setMuted(!isMuted);
        return;
    }

    for (const button of getDifficultyButtonLayout()) {
        if (clickX >= button.x && clickX <= button.x + button.w && clickY >= button.y && clickY <= button.y + button.h) {
            difficultyMode = button.mode;
            return;
        }
    }
    
    const iconLayout = getControlIconLayout();
    if (clickY >= iconLayout.iconY && clickY <= iconLayout.iconY + iconLayout.iconW) {
        let iconW = iconLayout.iconW;
        let singleX = iconLayout.singleX;
        let dualX = iconLayout.dualX;
        let keyX = iconLayout.keyX;
        
        if (clickX >= singleX && clickX <= singleX + iconW) {
            controlMode = 'SINGLE_HAND';
            pipContainer.style.display = 'block';
            startHandCamera();
        }
        else if (clickX >= dualX && clickX <= dualX + iconW) {
            if (isTiltSlotMode()) {
                enableTiltControl();
            } else {
                controlMode = 'DUAL_HAND';
                pipContainer.style.display = 'block';
                startHandCamera();
            }
        }
        else if (clickX >= keyX && clickX <= keyX + iconW) {
            controlMode = 'KEYBOARD';
            tiltControl.active = false;
            pipContainer.style.display = 'none';
        }
        return;
    }

    startUiTransition();
}

function isPointInsideRect(x, y, rect) {
    return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function startUiTransition() {
    if (scoreEntryActive) return false;
    if (gameState === 'GAMEOVER' && Date.now() < gameOverCanContinueAt) return false;
    if ((gameState === 'START' || gameState === 'GAMEOVER') && !uiTransitioning) {
        uiTransitioning = true;
        uiVelocity = -15;
        return true;
    }
    return false;
}

function getCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

window.addEventListener('mousedown', (e) => handleInteract(e.clientX, e.clientY));
window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        const point = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);
        if (isPointInsideRect(point.x, point.y, getMuteButtonLayout())) {
            e.preventDefault();
            e.stopPropagation();
        }
        handleInteract(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;

    const { x, y } = getCanvasPoint(e.clientX, e.clientY);
    const iconLayout = getControlIconLayout();
    const isModeTap = y >= iconLayout.iconY && y <= iconLayout.iconY + iconLayout.iconW;

    if (isPointInsideRect(x, y, getMuteButtonLayout()) || isModeTap || y < canvas.height * 0.42) return;

    e.preventDefault();
    ensureAudio();
    controlMode = 'TOUCH';
    pipContainer.style.display = 'none';
    touchControl.active = true;
    tiltControl.active = false;
    touchControl.id = e.pointerId;
    touchControl.baseX = x;
    touchControl.baseY = y;
    touchControl.x = x;
    touchControl.y = y;
    canvas.setPointerCapture(e.pointerId);
    setTouchInput(x, y);
});

canvas.addEventListener('pointermove', (e) => {
    if (!touchControl.active || e.pointerId !== touchControl.id) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    e.preventDefault();
    setTouchInput(x, y);
});

function endTouchControl(e) {
    if (!touchControl.active || e.pointerId !== touchControl.id) return;

    touchControl.active = false;
    touchControl.id = null;
    if (controlMode === 'TOUCH') {
        normalizedSteering = 0;
        actionState = "COAST";
    }
}

canvas.addEventListener('pointerup', endTouchControl);
canvas.addEventListener('pointercancel', endTouchControl);

// --- MEDIAPIPE HAND TRACKING SETUP ---

const videoElement = document.getElementsByClassName('input_video')[0];
const pipContainer = document.getElementById('pip-container');
const pipCanvas = document.getElementById('pip-canvas');
const pipCtx = pipCanvas.getContext('2d');

function resizePipCanvas() {
    pipCanvas.width = pipCanvas.clientWidth || 320;
    pipCanvas.height = pipCanvas.clientHeight || 240;
}

function drawPipStatus(title, detail) {
    resizePipCanvas();
    pipCtx.save();
    pipCtx.setTransform(1, 0, 0, 1, 0, 0);
    pipCtx.fillStyle = '#061718';
    pipCtx.fillRect(0, 0, pipCanvas.width, pipCanvas.height);
    pipCtx.fillStyle = '#e8ffff';
    pipCtx.font = '20px "PixelGame", Arial';
    pipCtx.textAlign = 'center';
    pipCtx.fillText(title, pipCanvas.width / 2, pipCanvas.height / 2 - 12);
    pipCtx.font = '13px Arial';
    pipCtx.fillText(detail, pipCanvas.width / 2, pipCanvas.height / 2 + 18);
    pipCtx.restore();
}

function getPalmSize(hand) {
    return Math.max(0.001, Math.hypot(hand[0].x - hand[9].x, hand[0].y - hand[9].y));
}

function isThumbExtended(hand) {
    const palmSize = getPalmSize(hand);
    const thumbTipToPalm = Math.hypot(hand[4].x - hand[9].x, hand[4].y - hand[9].y);
    const thumbTipToIndexBase = Math.hypot(hand[4].x - hand[5].x, hand[4].y - hand[5].y);
    return (thumbTipToPalm / palmSize) > 0.65 || (thumbTipToIndexBase / palmSize) > 0.45;
}

function getThumbVector(hand) {
    const base = hand[2];
    const tip = hand[4];
    const dx = tip.x - base.x;
    const dy = tip.y - base.y;
    const length = Math.max(0.001, Math.hypot(dx, dy));
    return { dx: dx / length, dy: dy / length, length };
}

function applySingleHandGesture(hand) {
    const thumb = getThumbVector(hand);
    const extended = isThumbExtended(hand);
    const thumbPointsUp = thumb.dy < -0.15;
    const thumbPointsDown = thumb.dy > 0.5;
    const palmTilt = (hand[0].x - hand[9].x) / getPalmSize(hand);

    normalizedSteering = clamp(extended ? thumb.dx / 0.75 : -palmTilt / 0.8, -1, 1);

    if (extended && thumbPointsUp) actionState = "ACCELERATE";
    else if (extended && thumbPointsDown) actionState = "BRAKE";
    else actionState = "COAST";

    handDebug.thumb = {
        extended,
        dx: thumb.dx,
        dy: thumb.dy
    };
}

function applyDualHandGesture(hands) {
    const hand1 = hands[0];
    const hand2 = hands[1];
    const leftHand = hand1[0].x < hand2[0].x ? hand1 : hand2;
    const rightHand = hand1[0].x < hand2[0].x ? hand2 : hand1;

    const angle = Math.atan2(rightHand[0].y - leftHand[0].y, rightHand[0].x - leftHand[0].x);
    normalizedSteering = clamp(angle / 0.55, -1, 1);

    const leftThumb = getThumbVector(leftHand);
    const rightThumb = getThumbVector(rightHand);
    const leftThumbDown = isThumbExtended(leftHand) && leftThumb.dy > 0.5;
    const rightThumbDown = isThumbExtended(rightHand) && rightThumb.dy > 0.5;
    actionState = leftThumbDown || rightThumbDown ? "BRAKE" : "ACCELERATE";

    handDebug.thumb = {
        extended: isThumbExtended(leftHand) || isThumbExtended(rightHand),
        dx: (leftThumb.dx + rightThumb.dx) / 2,
        dy: (leftThumb.dy + rightThumb.dy) / 2
    };
}

function startRaceFromGesture() {
    if (actionState === "ACCELERATE") startUiTransition();
}

function sanitizePlayerName(name, fallback = 'CAPT') {
    return String(name || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 10) || fallback;
}

function normalizeTopScores(scores) {
    return scores
        .map((entry) => {
            if (typeof entry === 'number') return { name: '---', score: Math.floor(entry) };
            return {
                name: entry.name === '---' ? '---' : sanitizePlayerName(entry.name || '---'),
                score: Math.floor(Number(entry.score) || 0)
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
}

function saveTopScores() {
    try {
        localStorage.setItem('hormuzEscapeTopScores', JSON.stringify(topScores));
    } catch (err) {
        console.warn("Could not save local top scores:", err);
    }
}

function loadTopScores() {
    try {
        const saved = JSON.parse(localStorage.getItem('hormuzEscapeTopScores') || '[]');
        if (Array.isArray(saved) && saved.length) topScores = normalizeTopScores(saved);
    } catch (err) {
        console.warn("Could not load local top scores:", err);
    }
    highScore = Math.max(highScore, topScores[0]?.score || 0);
}

async function fetchGlobalScores() {
    try {
        const response = await fetch(`${leaderboardApiBase}/api/scores`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const scores = await response.json();

        if (Array.isArray(scores)) {
            topScores = normalizeTopScores(scores);
            saveTopScores();
            highScore = Math.max(highScore, topScores[0]?.score || 0);
        }
    } catch (err) {
        console.warn("Could not fetch global scores, using local scores:", err);
    }
}

async function submitGlobalScore(name, scoreValue) {
    try {
        const response = await fetch(`${leaderboardApiBase}/api/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score: scoreValue, submissionId: scoreSubmissionId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const scores = await response.json();

        if (Array.isArray(scores)) {
            topScores = normalizeTopScores(scores);
            saveTopScores();
            highScore = Math.max(highScore, topScores[0]?.score || 0);
        }
    } catch (err) {
        console.warn("Could not submit global score, saving locally:", err);
        topScores = normalizeTopScores([...topScores, { name, score: scoreValue }]);
        saveTopScores();
        highScore = Math.max(highScore, topScores[0]?.score || 0);
    }
}

function showScoreNameInput() {
    if (!scoreNameInput || !scoreEntryRect) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    scoreNameInput.style.display = 'block';
    scoreNameInput.style.left = `${rect.left + scoreEntryRect.x * scaleX}px`;
    scoreNameInput.style.top = `${rect.top + scoreEntryRect.y * scaleY}px`;
    scoreNameInput.style.width = `${scoreEntryRect.w * scaleX}px`;
    scoreNameInput.style.height = `${scoreEntryRect.h * scaleY}px`;
    scoreNameInput.style.fontSize = `${Math.max(26, scoreEntryRect.h * scaleY * 0.74)}px`;

    if (document.activeElement !== scoreNameInput) scoreNameInput.focus({ preventScroll: true });
}

function hideScoreNameInput() {
    if (!scoreNameInput) return;
    scoreNameInput.style.display = 'none';
    scoreNameInput.blur();
}

function beginScoreEntry(finalScore) {
    scoreEntryActive = true;
    scoreEntrySaved = false;
    scoreEntrySubmitting = false;
    scoreSubmissionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    lastHighScoreValue = finalScore;
    lastHighScoreName = getAutoScoreName();
    if (scoreNameInput) {
        scoreNameInput.value = lastHighScoreName;
        setTimeout(() => scoreNameInput.focus({ preventScroll: true }), 60);
    }
}

async function saveScoreEntry() {
    if (!scoreEntryActive || scoreEntrySaved || scoreEntrySubmitting) return;

    lastHighScoreName = sanitizePlayerName(scoreNameInput ? scoreNameInput.value : lastHighScoreName);
    scoreEntrySubmitting = true;
    await submitGlobalScore(lastHighScoreName, lastHighScoreValue);
    scoreEntryActive = false;
    scoreEntrySaved = true;
    scoreEntrySubmitting = false;
    gameOverCanContinueAt = Date.now() + 1500;
    hideScoreNameInput();
}

function recordTopScore() {
    const finalScore = Math.floor(score);
    const lowestTopScore = topScores[2]?.score || 0;
    lastRunWasTopScore = finalScore > 0 && finalScore > lowestTopScore;
    lastHighScoreValue = finalScore;
    lastHighScoreName = '---';
    gameOverCanContinueAt = Date.now() + 1500;

    if (lastRunWasTopScore) {
        beginScoreEntry(finalScore);
    } else {
        scoreEntrySubmitting = false;
        scoreSubmissionId = "";
        hideScoreNameInput();
    }

    highScore = Math.max(highScore, finalScore, topScores[0]?.score || 0);
}

function getDifficulty() {
    const settings = difficultySettings[difficultyMode];
    return clamp(1 + difficultyProgress, 1, settings.maxLevel);
}

function getScoreMultiplier() {
    return scoreMultipliers[difficultyMode] || 1;
}

function updateDifficultyProgress(speedRatio) {
    const settings = difficultySettings[difficultyMode];

    if (gameState !== 'PLAYING' || isCrashed) return;

    const mobileFactor = getMobileDifficultyFactor();
    if (actionState === "ACCELERATE" && speedRatio > 0.18) {
        difficultyProgress += settings.gain * mobileFactor * (0.45 + speedRatio);
    } else {
        difficultyProgress -= settings.decay * (0.65 + (1 - speedRatio));
    }

    difficultyProgress = clamp(difficultyProgress, 0, settings.maxLevel - 1);

    if (difficultyMode === 'NORMAL' && difficultyProgress >= settings.maxLevel - 1) {
        difficultyMode = 'HARD';
        difficultyProgress = 0;
    } else if (difficultyMode === 'HARD' && difficultyProgress <= 0 && actionState !== "ACCELERATE") {
        difficultyMode = 'NORMAL';
        difficultyProgress = difficultySettings.NORMAL.maxLevel - 1;
    }
}

function getDifficultyLevel() {
    return Math.max(1, Math.min(difficultySettings[difficultyMode].maxLevel, Math.floor(difficulty)));
}

function chooseObstacleType() {
    const level = getDifficultyLevel();
    const roll = Math.random();

    if (level >= 4) return roll < 0.45 ? 'mine' : 'enemyBoat';
    if (level >= 3) return roll < 0.52 ? 'mine' : 'enemyBoat';
    if (level >= 2) return roll < 0.58 ? 'mine' : 'enemyBoat';
    return roll < 0.65 ? 'mine' : 'enemyBoat';
}

function choosePickupType() {
    if (Math.random() < 0.55) return 'boostPowerup';
    return 'ceaseFirePowerup';
}

function getActiveHazardCount() {
    return obstacles.filter((obs) => obs.type !== 'buoy' && !obs.dead).length;
}

function getActivePickupCount() {
    return obstacles.filter((obs) => (obs.type === 'boostPowerup' || obs.type === 'ceaseFirePowerup') && !obs.dead).length;
}

function getHazardLimit() {
    const speedRatio = clamp(speed / maxSpeed, 0, 1);
    const mobilePenalty = isMobileView() ? -2 : 0;
    if (difficultyMode === 'HARD') return Math.max(5, (speedRatio < 0.35 ? 7 : 10) + mobilePenalty);
    if (difficultyMode === 'NORMAL') return Math.max(4, (speedRatio < 0.35 ? 6 : 9) + mobilePenalty);
    return Math.max(3, (speedRatio < 0.35 ? 5 : 7) + mobilePenalty);
}

function getSpawnCount() {
    const level = getDifficultyLevel();
    const roll = Math.random();
    const speedRatio = clamp(speed / maxSpeed, 0, 1);

    if (difficultyMode === 'HARD') {
        if (speedRatio < 0.35) return 1;
        if (level >= 8) return roll < 0.10 ? 3 : 2;
        if (level >= 5) return roll < 0.82 ? 2 : 1;
        if (level >= 3) return roll < 0.58 ? 2 : 1;
        return roll < 0.38 ? 2 : 1;
    }

    if (difficultyMode === 'NORMAL') {
        if (speedRatio < 0.35) return 1;
        if (level >= 6) return roll < 0.10 ? 3 : 2;
        if (level >= 4) return roll < 0.62 ? 2 : 1;
        if (level >= 2) return roll < 0.36 ? 2 : 1;
        return 1;
    }

    if (speedRatio < 0.35) return 1;
    if (level >= 5) return roll < 0.25 ? 3 : 2;
    if (level >= 4) return roll < 0.12 ? 3 : 2;
    if (level >= 3) return roll < 0.50 ? 2 : 1;
    if (level >= 2) return roll < 0.22 ? 2 : 1;
    return 1;
}

function randomTrackX(forceEdge = false) {
    if (forceEdge) {
        const leftEdge = -1120 + Math.random() * 260;
        const rightEdge = 860 + Math.random() * 260;
        return Math.random() < 0.5 ? leftEdge : rightEdge;
    }

    return -1080 + Math.random() * 2160;
}

function isSpawnXClear(x, spawnZ, selected) {
    if (selected.some((existingX) => Math.abs(existingX - x) < 360)) return false;

    return !obstacles.some((obs) => {
        if (obs.type === 'buoy' || obs.dead) return false;
        return Math.abs(obs.x - x) < 320 && Math.abs(obs.z - spawnZ) < 900;
    });
}

function chooseSpawnPositions(count, spawnZ, forceEdgeMine = false) {
    const selected = [];
    const maxSpawnCount = difficultyMode === 'HARD' ? Math.min(count, 3) : Math.min(count, 2);
    const safeCorridorWidth = 460;

    if (forceEdgeMine) {
        selected.push(randomTrackX(true));
    }

    for (let tries = 0; tries < 24 && selected.length < maxSpawnCount; tries++) {
        const candidate = randomTrackX();
        const wouldLeaveGap = selected.length < 2 || selected.some((x) => Math.abs(x - candidate) > safeCorridorWidth);
        if (wouldLeaveGap && isSpawnXClear(candidate, spawnZ, selected)) selected.push(candidate);
    }

    while (selected.length < maxSpawnCount) {
        const fallback = randomTrackX();
        if (!selected.some((x) => Math.abs(x - fallback) < 300)) selected.push(fallback);
        else break;
    }

    return selected
        .sort((a, b) => a - b)
        .filter((x, index, sorted) => {
            if (sorted.length < 3) return true;
            const leftGap = index === 0 ? Infinity : x - sorted[index - 1];
            const rightGap = index === sorted.length - 1 ? Infinity : sorted[index + 1] - x;
            return Math.max(leftGap, rightGap) >= safeCorridorWidth;
        })
        .slice(0, maxSpawnCount);
}

function resolveObstacleSpacing() {
    const dynamicObstacles = obstacles
        .filter((obs) => obs.type !== 'buoy' && !obs.dead)
        .sort((a, b) => a.z - b.z);

    for (let i = 0; i < dynamicObstacles.length; i++) {
        for (let j = i + 1; j < dynamicObstacles.length; j++) {
            const near = dynamicObstacles[i];
            const far = dynamicObstacles[j];
            if (Math.abs(near.x - far.x) > 120) continue;

            const minGap = near.type === 'enemyBoat' || far.type === 'enemyBoat' ? 440 : 330;
            if (far.z - near.z < minGap) {
                far.z = near.z + minGap;
            }
        }
    }
}

function getPipViewport() {
    return {
        x: pipCanvas.width * 0.09,
        y: pipCanvas.height * 0.18,
        w: pipCanvas.width * 0.82,
        h: pipCanvas.height * 0.63
    };
}

function drawHandSkeleton(landmarks, viewport) {
    const toCanvasPoint = (point) => ({
        x: viewport.x + point.x * viewport.w,
        y: viewport.y + point.y * viewport.h
    });

    if (typeof window.HAND_CONNECTIONS !== 'undefined') {
        pipCtx.strokeStyle = '#ffb22e';
        pipCtx.lineWidth = Math.max(2, pipCanvas.width * 0.008);
        pipCtx.lineCap = 'round';
        pipCtx.lineJoin = 'round';

        for (const [start, end] of window.HAND_CONNECTIONS) {
            const a = toCanvasPoint(landmarks[start]);
            const b = toCanvasPoint(landmarks[end]);
            pipCtx.beginPath();
            pipCtx.moveTo(a.x, a.y);
            pipCtx.lineTo(b.x, b.y);
            pipCtx.stroke();
        }
    }

    const radius = Math.max(3, pipCanvas.width * 0.014);
    for (const [index, landmark] of landmarks.entries()) {
        const point = toCanvasPoint(landmark);
        pipCtx.beginPath();
        pipCtx.arc(point.x, point.y, index === 4 ? radius * 1.25 : radius, 0, Math.PI * 2);
        pipCtx.fillStyle = index === 4 ? '#ff3b2f' : '#f24f1f';
        pipCtx.fill();
        pipCtx.lineWidth = Math.max(1, pipCanvas.width * 0.003);
        pipCtx.strokeStyle = '#3d1a0b';
        pipCtx.stroke();
    }
}

function drawPipDebug() {
    const lines = [
        `MODE ${controlMode.replace('_', ' ')}`,
        `HANDS ${handDebug.hands} ${handDebug.status}`,
        `ACTION ${actionState}`,
        `STEER ${normalizedSteering.toFixed(2)}`
    ];

    if (handDebug.thumb) {
        lines.push(`THUMB ${handDebug.thumb.extended ? 'ON' : 'OFF'} ${handDebug.thumb.dx.toFixed(2)},${handDebug.thumb.dy.toFixed(2)}`);
    }

    pipCtx.save();
    pipCtx.setTransform(1, 0, 0, 1, 0, 0);
    pipCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    pipCtx.fillRect(8, 8, 148, 78);
    pipCtx.fillStyle = '#e8ffff';
    pipCtx.font = '10px Arial';
    pipCtx.textAlign = 'left';
    lines.forEach((line, index) => {
        pipCtx.fillText(line, 14, 22 + index * 13);
    });
    pipCtx.restore();
}

function drawPipFrameFromVideo() {
    if (!isHandControlMode()) return;

    resizePipCanvas();
    pipContainer.style.display = 'block';
    pipCtx.save();
    pipCtx.clearRect(0, 0, pipCanvas.width, pipCanvas.height);
    const viewport = getPipViewport();

    if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        pipCtx.save();
        pipCtx.beginPath();
        pipCtx.rect(viewport.x, viewport.y, viewport.w, viewport.h);
        pipCtx.clip();
        pipCtx.translate(viewport.x + viewport.w, viewport.y);
        pipCtx.scale(-1, 1);
        pipCtx.drawImage(videoElement, 0, 0, viewport.w, viewport.h);
        pipCtx.restore();

        if (latestHandLandmarks.length > 0) {
            pipCtx.save();
            pipCtx.beginPath();
            pipCtx.rect(viewport.x, viewport.y, viewport.w, viewport.h);
            pipCtx.clip();
            for (const landmarks of latestHandLandmarks) {
                drawHandSkeleton(landmarks, viewport);
            }
            pipCtx.restore();
        }

    } else {
        pipCtx.fillStyle = '#061718';
        pipCtx.fillRect(viewport.x, viewport.y, viewport.w, viewport.h);
    }

    if (cameraError) {
        pipCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        pipCtx.fillRect(0, 0, pipCanvas.width, pipCanvas.height);
        pipCtx.fillStyle = '#ff5b5b';
        pipCtx.font = '20px "PixelGame", Arial';
        pipCtx.textAlign = 'center';
        pipCtx.fillText("CAMERA ERROR", pipCanvas.width / 2, pipCanvas.height / 2 - 10);
        pipCtx.fillStyle = '#ffffff';
        pipCtx.font = '12px Arial';
        pipCtx.fillText(cameraError, pipCanvas.width / 2, pipCanvas.height / 2 + 18);
    }

    if (showPipDebug && !cameraError && videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        drawPipDebug();
    }

    pipCtx.restore();
}

let hands = null;
if (typeof window.Hands !== 'undefined') {
    hands = new window.Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        maxNumHands: 2,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
    });

    hands.onResults((results) => {
        if (!isHandControlMode()) {
            pipContainer.style.display = 'none';
            return;
        }

        latestHandLandmarks = results.multiHandLandmarks || [];
        handDebug.hands = latestHandLandmarks.length;
        handDebug.status = latestHandLandmarks.length > 0 ? 'tracking' : 'no hand';
        handDebug.thumb = null;
        normalizedSteering = 0;
        actionState = "COAST";

        if (controlMode === 'DUAL_HAND' && latestHandLandmarks.length === 2) {
            applyDualHandGesture(latestHandLandmarks);
        } else if (controlMode === 'DUAL_HAND' && latestHandLandmarks.length === 1) {
            applySingleHandGesture(latestHandLandmarks[0]);
        } else if (controlMode === 'SINGLE_HAND' && latestHandLandmarks.length > 0) {
            applySingleHandGesture(latestHandLandmarks[0]);
        }

        startRaceFromGesture();
    });
} else {
    drawPipStatus("HAND TRACKING OFF", "MediaPipe did not load");
}

function startPipRenderLoop() {
    if (pipRenderLoopStarted) return;
    pipRenderLoopStarted = true;

    requestAnimationFrame(function renderPip() {
        if (isHandControlMode()) drawPipFrameFromVideo();
        requestAnimationFrame(renderPip);
    });
}

function startMediaPipeLoop() {
    if (!hands) {
        handDebug.status = 'no mediapipe';
        return;
    }
    if (handTrackingLoopStarted) return;
    handTrackingLoopStarted = true;
    handDebug.status = 'detecting';

    async function trackHands() {
        if (isHandControlMode() && videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !handProcessing) {
            handProcessing = true;
            try {
                if (latestHandLandmarks.length === 0) handDebug.status = 'detecting';
                await hands.send({ image: videoElement });
            } catch (err) {
                console.error("MediaPipe hand tracking failed:", err);
                handDebug.status = 'tracking error';
            } finally {
                handProcessing = false;
            }
        }

        setTimeout(trackHands, 66);
    }

    trackHands();
}

async function startHandCamera() {
    if (cameraStarted) return;
    cameraStarted = true;
    cameraError = "";
    drawPipStatus("CAMERA STARTING", "Allow webcam access");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        videoElement.srcObject = stream;
        await videoElement.play();
        cameraError = "";
        startPipRenderLoop();
        startMediaPipeLoop();
    } catch (err) {
        console.error("Camera failed to start:", err);
        cameraStarted = false;
        cameraError = "Allow webcam access";
        drawPipFrameFromVideo();
    }
}

// ==========================================
// 5. THE RENDERER
// ==========================================
let lastTime = 0;
const targetFPS = 34;
const frameInterval = 2000 / targetFPS; // approx 41.6ms

function renderDesign(timestamp) {
    // Keep re-drawing for instant updates
    requestAnimationFrame(renderDesign);

    if (!areCriticalAssetsReady()) {
        drawLoadingScreen(timestamp || Date.now());
        return;
    }

    // --- RETRO FRAME RATE SIMULATION ---
    if (!timestamp) timestamp = performance.now();
    let deltaTime = timestamp - lastTime;

    if (deltaTime < frameInterval) {
        return; // Skip drawing this frame to simulate "jerky" retro arcade look
    }

    // Update lastTime but keep remainder to avoid drifting
    lastTime = timestamp - (deltaTime % frameInterval);

    // Current time for wave bobbing math
    let currentTime = Date.now();
    const mobileView = isMobileView();

    // Update horizon in case of resize
    horizonY = canvas.height / 2.5;

    // --- CLEAR CANVAS TO PREVENT SMEARING ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.78;
        if (screenShake < 0.4) screenShake = 0;
    }

    // --- GAME STATE & PHYSICS UPDATE ---
    let minSpeed = 5;
    let preUpdateMaxSpeed = maxSpeed + difficultyProgress * 5;
    let speedRatio = clamp(speed / preUpdateMaxSpeed, 0, 1);
    updateDifficultyProgress(speedRatio);
    difficulty = getDifficulty();
    const currentMaxSpeed = maxSpeed + (difficulty - 1) * 5;

    if (gameState === 'START' || gameState === 'GAMEOVER' || isCrashed) {
        // Zero speed during UI screens or while crashed
        speed = 0;
        actionState = "COAST"; // Reset action
    } else if (gameState === 'PAUSED') {
        speed = 0;
        actionState = "COAST";
    } else {
        // Evaluate Acceleration
        if (actionState === "ACCELERATE") {
            speed += boostTimer > 0 ? acceleration * 2.4 : acceleration;
            if (speed > currentMaxSpeed + (boostTimer > 0 ? 25 : 0)) speed = currentMaxSpeed + (boostTimer > 0 ? 25 : 0);
        } else if (actionState === "BRAKE") {
            speed -= friction * 3; // Rapid decrease for braking
            if (speed < minSpeed) speed = minSpeed;
        } else {
            speed -= friction;
            // Coasting decays to minSpeed
            if (speed < minSpeed) speed = minSpeed;
        }

        // Update Score only when playing and moving
        score += speed * 0.01 * getScoreMultiplier();
        if (score > highScore) highScore = score;
    }

    // --- STEERING UPDATE ---
    // Apply Normalized Steering
    if (normalizedSteering !== 0) {
        let steeringSensitivity = controlMode === 'TOUCH' ? 38 : 34;
        if (boostTimer > 0) steeringSensitivity += 4;
        playerX += normalizedSteering * steeringSensitivity;
    }

    // Constrain playerX to not pass the buoys
    if (playerX < leftBorderX + 150) playerX = leftBorderX + 150;
    if (playerX > rightBorderX - 150) playerX = rightBorderX - 150;

    // --- DRAW SKY ---
    const skyImage = mobileView && images.skyMobile && images.skyMobile.complete && images.skyMobile.naturalHeight !== 0
        ? images.skyMobile
        : images.sky;

    if (skyImage.complete && skyImage.naturalHeight !== 0) {
        drawImageCover(skyImage, 0, 0, canvas.width, horizonY, 1);
    } else {
        ctx.fillStyle = '#ECA95A';
        ctx.fillRect(0, 0, canvas.width, horizonY);
    }

    // --- DRAW WATER (Raster Scanline Mode 7) ---
    ctx.fillStyle = '#2A7FCC';
    ctx.fillRect(0, horizonY, canvas.width, canvas.height);

    if (images.water.complete && images.water.naturalHeight !== 0) {
        // Original perspective scanline mapping. This gives the stronger arcade depth you preferred.
        let waterSpeedMultiplier = 0.1;
        waterOffset += speed * waterSpeedMultiplier;

        let wHeight = images.water.naturalHeight;
        let wWidth = images.water.naturalWidth;

        for (let y = Math.floor(horizonY); y < canvas.height; y += 2) {
            let dy = y - horizonY;
            if (dy < 1) dy = 1;

            let z = (cameraHeight * 150) / dy;
            let sy = Math.floor(z + waterOffset) % wHeight;

            if (sy < 0) sy += wHeight;

            ctx.drawImage(
                images.water,
                0, sy, wWidth, 1,
                0, y, canvas.width, 2
            );
        }
    }

    // --- PROCEDURAL SPAWNING ---
    if (gameState === 'PLAYING') {
        const speedRatio = clamp(speed / currentMaxSpeed, 0, 1);
        const spawnThrottle = clamp((speedRatio - 0.18) / 0.82, 0, 1);

        if (isCrashed || speedRatio < 0.18) {
            spawnTimer = Math.max(spawnTimer, 18);
        } else {
            spawnTimer -= 0.35 + spawnThrottle * 0.95;
        }

        if (spawnTimer <= 0) {
            let activeHazards = getActiveHazardCount();
            if (activeHazards >= getHazardLimit()) {
                spawnTimer = 18;
            } else {
                let spawnZ = 3200 + Math.random() * 400;
                let edgeMine = Math.random() < (difficultyMode === 'HARD' ? 0.34 : difficultyMode === 'NORMAL' ? 0.22 : 0.14);
                let spawnCount = Math.min(getSpawnCount() + (edgeMine ? 1 : 0), getHazardLimit() - activeHazards);
                let spawnPositions = chooseSpawnPositions(spawnCount, spawnZ, edgeMine);

                spawnPositions.forEach((chosenX, index) => {
                    let chosenType = edgeMine && index === 0 ? 'mine' : chooseObstacleType();
                    let w = chosenType === 'mine' ? 180 : 250;
                    let h = chosenType === 'mine' ? 180 : 280;
                    let stagger = difficultyMode === 'HARD' ? 160 + Math.random() * 140 : 240 + Math.random() * 160;

                    obstacles.push({
                        type: chosenType,
                        x: chosenX,
                        z: spawnZ + index * stagger,
                        width: w,
                        height: h,
                        drift: chosenType === 'enemyBoat' ? (0.006 + difficulty * 0.0015) : 0
                    });
                });

                const settings = difficultySettings[difficultyMode];
                const speedSpawnBonus = 14 * (1 - spawnThrottle);
                spawnTimer = Math.max(settings.minSpawnTimer + speedSpawnBonus, settings.spawnBase - difficulty * 7.5 + speedSpawnBonus + Math.random() * 22);
            }
        }

        if (getActivePickupCount() < 2 && Math.random() < 0.006 + (speedRatio * 0.004)) {
            const type = choosePickupType();
            obstacles.push({
                type,
                x: randomTrackX(),
                z: 3000 + Math.random() * 700,
                width: 130,
                height: 130
            });
        }
    }

    // --- DRAW OBSTACLES ---
    resolveObstacleSpacing();
    obstacles.sort((a, b) => b.z - a.z); // Furthest away drawn first

    if (boostTimer > 0) boostTimer--;
    if (ceaseFireTimer > 0) ceaseFireTimer--;

    obstacles.forEach(obs => {
        if (obs.dead) return;

        // --- MOVE THE WORLD ---
        obs.z -= speed;

        // Relative enemy movement: Enemies move forward independently
        if (obs.type === 'enemyBoat') {
            obs.z -= (4 + difficulty * 2.1) * difficultySettings[difficultyMode].enemyBoost;
            obs.x += (playerX - obs.x) * (obs.drift || 0);
        }

        // --- COLLISION DETECTION ---
        if (obs.type === 'boostPowerup' || obs.type === 'ceaseFirePowerup') {
            if (obs.z < 230 && obs.z > 16 && Math.abs(obs.x - playerX) < 170) {
                if (obs.type === 'boostPowerup') {
                    boostTimer = targetFPS * 5;
                    speed = Math.min(currentMaxSpeed + 25, speed + 25);
                } else {
                    ceaseFireTimer = targetFPS * 5;
                }
                playPowerupSound();
                obs.dead = true;
            }
        }

        if (obs.type === 'mine' || obs.type === 'enemyBoat') {
            // Danger Zone: Object is very close to the camera
            if (obs.z < 210 && obs.z > 18) {
                let hitRadius = obs.type === 'enemyBoat' ? 180 : 135;
                if (Math.abs(obs.x - playerX) < hitRadius) {
                    if (ceaseFireTimer > 0) {
                        obs.dead = true;
                        return;
                    }

                    speed = 0; // The Crash Penalty
                    isCrashed = true;
                    crashTimer = 18; // Flash duration in frames
                    screenShake = 12;
                    playCrashSound();

                    // Deduct life and reset the specific obstacle
                    lives -= 1;
                    obs.dead = true;

                    // Complete game reset if out of lives
                    if (lives <= 0 && gameState === 'PLAYING') {
                        gameState = 'GAMEOVER';
                        recordTopScore();
                    }
                }
            }
        }

        // Cleanup or Recycle objects behind camera
        if (obs.z < 15) {
            if (obs.type === 'buoy') {
                obs.z += maxBuoyZ; // Endless track borders
            } else {
                obs.dead = true; // Mark for removal
            }
        }

        let scale = fov / (fov + obs.z);
        // Offset obstacle's X by playerX to create the illusion of steering
        let screenX = (canvas.width / 2) + ((obs.x - playerX) * scale);

        // Ocean Wave Bobbing (Asynchronous per object based on coordinates)
        let bobbingOffset = Math.sin(currentTime * 0.002 + obs.x * 0.05 + obs.z * 0.02) * 1;
        let screenY = horizonY + (cameraHeight * scale) + bobbingOffset;

        let drawWidth = obs.width * scale;
        let drawHeight = obs.height * scale;

        let img;
        if (obs.type === 'mine') {
            img = images.mine;
        } else if (obs.type === 'boostPowerup') {
            img = images.boostPowerup;
        } else if (obs.type === 'ceaseFirePowerup') {
            img = images.ceaseFirePowerup;
        } else if (obs.type === 'enemyBoat') {
            // Automatically pick the right sprite based on the lane!
            if (obs.x < -100) img = images.enemyBoatLeft;
            else if (obs.x > 100) img = images.enemyBoatRight;
            else img = images.enemyBoatCenter;
        } else if (obs.type === 'buoy') {
            img = images.buoy;
        }

        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, screenX - (drawWidth / 2), screenY - drawHeight, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = obs.type === 'mine' ? 'red' : (obs.type === 'buoy' ? 'orange' : 'gray');
            ctx.fillRect(screenX - (drawWidth / 2), screenY - drawHeight, drawWidth, drawHeight);
        }
    });

    // --- DRAW PLAYER BOAT ---
    // [HOW TO EDIT]: Change these variables to resize and move your player boat.
    let basePlayerWidth = mobileView ? 140 : 200;   // The width of the player boat
    let basePlayerHeight = mobileView ? 175 : 250;  // The height of the player boat

    // Y-Offset: Negative numbers move it UP the screen. Positive numbers move it DOWN.
    // For example, changing to -100 will lift the boat 100 pixels up.
    let playerYOffset = mobileView ? -118 : -35;

    // X-Offset: Negative numbers move it LEFT. Positive numbers move it RIGHT.
    let playerXOffset = 0;

    // --- ACCELERATION JUICE (SURGE EFFECT) ---
    // Calculate a surge factor (0.0 to 1.0) based on current speed
    let surgeFactor = speed / currentMaxSpeed;
    if (boostTimer > 0) surgeFactor = Math.min(1.25, surgeFactor + 0.25);

    // Increase size dynamically by up to 10% based on speed
    let playerWidth = basePlayerWidth * (1 + (0.05 * surgeFactor));
    let playerHeight = basePlayerHeight * (1 + (0.1 * surgeFactor));

    // Calculate drawX to keep perfectly centered with new width
    let drawX = (canvas.width / 2) - (playerWidth / 2) + playerXOffset;

    // Ocean Wave Bobbing for Player
    let playerBobbingOffset = Math.sin(currentTime * 0.003) * 6;

    // Calculate drawY based on the new scaled playerHeight so the bottom edge stays aligned
    let drawY = canvas.height - playerHeight + playerYOffset + playerBobbingOffset;

    // Dynamically pick the player boat sprite based on steering
    let currentPlayerImg = ceaseFireTimer > 0 ? images.playerBoatCease : images.playerBoat;
    if (normalizedSteering < -0.2) currentPlayerImg = ceaseFireTimer > 0 ? images.playerBoatLeftCease : images.playerBoatLeft;
    else if (normalizedSteering > 0.2) currentPlayerImg = ceaseFireTimer > 0 ? images.playerBoatRightCease : images.playerBoatRight;

    const visualTilt = controlMode === 'TILT' ? normalizedSteering * 0.08 : 0;

    if (currentPlayerImg && currentPlayerImg.complete && currentPlayerImg.naturalHeight !== 0) {
        if (visualTilt !== 0) {
            ctx.save();
            ctx.translate(drawX + playerWidth / 2, drawY + playerHeight * 0.62);
            ctx.rotate(visualTilt);
            ctx.drawImage(currentPlayerImg, -playerWidth / 2, -playerHeight * 0.62, playerWidth, playerHeight);
            ctx.restore();
        } else {
            ctx.drawImage(currentPlayerImg, drawX, drawY, playerWidth, playerHeight);
        }
    } else {
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
    }

    if (boostTimer > 0) {
        const boostImg = mobileView ? images.boostLinesMobile : images.boostLines;
        if (boostImg && boostImg.complete && boostImg.naturalHeight !== 0) {
            ctx.save();
            ctx.globalAlpha = 0.75;
            ctx.drawImage(boostImg, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    // --- DRAW UI DIALS ---
    // TWEAK THESE: Base coordinates and sizes for the Dials
    let dialSpeedSize = mobileView ? 116 : 180;
    let dialCompassSize = mobileView ? 82 : 130;

    // TWEAK THIS: Speedometer explicitly anchored to bottom-right corner
    let speedX = canvas.width - (mobileView ? 122 : 185);
    let speedY = canvas.height - (mobileView ? 152 : 190);

    let speedCenterX = speedX + dialSpeedSize / 2;
    let speedCenterY = speedY + dialSpeedSize / 2;

    // Draw Speedometer Dial
    if (images.speedDial && images.speedDial.complete && images.speedDial.naturalHeight !== 0) {
        ctx.drawImage(images.speedDial, speedX, speedY, dialSpeedSize, dialSpeedSize);
    }

    // Draw Speedometer Needle
    if (images.speedNeedle && images.speedNeedle.complete && images.speedNeedle.naturalHeight !== 0) {
        ctx.save();
        ctx.translate(speedCenterX, speedCenterY);
        let minAngle = -Math.PI * 0.9;
        let maxAngle = Math.PI * 0.35;
        let angle = minAngle + (maxAngle - minAngle) * (speed / currentMaxSpeed);
        ctx.rotate(angle);

        // Problem 5: Pointer image is exact same dimension as background meter.
        // Rotate from its center point
        ctx.drawImage(images.speedNeedle, -dialSpeedSize / 2, -dialSpeedSize / 2, dialSpeedSize, dialSpeedSize);
        ctx.restore();
    }

    // TWEAK THIS: Compass explicitly placed relative to the bottom-right corner as well
    let compassX = canvas.width - (mobileView ? 202 : 320); // Next to Speedometer
    let compassY = canvas.height - (mobileView ? 126 : 150);
    let compassCenterX = compassX + dialCompassSize / 2;
    let compassCenterY = compassY + dialCompassSize / 2;

    // Draw Compass Dial
    // Problem 4: The compass shouldn't have a separate needle. Rotate the entire image.
    if (images.compassDial && images.compassDial.complete && images.compassDial.naturalHeight !== 0) {
        ctx.save();
        ctx.translate(compassCenterX, compassCenterY);
        let steeringFactor = normalizedSteering;

        // Tilt the compass based on steering direction
        let compassAngle = (playerX / rightBorderX) * (Math.PI * 0.0) + (steeringFactor * 0.6);
        ctx.rotate(compassAngle);

        ctx.drawImage(images.compassDial, -dialCompassSize / 2, -dialCompassSize / 2, dialCompassSize, dialCompassSize);
        ctx.restore();
    }

    // --- DRAW UI HUD TEXT ---
    ctx.save();

    function drawPixelText(text, x, y, options = {}) {
        const size = options.size || 42;
        ctx.font = `${size}px 'PixelGame'`;
        ctx.textBaseline = options.baseline || "top";
        ctx.textAlign = options.align || "left";

        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.lineWidth = Math.max(5, size * 0.18);
        ctx.strokeStyle = options.outer || '#ffffff';
        ctx.strokeText(text, x, y);

        ctx.lineWidth = Math.max(3, size * 0.12);
        ctx.strokeStyle = options.inner || '#071320';
        ctx.strokeText(text, x, y);

        ctx.fillStyle = options.fill || '#fff7d7';
        ctx.fillText(text, x, y);
    }

    function drawScorePanel(label, value, x, y, align = "left") {
        const labelSize = mobileView ? 20 : 30;
        const valueSize = mobileView ? 34 : 54;
        drawPixelText(label, x, y, { size: labelSize, align, fill: '#ffcf65', outer: '#fff4d0', inner: '#1b1320' });
        drawPixelText(value.toString().padStart(5, '0'), x, y + (mobileView ? 22 : 32), { size: valueSize, align, fill: '#ffffff', outer: '#ffffff', inner: '#08131f' });
    }

    drawScorePanel("SCORE", Math.floor(score), mobileView ? 18 : 30, mobileView ? 20 : 24, "left");

    // Draw Lives Icons (stacked vertically below current score)
    if (images.lifeIcon && images.lifeIcon.complete && images.lifeIcon.naturalHeight !== 0) {
        let lifeWidth = mobileView ? 72 : 96;
        let lifeHeight = mobileView ? 39 : 52;
        let startX = mobileView ? 18 : 30;
        let startY = mobileView ? 78 : 126;
        let spacing = mobileView ? 6 : 8;

        for (let i = 0; i < lives; i++) {
            ctx.drawImage(images.lifeIcon, startX, startY + i * (lifeHeight + spacing), lifeWidth, lifeHeight);
        }
    }

    const rightX = canvas.width - (mobileView ? 18 : 30);
    drawScorePanel("HIGH SCORE", Math.floor(highScore), rightX, mobileView ? 20 : 24, "right");

    drawPixelText("TOP 3", rightX, mobileView ? 90 : 118, { size: mobileView ? 18 : 26, align: "right", fill: '#ffcf65', outer: '#fff4d0', inner: '#1b1320' });
    topScores.forEach((entry, index) => {
        const label = `${index + 1}. ${entry.name} ${Math.floor(entry.score).toString().padStart(5, '0')}`;
        drawPixelText(label, rightX, (mobileView ? 112 : 150) + index * (mobileView ? 20 : 29), { size: mobileView ? 16 : 24, align: "right", fill: '#ffffff', outer: '#ffffff', inner: '#08131f' });
    });
    drawPixelText(`${difficultyMode} ${difficulty.toFixed(1)}`, rightX, mobileView ? 178 : 238, { size: mobileView ? 15 : 20, align: "right", fill: '#ffcf65', outer: '#fff4d0', inner: '#1b1320' });
    drawDifficultyMeter(rightX, mobileView ? 200 : 266, mobileView ? 108 : 150, difficulty);
    drawDifficultyButtons();

    const mute = getMuteButtonLayout();
    const muteImg = isMuted ? images.unmuteButton : images.muteButton;
    if (muteImg && muteImg.complete && muteImg.naturalHeight !== 0) {
        ctx.drawImage(muteImg, mute.x, mute.y, mute.w, mute.h);
    }

    ctx.restore();

    drawGameNamePlate();

    // --- DRAW CONTROL MODE SELECTION UI ---
    const iconLayout = getControlIconLayout();
    let iconW = iconLayout.iconW;
    let singleX = iconLayout.singleX;
    let dualX = iconLayout.dualX;
    let keyX = iconLayout.keyX;
    let iconY = iconLayout.iconY;

    const middleIcon = isTiltSlotMode() ? images.iconMobileTilt : images.iconDualHand;
    if (images.iconSingleHand && images.iconSingleHand.complete) ctx.drawImage(images.iconSingleHand, singleX, iconY, iconW, iconW);
    if (middleIcon && middleIcon.complete) ctx.drawImage(middleIcon, dualX, iconY, iconW, iconW);
    if (images.iconKeyboard && images.iconKeyboard.complete) ctx.drawImage(images.iconKeyboard, keyX, iconY, iconW, iconW);

    if (images.navFrame && images.navFrame.complete) {
        if (controlMode === 'SINGLE_HAND') ctx.drawImage(images.navFrame, singleX, iconY, iconW, iconW);
        else if (controlMode === 'DUAL_HAND' || controlMode === 'TILT') ctx.drawImage(images.navFrame, dualX, iconY, iconW, iconW);
        else if (controlMode === 'KEYBOARD' || controlMode === 'TOUCH') ctx.drawImage(images.navFrame, keyX, iconY, iconW, iconW);
    }

    drawTouchJoystick();

    // Clean up dead obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].dead) obstacles.splice(i, 1);
    }

    // --- DRAW CRASH FLASH ---
    if (isCrashed) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        crashTimer--;
        if (crashTimer <= 0) isCrashed = false;
    }

    // --- STATE UI SCREENS & ANIMATIONS ---
    if (gameState === 'START' || gameState === 'GAMEOVER') {
        let uiImg = gameState === 'START' ? images.startScreen : (lastRunWasTopScore ? images.highScoreScreen : images.gameOverScreen);

        if (uiImg && uiImg.complete && uiImg.naturalHeight !== 0) {
            // Hover bobbing effect
            let hoverOffset = Math.sin(currentTime * 0.005) * 10;

            // Transition animation
            let transitionedToPlaying = false;
            if (uiTransitioning) {
                uiVelocity += 2; // Gravity pulling it UP (since we subtract velocity)
                uiYOffset -= uiVelocity;

                // Once off screen, start the game
                if (uiYOffset < -canvas.height) {
                    uiTransitioning = false;
                    gameState = 'PLAYING';
                    lives = 3;
                    score = 0;
                    lastRunWasTopScore = false;
                    scoreEntryActive = false;
                    scoreEntrySaved = false;
                    scoreEntrySubmitting = false;
                    scoreSubmissionId = "";
                    hideScoreNameInput();
                    difficultyProgress = 0;
                    difficulty = 1;
                    namePlateY = -240;
                    uiYOffset = 0;
                    uiVelocity = 0;

                    // Clear out old obstacles
                    for (let i = obstacles.length - 1; i >= 0; i--) {
                        if (obstacles[i].type !== 'buoy') obstacles.splice(i, 1);
                    }
                    transitionedToPlaying = true;
                }
            } else {
                uiYOffset = 0;
                uiVelocity = 0;
            }

            if (transitionedToPlaying) {
                updateEngineSound();
                ctx.restore();
                return;
            }

            // Scale image nicely for different screens
            const maxUiWidth = mobileView ? canvas.width * 0.88 : canvas.width * 0.5;
            const maxUiHeight = mobileView ? canvas.height * 0.44 : canvas.height * 0.72;
            let scale = Math.min(1.08, maxUiWidth / uiImg.naturalWidth, maxUiHeight / uiImg.naturalHeight);
            let drawWidth = uiImg.naturalWidth * scale;
            let drawHeight = uiImg.naturalHeight * scale;

            let finalX = (canvas.width / 2) - (drawWidth / 2);
            let finalY = (canvas.height / 2) - (drawHeight / 2) + hoverOffset + uiYOffset;
            if (mobileView && gameState === 'GAMEOVER' && lastRunWasTopScore && scoreEntryActive) {
                finalY -= canvas.height * 0.16;
            }

            ctx.drawImage(uiImg, finalX, finalY, drawWidth, drawHeight);

            if (gameState === 'GAMEOVER' && lastRunWasTopScore) {
                const assetX = (ratio) => finalX + drawWidth * ratio;
                const assetY = (ratio) => finalY + drawHeight * ratio;

                // YOUR SCORE POSITION:
                // Edit scoreXRatio and scoreYRatio to move the score number on the high-score PNG.
                // X ratio: smaller moves LEFT, bigger moves RIGHT. 0.50 is exactly centered.
                // Y ratio: smaller moves UP, bigger moves DOWN.
                // Font size: scoreFontScale controls the score number size.
                const scoreXRatio = 0.50;
                const scoreYRatio = 0.475;
                const scoreFontScale = 52;

                // NAME INPUT POSITION:
                // Edit nameBoxXRatio/nameBoxYRatio/nameBoxWRatio/nameBoxHRatio to move/resize the live typing box.
                // The text typed by the player is centered inside this rectangle.
                const nameBoxXRatio = 0.18;
                const nameBoxYRatio = 0.62;
                const nameBoxWRatio = 0.64;
                const nameBoxHRatio = 0.16;

                // SAVED NAME POSITION:
                // Used after the name is saved. X/Y work the same way as YOUR SCORE POSITION.
                const savedNameXRatio = 0.50;
                const savedNameYRatio = 0.68;
                const savedNameFontScale = 86;

                scoreEntryRect = {
                    x: assetX(nameBoxXRatio),
                    y: assetY(nameBoxYRatio),
                    w: drawWidth * nameBoxWRatio,
                    h: drawHeight * nameBoxHRatio
                };
                scoreSaveRect = {
                    x: assetX(0.24),
                    y: assetY(0.84),
                    w: drawWidth * 0.52,
                    h: drawHeight * 0.11
                };

                drawPixelText(lastHighScoreValue.toString().padStart(5, '0'), assetX(scoreXRatio), assetY(scoreYRatio), {
                    size: Math.max(28, Math.floor(scoreFontScale * scale)),
                    align: "center",
                    baseline: "middle",
                    fill: '#fff3c9',
                    outer: '#fff4d0',
                    inner: '#08131f'
                });

                if (scoreEntryActive) {
                    showScoreNameInput();
                } else {
                    hideScoreNameInput();
                    drawPixelText(lastHighScoreName, assetX(savedNameXRatio), assetY(savedNameYRatio), {
                        size: Math.max(36, Math.floor(savedNameFontScale * scale)),
                        align: "center",
                        fill: '#fff7d7',
                        outer: '#071320',
                        inner: '#071320'
                    });
                }
            } else {
                scoreEntryRect = null;
                scoreSaveRect = null;
                hideScoreNameInput();
            }
        }
    }

    updateEngineSound();
    ctx.restore();

    // (requestAnimationFrame moved to the top of renderDesign for frame timing)
}

loadTopScores();
fetchGlobalScores();

// Wait for custom font to load before rendering to prevent default font flash
document.fonts.load('30px "PixelGame"').then(() => {
    renderDesign();
}).catch(() => {
    // Fallback if font fails to load
    renderDesign();
});

