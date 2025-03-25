// Global Variables
let currentMode = "training";
let speed = 500;
let timeLimit = 120;
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;

// Function to Calculate and Update Viewing Distance
function updateViewingDistance() {
    const deviceTypeInput = document.getElementById("deviceType");
    const screenSizeInput = document.getElementById("screenSize");
    const viewingDistance = document.getElementById("viewingDistance");
    const resolutionWidthInput = document.getElementById("resolutionWidth");
    const resolutionHeightInput = document.getElementById("resolutionHeight");
    const hFovDisplay = document.getElementById("hFov");

    if (!deviceTypeInput || !screenSizeInput || !viewingDistance || 
        !resolutionWidthInput || !resolutionHeightInput || !hFovDisplay) {
        console.error("Missing DOM elements in updateViewingDistance.");
        return;
    }

    const deviceType = deviceTypeInput.value;
    const screenSize = parseFloat(screenSizeInput.value);
    const resolutionWidth = parseInt(resolutionWidthInput.value);
    const resolutionHeight = parseInt(resolutionHeightInput.value);

    if (isNaN(screenSize) || screenSize <= 0 || isNaN(resolutionWidth) || isNaN(resolutionHeight)) {
        viewingDistance.textContent = "Please enter valid positive values.";
        return;
    }

    // Base viewing distance (cm) based on device type
    const baseDistance = deviceType === "desktop" ? 60 : 50; 
    const referenceSize = deviceType === "desktop" ? 24 : 15;

    // Proportional scaling for viewing distance
    const adjustedDistance = (baseDistance / referenceSize) * screenSize;
    const finalDistance = Math.round(adjustedDistance * 10) / 10;
    viewingDistance.textContent = `${finalDistance} cm`;

    // Calculate H-FOV
    const screenWidthInCm = (screenSize * 2.54) * (resolutionWidth / Math.sqrt(resolutionWidth ** 2 + resolutionHeight ** 2));
    const viewingDistanceMeters = finalDistance / 100;
    const screenWidthMeters = screenWidthInCm / 100;

    const hFovRad = 2 * Math.atan((screenWidthMeters / 2) / viewingDistanceMeters);
    const hFovDeg = (hFovRad * (180 / Math.PI)).toFixed(2);

    // Update H-FOV Display
    hFovDisplay.textContent = `${hFovDeg}°`;

    console.log(`Screen Size: ${screenSize} inches, Viewing Distance: ${finalDistance} cm, H-FOV: ${hFovDeg}°`);
}

// Function to Enter Fullscreen and Continue
function enterFullscreenAndContinue() {
    const elem = document.documentElement;
    
    // Request fullscreen using the appropriate method
    const enterFS = () => {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        
        // Show the next page after entering fullscreen
        showPage2();
    };

    // Try to enter fullscreen and continue
    enterFS();
}

// Page Navigation Functions
function showPage1() { showPage("page1"); }
function showPage2() { showPage("page2"); }
function showPage3(mode) { currentMode = mode; showPage("page3"); }
function showPage4(mode) { currentMode = mode; showPage("page4"); }
function showPage5() { showPage("page5"); }
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

    if (deviceTypeInput && screenSizeInput) {
        deviceTypeInput.addEventListener("change", updateViewingDistance);
        screenSizeInput.addEventListener("input", updateViewingDistance);
    } else {
        console.error("Device type or screen size input not found.");
    }
}

// Check if Device is Mobile
function checkDevice() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) showPage("mobileWarning");
    else showPage("page1");
}

// Initialize on Page Load
window.onload = function () {
    checkDevice();
    addEventListeners();
};
