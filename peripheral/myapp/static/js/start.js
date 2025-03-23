// Initial variables
let speed = 800;
let timeLimit = 60;
let currentMode = "testing";
let selectionTimeout = 1200;
let centralToSelectionGap = 500;
let selectionToCentralGap = 1000;
let requiredDistance = 0;

// Webcam variables
let video, canvas, ctx, model, stream;
let isTracking = false;
let stableTime = 0;
const REAL_FACE_WIDTH = 14; // Average face width in cm
const FOCAL_LENGTH = 600; // Adjust if distance is off

// Page navigation functions
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

async function startFaceTracking() {
    if (isTracking) return;
    isTracking = true;

    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');

    video.style.display = 'block';
    canvas.style.display = 'block';

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        console.log('Webcam initialized successfully');
    } catch (err) {
        console.error('Webcam error:', err);
        alert('Webcam access failed. Please allow permissions.');
        isTracking = false;
        video.style.display = 'none';
        canvas.style.display = 'none';
        return;
    }

    try {
        const detectorConfig = {
            runtime: 'tfjs',
            modelType: 'short'
        };
        model = await faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, detectorConfig);
        console.log('Face detection model loaded successfully');
    } catch (err) {
        console.error('Face detection load error:', err);
        alert('Failed to load face detection model. Check your connection and refresh.');
        stopFaceTracking();
        return;
    }

    video.width = window.innerWidth;
    video.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    video.onplay = () => {
        console.log('Video started playing, initiating detection');
        detectFace();
    };

    video.play().then(() => {
        console.log('Video play triggered');
    }).catch(err => {
        console.error('Video play error:', err);
    });

    setTimeout(() => {
        if (!isTracking) return;
        console.log('Fallback: Starting detection manually');
        detectFace();
    }, 2000);
}

async function detectFace() {
    if (!isTracking || !model) {
        console.log('Detection stopped: Tracking off or model not loaded');
        return;
    }

    // Clear canvas and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        const faces = await model.estimateFaces(video);
        console.log('Faces detected:', faces);

        if (faces.length > 0) {
            const face = faces[0];
            const { box } = face;
            const faceWidthPixels = box.width;

            const distance = (FOCAL_LENGTH * REAL_FACE_WIDTH) / faceWidthPixels;
            const roundedDistance = Math.round(distance);

            // Draw green bounding box
            ctx.beginPath();
            ctx.rect(box.xMin, box.yMin, box.width, box.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            ctx.stroke();

            // Draw distance text above the face
            ctx.font = '20px Montserrat';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            const text = `${roundedDistance} cm`;
            const textX = box.xMin + box.width / 2;
            const textY = box.yMin - 10; // 10px above the box
            ctx.fillText(text, textX, textY);
            console.log('Drawing text:', text, 'at', textX, textY);

            // Update HTML elements
            document.getElementById("currentDistance").textContent = `${roundedDistance} cm`;

            const tolerance = 5;
            const difference = roundedDistance - requiredDistance;
            if (Math.abs(difference) < tolerance) {
                document.getElementById("distanceAdjustment").textContent = "Distance is optimal!";
                stableTime += 1000 / 30; // Increment by frame time (assuming ~30 FPS)
                console.log('Stable time:', stableTime);
                if (stableTime >= 5000) { // 5 seconds
                    stopFaceTracking();
                    return;
                }
            } else {
                stableTime = 0; // Reset if out of tolerance
                if (difference > 0) {
                    document.getElementById("distanceAdjustment").textContent = `Move closer by ${Math.round(difference)} cm.`;
                } else {
                    document.getElementById("distanceAdjustment").textContent = `Move farther by ${Math.round(-difference)} cm.`;
                }
            }
            console.log(`Face detected: Distance = ${roundedDistance} cm`);
        } else {
            document.getElementById("currentDistance").textContent = "No face detected.";
            document.getElementById("distanceAdjustment").textContent = "Center your face in the frame.";
            stableTime = 0;
            console.log('No face detected in this frame');
        }
    } catch (err) {
        console.error('Detection error:', err);
    }

    requestAnimationFrame(detectFace);
}

function stopFaceTracking() {
    isTracking = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById("currentDistance").textContent = `${Math.round(requiredDistance)} cm (Locked)`;
    document.getElementById("distanceAdjustment").textContent = "Distance set!";
    console.log('Tracking stopped');
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