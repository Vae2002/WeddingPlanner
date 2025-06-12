document.body.addEventListener('click', () => {
    const audio = document.getElementById('background-audio');
    audio.play();
}, { once: true });  // 'once' ensures it only triggers once