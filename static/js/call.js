document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bg-audio');
    const video = document.getElementById('vidcall-video')

    // Handle background audio end
    if (audio) {
        audio.addEventListener('ended', () => {
            window.location.href = "/messenger";
        });
    }

        // Handle background audio end
    if (video) {
        video.addEventListener('ended', () => {
            window.location.href = "/messenger";
        });
    }
});
