document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const audio = document.getElementById('background-audio');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const response = await fetch('/login', { // <-- corrected endpoint
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.success) {
                // ✅ Login successful

                try {
                    if (audio) {
                        // Attempt to preload and play audio right after form submit (user interaction)
                        await audio.play();
                        console.log("Audio started");
                        localStorage.setItem('audioAllowed', 'true');
                    }
                } catch (err) {
                    console.warn("Audio play failed:", err);
                }

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/home';
                }, 300);
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
