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

    // Show the switch button only on mobile
    if (switchBtn && /Mobi|Android/i.test(navigator.userAgent)) {
        switchBtn.style.display = 'block';
    }

    // Start the camera
    async function startCamera(facingMode = 'user') {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: facingMode } },
                audio: false
            });

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log('Camera stream ended.');
                window.location.href = "/messenger";
            });

            currentStream = stream;
            if (video) {
                video.srcObject = stream;
            }
        } catch (err) {
            console.error('Error starting camera:', err);
            alert('Camera access denied or not available.');
        }
    }

    // Initial camera start
    if (video) {
        startCamera();
    }


    // Flip camera
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera(currentFacingMode);
        });
    }

    // Capture photo
    if (captureBtn && canvas && video && modal && capturedImg) {
        captureBtn.addEventListener('click', () => {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = canvas.toDataURL('image/jpeg');
            capturedImg.src = imageData;
            modal.style.display = 'flex';

            fetch('/save-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            })
            .then(res => res.json())
            .then(data => {
                currentFilename = data.filename;
                console.log('Photo saved:', currentFilename);
            });
        });
    }

    // Share photo
    if (shareBtn && modal) {
    shareBtn.addEventListener('click', () => {
        fetch(`/upload-to-drive/${currentFilename}`, {
            method: 'POST'
        }).then(() => {
                    currentFilename = null;
                    modal.style.display = 'none';
                    alert('upload successful!');
                });
        })
    }
    // Cancel photo
    if (cancelBtn && modal) {
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
    }
});
