// Webcam variables
let video, canvas, ctx, model, stream;
let isTracking = false;
let stableTime = 0;
const REAL_FACE_WIDTH = 14; // Average face width in cm
const FOCAL_LENGTH = 600; // Adjust if distance is off

// Ensure requiredDistance is accessible from start.js
externals = window; // For global scope in some environments, optional

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
    console.log('Canvas set to:', canvas.width, 'x', canvas.height);
    canvas.style.background = 'rgba(0, 0, 255, 0.1)'; // Light blue tint for visibility check

    video.onloadeddata = () => {
        console.log('Video data loaded, starting detection');
        detectFace();
    };

    video.play().then(() => {
        console.log('Video playback started');
    }).catch(err => {
        console.error('Video play error:', err);
    });

    setTimeout(() => {
        if (!isTracking) return;
        console.log('Fallback: Forcing detection start');
        detectFace();
    }, 2000);
}

async function detectFace() {
    if (!isTracking || !model) {
        console.log('Detection stopped: Tracking off or model not loaded');
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log('Video frame drawn to canvas');

    // Draw a test red rectangle
    ctx.beginPath();
    ctx.rect(50, 50, 100, 100);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'red';
    ctx.stroke();
    console.log('Test red rectangle drawn at: 50, 50, 100, 100');

    try {
        const faces = await model.estimateFaces(video);
        console.log('Faces detected:', faces);

        if (faces.length > 0) {
            const face = faces[0];
            const { box } = face;
            const faceWidthPixels = box.width;
            const distance = (FOCAL_LENGTH * REAL_FACE_WIDTH) / faceWidthPixels;
            const roundedDistance = Math.round(distance);

            // Draw bounding box
            ctx.beginPath();
            ctx.rect(box.xMin, box.yMin, box.width, box.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            ctx.stroke();
            console.log('Bounding box drawn at:', box.xMin, box.yMin, box.width, box.height);

            // Draw distance text
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            const text = `${roundedDistance} cm`;
            const textX = box.xMin + box.width / 2;
            const textY = box.yMin - 10;
            ctx.fillText(text, textX, textY);
            console.log('Distance text drawn:', text, 'at', textX, textY);

            // Update HTML
            document.getElementById("currentDistance").textContent = `${roundedDistance} cm`;

            const tolerance = 5;
            const difference = roundedDistance - requiredDistance;
            if (Math.abs(difference) < tolerance) {
                document.getElementById("distanceAdjustment").textContent = "Distance is optimal!";
                stableTime += 1000 / 30;
                console.log('Stable time:', stableTime);
                if (stableTime >= 5000) {
                    console.log('Stable for 5 seconds, stopping');
                    stopFaceTracking();
                    return;
                }
            } else {
                stableTime = 0;
                document.getElementById("distanceAdjustment").textContent = difference > 0 
                    ? `Move closer by ${Math.round(difference)} cm.` 
                    : `Move farther by ${Math.round(-difference)} cm.`;
            }
            console.log(`Distance calculated: ${roundedDistance} cm, Required: ${requiredDistance} cm`);
        } else {
            document.getElementById("currentDistance").textContent = "No face detected.";
            document.getElementById("distanceAdjustment").textContent = "Center your face in the frame.";
            stableTime = 0;
            console.log('No face detected');
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