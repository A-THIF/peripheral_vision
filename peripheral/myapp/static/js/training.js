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
const resolutionWidth = parseInt(urlParams.get('resolution_width')) || 1920;
const resolutionHeight = parseInt(urlParams.get('resolution_height')) || 1080;

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
    deviceType,
    resolutionWidth,
    resolutionHeight
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
let isSelectionEnabled = true; // Flag to prevent multiple selections

// Colors for the lights
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00']; // Red, Green, Blue, Yellow

// DOM elements
const centralLight = document.getElementById('centralLight');
const topLeftLight = document.getElementById('topLeftLight');
const topRightLight = document.getElementById('topRightLight');
const bottomLeftLight = document.getElementById('bottomLeftLight');
const bottomRightLight = document.getElementById('bottomRightLight');
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

const cornerLights = {
    topLeft: topLeftLight,
    topRight: topRightLight,
    bottomLeft: bottomLeftLight,
    bottomRight: bottomRightLight
};

// Add keydown event listener for the spacebar to toggle pause/resume
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && timeRemaining > 0) {
        event.preventDefault(); // Prevent default spacebar behavior (e.g., scrolling)
        if (!isPaused) {
            // If the game is not paused, pause it
            pauseSessionWithStats();
        } else {
            // If the game is paused, resume it
            resumeSession();
        }
    }
});

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

    // Use device_type to set DPI
    const dpi = deviceType === 'desktop' ? 96 : 120;
    const pixelsPerCm = dpi / 2.54;

    // Calculate visual angle sizes for the lights
    const centralAngle = 2; // Central light: 2 degrees
    const cornerAngle = 1.5; // Corner lights: 1.5 degrees

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

    // Calculate screen dimensions using actual aspect ratio
    const diagonalMeters = screenSize * 0.0254; // Convert inches to meters
    const aspectRatio = resolutionWidth / resolutionHeight;
    const W = diagonalMeters / Math.sqrt(1 + (1 / aspectRatio) ** 2); // Screen width in meters
    const H = W / aspectRatio; // Screen height in meters

    // Convert viewing distance to meters
    const d = viewingDistance / 100; // Convert cm to meters

    // Calculate H-FOV (θ)
    const thetaRad = 2 * Math.atan(W / (2 * d)); // H-FOV in radians
    const thetaDeg = thetaRad * (180 / Math.PI); // H-FOV in degrees

    // Calculate V-FOV (φ)
    const phiRad = 2 * Math.atan(H / (2 * d)); // V-FOV in radians
    const phiDeg = phiRad * (180 / Math.PI); // V-FOV in degrees

    // Calculate x and y distances for corner lights
    const xMeters = d * Math.tan(thetaRad / 2); // Horizontal distance to edge of H-FOV
    const yMeters = d * Math.tan(phiRad / 2); // Vertical distance to edge of V-FOV

    // Convert x and y to pixels using the resolution
    const pixelsPerMeterX = resolutionWidth / W; // Pixels per meter (horizontal)
    const pixelsPerMeterY = resolutionHeight / H; // Pixels per meter (vertical)
    const xPx = xMeters * pixelsPerMeterX; // Convert x to pixels
    const yPx = yMeters * pixelsPerMeterY; // Convert y to pixels

    // Get viewport dimensions and center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    // Position calculations with margins
    const margin = 20;
    const topLeftX = Math.max(margin, centerX - xPx - (cornerSizePx / 2));
    const topLeftY = Math.max(margin, centerY - yPx - (cornerSizePx / 2));
    const topRightX = Math.min(viewportWidth - margin - cornerSizePx, centerX + xPx - (cornerSizePx / 2));
    const topRightY = Math.max(margin, centerY - yPx - (cornerSizePx / 2));
    const bottomLeftX = Math.max(margin, centerX - xPx - (cornerSizePx / 2));
    const bottomLeftY = Math.min(viewportHeight - margin - cornerSizePx, centerY + yPx - (cornerSizePx / 2));
    const bottomRightX = Math.min(viewportWidth - margin - cornerSizePx, centerX + xPx - (cornerSizePx / 2));
    const bottomRightY = Math.min(viewportHeight - margin - cornerSizePx, centerY + yPx - (cornerSizePx / 2));

    // Apply positions to corner lights
    topLeftLight.style.left = `${topLeftX}px`;
    topLeftLight.style.top = `${topLeftY}px`;
    topRightLight.style.right = `${viewportWidth - topRightX - cornerSizePx}px`;
    topRightLight.style.top = `${topRightY}px`;
    bottomLeftLight.style.left = `${bottomLeftX}px`;
    bottomLeftLight.style.bottom = `${viewportHeight - bottomLeftY - cornerSizePx}px`;
    bottomRightLight.style.right = `${viewportWidth - bottomRightX - cornerSizePx}px`;
    bottomRightLight.style.bottom = `${viewportHeight - bottomRightY - cornerSizePx}px`;

    // Debug logging
    console.log(`H-FOV: ${thetaDeg.toFixed(2)} degrees, V-FOV: ${phiDeg.toFixed(2)} degrees`);
    console.log(`Corner light distances: x=${xPx.toFixed(2)}px, y=${yPx.toFixed(2)}px`);
    console.log("Corner light positions:", {
        topLeft: { left: topLeftLight.style.left, top: topLeftLight.style.top },
        topRight: { right: topRightLight.style.right, top: topRightLight.style.top },
        bottomLeft: { left: bottomLeftLight.style.left, bottom: bottomLeftLight.style.bottom },
        bottomRight: { right: bottomRightLight.style.right, bottom: bottomRightLight.style.bottom }
    });
}

// Function to request fullscreen mode with error handling
function goFullscreen() {
    const element = document.documentElement; // Target the entire document
    const requestFullscreen = element.requestFullscreen || 
                             element.webkitRequestFullscreen || 
                             element.mozRequestFullScreen || 
                             element.msRequestFullscreen;

    if (requestFullscreen) {
        requestFullscreen.call(element).then(() => {
            console.log("Successfully entered fullscreen mode");
        }).catch(err => {
            console.error("Failed to enter fullscreen mode:", err);
            // Fallback: Prompt user to click to start
            showStartPrompt();
        });
    } else {
        console.error("Fullscreen API is not supported in this browser");
        // Fallback: Prompt user to click to start
        showStartPrompt();
    }
}

// Function to show a start prompt if fullscreen fails
function showStartPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'start-prompt';
    prompt.innerHTML = `
        <div class="modal-content">
            <div class="header">Welcome to Peripheral Vision Training</div>
            <p>Click the button below to start the session in fullscreen mode.</p>
            <button class="btn choice" onclick="startWithFullscreen()">Start</button>
        </div>
    `;
    document.body.appendChild(prompt);
}

// Function to start the session with fullscreen after user interaction
window.startWithFullscreen = function() {
    // Remove the prompt
    const prompt = document.querySelector('.start-prompt');
    if (prompt) {
        prompt.remove();
    }

    // Try to enter fullscreen again
    const element = document.documentElement;
    const requestFullscreen = element.requestFullscreen || 
                             element.webkitRequestFullscreen || 
                             element.mozRequestFullScreen || 
                             element.msRequestFullscreen;

    if (requestFullscreen) {
        requestFullscreen.call(element).then(() => {
            console.log("Successfully entered fullscreen mode after user interaction");
            // Start the game loop
            if (mode === 'training') {
                gameLoop();
            } else if (mode === 'testing') {
                gameLoopTesting();
            }
        }).catch(err => {
            console.error("Failed to enter fullscreen mode even after user interaction:", err);
            // Start the game loop anyway
            if (mode === 'training') {
                gameLoop();
            } else if (mode === 'testing') {
                gameLoopTesting();
            }
        });
    } else {
        // Start the game loop anyway if fullscreen is not supported
        if (mode === 'training') {
            gameLoop();
        } else if (mode === 'testing') {
            gameLoopTesting();
        }
    }
};

// Start the session
startSession();

function startSession() {
    // Start the timer
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            if (timeRemaining <= 0) {
                endSession();
            }
        }
    }, 1000);

    // Request fullscreen mode when the session starts
    goFullscreen();

    // Placeholder for eye tracking (future implementation)
    console.log("Eye tracking placeholder: Monitoring eye movement...");
}

function gameLoop() {
    if (isPaused || timeRemaining <= 0) return;
    
    isSelectionEnabled = true; // Enable selection at the start of each round
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
                resetLights();
                setTimeout(gameLoop, selectionToCentralGap); // Gap After Selection
            }
        }, selectionTimeout);
    }, centralToSelectionGap);
}

function gameLoopTesting() {
    if (isPaused || timeRemaining <= 0) return;
    
    isSelectionEnabled = true; // Enable selection at the start of each round
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
            clearInterval(testingInterval);
            resetLights();
            setTimeout(gameLoopTesting, 1000); // Short pause before next round
        }
    }, selectionTimeout);
}

function selectLight(position) {
    // If selection is disabled or game is paused/ended, ignore the click
    if (!isSelectionEnabled || isPaused || timeRemaining <= 0) return;

    // Immediately disable further selections
    isSelectionEnabled = false;

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

    // Reset lights immediately
    resetLights();

    // Proceed to the next round after the selectionToCentralGap
    if (mode === 'training') {
        setTimeout(gameLoop, selectionToCentralGap);
    } else if (mode === 'testing') {
        setTimeout(gameLoopTesting, 1000); // Fixed 1000ms gap for Testing mode
    }
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
    isSelectionEnabled = true; // Make sure selection is enabled when lights are reset
}

// Add fullscreen change event listener
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullscreenElement && 
        !document.msFullscreenElement) {
        // Pause the game when exiting fullscreen
        pauseSessionWithStats();
    }
}

function pauseSessionWithStats() {
    isPaused = true;
    clearTimeout(gameTimeout);
    if (mode === 'testing') {
        clearInterval(testingInterval);
    }
    
    // Format the time remaining as mm:ss
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}s`;

    // Update the pause modal content to show stats with "Good job" message
    const modalContent = document.querySelector('#pauseModal .modal-content');
    modalContent.innerHTML = `
        <div class="header">Paused</div>
        <p>Good job! Press spacebar to resume.</p>
        <div class="stats-container">
            <p><strong>Mode:</strong> <span>${mode === 'training' ? 'Training Mode' : 'Testing Mode'}</span></p>
            <p><strong>Speed:</strong> <span>${speed} ms</span></p>
            <p><strong>Time Remaining:</strong> <span>${formattedTime}</span></p>
            <p><strong>Score:</strong> <span>${score}/${totalAttempts}</span></p>
            <p><strong>Correct:</strong> <span>${score}</span></p>
            <p><strong>Missed:</strong> <span>${missed}</span></p>
            <p><strong>Wrong:</strong> <span>${wrong}</span></p>
        </div>
        <div class="button-group">
            <button class="btn choice" onclick="resumeSession()">Resume</button>
            <button class="btn choice" onclick="showEndModal()">End</button>
        </div>
    `;
    
    pauseModal.style.display = 'flex';
}

function pauseSession() {
    pauseSessionWithStats();
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

// Add styles for the pause modal and start prompt
const styles = `
.stats-container {
    background-color: #222;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
    text-align: left;
}

.stats-container p {
    margin: 8px 0;
    color: #ffffff;
    font-size: 16px;
}

.stats-container strong {
    color: #ffffff;
    margin-right: 10px;
}

.start-prompt {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);