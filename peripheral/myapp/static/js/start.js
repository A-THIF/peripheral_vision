let speed = 1000; // Default speed/interval in ms
let timeLimit = 60; // Default duration in seconds
let currentMode = "testing"; // Default mode

function showPage1() {
    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const page3 = document.getElementById("page3");
    if (page1 && page2 && page3) {
        page1.style.display = "flex";
        page2.style.display = "none";
        page3.style.display = "none";
    } else {
        console.error("Page elements not found!");
    }
}

function showPage2() {
    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const page3 = document.getElementById("page3");
    if (page1 && page2 && page3) {
        page1.style.display = "none";
        page2.style.display = "flex";
        page3.style.display = "none";
    } else {
        console.error("Page elements not found!");
    }
}

function showPage3(mode) {
    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const page3 = document.getElementById("page3");
    if (page1 && page2 && page3) {
        page1.style.display = "none";
        page2.style.display = "none";
        page3.style.display = "flex";
        currentMode = mode;
        document.getElementById("modeDisplay").textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

        const speedInput = document.getElementById("speed");
        const timeLimitInput = document.getElementById("timeLimit");
        const speedLabel = document.getElementById("speedLabel");
        const speedNote = document.getElementById("speedNote");
        const durationNote = document.getElementById("durationNote");

        if (mode === "testing") {
            speedLabel.textContent = "Blip Speed (Hz): ";
            speedInput.value = 1000; // 1 Hz = 1000 ms
            timeLimitInput.value = 60; // 60 seconds
            speedNote.textContent = "Recommended: 1 Hz (Range: 0.5 Hz to 2 Hz)";
            durationNote.textContent = "Recommended: 60s (Range: 30s to 180s)";
        } else if (mode === "training") {
            speedLabel.textContent = "Time Gap (ms): ";
            speedInput.value = 1000; // 1000 ms
            timeLimitInput.value = 120; // 120 seconds
            speedNote.textContent = "Recommended: 1000 ms (Range: 500 ms to 2000 ms)";
            durationNote.textContent = "Recommended: 120s (Range: 60s to 300s)";
        }
    } else {
        console.error("Page elements not found!");
    }
}

function startSession() {
    const speedInput = document.getElementById("speed").value;
    speed = parseInt(speedInput) || 1000;
    timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;

    // Convert speed to Hz for Testing mode in the alert
    let speedDisplay = speed;
    if (currentMode === "testing") {
        speedDisplay = (1000 / speed).toFixed(2) + " Hz"; // Convert ms to Hz
    } else {
        speedDisplay = speed + " ms";
    }

    alert(`Starting ${currentMode} with Speed: ${speedDisplay}, Duration: ${timeLimit}s`);
}

document.addEventListener("DOMContentLoaded", function () {
    showPage1();
});