document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bg-audio');
    const video = document.getElementById('vidcall-video')
    const camStream = document.getElementById('vidcall-stream')
    const toggleCamBtn = document.getElementById('toggle-camera');
    const camContainer = document.querySelector('.vidcam-container');
    const cameraOffOverlay = document.getElementById('camera-off-overlay');
    
    function getQueryParam(key) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    }

    const type = getQueryParam('type') || 'video';
    let cameraOn = type !== 'voice';  // camera is off if type=voice
    setCameraIcon(cameraOn);


    function setCameraIcon(isOn) {
        const iconHTML = isOn
            ? `
            <!-- Camera Off Icon (strike-through) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="black" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M17 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5l5 5v-13l-5 5z"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="red" stroke-width="2"/>
            </svg>`
            : `
            <!-- Camera On Icon (no strike-through) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="black" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M17 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5l5 5v-13l-5 5z"/>
            </svg>`;

        toggleCamBtn.innerHTML = iconHTML;
    }


    toggleCamBtn.addEventListener('click', () => {
        if (cameraOn) {
            // Turn off camera
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
                currentStream = null;
            }

            if (camContainer) camContainer.style.display = "none";
            if (cameraOffOverlay) cameraOffOverlay.style.display = "flex";
            if (switchBtn) switchBtn.style.display = "none";

        } else {
            // Turn on camera
            if (camContainer) camContainer.style.display = "block";
            if (cameraOffOverlay) cameraOffOverlay.style.display = "none";
            if (switchBtn && /Mobi|Android/i.test(navigator.userAgent)) {
                switchBtn.style.display = 'block';
            }

            startCamera(currentFacingMode);
        }

        cameraOn = !cameraOn;
        setCameraIcon(cameraOn);
    });



    function getQueryParam(key) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    }

    const from = getQueryParam('from') || 'messenger'; // fallback
    
    // Handle background audio end
    if (audio) {
        audio.addEventListener('ended', () => {
            window.location.href = "/messenger";
        });
    }

        // Handle background audio end
    if (video) {
        video.addEventListener('ended', () => {
            window.location.href = from === 'home' ? "/home" : "/messenger";
        });
    }

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
            if (camStream) {
                camStream.srcObject = stream;
            }
        } catch (err) {
            console.error('Error starting camera:', err);
            alert('Camera access denied or not available.');
        }
    }

    if (camStream && cameraOn) {
        startCamera();
    } else {
        camContainer.style.display = "none";
        cameraOffOverlay.style.display = "flex";
    }



    // Flip camera
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera(currentFacingMode);
        });
    }
});
