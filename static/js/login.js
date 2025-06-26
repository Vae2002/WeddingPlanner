document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const response = await fetch('/login', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (data.success) {
                // ✅ Temporarily create and play audio to enable autoplay on next page
                const tempAudio = new Audio('/static/audio/background_song.mp3');
                tempAudio.loop = true;
                try {
                    await tempAudio.play();
                    console.log("Temp audio started to enable autoplay");
                    localStorage.setItem('audioAllowed', 'true');
                } catch (err) {
                    console.warn("Temp audio play failed:", err);
                }

                setTimeout(() => {
                    window.location.href = '/home';
                }, 100);
            } else {
                errorMsg.textContent = data.error || 'Login failed';
            }

        } catch (err) {
            console.error('Error:', err);
            errorMsg.textContent = 'Something went wrong.';
        }
    });
});

// Clear audio time on new page load
function clearAudioTime() {
    localStorage.removeItem('bgAudioTime');
    console.log('bgAudioTime removed');
}

clearAudioTime();

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        clearAudioTime();
    }
});
