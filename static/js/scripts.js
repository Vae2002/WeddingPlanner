console.log("JavaScript is connected.");

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bg-audio');
    if (audio) {
        audio.addEventListener('ended', () => {
            window.location.href = "/messenger";
        });
    }
});
