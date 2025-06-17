document.addEventListener("DOMContentLoaded", async () => {
        const audio = document.getElementById('background-audio');
        if (!audio) return;

        if (localStorage.getItem('audioAllowed') === 'true') {
            try {
                await audio.play();
                console.log("Audio auto-played on home");
            } catch (err) {
                console.log("Autoplay failed on home:", err);
            }
        }
    });

document.body.addEventListener('click', () => {
    const audio = document.getElementById('background-audio');
    audio.play();
}, { once: true });  // 'once' ensures it only triggers once