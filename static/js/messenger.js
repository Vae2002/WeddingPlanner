document.addEventListener('DOMContentLoaded', () => {
  const questions = [
    "Are you coming?",
    "How many people are attending?",
    "Any wishes for the bride & groom?"
  ];

  const answers = [];
  let currentQuestion = 0;
  let stopAsking = false;
  let counter = 0;

  const chatBox = document.getElementById('chat-box');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const submitCounterBtn = document.getElementById('submit-counter');
  const buttonAnswers = document.getElementById('button-answers');
  const counterControls = document.getElementById('counter-controls');
  const noThanksBtn = document.getElementById('no-thanks-btn');
  const counterDisplay = counterControls.querySelector('.num');

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
    } else if (currentQuestion === 1) {
      counterControls.style.display = 'flex';
    } else if (currentQuestion === 2) {
      answerInput.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
      noThanksBtn.style.display = 'inline-block';
    }
  }

  function handleAnswerSubmit(answer) {
    if (!answer) return;

    appendMessage(answer, 'answer');
    answers.push({ question: questions[currentQuestion], answer });

    if (currentQuestion === 0 && answer.toLowerCase() === 'no') {
      appendMessage("We would still be delighted to have you join our online reception. 💌", 'question');
      stopAsking = true;
    } else if (currentQuestion === 0 && answer.toLowerCase() === "i'm still not sure") {
      appendMessage("We kindly ask you to confirm your attendance by 22 August 2025 at the latest. 💌", 'question');
      stopAsking = true;
    }

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

  // Event Listeners
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

  buttonAnswers.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      handleAnswerSubmit(button.getAttribute('data-answer'));
    });
  });

  noThanksBtn.addEventListener('click', () => {
    handleAnswerSubmit("No");
  });

  // Counter logic
  counterControls.querySelector('.plus').addEventListener('click', () => {
    counter++;
    counterDisplay.textContent = counter;
  });

  counterControls.querySelector('.minus').addEventListener('click', () => {
    if (counter > 0) {
      counter--;
      counterDisplay.textContent = counter;
    }
  });

  submitCounterBtn.addEventListener('click', () => {
    handleAnswerSubmit(`${counter}`);
    counter = 0;
    counterDisplay.textContent = counter;
  });

  askNextQuestion(); // Start the chat

});
