document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    // === Close Modal on Background Click or Close Button ===
    document.getElementById('imgModal').addEventListener('click', function (e) {
        if (e.target.id === 'imgModal' || e.target.classList.contains('modal-close')) {
            this.style.display = "none";
        }
    });

    const scrollContainer = document.querySelector('.photo-grid');
    let page = 1;
    let loading = false;

let nextToken = null;

const loadMoreImages = () => {
    if (loading) return;
    loading = true;
    console.log("Loading more images...");

    const url = nextToken
        ? `/load-more-images?page_token=${encodeURIComponent(nextToken)}`
        : `/load-more-images`;

    const grid = document.querySelector('.photo-grid');
    const trigger = document.getElementById('grid-end-trigger');

    // Remove trigger before updating DOM
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
                    div.innerHTML = `
                        <div class="image-wrapper aspect-ratio-box">
                            <div class="aspect-ratio-content"></div>
                        </div>
                    `;
                    grid.appendChild(div);

                    const img = new Image();
                    img.src = src;
                    img.alt = "Post";

                    img.onload = () => {
                        div.innerHTML = `
                            <div class="image-wrapper aspect-ratio-box">
                                <div class="aspect-ratio-content">
                                    <img src="${src}" alt="Post" onclick="openModal('${src}')">
                                    <a href="${src}" class="download-hover-button" data-src="${src}" onclick="downloadFromGrid(event)">⭳</a>
                                </div>
                            </div>`;
                        div.classList.remove('loading');
                        resolve();
                    };

                    img.onerror = () => {
                        div.remove();
                        console.error("Image failed to load:", src);
                        resolve(); // Still resolve so all promises can complete
                    };
                });
            });

            return Promise.all(loadPromises).then(() => data); // pass data forward
        })
        .then(data => {
            // Re-append and observe trigger
            const newTrigger = document.createElement('div');
            newTrigger.id = 'grid-end-trigger';
            newTrigger.className = 'grid-end-trigger';
            grid.appendChild(newTrigger);
            observer.observe(newTrigger);

            if (data.next_token) {
                nextToken = data.next_token;
            } else {
                observer.disconnect(); // No more images
            }

            loading = false;
        })
        .catch(err => {
            console.error("Error loading more images:", err);
            loading = false;
        });
};


const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        console.log("IntersectionObserver entry:", entry.target.id, "isIntersecting:", entry.isIntersecting);
    });

    if (entries[0].isIntersecting) {
        console.log("Trigger intersecting and user scrolled, loading more images...");
        loadMoreImages();
    }
}, {
    root: document.querySelector('.photo-grid'),
    // root: null, // Use viewport as root
    rootMargin: '0px 0px 200px 0px',
});

const triggerEl = document.getElementById('grid-end-trigger');
observer.observe(triggerEl);

});

function moveTriggerToEnd() {
    const grid = document.querySelector('.photo-grid');
    const trigger = document.getElementById('grid-end-trigger');

    if (trigger && trigger.parentNode) {
        observer.unobserve(trigger);
        trigger.parentNode.removeChild(trigger);
        grid.appendChild(trigger);
        observer.observe(trigger);
    }
}


function openModal(src) {
    const modal = document.getElementById('imgModal');
    const modalImage = document.getElementById('modalImage');
    const downloadBtn = document.getElementById('downloadBtn');

    modal.style.display = 'block';
    modalImage.src = src;
    downloadBtn.href = src; 

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); 
    const extension = src.split('.').pop().split('?')[0]; // handles jpg, jpeg, png, etc.
    const fileName = `img_${timestamp}.${extension}`;

     downloadBtn.onclick = async function (e) {
        e.preventDefault(); // stop default <a href>

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

function closeModal() {
    document.getElementById('imgModal').style.display = 'none';
}


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

