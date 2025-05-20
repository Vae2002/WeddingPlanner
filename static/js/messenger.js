document.addEventListener('DOMContentLoaded', () => {
  const questions = [
    "Are you coming?",
    "How many people are attending?",
    "Any wishes for the bride & groom?"
  ];

  const answers = [];
  let currentQuestion = 0;
  let stopAsking = false;

  const chatBox = document.getElementById('chat-box');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const buttonAnswers = document.getElementById('button-answers');

  function appendMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function showInputArea(showInput) {
    if (showInput) {
      answerInput.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
      buttonAnswers.style.display = 'none';
      answerInput.disabled = false;
      submitBtn.disabled = false;
      answerInput.focus();
    } else {
      answerInput.style.display = 'none';
      submitBtn.style.display = 'none';
      buttonAnswers.style.display = 'inline-block';
    }
  }

  function askNextQuestion() {
    if (stopAsking || currentQuestion >= questions.length) {
      appendMessage("Thank you for your responses! ❤️", 'question');
      fetch('/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      submitBtn.disabled = true;
      answerInput.disabled = true;
      buttonAnswers.querySelectorAll('button').forEach(btn => btn.disabled = true);
      return;
    }

    appendMessage(questions[currentQuestion], 'question');

    // Show buttons for first question, input for the others
    if (currentQuestion === 0) {
      showInputArea(false);
    } else {
      showInputArea(true);
    }
  }

  function handleAnswerSubmit(answer) {
    if (!answer) return;

    appendMessage(answer, 'answer');
    answers.push({ question: questions[currentQuestion], answer });

    // Special logic for the first question
    if (currentQuestion === 0 && answer.toLowerCase() === 'no') {
      appendMessage("Thank you for your confirmation. We still welcome you to our online reception. 💌", 'question');
      stopAsking = true;
    }

    currentQuestion++;
    setTimeout(askNextQuestion, 500);
  }

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

  // Add listeners to buttons
  buttonAnswers.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      handleAnswerSubmit(button.getAttribute('data-answer'));
    });
  });

  askNextQuestion(); // Start the chat
});
