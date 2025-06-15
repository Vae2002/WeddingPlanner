document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('capture-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const modal = document.getElementById('photo-modal');
    const capturedImg = document.getElementById('captured-image-preview');
    const shareBtn = document.getElementById('share-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const switchBtn = document.getElementById('switch-camera-btn');
    const overlayImg = document.getElementById('frame-overlay');
    const nextBtn = document.getElementById('next-overlay-btn');
    const prevBtn = document.getElementById('prev-overlay-btn');

    const overlays = [
        null,
        'static/images/BG1.png',
        'static/images/BG2.png'
        // Add more overlays as needed
    ];

    let overlayIndex = 1;
    let currentFilename = null;
    let currentStream = null;
    let currentFacingMode = 'user';
    let photoSaved = false;

    // Helpers
    function updateOverlay() {
        if (overlayIndex === 0 || overlays[overlayIndex] == null) {
            overlayImg.style.display = 'none';
            captureBtn.classList.add('overlay-off');
            captureBtn.classList.remove('overlay-on');
        } else {
            overlayImg.src = overlays[overlayIndex];
            overlayImg.style.display = 'block';
            captureBtn.classList.add('overlay-on');
            captureBtn.classList.remove('overlay-off');
        }
    }

    // Show switch button only on mobile
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
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                    resizeMode: "none",
                    frameRate: { ideal: 30, max: 60 }
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

    // Start camera and set initial overlay
    if (video) {
        startCamera(currentFacingMode);
        updateOverlay();
    }

    // Switch camera
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera(currentFacingMode);
        });
    }

    // Add button handlers for overlay switching
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            overlayIndex = (overlayIndex + 1) % overlays.length;
            updateOverlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            overlayIndex = (overlayIndex - 1 + overlays.length) % overlays.length;
            updateOverlay();
        });
    }

        // ✅ NEW: Add keyboard arrow navigation for overlays
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            overlayIndex = (overlayIndex + 1) % overlays.length;
            updateOverlay();
        } else if (e.key === 'ArrowLeft') {
            overlayIndex = (overlayIndex - 1 + overlays.length) % overlays.length;
            updateOverlay();
        }
    });

    // Optional: swipe gesture to change overlays
    let touchStartX = null;
    let touchStartY = null;
    let touchMoved = false;

    captureBtn.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchMoved = false;
    });

    captureBtn.addEventListener('touchmove', () => {
        touchMoved = true;
    });

    captureBtn.addEventListener('touchend', (e) => {
        if (!touchMoved) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const minSwipe = 40;

        if (Math.abs(dx) > minSwipe && Math.abs(dy) < 30) {
            overlayIndex = dx > 0
                ? (overlayIndex - 1 + overlays.length) % overlays.length
                : (overlayIndex + 1) % overlays.length;
            updateOverlay();
        }
    });

    // Capture photo
    if (captureBtn && canvas && video && modal && capturedImg) {
        if (!captureBtn.dataset.listenerAttached) {
            captureBtn.addEventListener('click', () => {
                photoSaved = false;

                const frameAspectRatio = 9 / 16;
                const streamWidth = video.videoWidth;
                const streamHeight = video.videoHeight;
                const actualAspectRatio = streamWidth / streamHeight;

                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

                if (actualAspectRatio > frameAspectRatio) {
                    drawHeight = streamHeight;
                    drawWidth = streamHeight * frameAspectRatio;
                    offsetX = (streamWidth - drawWidth) / 2;
                } else {
                    drawWidth = streamWidth;
                    drawHeight = streamWidth / frameAspectRatio;
                    offsetY = (streamHeight - drawHeight) / 2;
                }

                canvas.width = 1080;
                canvas.height = 1920;

                const context = canvas.getContext('2d');

                if (currentFacingMode === 'user') {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }

                context.drawImage(
                    video,
                    offsetX, offsetY, drawWidth, drawHeight,
                    0, 0, canvas.width, canvas.height
                );

                context.setTransform(1, 0, 0, 1, 0, 0);

                if (overlayIndex !== 0 && overlays[overlayIndex]) {
                    const overlay = new Image();
                    overlay.src = overlays[overlayIndex];
                    overlay.onload = () => {
                        context.drawImage(overlay, 0, 0, canvas.width, canvas.height);
                        saveAndShow();
                    };
                } else {
                    saveAndShow();
                }

                function saveAndShow() {
                    const imageData = canvas.toDataURL('image/jpeg');
                    capturedImg.src = imageData;
                    modal.style.display = 'flex';

                    fetch('/save-photo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData }),
                    })
                        .then(res => res.json())
                        .then(data => {
                            currentFilename = data.filename;
                            photoSaved = true;
                        });
                }
            });

            captureBtn.dataset.listenerAttached = true;
        }
    }

    // Share photo
    if (shareBtn && modal) {
        shareBtn.addEventListener('click', () => {
            if (!photoSaved || !currentFilename) {
                alert("Please wait while your photo saves...");
                return;
            }

            Loader.open();

            fetch(`/upload-to-drive/${currentFilename}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    Loader.close();
                    currentFilename = null;
                    photoSaved = false;
                    modal.style.display = 'none';

                    alert(data.file_id
                        ? 'Upload successful! Check the Explore tab.'
                        : 'Upload failed: ' + (data.error || 'Unknown error'));
                })
                .catch(err => {
                    Loader.close();
                    alert('Error during upload');
                    console.error(err);
                });
        });
    }

    // Cancel photo
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
