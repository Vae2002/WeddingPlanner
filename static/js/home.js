document.querySelectorAll('.image-carousel').forEach((carousel, index) => {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextBtn = carousel.querySelector('.next');
    const prevBtn = carousel.querySelector('.prev');
    const dotsContainer = carousel.querySelector('.carousel-dots');

    if (!slides.length) return;

    let currentIndex = 0;
    const slideWidth = slides[0].offsetWidth;

    function updateCarousel() {
        track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'dot' + (i === currentIndex ? ' active' : '');
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel();
            });
            dotsContainer.appendChild(dot);
        });
    }

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    });

    window.addEventListener('resize', () => {
        updateCarousel(); // in case width changes
    });

    updateCarousel(); // initialize

  function initCarousel(carouselId, dotsId) {
      const carousel = document.getElementById(carouselId);
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      const dotsContainer = document.getElementById(dotsId);
      let currentIndex = 0;

      function update() {
          const slideWidth = slides[0].offsetWidth;
          track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
          dotsContainer.innerHTML = '';
          slides.forEach((_, i) => {
              const dot = document.createElement('button'); // Consistent element
              dot.className = 'dot' + (i === currentIndex ? ' active' : '');
              dot.addEventListener('click', () => {
                  currentIndex = i;
                  update();
              });
              dotsContainer.appendChild(dot);
          });
      }

      carousel.dataset.currentIndex = currentIndex;
      window.addEventListener('resize', update);
      update();
  }

  function prevSlide(carouselId) {
      const carousel = document.getElementById(carouselId);
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      let currentIndex = parseInt(carousel.dataset.currentIndex);
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      carousel.dataset.currentIndex = currentIndex;
      track.style.transform = `translateX(-${slides[0].offsetWidth * currentIndex}px)`;
      initCarousel(carouselId, carouselId.replace('carousel', 'dots'));
  }

  function nextSlide(carouselId) {
      const carousel = document.getElementById(carouselId);
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      let currentIndex = parseInt(carousel.dataset.currentIndex);
      currentIndex = (currentIndex + 1) % slides.length;
      carousel.dataset.currentIndex = currentIndex;
      track.style.transform = `translateX(-${slides[0].offsetWidth * currentIndex}px)`;
      initCarousel(carouselId, carouselId.replace('carousel', 'dots'));
  }

  // Initialize each manually
  window.addEventListener("DOMContentLoaded", () => {
      initCarousel('carousel-1', 'dots-1');
      initCarousel('carousel-2', 'dots-2');

      // Days left section
      const targetDate = new Date('2025-09-06');
      const today = new Date();
      targetDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const message = diffDays > 0 ? `${diffDays} days left` : `The big day has arrived or passed! 🎉`;
      document.getElementById('days-left-1').textContent = message;
      document.getElementById('days-left-2').textContent = message;
  });
});