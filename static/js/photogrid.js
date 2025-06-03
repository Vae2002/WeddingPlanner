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

    // scrollContainer.addEventListener('scroll', scrollHandler);

    // function scrollHandler() {
    //     console.log("Scroll event detected!");

    //     const scrollTop = scrollContainer.scrollTop;
    //     const scrollHeight = scrollContainer.scrollHeight;
    //     const clientHeight = scrollContainer.clientHeight;

    //     console.log("Scroll position:", scrollTop + clientHeight, "/", scrollHeight);

    //     if (scrollTop + clientHeight >= scrollHeight - 100) {
    //         console.log("Triggering loadMoreImages()");
    //         loadMoreImages();
    //     }
    // }

    // async function loadMoreImages() {
    //     if (loading) return;
    //     loading = true;

    //     document.getElementById('loading').classList.remove('hidden');

    //     try {
    //         const res = await fetch(`/load-more-images?page=${page}`);
    //         const data = await res.json();

    //         const grid = document.getElementById('photo-grid');
    //         data.images.forEach(img => {
    //             const div = document.createElement('div');
    //             div.className = 'grid-item';
    //             div.innerHTML = `
    //                 <div class="image-wrapper">
    //                     <img src="${img.url}" alt="Post" onclick="openModal('${img.url}')">
    //                     <a href="${img.url}" class="download-hover-button"
    //                        data-src="${img.url}"
    //                        onclick="downloadFromGrid(event)">⭳</a>
    //                 </div>`;
    //             grid.appendChild(div);
    //         });

    //         if (data.images.length > 0) {
    //             page += 1;
    //         } else {
    //             scrollContainer.removeEventListener('scroll', scrollHandler);
    //         }

    //     } catch (err) {
    //         console.error("Error loading images:", err);
    //     }

    //     document.getElementById('loading').classList.add('hidden');
    //     loading = false;
    // }
let nextToken = null;

const loadMoreImages = () => {
    if (loading) return;
    loading = true;

    const url = nextToken 
        ? `/load-more-images?page_token=${encodeURIComponent(nextToken)}`
        : `/load-more-images`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const grid = document.querySelector('.photo-grid');

            data.images.forEach(imgObj => {
                const src = imgObj.url;
                const div = document.createElement('div');
                div.className = 'grid-item';
                div.innerHTML = `
                    <div class="image-wrapper">
                        <img src="${src}" alt="Post" onclick="openModal('${src}')">
                        <a href="${src}" class="download-hover-button" data-src="${src}" onclick="downloadFromGrid(event)">⭳</a>
                    </div>`;
                grid.appendChild(div);
            });

            if (data.next_token) {
                nextToken = data.next_token;
            } else {
                observer.disconnect();  // Stop if no more images
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
    rootMargin: '200px',
});

observer.observe(document.getElementById('loading-trigger'));


});


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

