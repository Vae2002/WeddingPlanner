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
  // Auto-resize the textarea when typing
  answerInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  const submitBtn = document.getElementById('submit-answer');
  const submitCounterBtn = document.getElementById('submit-counter');
  const buttonAnswers = document.getElementById('button-answers');
  const counterControls = document.getElementById('counter-controls');
  const noThanksBtn = document.getElementById('no-thanks-btn');
  const counterDisplay = counterControls.querySelector('.num');

  const plusBtn = counterControls.querySelector('.plus');
  const minusBtn = counterControls.querySelector('.minus');

  plusBtn.addEventListener('click', () => {
    if (counter < (isGroup ? maxAvailablePerson || maxPerson : maxPerson)) {
      counter++;
      counterDisplay.textContent = counter;
    }
  });

  minusBtn.addEventListener('click', () => {
    if (counter > 1) {
      counter--;
      counterDisplay.textContent = counter;
    }
  });

  submitCounterBtn.addEventListener('click', () => {
    appendMessage(String(counter), 'answer');
    answers.push({ question: questions[2], answer: String(counter) });
    currentQuestion++;
    askNextQuestion();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (nameInput.style.display !== 'none' && !submitBtn.disabled) {
        submitName();
      } else if (answerInput.style.display !== 'none' && !submitBtn.disabled && currentQuestion === 3) {
        const wishes = answerInput.value.trim();
        if (!wishes) return;
        appendMessage(wishes, 'answer');
        answers.push({ question: questions[3], answer: wishes });
        currentQuestion++;
        askNextQuestion();
      }
    }
  });



  async function initChat() {
    Loader.open();

    try {
      const res = await fetch('/get-user-info');
      const data = await res.json();
      const isFilled = data.is_filled === 1;
      isGroup = data.is_group === 1;
      isOnlineUser = data.is_online === 1;
      maxPerson = typeof data.max_person === 'number' ? data.max_person : 1;
      maxAvailablePerson  = typeof data.max_available_person === 'number' ? data.max_available_person : 1;

      if (isFilled && !isGroup && !isOnlineUser) {
        hideAllInputs();
        disableInputs();

        appendMessage(questions[1], 'question');
        if (data.is_coming === 0) {
          appendMessage("Unfortunately, I won't be attending.", 'answer');
        } else {
          appendMessage("Yes, I'll be there!", 'answer');
          appendMessage(questions[2], 'question');
          appendMessage(String(data.n_person_confirm || ''), 'answer');
        }

        if (data.wishes && data.wishes.toString().trim() !== '') {
          appendMessage(questions[3], 'question');
          appendMessage(data.wishes, 'answer');
        }

        appendMessage("Thank you for your responses! ❤️", 'question');
        renderWishesButton();
        stopAsking = true;
        return;
      }

      currentQuestion = isGroup ? 0 : 1;
      questions[1] = isOnlineUser ? "Will you be attending online?" : "Are you coming?";

      if (isOnlineUser) {
        buttonAnswers.innerHTML = '';
        onlineAnswers.forEach(ans => {
          const btn = document.createElement('button');
          btn.textContent = ans;
          btn.dataset.answer = ans;
          buttonAnswers.appendChild(btn);
          btn.addEventListener('click', () => handleAnswerSubmit(ans));
        });
      }
    } catch (err) {
      console.error('Init error:', err);
      currentQuestion = 1;
    }finally {
    Loader.close(); // ✅ Always called, even if returned early
    if (!stopAsking) askNextQuestion();
   }
  }

  function appendMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function askNextQuestion() {
    if (stopAsking) return;
    if (currentQuestion === 2 && isOnlineUser) currentQuestion++;

    hideAllInputs();

    if (currentQuestion >= questions.length) {
      sendAnswers();
      appendMessage("Thank you for your responses! ❤️", 'question');
      disableInputs();
      renderWishesButton();
      stopAsking = true;
      return;
    }

    appendMessage(questions[currentQuestion], 'question');

    switch (currentQuestion) {
      case 0:
        nameInput.style.display = 'inline-block';
        submitBtn.style.display = 'inline-block';
        submitBtn.onclick = submitName;
        break;
      case 1:
        buttonAnswers.style.display = 'inline-block';
        if (!isOnlineUser) renderAttendanceButtons();
        break;
      case 2:
        counterControls.style.display = 'flex';
        counterDisplay.textContent = counter;
        break;
      case 3:
        answerInput.style.display = 'inline-block';
        submitBtn.style.display = 'inline-block';
        noThanksBtn.style.display = 'inline-block';
        submitBtn.onclick = () => {
          const wishes = answerInput.value.trim();
          if (!wishes) return;
          appendMessage(wishes, 'answer');
          answers.push({ question: questions[3], answer: wishes });
          currentQuestion++;
          askNextQuestion();
        };
        break;
      case 4:
        buttonAnswers.style.display = 'inline-block';
        buttonAnswers.innerHTML = `
          <button data-answer="Yes, share my wishes">Yes, share my wishes</button>
          <button data-answer="No, I'd like to edit my wishes">No, I'd like to edit my wishes</button>
        `;
        buttonAnswers.querySelectorAll('button').forEach(btn =>
          btn.onclick = () => handleAnswerSubmit(btn.dataset.answer)
        );
        break;
    }
  }

  function submitName() {
    const name = nameInput.value.trim();
    if (!name) return;
    appendMessage(name, 'answer');
    answers.push({ question: questions[0], answer: name });
    currentQuestion = 1;
    setTimeout(askNextQuestion, 500);
  }

  function renderAttendanceButtons() {
    buttonAnswers.innerHTML = `
      <button data-answer="Yes">Yes</button>
      <button data-answer="No">No</button>
      <button data-answer="I'm still not sure">I'm still not sure</button>
      <button data-answer="I will be attending online">I will be attending online</button>
    `;
    buttonAnswers.querySelectorAll('button').forEach(btn =>
      btn.onclick = () => handleAnswerSubmit(btn.dataset.answer)
    );
  }

  function handleAnswerSubmit(answer) {
    if (!answer) return;

    if (currentQuestion === 1 && answer === "Yes") {
      appendMessage(answer, 'answer');
      answers.push({ question: questions[1], answer });
      currentQuestion = 2;
      setTimeout(askNextQuestion, 500);
      return;
    } else if (currentQuestion === 1 && answer === "I'm still not sure") {
      appendMessage(answer, 'answer');
      appendMessage("We kindly ask you to confirm your attendance by 22 August 2025 at the latest. 💌", 'question');
      stopAsking = true;
      return;
    } else if (currentQuestion === 1 && answer === "I will be attending online") {
      appendMessage(answer, 'answer');
      answers.push({ question: questions[1], answer }); 
      appendMessage("We look forward to seeing you online! 💌", 'question');
      currentQuestion = 3;
      setTimeout(askNextQuestion, 500);
      return;
    } else if (currentQuestion === 1 && answer === "No") {
      appendMessage(answer, 'answer');
      answers.push({ question: questions[1], answer }); 
      currentQuestion = 3;
      setTimeout(askNextQuestion, 500);
      return;
    }

    if (currentQuestion === 3 && answer === "No, thank you.") {
      currentQuestion = questions.length;
    } else if (currentQuestion === 4 && answer === "No, I'd like to edit my wishes") {
      currentQuestion = 3;
    } else {
      currentQuestion++;
    }

    setTimeout(askNextQuestion, 500);
  }

  function sendAnswers() {
    console.log("Sending answers:", answers);

    let memberName = null;
    if (isGroup) {
      const name = answers.find(a => a.question === "Please enter your name")?.answer;
      if (name) {
        memberName = [name]; // send as array
      }
    }

    const query = memberName ? '?memberName=' + encodeURIComponent(JSON.stringify(memberName)) : '';
    console.log("Encoded query string:", query); 

    fetch(`/submit-answers${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    })
      .then(res => res.json())
      .then(data => console.log('Submit result:', data))
      .catch(err => console.error('Submit error:', err));
  }

  function renderWishesButton() {
    const wishesBtn = document.createElement('button');
    wishesBtn.textContent = "Click here to see everyone's wishes";
    wishesBtn.className = 'wishes-btn';
    wishesBtn.onclick = () => {
      window.location.href = '/wishes';
    };
    chatBox.appendChild(wishesBtn);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function hideAllInputs() {
    [nameInput, answerInput, submitBtn, noThanksBtn, buttonAnswers, counterControls].forEach(
      el => el.style.display = 'none'
    );
    answerInput.style.height = 'auto';  // reset height when hiding
  }


  function disableInputs() {
    [nameInput, answerInput, submitBtn, noThanksBtn, submitCounterBtn].forEach(
      el => el.disabled = true
    );
    buttonAnswers.querySelectorAll('button').forEach(btn => btn.disabled = true);
    counterControls.querySelectorAll('button').forEach(btn => btn.disabled = true);
  }



  noThanksBtn.addEventListener('click', () => {
    handleAnswerSubmit("No, thank you.");
  });

  initChat();
});