document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('capture-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const modal = document.getElementById('photo-modal');
    const capturedImg = document.getElementById('captured-image-preview');
    const shareBtn = document.getElementById('share-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const switchBtn = document.getElementById('switch-camera-btn');

    let currentFilename = null;
    let currentStream = null;
    let currentFacingMode = 'user'; // 'user' = front, 'environment' = back

    // Show the switch button only on mobile devices
    if (switchBtn && /Mobi|Android/i.test(navigator.userAgent)) {
        switchBtn.style.display = 'block';
    }

  async function startCamera(facingMode = 'user') {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 3840 },  // 4K width
                height: { ideal: 2160 }, // 4K height
                resizeMode: "none",      // Don't scale if not necessary (optional, not widely supported)
                frameRate: { ideal: 30, max: 60 } // High frame rate if supported
            },
            audio: false,
        });

        currentStream = stream;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
            if (currentFacingMode === 'user') {
                video.style.transform = 'scaleX(-1)';
                video.style.webkitTransform = 'scaleX(-1)';
            } else {
                video.style.transform = 'none';
                video.style.webkitTransform = 'none';
            }
        };

    } catch (err) {
        console.error('Error starting camera:', err);
        alert('Camera access denied or not available.');
    }
}


    // Start initial camera
    if (video) {
        startCamera(currentFacingMode);
    }

    // Switch camera button handler
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera(currentFacingMode);
        });
    }

    // Capture photo handler
    if (captureBtn && canvas && video && modal && capturedImg) {
        if (!captureBtn.dataset.listenerAttached) {
        captureBtn.addEventListener('click', () => {
            console.log('Capture clicked')
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (currentFacingMode === 'user') {
                // Mirror the image on canvas
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Reset transform matrix
            context.setTransform(1, 0, 0, 1, 0, 0);

            const imageData = canvas.toDataURL('image/jpeg');
            capturedImg.src = imageData;
            modal.style.display = 'flex';

            // Save photo to server
            fetch('/save-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
            })
                .then(res => res.json())
                .then(data => {
                    currentFilename = data.filename;
                });
        });
        captureBtn.dataset.listenerAttached = true;
        }
    }

    // Share photo
if (shareBtn && modal) {
    shareBtn.addEventListener('click', () => {
        Loader.open(); // ✅ Show loader

        fetch(`/upload-to-drive/${currentFilename}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            Loader.close(); // ✅ Hide loader

            currentFilename = null;
            modal.style.display = 'none';

            if (data.file_id) {
                alert('Upload successful!\n\nPlease check explore tab to download your photo');
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            Loader.close(); // ✅ Hide loader on error
            alert('Error during upload');
            console.error(err);
        });
    });
}

    // Cancel photo handler
    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => {
            if (!currentFilename) {
                modal.style.display = 'none';
                return;
            }

            fetch(`/delete-photo/${currentFilename}`, { method: 'DELETE' }).then(() => {
                currentFilename = null;
                modal.style.display = 'none';
            });
        });
    }
});
