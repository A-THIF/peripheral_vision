// Get URL parameters from start.js
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const speed = parseInt(urlParams.get('speed')) || 500; // Should match centralToSelectionGap in Training mode
const timeLimit = parseInt(urlParams.get('time_limit')) || 120; // Duration (seconds)
const selectionTimeout = parseInt(urlParams.get('selection_timeout')) || 1200; // Selection Time (ms)
const centralToSelectionGap = parseInt(urlParams.get('central_to_selection_gap')) || 500; // Gap After Central Light (ms)
const selectionToCentralGap = parseInt(urlParams.get('selection_to_central_gap')) || 1000; // Gap After Selection (ms)

// Game state
let timeRemaining = timeLimit;
let score = 0;
let totalAttempts = 0;
let isPaused = false;
let correctLight = null;
let timerInterval = null;
let gameTimeout = null; // Use a single timeout instead of interval to control game loop

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

const cornerLights = {
    topLeft: topLeftLight,
    topRight: topRightLight,
    bottomLeft: bottomLeftLight,
    bottomRight: bottomRightLight
};

// Validate mode
if (mode !== 'training') {
    alert('Invalid mode. Redirecting to start page.');
    window.location.href = '/';
}

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

    // Start the game loop
    gameLoop();
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
        cornerKeys.forEach(key => {
            if (key === correctLight) {
                cornerLights[key].style.backgroundColor = centralColor;
            } else {
                let otherColor;
                do {
                    otherColor = colors[Math.floor(Math.random() * colors.length)];
                } while (otherColor === centralColor);
                cornerLights[key].style.backgroundColor = otherColor;
            }
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

function selectLight(position) {
    if (isPaused || timeRemaining <= 0) return;

    // Clear any existing timeout to prevent multiple loops
    clearTimeout(gameTimeout);

    totalAttempts++;
    if (position === correctLight) {
        score++;
    }
    scoreDisplay.textContent = score;
    totalAttemptsDisplay.textContent = totalAttempts;

    resetLights();
    setTimeout(gameLoop, selectionToCentralGap); // Gap After Selection
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
    pauseModal.style.display = 'flex';
}

function resumeSession() {
    isPaused = false;
    pauseModal.style.display = 'none';
    endModal.style.display = 'none';
    gameLoop();
}

function showEndModal() {
    isPaused = true;
    clearTimeout(gameTimeout);
    endModal.style.display = 'flex';
}

function endSession() {
    clearInterval(timerInterval);
    clearTimeout(gameTimeout);
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