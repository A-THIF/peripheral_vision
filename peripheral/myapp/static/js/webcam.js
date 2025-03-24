let isTracking = false;
let video, canvas, ctx, stream;
let stableTime = 0;
const requiredDistance = parseFloat(document.getElementById("requiredDistance").textContent) || 0;

async function startDistanceTracking() {
    console.log('startDistanceTracking called');
    if (isTracking) return;
    isTracking = true;

    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');

    video.style.display = 'block';
    canvas.style.display = 'none'; // Canvas is hidden, used only for capturing frames

    // Hide the button group and show the stop button
    document.getElementById("webcamButtonGroup").style.display = 'none';
    document.getElementById("closeWebcamBtn").style.display = 'block';

    // Adjust the settings-group position
    const settingsGroup = document.querySelector('.settings-group');
    settingsGroup.classList.add('settings-group-webcam-active');

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        // Set canvas size to match video resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        console.log('Webcam initialized successfully');
        console.log('Video dimensions:', video.videoWidth, video.videoHeight);

        // Start sending frames to the backend
        sendFrames();
    } catch (err) {
        console.error('Webcam error:', err.name, err.message);
        alert('Webcam access failed: ' + err.message + '. Please allow permissions.');
        stopDistanceTracking();
    }
}

async function sendFrames() {
    if (!isTracking) return;

    // Draw the current video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas to a base64-encoded JPEG image
    const imageData = canvas.toDataURL('image/jpeg');

    try {
        // Send the frame to the backend
        const response = await fetch('/calculate-distance/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
        });

        const data = await response.json();

        if (data.status === 'success') {
            const distance = data.distance;
            document.getElementById("currentDistance").textContent = `${distance} cm`;

            const tolerance = 5;
            const difference = distance - requiredDistance;
            if (Math.abs(difference) < tolerance) {
                document.getElementById("distanceAdjustment").textContent = "Distance is optimal!";
                stableTime += 1000 / 30; // Approx 30 fps
                if (stableTime >= 5000) { // 5 seconds of stability
                    stopDistanceTracking();
                    return;
                }
            } else {
                stableTime = 0;
                document.getElementById("distanceAdjustment").textContent = difference > 0 
                    ? `Move closer by ${Math.round(difference)} cm.` 
                    : `Move farther by ${Math.round(-difference)} cm.`;
            }
        } else {
            document.getElementById("currentDistance").textContent = data.message;
            document.getElementById("distanceAdjustment").textContent = "Please adjust your position.";
            stableTime = 0;
        }
    } catch (err) {
        console.error('Error sending frame:', err);
        document.getElementById("currentDistance").textContent = "Error processing frame.";
        document.getElementById("distanceAdjustment").textContent = "Please try again.";
        stableTime = 0;
    }

    // Continue sending frames
    requestAnimationFrame(sendFrames);
}

function stopDistanceTracking() {
    isTracking = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.style.display = 'none';
    canvas.style.display = 'none';
    // Show the button group and hide the stop button
    document.getElementById("webcamButtonGroup").style.display = 'flex';
    document.getElementById("closeWebcamBtn").style.display = 'none';
    // Revert the settings-group position
    const settingsGroup = document.querySelector('.settings-group');
    settingsGroup.classList.remove('settings-group-webcam-active');
    console.log('Tracking stopped');
}