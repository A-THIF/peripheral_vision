let currentMode = "training";
let speed = 500;
let timeLimit = 120;
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;

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
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("page5").style.display = "flex";
    document.getElementById("mobileWarning").style.display = "none";

    const deviceType = document.getElementById("deviceType").value;
    const screenSize = parseFloat(document.getElementById("screenSize").value);
    const viewingDistance = document.getElementById("viewingDistance");

    if (isNaN(screenSize) || screenSize <= 0) {
        viewingDistance.textContent = "Please enter a valid screen size.";
        return;
    }

    const diagonalInches = screenSize;
    const diagonalCm = diagonalInches * 2.54;
    const cornerDistanceCm = (diagonalCm / 2) * Math.tan(20 * Math.PI / 180);
    const viewingDistanceCm = cornerDistanceCm / Math.tan(10 * Math.PI / 180);
    viewingDistance.textContent = `${Math.round(viewingDistanceCm)} cm`;
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

    let speedDisplay = speed;
    if (currentMode === "testing") {
        speedDisplay = speed + " Hz";
    } else {
        speedDisplay = speed + " ms";
    }

    alert(`Starting ${currentMode} with Speed: ${speedDisplay}, Duration: ${timeLimit}s, Selection Timeout: ${selectionTimeout}ms, Gaps: ${centralToSelectionGap}ms/${selectionToCentralGap}ms`);
    window.location.href = `/training/?mode=${currentMode}&speed=${speed}&time_limit=${timeLimit}&selection_timeout=${selectionTimeout}&central_to_selection_gap=${centralToSelectionGap}&selection_to_central_gap=${selectionToCentralGap}`;
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