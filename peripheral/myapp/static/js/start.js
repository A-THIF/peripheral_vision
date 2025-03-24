let currentMode = "training";
let speed = 500;
let timeLimit = 120;
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;

// Global function to calculate and update viewing distance
function updateViewingDistance() {
    const deviceTypeInput = document.getElementById("deviceType");
    const screenSizeInput = document.getElementById("screenSize");
    const viewingDistance = document.getElementById("viewingDistance");

    // Debugging: Check if DOM elements are found
    if (!deviceTypeInput || !screenSizeInput || !viewingDistance) {
        console.error("DOM elements not found in updateViewingDistance:", {
            deviceTypeInput: !!deviceTypeInput,
            screenSizeInput: !!screenSizeInput,
            viewingDistance: !!viewingDistance
        });
        return;
    }

    const deviceType = deviceTypeInput.value;
    const screenSize = parseFloat(screenSizeInput.value);

    // Debugging: Log input values
    console.log("updateViewingDistance called:", { deviceType, screenSize });

    if (isNaN(screenSize) || screenSize <= 0) {
        viewingDistance.textContent = "Please enter a valid positive screen size.";
        return;
    }

    // Ergonomic base distances and reference screen sizes
    const baseDistance = deviceType === "desktop" ? 60 : 50; // cm (midpoint of 50-70 for desktop, 40-60 for laptop)
    const referenceSize = deviceType === "desktop" ? 24 : 15; // inches (24 for desktop, 15 for laptop)

    // Proportional scaling (no constraints)
    const adjustedDistance = (baseDistance / referenceSize) * screenSize;
    const finalDistance = Math.round(adjustedDistance * 10) / 10; // Round to 1 decimal place

    viewingDistance.textContent = `${finalDistance} cm`;
    console.log(`Screen Size: ${screenSize} inches, Viewing Distance: ${finalDistance} cm`);
}

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
    showPage2();
}

function showPage1() {
    document.getElementById("page1").style.display = "flex";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("page5").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage2() {
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "flex";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("page5").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage3(mode) {
    currentMode = mode;
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "flex";
    document.getElementById("page4").style.display = "none";
    document.getElementById("page5").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage4(mode) {
    currentMode = mode;
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "flex";
    document.getElementById("page5").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage5() {
    console.log("showPage5 called");

    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("page5").style.display = "flex";
    document.getElementById("mobileWarning").style.display = "none";

    const deviceTypeInput = document.getElementById("deviceType");
    const screenSizeInput = document.getElementById("screenSize");

    // Debugging: Check if DOM elements are found
    if (!deviceTypeInput || !screenSizeInput) {
        console.error("DOM elements not found in showPage5:", {
            deviceTypeInput: !!deviceTypeInput,
            screenSizeInput: !!screenSizeInput
        });
        return;
    }

    // Remove existing event listeners to prevent duplicates
    deviceTypeInput.removeEventListener("change", updateViewingDistance);
    screenSizeInput.removeEventListener("input", updateViewingDistance);

    // Add event listeners
    deviceTypeInput.addEventListener("change", () => {
        console.log("Device type changed to:", deviceTypeInput.value);
        updateViewingDistance();
    });
    screenSizeInput.addEventListener("input", () => {
        console.log("Screen size changed to:", screenSizeInput.value);
        updateViewingDistance();
    });

    // Debugging: Confirm event listeners are added
    console.log("Event listeners added for deviceType and screenSize");

    // Trigger on page load
    updateViewingDistance();
}

function showPreviousPage() {
    if (currentMode === "testing") {
        showPage3("testing");
    } else {
        showPage4("training");
    }
}

function startSession() {
    const speedInput = currentMode === "testing" ? document.getElementById("speed-testing").value : document.getElementById("speed-training").value;
    const timeLimitInput = currentMode === "testing" ? document.getElementById("timeLimit-testing").value : document.getElementById("timeLimit-training").value;
    const selectionTimeoutInput = currentMode === "testing" ? document.getElementById("selectionTimeout-testing").value : document.getElementById("selectionTimeout-training").value;
    const selectionToCentralGapInput = currentMode === "testing" ? 0 : document.getElementById("selectionToCentralGap-training").value;

    speed = parseInt(speedInput) || (currentMode === "testing" ? 1 : 500);
    timeLimit = parseInt(timeLimitInput) || (currentMode === "testing" ? 60 : 120);
    selectionTimeout = parseInt(selectionTimeoutInput) || 1200;
    centralToSelectionGap = currentMode === "testing" ? 0 : speed;
    selectionToCentralGap = currentMode === "testing" ? 0 : parseInt(selectionToCentralGapInput) || 1000;

<<<<<<< Updated upstream
    // Get screen size and viewing distance from page5
    const screenSizeInput = document.getElementById("screenSize");
    const viewingDistanceElement = document.getElementById("viewingDistance");
    const screenSize = parseFloat(screenSizeInput.value);
    const viewingDistanceText = viewingDistanceElement.textContent; // e.g., "47.5 cm"
    const viewingDistance = parseFloat(viewingDistanceText.replace(" cm", ""));

    // Redirect to the training page with additional parameters
    window.location.href = `/training/?mode=${currentMode}&speed=${speed}&time_limit=${timeLimit}&selection_timeout=${selectionTimeout}&central_to_selection_gap=${centralToSelectionGap}&selection_to_central_gap=${selectionToCentralGap}&screen_size=${screenSize}&viewing_distance=${viewingDistance}`;
=======
    // Redirect to the training page without showing an alert
    window.location.href = `/training/?mode=${currentMode}&speed=${speed}&time_limit=${timeLimit}&selection_timeout=${selectionTimeout}&central_to_selection_gap=${centralToSelectionGap}&selection_to_central_gap=${selectionToCentralGap}`;
>>>>>>> Stashed changes
}

// Check if the device is mobile
function checkDevice() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById("page1").style.display = "none";
        document.getElementById("page2").style.display = "none";
        document.getElementById("page3").style.display = "none";
        document.getElementById("page4").style.display = "none";
        document.getElementById("page5").style.display = "none";
        document.getElementById("mobileWarning").style.display = "flex";
    } else {
        document.getElementById("page1").style.display = "flex";
        document.getElementById("page2").style.display = "none";
        document.getElementById("page3").style.display = "none";
        document.getElementById("page4").style.display = "none";
        document.getElementById("page5").style.display = "none";
        document.getElementById("mobileWarning").style.display = "none";
    }
}

window.onload = checkDevice;