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

// Pause modal elements
const pauseMode = document.getElementById('pauseMode');
const pauseSpeed = document.getElementById('pauseSpeed');
const pauseTime = document.getElementById('pauseTime');
const pauseScore = document.getElementById('pauseScore');
const pauseCorrect = document.getElementById('pauseCorrect');
const pauseMissed = document.getElementById('pauseMissed');
const pauseWrong = document.getElementById('pauseWrong');

const cornerLights = {
    topLeft: topLeftLight,
    topRight: topRightLight,
    bottomLeft: bottomLeftLight,
    bottomRight: bottomRightLight
};

// Keyboard and focus state
let focusedElementIndex = 0; // Track the currently focused element
let focusableElements = []; // List of focusable elements (buttons)

// Update the list of focusable elements based on the current page/modal
function updateFocusableElements() {
    focusableElements = Array.from(document.querySelectorAll('.btn.choice, button:not(:disabled)'))
        .filter(element => element.offsetParent !== null); // Only include visible buttons
    
    console.log("Focusable elements in training:", focusableElements); // Debug log
    
    if (focusableElements.length === 0) {
        focusedElementIndex = 0;
        return;
    }
    
    focusedElementIndex = Math.min(focusedElementIndex, focusableElements.length - 1);
    
    focusableElements.forEach((element, index) => {
        element.classList.remove('gamepad-focus');
        if (index === focusedElementIndex) {
            element.classList.add('gamepad-focus');
            element.focus();
        }
    });
}

// Keyboard input for navigation and selection
document.addEventListener('keydown', (event) => {
    // Navigation with arrow keys
    if (focusableElements.length > 0) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            focusedElementIndex = (focusedElementIndex + 1) % focusableElements.length;
            console.log("Navigating forward in training, new index:", focusedElementIndex);
            updateFocusableElements();
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            focusedElementIndex = (focusedElementIndex - 1 + focusableElements.length) % focusableElements.length;
            console.log("Navigating backward in training, new index:", focusedElementIndex);
            updateFocusableElements();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const focusedElement = focusableElements[focusedElementIndex];
            if (focusedElement) {
                focusedElement.click();
            }
        }
    }

    // Corner light selection with Q, W, A, S
    if (isSelectionEnabled && !isPaused && timeRemaining > 0) {
        if (event.key.toLowerCase() === 'q') {
            selectLight('topLeft');
        } else if (event.key.toLowerCase() === 'w') {
            selectLight('topRight');
        } else if (event.key.toLowerCase() === 'a') {
            selectLight('bottomLeft');
        } else if (event.key.toLowerCase() === 's') {
            selectLight('bottomRight');
        }
    }

    // Pause with Escape key
    if (event.key === 'Escape' && !isPaused) {
        pauseSessionWithStats();
    }
});

// Add click event listeners to corner lights for mouse support
Object.entries(cornerLights).forEach(([position, light]) => {
    light.addEventListener('click', () => {
        if (isSelectionEnabled && !isPaused && timeRemaining > 0) {
            selectLight(position);
        }
    });
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

// Function to request fullscreen mode
function goFullscreen() {
    const element = document.documentElement; // Target the entire document
    const requestFullscreen = element.requestFullscreen || 
                             element.webkitRequestFullscreen || 
                             element.mozRequestFullScreen || 
                             element.msRequestFullscreen;

    if (requestFullscreen) {
        requestFullscreen.call(element).then(() => {
            console.log("Successfully entered fullscreen mode");
            updateFocusableElements(); // Update focusable elements after entering fullscreen
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
            <p>Click the button below or press Enter to start the session in fullscreen mode.</p>
            <button class="btn choice" onclick="startWithFullscreen()">Start</button>
        </div>
    `;
    document.body.appendChild(prompt);
    updateFocusableElements(); // Update focusable elements for the start prompt
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
    // Request fullscreen mode when the session starts
    goFullscreen();

    // Start the timer
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
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
                cornerLights[key].style.backgroundColor = !isOn ? colors[Math.floor(Math.random() * colors.length)] : '#ccc';
            }
        });
    }, flashInterval);
}

function selectLight(position) {
    if (!isSelectionEnabled || isPaused || timeRemaining <= 0) return;

    isSelectionEnabled = false; // Prevent multiple selections
    totalAttempts++;

    if (position === correctLight) {
        score += 10; // Increment score for correct selection
    } else {
        wrong++; // Increment wrong selections
    }

    resetLights();

    if (mode === 'training') {
        setTimeout(gameLoop, selectionToCentralGap); // Gap After Selection
    } else if (mode === 'testing') {
        clearInterval(testingInterval);
        setTimeout(gameLoopTesting, selectionToCentralGap);
    }
}

function resetLights() {
    centralLight.style.backgroundColor = '#ccc';
    Object.values(cornerLights).forEach(light => {
        light.style.display = 'none';
        light.style.backgroundColor = '#ccc';
    });
}

function hideCornerLights() {
    Object.values(cornerLights).forEach(light => {
        light.style.display = 'none';
    });
}

function pauseSessionWithStats() {
    isPaused = true;
    clearTimeout(gameTimeout);
    clearInterval(testingInterval);

    // Update pause modal stats
    pauseMode.textContent = mode;
    pauseSpeed.textContent = mode === 'training' ? `${speed} ms` : `${speed} Hz`;
    pauseTime.textContent = `${timeRemaining} s`;
    pauseScore.textContent = score;
    pauseCorrect.textContent = totalAttempts - missed - wrong;
    pauseMissed.textContent = missed;
    pauseWrong.textContent = wrong;

    pauseModal.style.display = 'flex';
    updateFocusableElements(); // Update focusable elements for the pause modal
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
    pauseModal.style.display = 'none';
    endModal.style.display = 'flex';
    updateFocusableElements(); // Update focusable elements for the end modal
}

function endSession() {
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
    clearInterval(testingInterval);

    // Calculate final stats
    const correct = totalAttempts - missed - wrong;
    const accuracy = totalAttempts > 0 ? (correct / totalAttempts * 100).toFixed(2) : 0;

    // Save results to the server
    saveTrainingResults();

    // Display the report page
    reportCorrect.textContent = correct;
    reportMissed.textContent = missed;
    reportWrong.textContent = wrong;
    reportScore.textContent = score;
    reportTotal.textContent = totalAttempts;
    reportAccuracy.textContent = accuracy;

    trainingPage.style.display = 'none';
    reportPage.style.display = 'flex';
    updateFocusableElements(); // Update focusable elements for the report page
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

// Function to save training results to the server
function saveTrainingResults() {
    const sessionId = urlParams.get('session_id');
    const data = {
        session_id: sessionId,
        score: score,
        total_attempts: totalAttempts,
        correct: totalAttempts - missed - wrong,
        missed: missed,
        wrong: wrong,
        accuracy: totalAttempts > 0 ? ((totalAttempts - missed - wrong) / totalAttempts * 100).toFixed(2) : 0,
    };

    fetch('/save-results/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(), // Add CSRF token for Django
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Training results saved successfully');
        } else {
            console.error('Failed to save training results:', result.message);
        }
    })
    .catch(error => {
        console.error('Error saving training results:', error);
    });
}

// Function to get CSRF token from the DOM
function getCsrfToken() {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrftoken ? csrftoken.value : null;
}