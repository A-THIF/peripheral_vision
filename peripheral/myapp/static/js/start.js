// Initial variables
let speed = 800;
let timeLimit = 60;
let currentMode = "testing";
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;
<<<<<<< Updated upstream
let requiredDistance = 0;
=======
let requiredDistance = 0; // Store requiredDistance globally
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "block";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
=======
    const deviceType = deviceTypeInput.value;
    const screenSize = parseFloat(screenSizeInput.value);
    const resolutionWidth = parseInt(resolutionWidthInput.value);
    const resolutionHeight = parseInt(resolutionHeightInput.value);

    if (isNaN(screenSize) || screenSize <= 0 || isNaN(resolutionWidth) || isNaN(resolutionHeight)) {
        viewingDistance.textContent = "Please enter valid positive values.";
        hFovDisplay.textContent = "--";
        return;
    }

    // Base viewing distance (cm) based on device type
    const baseDistance = deviceType === "desktop" ? 60 : 50; 
    const referenceSize = deviceType === "desktop" ? 24 : 15;

    // Proportional scaling for viewing distance
    const adjustedDistance = (baseDistance / referenceSize) * screenSize;
    requiredDistance = Math.round(adjustedDistance * 10) / 10; // Store globally
    viewingDistance.textContent = `${requiredDistance} cm`;

    // Calculate H-FOV
    const screenWidthInCm = (screenSize * 2.54) * (resolutionWidth / Math.sqrt(resolutionWidth ** 2 + resolutionHeight ** 2));
    const viewingDistanceMeters = requiredDistance / 100;
    const screenWidthMeters = screenWidthInCm / 100;

    const hFovRad = 2 * Math.atan((screenWidthMeters / 2) / viewingDistanceMeters);
    const hFovDeg = (hFovRad * (180 / Math.PI)).toFixed(2);

    // Update H-FOV Display
    hFovDisplay.textContent = `${hFovDeg}`;

    console.log(`Screen Size: ${screenSize} inches, Viewing Distance: ${requiredDistance} cm, H-FOV: ${hFovDeg}°`);
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
// Page Navigation Functions
function showPage1() { showPage("page1"); }
function showPage2() { showPage("page2"); }
function showPage3(mode) { currentMode = mode; showPage("page3"); }
function showPage4(mode) { currentMode = mode; showPage("page4"); }
function showPage5() { 
    showPage("page5");
    updateViewingDistance(); // Ensure viewing distance is updated when showing Page 5
}
function showPage(id) {
    const pages = ["page1", "page2", "page3", "page4", "page5", "mobileWarning"];
    pages.forEach(page => {
        document.getElementById(page).style.display = (page === id) ? "flex" : "none";
    });
}

// Go Back to Previous Page
function showPreviousPage() {
    if (currentMode === "testing") showPage3("testing");
    else showPage4("training");
}

// Start Training or Testing Session
function startSession() {
    // Get the current mode from the page visibility
    const currentMode = document.getElementById('page3').style.display !== 'none' ? 'testing' : 'training';

    // Get settings based on the mode
    let speed, timeLimit, selectionTimeout, centralToSelectionGap, selectionToCentralGap;
    
    try {
        if (currentMode === 'testing') {
            speed = parseFloat(document.getElementById('speed-testing').value) || 1;
            timeLimit = parseInt(document.getElementById('timeLimit-testing').value) || 60;
            selectionTimeout = parseInt(document.getElementById('selectionTimeout-testing').value) || 1200;
            centralToSelectionGap = 0; // Not used in testing mode
            selectionToCentralGap = 0; // Not used in testing mode
        } else {
            speed = parseInt(document.getElementById('speed-training').value) || 500;
            timeLimit = parseInt(document.getElementById('timeLimit-training').value) || 120;
            selectionTimeout = parseInt(document.getElementById('selectionTimeout-training').value) || 1200;
            centralToSelectionGap = speed; // In training mode, speed is the gap after central light
            selectionToCentralGap = parseInt(document.getElementById('selectionToCentralGap-training').value) || 1000;
        }

        // Get screen settings
        const screenSize = parseFloat(document.getElementById('screenSize').value) || 19;
        const viewingDistanceText = document.getElementById('viewingDistance').textContent;
        const viewingDistance = parseFloat(viewingDistanceText.replace(/[^0-9.]/g, '')) || (screenSize * 1.5 * 2.54);
        const deviceType = document.getElementById('deviceType').value;
        const resolutionWidth = parseInt(document.getElementById('resolutionWidth').value) || 1920;
        const resolutionHeight = parseInt(document.getElementById('resolutionHeight').value) || 1080;

        // Validate essential inputs
        if (!screenSize || !viewingDistance || !resolutionWidth || !resolutionHeight) {
            alert('Please fill in all required fields (screen size, resolution, etc.)');
            return;
        }

        // Construct the URL with all parameters
        const params = new URLSearchParams({
            mode: currentMode,
            speed: speed,
            time_limit: timeLimit,
            selection_timeout: selectionTimeout,
            central_to_selection_gap: centralToSelectionGap,
            selection_to_central_gap: selectionToCentralGap,
            screen_size: screenSize,
            viewing_distance: viewingDistance,
            device_type: deviceType,
            resolution_width: resolutionWidth,
            resolution_height: resolutionHeight
        });

        // Navigate to the training page
        window.location.href = `/training/?${params.toString()}`;

    } catch (error) {
        console.error('Error starting session:', error);
        alert('There was an error starting the session. Please check all inputs and try again.');
    }
}

// Add Event Listeners on Page Load
function addEventListeners() {
    const deviceTypeInput = document.getElementById("deviceType");
    const screenSizeInput = document.getElementById("screenSize");
    const resolutionWidthInput = document.getElementById("resolutionWidth");
    const resolutionHeightInput = document.getElementById("resolutionHeight");

    if (deviceTypeInput && screenSizeInput && resolutionWidthInput && resolutionHeightInput) {
        deviceTypeInput.addEventListener("change", updateViewingDistance);
        screenSizeInput.addEventListener("input", updateViewingDistance);
        resolutionWidthInput.addEventListener("input", updateViewingDistance);
        resolutionHeightInput.addEventListener("input", updateViewingDistance);
    } else {
        console.error("Device type, screen size, or resolution inputs not found.");
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
// Initialize on Page Load
window.onload = function () {
    checkDevice();
    addEventListeners();
};
>>>>>>> Stashed changes
