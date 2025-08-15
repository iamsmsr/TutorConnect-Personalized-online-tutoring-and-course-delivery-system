// quiz.js
// This script expects quiz questions and settings in localStorage under 'practiceQuizData'

document.addEventListener('DOMContentLoaded', function() {
  const settingsDiv = document.getElementById('quizSettings');
  const quizArea = document.getElementById('quizArea');
  const resultArea = document.getElementById('resultArea');
  const startBtn = document.getElementById('startQuizBtn');
  const errorDiv = document.getElementById('settingsError');

  // Retrieve quiz questions from localStorage (set by student_dashboard.js)
  let quizData = JSON.parse(localStorage.getItem('practiceQuizData') || '{}');
  let allQuestions = Array.isArray(quizData.questions) ? quizData.questions : [];

  startBtn.onclick = function() {
    errorDiv.textContent = '';
    let numQuestions = parseInt(document.getElementById('numQuestions').value);
    let timeLimit = parseInt(document.getElementById('timeLimit').value);
    if (isNaN(numQuestions) || numQuestions < 1) {
      errorDiv.textContent = 'Please enter a valid number of questions.';
      return;
    }
    if (isNaN(timeLimit) || timeLimit < 1) {
      errorDiv.textContent = 'Please enter a valid time limit.';
      return;
    }
    if (numQuestions > allQuestions.length) {
      errorDiv.textContent = `Not enough questions available. Only ${allQuestions.length} available.`;
      return;
    }
    // Randomly select numQuestions
    let selectedQuestions = [...allQuestions];
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }
    selectedQuestions = selectedQuestions.slice(0, numQuestions);
    // Start quiz
    startQuiz(selectedQuestions, timeLimit);
  };

  function startQuiz(questions, timeLimit) {
    settingsDiv.style.display = 'none';
    quizArea.style.display = '';
    resultArea.style.display = 'none';
    let timer = timeLimit * 60;
    let interval;
    let answers = Array(questions.length).fill(null);
    quizArea.innerHTML = `<div id="timer" style="font-weight:bold;margin-bottom:10px;"></div>`;
    questions.forEach((q, idx) => {
      quizArea.innerHTML += `
        <div class="quiz-question" style="margin-bottom:20px;">
          <b>Q${idx+1}:</b> ${q.question}<br>
          ${q.options.map((opt, oidx) => `<label><input type="radio" name="q${idx}" value="${opt}"> ${opt}</label><br>`).join('')}
        </div>
      `;
    });
    quizArea.innerHTML += `<button id="submitQuizBtn">Submit Quiz</button>`;
    // Timer logic
    function updateTimer() {
      let min = Math.floor(timer/60);
      let sec = timer%60;
      document.getElementById('timer').textContent = `Time left: ${min}:${sec.toString().padStart(2,'0')}`;
      if (timer <= 0) {
        clearInterval(interval);
        submitQuiz();
      }
      timer--;
    }
    interval = setInterval(updateTimer, 1000);
    updateTimer();
    document.getElementById('submitQuizBtn').onclick = function() {
      clearInterval(interval);
      submitQuiz();
    };
    function submitQuiz() {
      quizArea.style.display = 'none';
      resultArea.style.display = '';
      let score = 0;
      let resultHtml = '<h3>Quiz Results</h3>';
      questions.forEach((q, idx) => {
        let selected = document.querySelector(`input[name='q${idx}']:checked`);
        let userAns = selected ? selected.value : null;
        let correct = userAns === q.answer;
        if (correct) score++;
        resultHtml += `<div style="margin-bottom:10px;">
          <b>Q${idx+1}:</b> ${q.question}<br>
          <span style="color:${correct?'green':'red'};font-weight:bold;">Your answer: ${userAns||'None'} (${correct?'Correct':'Incorrect'})</span><br>
          <span>Correct answer: ${q.answer}</span>
        </div>`;
      });
      resultHtml += `<h4>Score: ${score} / ${questions.length}</h4>`;
      resultArea.innerHTML = resultHtml;
    }
  }
});
