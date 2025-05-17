document.addEventListener('DOMContentLoaded', () => {
  const questions = [
    "Are you coming?",
    "How many people are attending?",
    "Any wishes for the bride & groom?"
  ];

  const answers = [];
  let currentQuestion = 0;

  const chatBox = document.getElementById('chat-box');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');

  function appendMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function askNextQuestion() {
    if (currentQuestion < questions.length) {
      appendMessage(questions[currentQuestion], 'question');
    } else {
      appendMessage("Thank you for your responses! ❤️", 'question');
      // Optionally send to server
      fetch('/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      submitBtn.disabled = true;
      answerInput.disabled = true;
    }
  }

  submitBtn.addEventListener('click', () => {
    const answer = answerInput.value.trim();
    if (!answer) return;

    appendMessage(answer, 'answer');
    answers.push({ question: questions[currentQuestion], answer });

    answerInput.value = '';
    currentQuestion++;
    setTimeout(askNextQuestion, 500);
  });

  askNextQuestion(); // Start the chat
});
