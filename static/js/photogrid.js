document.addEventListener("DOMContentLoaded", function () {

    // Close modal when clicking outside the image or on close button
    document.getElementById('imgModal').addEventListener('click', function (e) {
        // Only close if clicked outside the image (not the image itself)
        if (e.target.id === 'imgModal' || e.target.classList.contains('modal-close')) {
            this.style.display = "none";
        }
    });
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