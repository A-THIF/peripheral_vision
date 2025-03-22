let speed = 800;
let timeLimit = 60;
let currentMode = "testing";
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;
let requiredDistance = 0; // To store the required viewing distance for 20 degrees

function showPage1() {
    document.getElementById("page1").style.display = "flex";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage2() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) {
        document.getElementById("page1").style.display = "none";
        document.getElementById("mobileWarning").style.display = "flex";
        return;
    }

    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "flex";
    document.getElementById("page3").style.display = "none";
    document.getElementById("page4").style.display = "none";
    document.getElementById("mobileWarning").style.display = "none";
}

function showPage3(mode) {
    currentMode = mode;
    document.getElementById("page1").style.display = "none";
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "flex";
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
    document.getElementById("page4").style.display = "flex";
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

async function startFaceTracking() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const currentDistanceDisplay = document.getElementById("currentDistance");
    const distanceAdjustmentDisplay = document.getElementById("distanceAdjustment");

    // Request webcam access
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Load the face landmarks detection model
    const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );

    // Calculate focal length (assume 70-degree FOV, 1280px width)
    const fov = 70 * (Math.PI / 180); // 70 degrees in radians
    const focalLength = 1280 / (2 * Math.tan(fov / 2)); // Focal length in pixels

    // Detect faces and calculate distance
    async function detectFace() {
        const predictions = await model.estimateFaces({ input: video });
        if (predictions.length > 0) {
            const landmarks = predictions[0].scaledMesh;
            // Get the left and right eye positions (indices 33 and 263 are approximate for outer eye corners)
            const leftEye = landmarks[33]; // [x, y, z]
            const rightEye = landmarks[263];
            const apparentIPD = Math.sqrt(
                Math.pow(rightEye[0] - leftEye[0], 2) +
                Math.pow(rightEye[1] - leftEye[1], 2)
            ); // In pixels

            // Calculate distance (assume actual IPD = 6.3 cm)
            const actualIPD = 6.3; // cm
            const distance = (actualIPD * focalLength) / apparentIPD; // cm

            // Display current distance
            const roundedDistance = Math.round(distance);
            currentDistanceDisplay.textContent = `${roundedDistance} cm`;

            // Provide adjustment feedback
            if (requiredDistance > 0) {
                const difference = roundedDistance - requiredDistance;
                if (Math.abs(difference) < 5) {
                    distanceAdjustmentDisplay.textContent = "Distance is optimal!";
                } else if (difference > 0) {
                    distanceAdjustmentDisplay.textContent = `Move closer by ${Math.round(difference)} cm.`;
                } else {
                    distanceAdjustmentDisplay.textContent = `Move farther by ${Math.round(-difference)} cm.`;
                }
            }
        } else {
            currentDistanceDisplay.textContent = "No face detected.";
            distanceAdjustmentDisplay.textContent = "Please position your face in front of the camera.";
        }

        // Repeat detection
        requestAnimationFrame(detectFace);
    }

    // Start video and detection
    video.addEventListener("play", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        detectFace();
    });
}

function calculateViewingDistance() {
    const deviceType = document.getElementById("deviceType").value;
    const screenSize = parseFloat(document.getElementById("screenSize").value);
    const viewingDistanceDisplay = document.getElementById("viewingDistance");

    if (!screenSize || screenSize < 10 || screenSize > 50) {
        viewingDistanceDisplay.textContent = "Please enter a valid screen size (10-50 inches).";
        return;
    }

    // Get viewport size (assumes fullscreen mode)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate PPI using resolution and screen size
    const diagonalPixels = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
    const ppi = diagonalPixels / screenSize;
    const pixelsPerCm = ppi / 2.54;

    // Calculate diagonal distance from center to corner light (40vw and 40vh)
    const horizontalPixels = 0.4 * viewportWidth; // 40vw
    const verticalPixels = 0.4 * viewportHeight; // 40vh
    const diagonalPixelsToCorner = Math.sqrt(horizontalPixels * horizontalPixels + verticalPixels * verticalPixels);

    // Convert to physical distance
    const diagonalCm = diagonalPixelsToCorner / pixelsPerCm;

    // Calculate viewing distance for 20 degrees
    const targetAngle = 20 * (Math.PI / 180); // 20 degrees in radians
    const viewingDistanceCm = diagonalCm / Math.tan(targetAngle);
    const viewingDistanceInches = viewingDistanceCm / 2.54;

    // Round to nearest cm and inch
    const roundedCm = Math.round(viewingDistanceCm);
    const roundedInches = Math.round(viewingDistanceInches);

    // Store the required distance for on-spot comparison
    requiredDistance = roundedCm;

    viewingDistanceDisplay.textContent = `Position your eyes approximately ${roundedCm} cm (${roundedInches} inches) from the screen for optimal peripheral vision training.`;
}

document.addEventListener('DOMContentLoaded', () => {
    showPage1();
    document.getElementById("deviceType").addEventListener("change", calculateViewingDistance);
    document.getElementById("screenSize").addEventListener("input", calculateViewingDistance);
});

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
    // Update the URL to match the pattern in urls.py
    window.location.href = `/training/?mode=${currentMode}&speed=${speed}&time_limit=${timeLimit}&selection_timeout=${selectionTimeout}&central_to_selection_gap=${centralToSelectionGap}&selection_to_central_gap=${selectionToCentralGap}`;
}