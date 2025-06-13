document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    const modal = document.getElementById('imgModal');
    const modalImage = document.getElementById('modalImage');
    const downloadBtn = document.getElementById('downloadBtn');

    let imageList = [];
    let currentIndex = -1;

    function updateImageList() {
        imageList = Array.from(document.querySelectorAll('.photo-grid .grid-item img'));
    }

    window.openModal = function (src) {
        updateImageList(); // update the list when opening modal

        modal.style.display = 'block';
        modalImage.src = src;
        downloadBtn.href = src;

        currentIndex = imageList.findIndex(img => img.src === src);

        // update download file name logic
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const extension = src.split('.').pop().split('?')[0];
        const fileName = `img_${timestamp}.${extension}`;

        downloadBtn.onclick = async function (e) {
            e.preventDefault();
            try {
                const response = await fetch(src);
                const blob = await response.blob();

                const blobUrl = URL.createObjectURL(blob);
                const tempLink = document.createElement('a');
                tempLink.href = blobUrl;
                tempLink.download = fileName;
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                URL.revokeObjectURL(blobUrl);
            } catch (err) {
                alert("Download failed.");
                console.error(err);
            }
        };
    };

    window.closeModal = function () {
        modal.style.display = 'none';
    };

    window.nextImage = function (event) {
        event.stopPropagation();
        if (currentIndex < imageList.length - 1) {
            showImage(currentIndex + 1);
        }
    };

    window.prevImage = function (event) {
        event.stopPropagation();
        if (currentIndex > 0) {
            showImage(currentIndex - 1);
        }
    };

    function showImage(index) {
        if (index >= 0 && index < imageList.length) {
            currentIndex = index;
            const newSrc = imageList[currentIndex].src;
            modalImage.src = newSrc;
            downloadBtn.href = newSrc;
        }
    }

    // Close modal on background or close button click
    modal.addEventListener('click', function (e) {
        if (e.target.id === 'imgModal' || e.target.classList.contains('modal-close')) {
            closeModal();
        }
    });

    // === Lazy load / infinite scroll ===
    const scrollContainer = document.querySelector('.photo-grid');
    let page = 1;
    let loading = false;
    let nextToken = null;

    const loadMoreImages = () => {
        if (loading) return;
        loading = true;

        const url = nextToken
            ? `/load-more-images?page_token=${encodeURIComponent(nextToken)}`
            : `/load-more-images`;

        const grid = document.querySelector('.photo-grid');
        const trigger = document.getElementById('grid-end-trigger');

        if (trigger && trigger.parentNode) {
            observer.unobserve(trigger);
            trigger.remove();
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                const loadPromises = data.images.map(imgObj => {
                    return new Promise(resolve => {
                        const src = imgObj.url;
                        const div = document.createElement('div');
                        div.className = 'grid-item';

                        const img = new Image();
                        img.src = src;
                        img.alt = "Post";

                        img.onload = () => {
                            div.innerHTML = `
                                <div class="image-wrapper">
                                    <img src="${src}" alt="Post" onclick="openModal('${src}')">
                                    <a href="${src}" class="download-hover-button" data-src="${src}" onclick="downloadFromGrid(event)">⭳</a>
                                </div>`;
                            grid.appendChild(div);
                            resolve();
                        };

                        img.onerror = () => {
                            div.remove();
                            console.error("Image failed to load:", src);
                            resolve();
                        };
                    });
                });

                return Promise.all(loadPromises).then(() => data);
            })
            .then(data => {
                const newTrigger = document.createElement('div');
                newTrigger.id = 'grid-end-trigger';
                newTrigger.className = 'grid-end-trigger';
                scrollContainer.appendChild(newTrigger);
                observer.observe(newTrigger);

                if (data.next_token) {
                    nextToken = data.next_token;
                } else {
                    observer.disconnect();
                }

                updateImageList(); // refresh the global list
                loading = false;
            })
            .catch(err => {
                console.error("Error loading more images:", err);
                loading = false;
            });
    };

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMoreImages();
        }
    }, {
        root: document.querySelector('.photo-grid'),
        rootMargin: '0px 0px 200px 0px',
    });

    const triggerEl = document.getElementById('grid-end-trigger');
    observer.observe(triggerEl);
});

// Global function (outside DOMContentLoaded) to allow inline onclick
function downloadFromGrid(event) {
    event.preventDefault();
    const src = event.currentTarget.getAttribute('data-src');

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const extension = src.split('.').pop().split('?')[0];
    const fileName = `img_${timestamp}.${extension}`;

    fetch(src)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.download = fileName;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            alert("Download failed.");
            console.error(err);
        });
}
