document.addEventListener('DOMContentLoaded', () => {
  const questions = [
    "Are you coming?",
    "How many people are attending?",
    "Any wishes for the bride & groom?",
    "Are you sure with your wishes?"
  ];

  const onlineAnswers = [ // Only these buttons for online users
    "No",
    "Yes, I will be attending online",
    "I'm still not sure"
  ];

  const answers = [];
  let currentQuestion = 0;
  let stopAsking = false;
  let counter = 0;
  let maxPerson = 1; // default max
  let isOnlineUser = false; // track if user is online

  const chatBox = document.getElementById('chat-box');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const submitCounterBtn = document.getElementById('submit-counter');
  const buttonAnswers = document.getElementById('button-answers');
  const counterControls = document.getElementById('counter-controls');
  const noThanksBtn = document.getElementById('no-thanks-btn');
  const counterDisplay = counterControls.querySelector('.num');

  // Fetch full user info first
  fetch('/get-user-info')
  .then(response => response.json())
  .then(data => {
    isOnlineUser = data.is_online === 1;

    if (isOnlineUser) {
      // Change first question for online users
      questions[0] = "Will you be attending online?";

      // Restrict buttons for question 0
      buttonAnswers.innerHTML = ''; // Clear old buttons
      onlineAnswers.forEach(ans => {
        const btn = document.createElement('button');
        btn.textContent = ans;
        btn.setAttribute('data-answer', ans);
        buttonAnswers.appendChild(btn);

        btn.addEventListener('click', () => {
          handleAnswerSubmit(ans);
        });
      });
    } else {
      // Not online - keep original question and fetch max person
      questions[0] = "Are you coming?";

      fetch('/get-max-person')
        .then(resp => resp.json())
        .then(data => {
          if (data.max_person !== undefined) {
            maxPerson = data.max_person;
            counter = 1;
            counterDisplay.textContent = counter;

            if (maxPerson <= 1) {
              counterControls.querySelector('.plus').disabled = true;
              counterControls.querySelector('.minus').disabled = true;
              submitCounterBtn.disabled = true;
            }
          }
        })
        .catch(err => {
          console.error('Error fetching max person:', err);
        });
    }

    askNextQuestion(); // Start chat after user info loaded
  })
  .catch(err => {
    console.error('Error fetching user info:', err);
    askNextQuestion(); // fallback start chat anyway
  });


  function appendMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function askNextQuestion() {
    if (stopAsking || currentQuestion >= questions.length) {
      appendMessage("Thank you for your responses! ❤️", 'question');

      fetch('/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      }).then(res => res.json()).then(res => {
        if (res.status === 'success') {
          const wishesButton = document.createElement('button');
          wishesButton.textContent = "View all wishes 💌";
          wishesButton.className = 'redirect-button';
          wishesButton.addEventListener('click', () => {
            window.location.href = "/wishes";  // You must define this route in Flask
          });
          chatBox.appendChild(wishesButton);
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      });

      disableInputs();
      return;
    }

    appendMessage(questions[currentQuestion], 'question');

    // Reset UI
    buttonAnswers.style.display = 'none';
    counterControls.style.display = 'none';
    answerInput.style.display = 'none';
    submitBtn.style.display = 'none';
    noThanksBtn.style.display = 'none';

    if (currentQuestion === 0) {
      buttonAnswers.style.display = 'inline-block';
      if (!isOnlineUser) {
        buttonAnswers.innerHTML = `
          <button data-answer="Yes">Yes</button>
          <button data-answer="No">No</button>
          <button data-answer="I'm still not sure">I'm still not sure</button>
          <button data-answer="I will be attending online">I will be attending online</button>
        `;
        buttonAnswers.querySelectorAll('button').forEach(button => {
          button.addEventListener('click', () => {
            handleAnswerSubmit(button.getAttribute('data-answer'));
          });
        });
      }
    } else if (currentQuestion === 1) {
      counterControls.style.display = 'flex';
    } else if (currentQuestion === 2) {
      answerInput.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
      noThanksBtn.style.display = 'inline-block';
    } else if (currentQuestion === 3) {
      buttonAnswers.style.display = 'inline-block';
      buttonAnswers.innerHTML = `
        <button data-answer="Yes">Yes</button>
        <button data-answer="No, I'd like to share my wishes">No, I'd like to share my wishes</button>
      `;
      buttonAnswers.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
          handleAnswerSubmit(button.getAttribute('data-answer'));
        });
      });
    }
  }

  function handleAnswerSubmit(answer) {
    if (!answer) return;

    appendMessage(answer, 'answer');
    answers.push({ question: questions[currentQuestion], answer });

    if (currentQuestion === 0) {
      const lower = answer.toLowerCase();
      if (lower === 'no') {
        appendMessage("We would still be delighted to have you join our online reception. 💌", 'question');
        stopAsking = true;
      } else if (["i will be attending online", "yes, i will be attending online"].includes(lower)) {
        appendMessage("We look forward to seeing you online! 💌", 'question');
        currentQuestion = 2; // Skip to wishes
        setTimeout(askNextQuestion, 500);
        return;
      } else if (lower === "i'm still not sure") {
        appendMessage("We kindly ask you to confirm your attendance by 22 August 2025 at the latest. 💌", 'question');
        stopAsking = true;
      }
    }

    if (currentQuestion === 3) {
      if (answer.toLowerCase() === "no, i'd like to share my wishes") {
        answers.splice(2, 1); // Remove previous wishes
        currentQuestion = 2;  // Go back to edit wishes
        setTimeout(askNextQuestion, 500);
        return;
      }
    }

    currentQuestion++;

    if (currentQuestion === questions.length) {
      answerInput.style.display = 'none';
      submitBtn.style.display = 'none';
      noThanksBtn.style.display = 'none';
      counterControls.style.display = 'none';
      buttonAnswers.style.display = 'none';
    }

    setTimeout(askNextQuestion, 500);
  }


  function disableInputs() {
    answerInput.disabled = true;
    submitBtn.disabled = true;
    noThanksBtn.disabled = true;
    buttonAnswers.querySelectorAll('button').forEach(btn => btn.disabled = true);
    submitCounterBtn.disabled = true;
  }

  // Event listeners for inputs/counter remain the same as before...

  submitBtn.addEventListener('click', () => {
    handleAnswerSubmit(answerInput.value.trim());
    answerInput.value = '';
  });

  answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAnswerSubmit(answerInput.value.trim());
      answerInput.value = '';
    }
  });

  noThanksBtn.addEventListener('click', () => {
    handleAnswerSubmit("No");
  });

  counterControls.querySelector('.plus').addEventListener('click', () => {
    if (counter < maxPerson) {
      counter++;
      counterDisplay.textContent = counter;
    }
  });

  counterControls.querySelector('.minus').addEventListener('click', () => {
    if (counter > 1) {
      counter--;
      counterDisplay.textContent = counter;
    }
  });

  submitCounterBtn.addEventListener('click', () => {
    handleAnswerSubmit(`${counter}`);
    counter = 1;
    counterDisplay.textContent = counter;
  });

});