const pastelUsernameColors = [
  '#4A2C33', // dark muted pink
  '#5C4426', // dark muted orange
  '#2E5D5A', // dark teal
  '#2E4A26', // dark green
  '#5A591F', // dark mustard yellow
  '#473B4D', // dark purple
  '#5A2927', // dark red
];

const contrastingBackgrounds = [
  '#FFD1DC', // pastel pink
  '#FFB347', // pastel orange
  '#B2F7EF', // pastel turquoise
  '#C3FDB8', // pastel green
  '#F9F871', // pastel yellow
  '#CBAACB', // pastel purple
  '#FF6961', // pastel red
];

document.addEventListener('DOMContentLoaded', () => {
  Loader.open();
  fetch('/get-all-wishes')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error('Error from server:', data.error);
        return;
      }

      const wishesList = data.wishes;
      const container = document.getElementById('wishes-container');
      container.innerHTML = '<h2>All Wishes</h2>';

      if (wishesList.length === 0) {
        container.innerHTML += '<p>No wishes found.</p>';
        return;
      }

      wishesList.forEach(({username, wish}, index) => {
        const postDiv = document.createElement('div');
        postDiv.className = 'wish-post';

        postDiv.innerHTML = `
          <div class="wish-header">
            <span class="wish-username">@${username}</span>
          </div>
          <div class="wish-content">${wish}</div>
        `;

        const usernameColor = pastelUsernameColors[index % pastelUsernameColors.length];
        const backgroundColor = contrastingBackgrounds[index % contrastingBackgrounds.length];

        postDiv.style.backgroundColor = backgroundColor;

        const usernameSpan = postDiv.querySelector('.wish-username');
        usernameSpan.style.color = usernameColor;

        container.appendChild(postDiv);
      });
    })
    .catch(err => {
      console.error('Error fetching wishes:', err);
    })
    .finally(() => {
      Loader.close(); 
    });
});
