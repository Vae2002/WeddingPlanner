function clearAudioTime() {
  localStorage.removeItem('bgAudioTime');
  console.log('bgAudioTime removed');
}

// Run on initial load
clearAudioTime();

// Also run when page is shown (including from bfcache)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    clearAudioTime();
  }
});
