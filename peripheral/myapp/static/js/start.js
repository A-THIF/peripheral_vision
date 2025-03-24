// Add this at the top of start.js
function getFormData() {
    return {
        mode: currentMode,
        speed: speed,
        time_limit: timeLimit,
        selection_timeout: selectionTimeout,
        central_to_selection_gap: centralToSelectionGap,
        selection_to_central_gap: selectionToCentralGap,
        screen_size: parseFloat(document.getElementById('screenSize').value) || 19,
        viewing_distance: parseFloat(document.getElementById('viewingDistance').textContent.replace(/[^0-9.]/g, '')) || (screenSize * 1.5 * 2.54),
        device_type: document.getElementById('deviceType').value,
        resolution_width: parseInt(document.getElementById('resolutionWidth').value) || 1920,
        resolution_height: parseInt(document.getElementById('resolutionHeight').value) || 1080,
    };
}

// Update startSession
function startSession() {
    const data = getFormData();

    // Validate essential inputs
    if (!data.screen_size || !data.viewing_distance || !data.resolution_width || !data.resolution_height) {
        alert('Please fill in all required fields (screen size, resolution, etc.)');
        return;
    }

    // Create a form and submit it
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/'; // The URL for start_page view

    // Add CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrfmiddlewaretoken';
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);

    // Add form data
    for (const [key, value] of Object.entries(data)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}// Global variables
let currentPage = 1;
let currentMode = 'training';
let speed = 500; // Default for training mode (ms)
let timeLimit = 120; // Default time limit (seconds)
let selectionTimeout = 1200; // Default selection timeout (ms)
let centralToSelectionGap = 500; // Default gap after central light (ms)
let selectionToCentralGap = 1000; // Default gap after selection (ms)
let screenSize = 19; // Default screen size (inches)
let viewingDistance = screenSize * 1.5 * 2.54; // Default viewing distance (cm)
let focusedElementIndex = 0;
let focusableElements = [];

// Update viewing distance based on screen size
function updateViewingDistance() {
    screenSize = parseFloat(document.getElementById('screenSize').value) || 19;
    viewingDistance = screenSize * 1.5 * 2.54; // 1.5 times screen size in inches, converted to cm
    document.getElementById('viewingDistance').textContent = `${viewingDistance.toFixed(1)} cm`;
}

// Update the list of focusable elements based on the current page
function updateFocusableElements() {
    const currentPageElement = document.getElementById(`page${currentPage}`);
    focusableElements = Array.from(currentPageElement.querySelectorAll('button, select, input'))
        .filter(element => element.offsetParent !== null && !element.disabled);

    console.log("Focusable elements in start:", focusableElements);

    if (focusableElements.length === 0) {
        focusedElementIndex = 0;
        return;
    }

    focusedElementIndex = Math.min(focusedElementIndex, focusableElements.length - 1);

    focusableElements.forEach((element, index) => {
        element.classList.remove('gamepad-focus');
        if (index === focusedElementIndex) {
            element.classList.add('gamepad-focus');
            element.focus();
        }
    });
}

// Show the specified page
function showPage(pageNumber) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    const page = document.getElementById(`page${pageNumber}`);
    if (page) {
        page.style.display = 'flex';
        currentPage = pageNumber;
        focusedElementIndex = 0;
        updateFocusableElements();
    }
}

// Update speed label based on mode
function updateSpeedLabel() {
    const speedLabel = document.getElementById('speedLabel');
    speedLabel.textContent = currentMode === 'training' ? 'Speed (ms):' : 'Speed (Hz):';
    speed = currentMode === 'training' ? 500 : 1; // Reset speed to default for the mode
    document.getElementById('speed').value = speed;
}

// Enter fullscreen and proceed to the next page
function enterFullscreenAndContinue() {
    const element = document.documentElement;
    const requestFullscreen = element.requestFullscreen || 
                             element.webkitRequestFullscreen || 
                             element.mozRequestFullScreen || 
                             element.msRequestFullscreen;

    if (requestFullscreen) {
        requestFullscreen.call(element).then(() => {
            console.log("Successfully entered fullscreen mode");
            if (currentPage === 1) {
                showPage(2);
            } else if (currentPage === 2) {
                showPage(3);
            } else if (currentPage === 3) {
                showPage(4);
            }
        }).catch(err => {
            console.error("Failed to enter fullscreen mode:", err);
            // Proceed anyway
            if (currentPage === 1) {
                showPage(2);
            } else if (currentPage === 2) {
                showPage(3);
            } else if (currentPage === 3) {
                showPage(4);
            }
        });
    } else {
        console.error("Fullscreen API is not supported in this browser");
        // Proceed anyway
        if (currentPage === 1) {
            showPage(2);
        } else if (currentPage === 2) {
            showPage(3);
        } else if (currentPage === 3) {
            showPage(4);
        }
    }
}

// Start the session
function startSession() {
    const data = getFormData();

    // Validate essential inputs
    if (!data.screen_size || !data.viewing_distance || !data.resolution_width || !data.resolution_height) {
        alert('Please fill in all required fields (screen size, resolution, etc.)');
        return;
    }

    // Create a form and submit it
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/'; // The URL for start_page view

    // Add CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrfmiddlewaretoken';
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);

    // Add form data
    for (const [key, value] of Object.entries(data)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}

function getFormData() {
    return {
        mode: currentMode,
        speed: speed,
        time_limit: timeLimit,
        selection_timeout: selectionTimeout,
        central_to_selection_gap: centralToSelectionGap,
        selection_to_central_gap: selectionToCentralGap,
        screen_size: parseFloat(document.getElementById('screenSize').value) || 19,
        viewing_distance: parseFloat(document.getElementById('viewingDistance').textContent.replace(/[^0-9.]/g, '')) || (screenSize * 1.5 * 2.54),
        device_type: document.getElementById('deviceType').value,
        resolution_width: parseInt(document.getElementById('resolutionWidth').value) || 1920,
        resolution_height: parseInt(document.getElementById('resolutionHeight').value) || 1080,
    };
}

// Keyboard input for navigation
document.addEventListener('keydown', (event) => {
    if (focusableElements.length > 0) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            focusedElementIndex = (focusedElementIndex + 1) % focusableElements.length;
            console.log("Navigating forward in start, new index:", focusedElementIndex);
            updateFocusableElements();
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            focusedElementIndex = (focusedElementIndex - 1 + focusableElements.length) % focusableElements.length;
            console.log("Navigating backward in start, new index:", focusedElementIndex);
            updateFocusableElements();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const focusedElement = focusableElements[focusedElementIndex];
            if (focusedElement) {
                focusedElement.click();
            }
        }
    }
});

// Initialize the first page
document.addEventListener('DOMContentLoaded', () => {
    showPage(1);
    updateViewingDistance();
    updateSpeedLabel();
});