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

    if (!deviceTypeInput || !screenSizeInput || !viewingDistance) {
        console.error("Missing DOM elements in updateViewingDistance.");
        return;
    }

    const deviceType = deviceTypeInput.value;
    const screenSize = parseFloat(screenSizeInput.value);

    if (isNaN(screenSize) || screenSize <= 0) {
        viewingDistance.textContent = "Please enter a valid positive screen size.";
        return;
    }

    // Base viewing distance (cm) based on device type
    const baseDistance = deviceType === "desktop" ? 60 : 50; 
    const referenceSize = deviceType === "desktop" ? 24 : 15;

    // Proportional scaling for viewing distance
    const adjustedDistance = (baseDistance / referenceSize) * screenSize;
    const finalDistance = Math.round(adjustedDistance * 10) / 10;

    viewingDistance.textContent = `${finalDistance} cm`;
    console.log(`Screen Size: ${screenSize} inches, Viewing Distance: ${finalDistance} cm`);
}

// Function to Enter Fullscreen Mode
function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();

    showPage2(); // Proceed to next page after fullscreen
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
    const speedInput = document.getElementById(`speed-${currentMode}`).value;
    const timeLimitInput = document.getElementById(`timeLimit-${currentMode}`).value;
    const selectionTimeoutInput = document.getElementById(`selectionTimeout-${currentMode}`).value;
    const selectionToCentralGapInput = currentMode === "training"
        ? document.getElementById("selectionToCentralGap-training").value
        : 0;

    speed = parseInt(speedInput) || (currentMode === "testing" ? 1 : 500);
    timeLimit = parseInt(timeLimitInput) || (currentMode === "testing" ? 60 : 120);
    selectionTimeout = parseInt(selectionTimeoutInput) || 1200;
    centralToSelectionGap = currentMode === "testing" ? 0 : speed;
    selectionToCentralGap = parseInt(selectionToCentralGapInput) || 1000;

    const screenSizeInput = document.getElementById("screenSize");
    const viewingDistanceElement = document.getElementById("viewingDistance");
    const screenSize = parseFloat(screenSizeInput.value);
    const viewingDistanceText = viewingDistanceElement.textContent;
    const viewingDistance = parseFloat(viewingDistanceText.replace(" cm", ""));

    if (isNaN(screenSize) || screenSize <= 0 || isNaN(viewingDistance) || viewingDistance <= 0) {
        console.error("Invalid screen size or viewing distance.");
        return;
    }

    // Redirect to Training Page
    window.location.href = `/training/?mode=${currentMode}&speed=${speed}&time_limit=${timeLimit}&selection_timeout=${selectionTimeout}&central_to_selection_gap=${centralToSelectionGap}&selection_to_central_gap=${selectionToCentralGap}&screen_size=${screenSize}&viewing_distance=${viewingDistance}&device_type=${document.getElementById("deviceType").value}`;
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
