document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    const modal = document.getElementById('imgModal');
    const modalImage = document.getElementById('modalImage');
    const downloadBtn = document.getElementById('downloadBtn');

    let imageList = [];
    let currentIndex = -1;

    function updateDownloadHandler(src) {
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
    }

    // Open modal using index directly
    function openModal(index) {
        currentIndex = index;
        modal.style.display = 'block';
        const src = imageList[currentIndex].src;
        modalImage.src = src;
        updateDownloadHandler(src);
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function showImage(index) {
        if (index >= 0 && index < imageList.length) {
            currentIndex = index;
            const src = imageList[currentIndex].src;
            modalImage.src = src;
            updateDownloadHandler(src);
        }
    }

    function nextImage(event) {
        event.stopPropagation();
        if (currentIndex < imageList.length - 1) {
            showImage(currentIndex + 1);
        }
    }

    function prevImage(event) {
        event.stopPropagation();
        if (currentIndex > 0) {
            showImage(currentIndex - 1);
        }
    }

    modal.addEventListener('click', function (e) {
        if (e.target.id === 'imgModal') {
            closeModal();
        }
    });

    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-prev').addEventListener('click', prevImage);
    document.querySelector('.modal-next').addEventListener('click', nextImage);

    // Attach modal open logic to grid images and assign data-index
    const images = document.querySelectorAll('.grid-image');
    images.forEach((img, index) => {
        img.dataset.index = index;  // Assign data-index
        imageList.push(img);
        img.addEventListener('click', () => openModal(index));  // Use index here
    });

    // Attach download handler to existing grid buttons (unchanged)
    document.querySelectorAll('.download-hover-button').forEach(btn => {
        btn.addEventListener('click', async function (event) {
            event.preventDefault();
            const src = this.getAttribute('data-src');
            const now = new Date();
            const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
            const extension = src.split('.').pop().split('?')[0];
            const fileName = `img_${timestamp}.${extension}`;

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
        });
    });

    // === Lazy load / infinite scroll ===

    const scrollContainer = document.querySelector('.photo-grid');
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
                        img.className = "grid-image";

                        img.onload = () => {
                            div.innerHTML = `
                                <div class="image-wrapper">
                                    <img src="${src}" alt="Post" class="grid-image">
                                    <a href="${src}" class="download-hover-button" data-src="${src}">⭳</a>
                                </div>`;
                            grid.appendChild(div);

                            // Add newly loaded image to imageList and bind event
                            const newImg = div.querySelector('.grid-image');
                            newImg.dataset.index = imageList.length; // Assign next index
                            imageList.push(newImg);
                            // === FIX HERE: cast dataset.index to number before passing ===
                            newImg.addEventListener('click', () => openModal(Number(newImg.dataset.index)));

                            const newBtn = div.querySelector('.download-hover-button');
                            newBtn.addEventListener('click', async function (event) {
                                event.preventDefault();
                                const now = new Date();
                                const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
                                const extension = src.split('.').pop().split('?')[0];
                                const fileName = `img_${timestamp}.${extension}`;

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
                            });

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
