console.log("JavaScript is connected.");

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bg-audio');
    if (audio) {
        audio.addEventListener('ended', () => {
            window.location.href = "/messenger";
        });
    }
});

const video = document.getElementById('camera-stream');
const canvas = document.getElementById('capture-canvas');
const captureBtn = document.getElementById('capture-btn');
const modal = document.getElementById('photo-modal');
const capturedImg = document.getElementById('captured-image-preview');
const shareBtn = document.getElementById('share-btn');
const cancelBtn = document.getElementById('cancel-btn');

let currentFilename = null;

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        alert('Camera access denied');
        console.error(err);
    }
}

captureBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    capturedImg.src = imageData;
    modal.style.display = 'flex';

    // Save image temporarily
    fetch('/save-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
    })
    .then(res => res.json())
    .then(data => {
        currentFilename = data.filename;
    });
});

shareBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    alert('Photo shared!');
    currentFilename = null; // already saved
});

cancelBtn.addEventListener('click', () => {
    if (currentFilename) {
        fetch(`/delete-photo/${currentFilename}`, {
            method: 'DELETE'
        }).then(() => {
            currentFilename = null;
            modal.style.display = 'none';
        });
    }
});

let currentStream = null;
let currentFacingMode = 'user'; // 'user' = front, 'environment' = back

const switchBtn = document.getElementById('switch-camera-btn');

// Show the switch button only on mobile
if (/Mobi|Android/i.test(navigator.userAgent)) {
    switchBtn.style.display = 'block';
}

// Start the camera
async function startCamera(facingMode = 'user') {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: facingMode } }
        });

        currentStream = stream;
        video.srcObject = stream;
    } catch (err) {
        console.error('Error starting camera:', err);
    }
}

// Flip camera when button is clicked
switchBtn.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startCamera(currentFacingMode);
});

startCamera(); // Initial start


