// Initial variables
let speed = 800;
let timeLimit = 60;
let currentMode = "testing";
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;
let requiredDistance = 0;

// Page navigation functions
function showPage1() {
    document.getElementById("page1").style.display = "block";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage2() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) {
        document.getElementById("page1").style.display = "none";
        document.getElementById("mobileWarning").style.display = "block";
        return;
    }

    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "block";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage3(mode) {
    currentMode = mode;
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "block";
    document.getElementById("page4").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";

    const modeDisplay = document.getElementById("mode-display");
    const speedSection = document.getElementById("speed-section");
    const timeLimitLabel = document.getElementById("time-limit-label");
    const timeLimitInput = document.getElementById("timeLimit");
    const timeLimitNote = document.getElementById("time-limit-note");

    modeDisplay.textContent = `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

    if (mode === "testing") {
        speedSection.innerHTML = `
            <label id="speed-label">Blip Speed (Hz):</label>
            <input type="number" id="speed" min="0.5" max="2" step="0.1" value="1">
            <p class="default-note" id="speed-note">Recommended: 0.5-2 Hz</p>
        `;
        timeLimitLabel.textContent = "Duration (seconds):";
        timeLimitInput.value = 60;
        timeLimitInput.min = 30;
        timeLimitInput.max = 180;
        timeLimitNote.textContent = "Recommended: 30-180 seconds";
    } else {
        speedSection.innerHTML = `
            <label id="speed-label">Gap After Central Light (ms):</label>
            <input type="number" id="speed" min="300" max="1000" step="100" value="500">
            <p class="default-note" id="speed-note">Recommended: 300-1000 ms (Football: Start at 500 ms, reduce to 300 ms for speed)</p>
        `;
        timeLimitLabel.textContent = "Duration (seconds):";
        timeLimitInput.value = 120;
        timeLimitInput.min = 60;
        timeLimitInput.max = 300;
        timeLimitNote.textContent = "Recommended: 60-300 seconds";
    }
}

function showPage4() {
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "block";
    document.getElementById("mobileWarning").style.display = "none";

    calculateViewingDistance();
}

function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    showPage2();
}

function calculateViewingDistance() {
    const deviceType = document.getElementById("deviceType").value;
    const screenSize = parseFloat(document.getElementById("screenSize").value);
    const viewingDistanceDisplay = document.getElementById("viewingDistance");

    if (!screenSize || screenSize < 10 || screenSize > 50) {
        viewingDistanceDisplay.textContent = "Please enter a valid screen size (10-50 inches).";
        return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const diagonalPixels = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
    const ppi = diagonalPixels / screenSize;
    const pixelsPerCm = ppi / 2.54;
    const horizontalPixels = 0.4 * viewportWidth;
    const verticalPixels = 0.4 * viewportHeight;
    const diagonalPixelsToCorner = Math.sqrt(horizontalPixels * horizontalPixels + verticalPixels * verticalPixels);
    const diagonalCm = diagonalPixelsToCorner / pixelsPerCm;
    const targetAngle = 20 * (Math.PI / 180);
    const viewingDistanceCm = diagonalCm / Math.tan(targetAngle);
    const viewingDistanceInches = viewingDistanceCm / 2.54;
    const roundedCm = Math.round(viewingDistanceCm);
    const roundedInches = Math.round(viewingDistanceInches);

    requiredDistance = roundedCm;
    viewingDistanceDisplay.textContent = `Position your eyes approximately ${roundedCm} cm (${roundedInches} inches) from the screen for optimal peripheral vision training.`;
}

function startSession() {
    const speedInput = document.getElementById("speed").value;
    speed = parseInt(speedInput) || (currentMode === "testing" ? 1 : 500);
    timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;
    selectionTimeout = parseInt(document.getElementById("selectionTimeout").value) || 1200;
    centralToSelectionGap = currentMode === "testing" ? 0 : parseInt(document.getElementById("centralToSelectionGap").value) || 500;
    selectionToCentralGap = currentMode === "testing" ? 0 : parseInt(document.getElementById("selectionToCentralGap").value) || 1000;

    let speedDisplay = speed;
    if (currentMode === "testing") {
        speedDisplay = speed + " Hz";
    } else {
        speedDisplay = speed + " ms";
    }

    alert(`Starting ${currentMode} with Speed: ${speedDisplay}, Duration: ${timeLimit}s, Selection Timeout: ${selectionTimeout}ms, Gaps: ${centralToSelectionGap}ms/${selectionToCentralGap}ms`);
    window.location.href = `/training/?mode=${currentMode}&speed=${speed}&time_limit=${timeLimit}&selection_timeout=${selectionTimeout}¢ral_to_selection_gap=${centralToSelectionGap}&selection_to_central_gap=${selectionToCentralGap}`;
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    showPage1();
    document.getElementById("deviceType").addEventListener("change", calculateViewingDistance);
    document.getElementById("screenSize").addEventListener("input", calculateViewingDistance);
});