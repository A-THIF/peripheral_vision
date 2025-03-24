// Get URL parameters from start.js
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'training'; // Default to training if not specified
const speed = parseInt(urlParams.get('speed')) || (mode === 'training' ? 500 : 1); // ms for training, Hz for testing
const timeLimit = parseInt(urlParams.get('time_limit')) || 120; // Duration (seconds)
const selectionTimeout = parseInt(urlParams.get('selection_timeout')) || 1200; // Selection Time (ms)
const centralToSelectionGap = parseInt(urlParams.get('central_to_selection_gap')) || 500; // Gap After Central Light (ms)
const selectionToCentralGap = parseInt(urlParams.get('selection_to_central_gap')) || 1000; // Gap After Selection (ms)
const screenSize = parseFloat(urlParams.get('screen_size')) || 19; // Screen size in inches (default to 19)
const viewingDistance = parseFloat(urlParams.get('viewing_distance')) || 47.5; // Viewing distance in cm (default to 47.5)
const deviceType = urlParams.get('device_type') || 'desktop'; // Device type (desktop or laptop, default to desktop)

// Game state
let timeRemaining = timeLimit;
let score = 0;
let totalAttempts = 0;
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
const reportTotal = document.getElementById('reportTotal');
const reportAccuracy = document.getElementById('reportAccuracy');
const header = document.querySelector('.header'); // To update the mode display

const cornerLights = {
    topLeft: topLeftLight,
    topRight: topRightLight,
    bottomLeft: bottomLeftLight,
    bottomRight: bottomRightLight
};

// Update header based on mode
header.textContent = mode === 'training' ? 'Training Mode' : 'Testing Mode';

// Adjust light sizes and positions based on screen size, viewing distance, and device type
function adjustLights() {
    // Use device_type to set DPI (dots per inch)
    const dpi = deviceType === 'desktop' ? 96 : 120; // Typical DPI values: 96 for desktops, 120 for laptops
    const pixelsPerCm = dpi / 2.54; // Convert DPI to pixels per cm

    // Calculate visual angle sizes
    const centralAngle = 2; // Central light: 2 degrees
    const cornerAngle = 1.5; // Corner lights: 1.5 degrees
    const cornerPositionAngle = 30; // Corner lights: 30 degrees from center

    // Size in cm = 2 * viewingDistance * tan(angle/2)
    const centralSizeCm = 2 * viewingDistance * Math.tan((centralAngle / 2) * (Math.PI / 180));
    const cornerSizeCm = 2 * viewingDistance * Math.tan((cornerAngle / 2) * (Math.PI / 180));
    const cornerDistanceCm = viewingDistance * Math.tan(cornerPositionAngle * (Math.PI / 180)); // Distance from center to corner light

    // Convert sizes to pixels
    const centralSizePx = centralSizeCm * pixelsPerCm;
    const cornerSizePx = cornerSizeCm * pixelsPerCm;
    const cornerDistancePx = cornerDistanceCm * pixelsPerCm;

    // Apply sizes to the lights
    centralLight.style.setProperty('--central-size', `${centralSizePx}px`);
    Object.values(cornerLights).forEach(light => {
        light.style.setProperty('--corner-size', `${cornerSizePx}px`);
    });

    // Estimate the screen's physical dimensions in pixels
    const screenDiagonalCm = screenSize * 2.54; // Convert inches to cm
    const screenDiagonalPx = screenDiagonalCm * pixelsPerCm; // Approximate diagonal in pixels

    // Assume a typical aspect ratio (16:9) to estimate width and height
    const aspectRatio = 16 / 9;
    const screenWidthPx = screenDiagonalPx / Math.sqrt(1 + (1 / aspectRatio) ** 2);
    const screenHeightPx = screenWidthPx / aspectRatio;

    // Convert corner distance to vw and vh
    const cornerDistanceVw = (cornerDistancePx / screenWidthPx) * 100; // Convert to vw percentage
    const cornerDistanceVh = (cornerDistancePx / screenHeightPx) * 100; // Convert to vh percentage

    // Calculate the offset from the center (50vw, 50vh) to place the corner lights at 30 degrees
    // Since 30 degrees is roughly at a 45-degree angle in the 2D plane (for simplicity), adjust for top-left, top-right, etc.
    const cornerOffsetVw = 50 - cornerDistanceVw; // Distance from the edge (left or right)
    const cornerOffsetVh = 50 - cornerDistanceVh; // Distance from the edge (top or bottom)

    // Apply positions to the corner lights
    topLeftLight.style.setProperty('--corner-top', `${cornerOffsetVh}vh`);
    topLeftLight.style.setProperty('--corner-left', `${cornerOffsetVw}vw`);
    topRightLight.style.setProperty('--corner-top', `${cornerOffsetVh}vh`);
    topRightLight.style.setProperty('--corner-right', `${cornerOffsetVw}vw`);
    bottomLeftLight.style.setProperty('--corner-bottom', `${cornerOffsetVh}vh`);
    bottomLeftLight.style.setProperty('--corner-left', `${cornerOffsetVw}vw`);
    bottomRightLight.style.setProperty('--corner-bottom', `${cornerOffsetVh}vh`);
    bottomRightLight.style.setProperty('--corner-right', `${cornerOffsetVw}vw`);
}

// Call adjustLights on page load
adjustLights();

// Start the session
startSession();

function startSession() {
    // Initialize displays
    timeRemainingDisplay.textContent = timeRemaining;
    scoreDisplay.textContent = score;
    totalAttemptsDisplay.textContent = totalAttempts;

    // Start the timer
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            timeRemainingDisplay.textContent = timeRemaining;
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

            // If no selection was made, increment attempts and reset
            if (!isPaused) {
                totalAttempts++;
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

        // If no selection was made, increment attempts and reset
        if (!isPaused) {
            totalAttempts++;
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
    reportTotal.textContent = totalAttempts;
    reportAccuracy.textContent = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
}

function restartSession() {
    timeRemaining = timeLimit;
    score = 0;
    totalAttempts = 0;
    isPaused = false;
    trainingPage.style.display = 'flex';
    reportPage.style.display = 'none';
    startSession();
}

function returnToStart() {
    window.location.href = '/';
}