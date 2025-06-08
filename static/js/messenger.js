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
  let currentQuestion;
  let stopAsking = false;
  let counter = 1;
  let maxPerson = 1;
  let isOnlineUser = false;
  let isGroup = false;

  const chatBox = document.getElementById('chat-box');
  const nameInput = document.getElementById('name-input');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const submitCounterBtn = document.getElementById('submit-counter');
  const buttonAnswers = document.getElementById('button-answers');
  const counterControls = document.getElementById('counter-controls');
  const noThanksBtn = document.getElementById('no-thanks-btn');
  const counterDisplay = counterControls.querySelector('.num');

  async function initChat() {
    try {
      const res = await fetch('/get-user-info');
      const data = await res.json();
      isGroup = data.is_group === 1;
      isOnlineUser = data.is_online === 1;
      maxPerson = typeof data.max_person === 'number' ? data.max_person : 1;

      // Start at name entry if group, else attendance
      currentQuestion = isGroup ? 0 : 1;

      questions[1] = isOnlineUser ? "Will you be attending online?" : "Are you coming?";

      counterDisplay.textContent = counter;
      if (maxPerson <= 1) {
        counterControls.querySelector('.plus').disabled = true;
        counterControls.querySelector('.minus').disabled = true;
        submitCounterBtn.disabled = true;
      }

      if (isOnlineUser) {
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
      console.error('Init error:', err);
      currentQuestion = 1;
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

    // hide all inputs
    nameInput.style.display = 'none';
    buttonAnswers.style.display = 'none';
    counterControls.style.display = 'none';
    answerInput.style.display = 'none';
    submitBtn.style.display = 'none';
    noThanksBtn.style.display = 'none';

    if (currentQuestion === 0) {
      // Name input
      nameInput.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
      submitBtn.onclick = () => {
        const name = nameInput.value.trim();
        if (!name) return;
        appendMessage(name, 'answer');
        answers.push({ question: questions[0], answer: name });
        nameInput.value = '';
        currentQuestion++;
        setTimeout(askNextQuestion, 500);
      };
    } else if (currentQuestion === 1) {
      // Attendance
      buttonAnswers.style.display = 'inline-block';
      if (!isOnlineUser) {
        buttonAnswers.innerHTML = `
          <button data-answer="Yes">Yes</button>
          <button data-answer="No">No</button>
          <button data-answer="I'm still not sure">I'm still not sure</button>
          <button data-answer="I will be attending online">I will be attending online</button>
        `;
        buttonAnswers.querySelectorAll('button').forEach(btn => {
          btn.onclick = () => handleAnswerSubmit(btn.getAttribute('data-answer'));
        });
      }
    } else if (currentQuestion === 2) {
      // Guest count
      counterControls.style.display = 'flex';
    } else if (currentQuestion === 3) {
      // Wishes input
      answerInput.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
      noThanksBtn.style.display = 'inline-block';
    } else if (currentQuestion === 4) {
      // Confirm wishes
      buttonAnswers.style.display = 'inline-block';
      buttonAnswers.innerHTML = `
        <button data-answer="Yes, share my wishes">Yes, share my wishes</button>
        <button data-answer="No, I'd like to edit my wishes">No, I'd like to edit my wishes</button>
      `;
      buttonAnswers.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => handleAnswerSubmit(btn.getAttribute('data-answer'));
      });
    }
  }

  function handleAnswerSubmit(answer) {
    if (!answer) return;
    appendMessage(answer, 'answer');
    answers.push({ question: questions[currentQuestion], answer });
    currentQuestion++;
    setTimeout(askNextQuestion, 500);
  }

  function disableInputs() {
    [nameInput, answerInput, submitBtn, noThanksBtn].forEach(el => el.disabled = true);
    buttonAnswers.querySelectorAll('button').forEach(btn => btn.disabled = true);
    submitCounterBtn.disabled = true;
  }

  // Counter controls
  counterControls.querySelector('.plus').addEventListener('click', () => {
    if (counter < maxPerson) counterDisplay.textContent = ++counter;
  });
  counterControls.querySelector('.minus').addEventListener('click', () => {
    if (counter > 1) counterDisplay.textContent = --counter;
  });
  submitCounterBtn.addEventListener('click', () => {
    handleAnswerSubmit(String(counter));
    counter = 1;
    counterDisplay.textContent = counter;
  });

  // Answer input handlers
  submitBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitBtn.click();
  });
  answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAnswerSubmit(answerInput.value.trim());
  });
  noThanksBtn.addEventListener('click', () => handleAnswerSubmit("No"));

  // Name input enter key
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitBtn.click();
  });

  initChat();
});
