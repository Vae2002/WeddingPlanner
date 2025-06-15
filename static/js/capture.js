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

    let currentFilename = null;
    let currentStream = null;
    let currentFacingMode = 'user'; // 'user' = front, 'environment' = back
    let photoSaved = false;
    let overlayIndex = 1; // 0 = no overlay, 1 = BG1.png, 2 = BG2.png

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

    // Start initial camera
    if (video) {
        startCamera(currentFacingMode);
    }

    // Initialize capture button visual feedback & overlay image on load
    if (overlayIndex === 0) {
        captureBtn.classList.add('overlay-off');
        captureBtn.classList.remove('overlay-on');
        overlayImg.style.display = 'none';
    } else {
        captureBtn.classList.add('overlay-on');
        captureBtn.classList.remove('overlay-off');
        overlayImg.style.display = 'block';
        overlayImg.src = overlayIndex === 1 ? 'static/images/BG1.png' : 'static/images/BG2.png';
    }

    // Switch camera button handler
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera(currentFacingMode);
        });
    }

    // Swipe detection on capture button to cycle overlay
    let touchStartX = null;
    let touchStartY = null;
    let touchMoved = false;

    captureBtn.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchMoved = false;
    });

    captureBtn.addEventListener('touchmove', (e) => {
        touchMoved = true;
    });

    captureBtn.addEventListener('touchend', (e) => {
        if (touchStartX === null || touchStartY === null) return;

        if (!touchMoved) {
            // No swipe, this is a tap, let the click handler do its job
            return;
        }

        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        const minSwipeDistance = 40;
        const maxVerticalMovement = 30;

        if (Math.abs(dx) > minSwipeDistance && Math.abs(dy) < maxVerticalMovement) {
            // Cycle overlay index: 0 → 1 → 2 → 0 ...
            overlayIndex = (overlayIndex + 1) % 3;

            if (overlayIndex === 0) {
                overlayImg.style.display = 'none';
                captureBtn.classList.add('overlay-off');
                captureBtn.classList.remove('overlay-on');
            } else {
                overlayImg.style.display = 'block';
                captureBtn.classList.add('overlay-on');
                captureBtn.classList.remove('overlay-off');
                overlayImg.src = overlayIndex === 1 ? 'static/images/BG1.png' : 'static/images/BG2.png';
            }

            // Reset touch coords
            touchStartX = null;
            touchStartY = null;
        }
    });

    // Capture photo handler
    if (captureBtn && canvas && video && modal && capturedImg) {
        if (!captureBtn.dataset.listenerAttached) {
            captureBtn.addEventListener('click', () => {
                console.log('Capture clicked');
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

                if (overlayIndex !== 0) {
                    const overlay = new Image();
                    overlay.src = overlayIndex === 1 ? 'static/images/BG1.png' : 'static/images/BG2.png';

                    overlay.onload = () => {
                        context.drawImage(overlay, 0, 0, canvas.width, canvas.height);

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
                    };
                } else {
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
                alert("Please wait a moment while your photo is saving...");
                return;
            }

            Loader.open();

            fetch(`/upload-to-drive/${currentFilename}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                Loader.close();
                currentFilename = null;
                photoSaved = false;
                modal.style.display = 'none';

                if (data.file_id) {
                    alert('Upload successful!\n\nPlease check explore tab to download your photo');
                } else {
                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                Loader.close();
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
