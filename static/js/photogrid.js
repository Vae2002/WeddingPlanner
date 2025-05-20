document.addEventListener("DOMContentLoaded", function () {
    // Add click listeners to all images inside .photo-grid
    document.querySelectorAll('.photo-grid img').forEach(img => {
        img.addEventListener('click', function () {
            const modal = document.getElementById('imgModal');
            const modalImg = document.getElementById('modalImage');
            modalImg.src = this.src;
            modal.style.display = "block";
        });
    });

    // Close modal when clicking outside the image or on close button
    document.getElementById('imgModal').addEventListener('click', function (e) {
        // Only close if clicked outside the image (not the image itself)
        if (e.target.id === 'imgModal' || e.target.classList.contains('modal-close')) {
            this.style.display = "none";
        }
    });
});