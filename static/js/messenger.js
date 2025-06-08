document.addEventListener('DOMContentLoaded', () => {
  const questions = [
    "Please enter your name",
    "Are you coming?",
    "How many people are attending?",
    "Any wishes for the bride & groom?",
    "Are you sure with your wishes?"
  ];

  const onlineAnswers = [
    "No",
    "Yes, I will be attending online",
    "I'm still not sure"
  ];

  const answers = [];
  let currentQuestion = 1;
  let stopAsking = false;
  let counter = 1;
  let maxPerson = 1;
  let isOnlineUser = false;

  const chatBox = document.getElementById('chat-box');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const submitCounterBtn = document.getElementById('submit-counter');
  const buttonAnswers = document.getElementById('button-answers');
  const counterControls = document.getElementById('counter-controls');
  const noThanksBtn = document.getElementById('no-thanks-btn');
  const counterDisplay = counterControls.querySelector('.num');

  async function initChat() {
    try {
      // Fetch user info (including max_person)
      const res = await fetch('/get-user-info');
      const data = await res.json();
      isOnlineUser = data.is_online === 1;
      // Set maxPerson from the same payload
      maxPerson = typeof data.max_person === 'number' ? data.max_person : 1;
      counter = 1;

      // Tweak the first question
      questions[1] = isOnlineUser
        ? "Will you be attending online?"
        : "Are you coming?";

      // Initialize UI state
      counterDisplay.textContent = counter;
      if (maxPerson <= 1) {
        counterControls.querySelector('.plus').disabled = true;
        counterControls.querySelector('.minus').disabled = true;
        submitCounterBtn.disabled = true;
      }

      if (isOnlineUser) {
        // Pre-build online-only answers
        buttonAnswers.innerHTML = '';
        onlineAnswers.forEach(ans => {
          const btn = document.createElement('button');
          btn.textContent = ans;
          btn.setAttribute('data-answer', ans);
          buttonAnswers.appendChild(btn);
          btn.addEventListener('click', () => handleAnswerSubmit(ans));
        });
      }
    } catch (err) {
      console.error('Initialization error:', err);
    }
    askNextQuestion();
  }

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
      disableInputs();
      return;
    }
    appendMessage(questions[currentQuestion], 'question');
    // hide all inputs by default
    buttonAnswers.style.display = 'none';
    counterControls.style.display = 'none';
    answerInput.style.display = 'none';
    submitBtn.style.display = 'none';
    noThanksBtn.style.display = 'none';

    if (currentQuestion === 1) {
      buttonAnswers.style.display = 'inline-block';
      if (!isOnlineUser) {
        buttonAnswers.innerHTML = `
          <button data-answer="Yes">Yes</button>
          <button data-answer="No">No</button>
          <button data-answer="I'm still not sure">I'm still not sure</button>
          <button data-answer="I will be attending online">I will be attending online</button>
        `;
        buttonAnswers.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => handleAnswerSubmit(btn.getAttribute('data-answer')));
        });
      }
    } else if (currentQuestion === 2) {
      counterControls.style.display = 'flex';
    } else if (currentQuestion === 3) {
      answerInput.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
      noThanksBtn.style.display = 'inline-block';
    } else if (currentQuestion === 4) {
      buttonAnswers.style.display = 'inline-block';
      buttonAnswers.innerHTML = `
        <button data-answer="Yes, share my wishes">Yes, share my wishes</button>
        <button data-answer="No, I'd like to edit my wishes">No, I'd like to edit my wishes</button>
      `;
      buttonAnswers.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => handleAnswerSubmit(btn.getAttribute('data-answer')));
      });
    }
  }

  function handleAnswerSubmit(answer) {
    if (!answer) return;
    appendMessage(answer, 'answer');
    answers.push({ question: questions[currentQuestion], answer });
    // handle branching logic as before...
    currentQuestion++;
    setTimeout(askNextQuestion, 500);
  }

  function disableInputs() {
    answerInput.disabled = true;
    submitBtn.disabled = true;
    noThanksBtn.disabled = true;
    buttonAnswers.querySelectorAll('button').forEach(btn => btn.disabled = true);
    submitCounterBtn.disabled = true;
  }

  // Counter controls always attached
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

  // Text input event handlers
  submitBtn.addEventListener('click', () => {
    handleAnswerSubmit(answerInput.value.trim());
    answerInput.value = '';
  });
  answerInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAnswerSubmit(answerInput.value.trim());
      answerInput.value = '';
    }
  });
  noThanksBtn.addEventListener('click', () => handleAnswerSubmit("No"));

  initChat();
});
