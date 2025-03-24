// Get URL parameters from start.js
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'training';
const speed = parseInt(urlParams.get('speed')) || (mode === 'training' ? 500 : 1);
const timeLimit = parseInt(urlParams.get('time_limit')) || 120;
const selectionTimeout = parseInt(urlParams.get('selection_timeout')) || 1200;
const centralToSelectionGap = parseInt(urlParams.get('central_to_selection_gap')) || 500;
const selectionToCentralGap = parseInt(urlParams.get('selection_to_central_gap')) || 1000;
const screenSize = parseFloat(urlParams.get('screen_size')) || 19;
const viewingDistance = parseFloat(urlParams.get('viewing_distance')) || (screenSize * 1.5 * 2.54);
const deviceType = urlParams.get('device_type') || 'desktop';

// Debug: Log URL parameters
console.log("URL Parameters:", {
    mode,
    speed,
    timeLimit,
    selectionTimeout,
    centralToSelectionGap,
    selectionToCentralGap,
    screenSize,
    viewingDistance,
    deviceType
});
// Game state
let timeRemaining = timeLimit;
let score = 0;
let totalAttempts = 0;
let missed = 0; // Track missed attempts (timeout)
let wrong = 0; // Track wrong selections
let isPaused = false;
let correctLight = null;
let timerInterval = null;
let gameTimeout = null;
let testingInterval = null; // For Testing mode flashing

// Colors for the lights
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00']; // Red, Green, Blue, Yellow

// DOM elements
const centralLight = document.getElementById('centralLight');
const topLeftLight = document.getElementById('topLeftLight');
const topRightLight = document.getElementById('topRightLight');
const bottomLeftLight = document.getElementById('bottomLeftLight');
const bottomRightLight = document.getElementById('bottomRightLight');
const timeRemainingDisplay = document.getElementById('timeRemaining');
const scoreDisplay = document.getElementById('score');
const totalAttemptsDisplay = document.getElementById('totalAttempts');
const pauseModal = document.getElementById('pauseModal');
const endModal = document.getElementById('endModal');
const trainingPage = document.getElementById('trainingPage');
const reportPage = document.getElementById('reportPage');
const reportCorrect = document.getElementById('reportCorrect');
const reportMissed = document.getElementById('reportMissed');
const reportWrong = document.getElementById('reportWrong');
const reportScore = document.getElementById('reportScore');
const reportTotal = document.getElementById('reportTotal');
const reportAccuracy = document.getElementById('reportAccuracy');
const header = document.querySelector('.header'); // To update the mode display

// Speed display
const speedDisplay = document.createElement('div');
speedDisplay.className = 'speed';
speedDisplay.innerHTML = `Speed: ${mode === 'training' ? speed + ' ms' : speed + 'X'}`;
trainingPage.insertBefore(speedDisplay, document.querySelector('.timer'));

const cornerLights = {
    topLeft: topLeftLight,
    topRight: topRightLight,
    bottomLeft: bottomLeftLight,
    bottomRight: bottomRightLight
};

// Update header based on mode
header.textContent = mode === 'training' ? 'Training Mode' : 'Testing Mode';

// Call adjustLights on page load and on window resize
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, calling adjustLights");
    adjustLights();
});
window.addEventListener('resize', () => {
    console.log("Window resized, calling adjustLights");
    adjustLights();
});

function adjustLights() {
    // Validate inputs
    if (isNaN(screenSize) || screenSize <= 0 || isNaN(viewingDistance) || viewingDistance <= 0) {
        console.error("Invalid screen size or viewing distance:", { screenSize, viewingDistance });
        return;
    }

    // Use device_type to set DPI (dots per inch)
    const dpi = deviceType === 'desktop' ? 96 : 120;
    const pixelsPerCm = dpi / 2.54;

    // Calculate visual angle sizes for the lights
    const centralAngle = 2;
    const cornerAngle = 1.5;

    // Size calculations
    const centralSizeCm = 2 * viewingDistance * Math.tan((centralAngle / 2) * (Math.PI / 180));
    const cornerSizeCm = 2 * viewingDistance * Math.tan((cornerAngle / 2) * (Math.PI / 180));
    const centralSizePx = centralSizeCm * pixelsPerCm;
    const cornerSizePx = cornerSizeCm * pixelsPerCm;

    // Apply sizes to the lights
    centralLight.style.setProperty('--central-size', `${centralSizePx}px`);
    Object.values(cornerLights).forEach(light => {
        light.style.setProperty('--corner-size', `${cornerSizePx}px`);
    });

    // Calculate H-FOV
    const diagonalMeters = screenSize * 2.54 / 100;
    const aspectRatioFactor = 16 / Math.sqrt(16 * 16 + 9 * 9);
    const screenWidthMeters = diagonalMeters * aspectRatioFactor;
    const viewingDistanceMeters = viewingDistance / 100;
    const hFovRad = 2 * Math.atan(screenWidthMeters / (2 * viewingDistanceMeters));
    const hFovDeg = hFovRad * (180 / Math.PI);

    console.log(`Calculated H-FOV: ${hFovDeg.toFixed(2)}° for screen size ${screenSize}" at viewing distance ${viewingDistance} cm`);

    // Calculate edge distances
    const distanceToEdgeMeters = viewingDistanceMeters * Math.tan((hFovDeg / 2) * (Math.PI / 180));
    const distanceToEdgeCm = distanceToEdgeMeters * 100;
    const distanceToEdgePx = distanceToEdgeCm * pixelsPerCm;

    // Get viewport dimensions and center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    // Position calculations
    const margin = 20;
    const edgeX = Math.min(distanceToEdgePx, (viewportWidth / 2) - margin - (cornerSizePx / 2));
    const edgeY = Math.min((viewportHeight / 2) - margin - (cornerSizePx / 2), (viewportHeight / 2) - margin);

    // Apply positions to corner lights
    topLeftLight.style.left = `${centerX - edgeX}px`;
    topLeftLight.style.top = `${centerY - edgeY}px`;

    topRightLight.style.right = `${centerX - edgeX}px`;
    topRightLight.style.top = `${centerY - edgeY}px`;

    bottomLeftLight.style.left = `${centerX - edgeX}px`;
    bottomLeftLight.style.bottom = `${centerY - edgeY}px`;

    bottomRightLight.style.right = `${centerX - edgeX}px`;
    bottomRightLight.style.bottom = `${centerY - edgeY}px`;

    // Debug logging
    console.log("Corner light positions:", {
        topLeft: { left: topLeftLight.style.left, top: topLeftLight.style.top },
        topRight: { right: topRightLight.style.right, top: topRightLight.style.top },
        bottomLeft: { left: bottomLeftLight.style.left, bottom: bottomLeftLight.style.bottom },
        bottomRight: { right: bottomRightLight.style.right, bottom: bottomRightLight.style.bottom }
    });
}

// Start the session
startSession();

function startSession() {
    // Initialize displays
    updateTimeDisplay();
    scoreDisplay.textContent = score;
    totalAttemptsDisplay.textContent = totalAttempts;

    // Start the timer
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            updateTimeDisplay();
            if (timeRemaining <= 0) {
                endSession();
            }
        }
    }, 1000);

    // Start the game loop based on mode
    if (mode === 'training') {
        gameLoop();
    } else if (mode === 'testing') {
        gameLoopTesting();
    }

    // Placeholder for eye tracking (future implementation)
    console.log("Eye tracking placeholder: Monitoring eye movement...");
}

function updateTimeDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeRemainingDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function gameLoop() {
    if (isPaused || timeRemaining <= 0) return;

    // Step 1: Show the central light with a random color
    const centralColor = colors[Math.floor(Math.random() * colors.length)];
    centralLight.style.backgroundColor = centralColor;
    hideCornerLights();

    // Step 2: After centralToSelectionGap, show the corner lights
    gameTimeout = setTimeout(() => {
        if (isPaused || timeRemaining <= 0) return;

        // Randomly select one corner light to match the central light
        const cornerKeys = Object.keys(cornerLights);
        correctLight = cornerKeys[Math.floor(Math.random() * cornerKeys.length)];

        // Ensure all corner lights have distinct colors
        const availableColors = [...colors];
        const centralColorIndex = availableColors.indexOf(centralColor);
        availableColors.splice(centralColorIndex, 1); // Remove the central color from available colors

        // Assign the central color to the correct light
        cornerLights[correctLight].style.backgroundColor = centralColor;

        // Assign distinct colors to the other lights
        const otherKeys = cornerKeys.filter(key => key !== correctLight);
        otherKeys.forEach((key, index) => {
            const colorIndex = index % availableColors.length;
            cornerLights[key].style.backgroundColor = availableColors[colorIndex];
            // Remove the used color to ensure distinctness
            availableColors.splice(colorIndex, 1);
        });

        // Show all corner lights
        cornerKeys.forEach(key => {
            cornerLights[key].style.display = 'block';
        });

        // Step 3: Wait for selection or timeout
        gameTimeout = setTimeout(() => {
            if (isPaused || timeRemaining <= 0) return;

            // If no selection was made, increment attempts and missed
            if (!isPaused) {
                totalAttempts++;
                missed++;
                totalAttemptsDisplay.textContent = totalAttempts;
                resetLights();
                setTimeout(gameLoop, selectionToCentralGap); // Gap After Selection
            }
        }, selectionTimeout);
    }, centralToSelectionGap);
}

function gameLoopTesting() {
    if (isPaused || timeRemaining <= 0) return;

    // In Testing mode, speed is in Hz (e.g., 1 Hz = 1 flash per second)
    const flashInterval = 1000 / speed; // Convert Hz to ms (e.g., 1 Hz = 1000 ms)
    const onTime = flashInterval / 2; // Half the time on, half off
    const offTime = flashInterval / 2;

    // Select a random color for the central light
    const centralColor = colors[Math.floor(Math.random() * colors.length)];
    centralLight.style.backgroundColor = centralColor;

    // Select the correct corner light to flash in sync
    const cornerKeys = Object.keys(cornerLights);
    correctLight = cornerKeys[Math.floor(Math.random() * cornerKeys.length)];

    // Flash the central light and corner lights
    let isOn = false;
    testingInterval = setInterval(() => {
        if (isPaused || timeRemaining <= 0) {
            clearInterval(testingInterval);
            resetLights();
            return;
        }

        isOn = !isOn;
        centralLight.style.backgroundColor = isOn ? centralColor : '#ccc';

        // Flash the correct corner light in sync, others out of sync
        cornerKeys.forEach(key => {
            cornerLights[key].style.display = 'block';
            if (key === correctLight) {
                cornerLights[key].style.backgroundColor = isOn ? centralColor : '#ccc';
            } else {
                // Out of sync: flash opposite to the central light
                cornerLights[key].style.backgroundColor = !isOn ? centralColor : '#ccc';
            }
        });
    }, flashInterval / 2); // Toggle twice per cycle (on and off)

    // Wait for selection or timeout
    gameTimeout = setTimeout(() => {
        if (isPaused || timeRemaining <= 0) return;

        // If no selection was made, increment attempts and missed
        if (!isPaused) {
            totalAttempts++;
            missed++;
            totalAttemptsDisplay.textContent = totalAttempts;
            clearInterval(testingInterval);
            resetLights();
            setTimeout(gameLoopTesting, 1000); // Short pause before next round
        }
    }, selectionTimeout);
}

function selectLight(position) {
    if (isPaused || timeRemaining <= 0) return;

    // Clear any existing timeout or interval
    clearTimeout(gameTimeout);
    if (mode === 'testing') {
        clearInterval(testingInterval);
    }

    totalAttempts++;
    const isCorrect = position === correctLight;
    if (isCorrect) {
        score++;
    } else {
        wrong++;
    }
    scoreDisplay.textContent = score;
    totalAttemptsDisplay.textContent = totalAttempts;

    // Provide visual feedback
    const selectedLight = cornerLights[position];
    const correctLightElement = cornerLights[correctLight];

    // Flash the selected light
    selectedLight.style.transition = 'none'; // Disable transition for immediate change
    selectedLight.style.backgroundColor = isCorrect ? '#00ff00' : '#ff0000'; // Green for correct, red for incorrect

    // If incorrect, also flash the correct light green
    if (!isCorrect) {
        correctLightElement.style.transition = 'none';
        correctLightElement.style.backgroundColor = '#00ff00';
    }

    // Reset the colors after a short delay (e.g., 500 ms)
    setTimeout(() => {
        selectedLight.style.transition = 'background-color 0.3s ease';
        if (!isCorrect) {
            correctLightElement.style.transition = 'background-color 0.3s ease';
        }
        resetLights();

        // Proceed to the next round
        if (mode === 'training') {
            setTimeout(gameLoop, selectionToCentralGap); // Gap After Selection
        } else if (mode === 'testing') {
            setTimeout(gameLoopTesting, 1000); // Short pause before next round
        }
    }, 500); // Duration of the feedback flash
}

function hideCornerLights() {
    Object.values(cornerLights).forEach(light => {
        light.style.display = 'none';
        light.style.backgroundColor = '#ccc';
    });
}

function resetLights() {
    centralLight.style.backgroundColor = '#ccc';
    hideCornerLights();
}

function pauseSession() {
    isPaused = true;
    clearTimeout(gameTimeout);
    if (mode === 'testing') {
        clearInterval(testingInterval);
    }
    pauseModal.style.display = 'flex';
}

function resumeSession() {
    isPaused = false;
    pauseModal.style.display = 'none';
    endModal.style.display = 'none';
    if (mode === 'training') {
        gameLoop();
    } else if (mode === 'testing') {
        gameLoopTesting();
    }
}

function showEndModal() {
    isPaused = true;
    clearTimeout(gameTimeout);
    if (mode === 'testing') {
        clearInterval(testingInterval);
    }
    endModal.style.display = 'flex';
}

function endSession() {
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    if (mode === 'testing') {
        clearInterval(testingInterval);
    }
    trainingPage.style.display = 'none';
    pauseModal.style.display = 'none';
    endModal.style.display = 'none';
    reportPage.style.display = 'flex';

    // Display report
    reportCorrect.textContent = score;
    reportMissed.textContent = missed;
    reportWrong.textContent = wrong;
    reportScore.textContent = score;
    reportTotal.textContent = totalAttempts;
    reportAccuracy.textContent = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
}

function restartSession() {
    timeRemaining = timeLimit;
    score = 0;
    totalAttempts = 0;
    missed = 0;
    wrong = 0;
    isPaused = false;
    trainingPage.style.display = 'flex';
    reportPage.style.display = 'none';
    startSession();
}

function returnToStart() {
    window.location.href = '/';
}