document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bg-audio');
    const video = document.getElementById('vidcall-video')
    const camStream = document.getElementById('vidcall-stream')

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

    // Initial camera start
    if (camStream) {
        startCamera();
    }


    // Flip camera
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera(currentFacingMode);
        });
    }
});
