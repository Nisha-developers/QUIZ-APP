// Getting The Elements for Quiz Begins;
const toggleEl = document.querySelector('.toggle');
const timerEl = document.querySelector('.timer');
const mainEl = document.querySelector('main');
const alertEl = document.querySelector('.alert');
console.log(alertEl);
console.log(mainEl);
const uniqueEl = document.querySelector('.uniqueid');
const welcomeMessage = document.querySelector('.welcome-message');
const questionContainer = document.querySelector('.question-answers-display-option');
const optionA = document.getElementById('A');
const optionB = document.getElementById('B');
const optionC = document.getElementById('C');
const optionD = document.getElementById('D');
const questions = document.querySelector('.questions');
const aItem = document.querySelector('label[for="A"]');
const bItem = document.querySelector('label[for="B"]');
const cItem = document.querySelector('label[for="C"]');
const dItem = document.querySelector('label[for="D"]');
const prevEl = document.querySelector('.prev');
const nextEl = document.querySelector('.next');
const generateNumbers = document.querySelector('.generate-total-numer');
const optiondiv = document.querySelectorAll('div.option');
// Getting the Elements for Quiz Ends

// Getting the initial values
let secs = 200;
let hour;
let minutes;
let seconds;
let timerInterval;
let DangerTime = (10/100) * secs;
let WarningTime = (25/100) * secs;
const questionsSet = 15;
let score = 0;
let index = 0;
const studentStoredInfo = {};
const answeredStatus = Array(questionsSet).fill(false);
const viewedStatus = Array(questionsSet).fill(false);

// Loading of students informations begins
const studentInfo = sessionStorage.getItem('currentStudentSession');

let uniqueId = '';
let subject = '';

if (studentInfo) {
  const result = JSON.parse(studentInfo);
  welcomeMessage.textContent = `Welcome ${result.firstName} ${result.lastName}`;
  uniqueEl.textContent = `Unique Id: ${result.uniqueId}`;
  uniqueId = result.uniqueId; // Optional: assign if you need it later
} else {
  welcomeMessage.textContent = 'Welcome Guest';
  uniqueEl.textContent = 'Unique Id: N/A';
  // Optional fallback values
  uniqueId = '';
  subject = '';
}


// NEW FUNCTION - Check if quiz is already completed
function isQuizAlreadyCompleted(uniqueId, subject) {
  const completedQuiz = localStorage.getItem(`results_${uniqueId}_${subject}`);
  return completedQuiz !== null;
}

// NEW FUNCTION - Handle when quiz is already completed
function handleCompletedQuiz() {
  console.log('Quiz already completed for this student');
  // Hide main quiz area
  if (mainEl) {
    mainEl.style.display = 'none';
  }
  if(alertEl){
    alertEl.style.display = 'block';
    alertEl.innerHTML = `
      <h3>Quiz Already Completed</h3>
      <p>You have already completed this quiz and cannot retake it.</p>
      <p>If you need to review your results, please contact your instructor.</p>
    `;
    alertEl.style.color = '#ff6b6b';
    alertEl.style.textAlign = 'center';
    alertEl.style.padding = '20px';
  }
  // Clear any existing timer intervals
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

// Function to handle when no student info is found
function handleNoStudentInfo() {
  console.log('No student info found');
  
  // Hide main quiz area
  if (mainEl) {
    mainEl.style.display = 'none';
  }
  
  // Show alert/error message
  if (alertEl) {
    alertEl.style.display = 'block';
    alertEl.textContent = 'Please log in to access the quiz.';
  } else {
    // If no alert element exists, show browser alert
    alert('Student information not found. Please log in first.');
  }
  
  // Stop further execution
  return;
}

// Check if student info exists and handle accordingly
if (studentInfo) {
  // Student info found - parse and use it
  try {
    const results = JSON.parse(studentInfo);
    console.log('Student info found:', results);
    
    uniqueId = results.uniqueId || '';
    subject = results.subject || '';
    
    // CHECK IF QUIZ IS ALREADY COMPLETED
    if (isQuizAlreadyCompleted(uniqueId, subject)) {
      // If completed, run the handler and STOP further quiz setup.
      handleCompletedQuiz();

    } else {
      // --- CORRECTED LOGIC ---
      // This 'else' block ensures this code ONLY runs for students
      // who have NOT completed the quiz.

      // Make sure main element is visible for the quiz
      if (mainEl) {
        mainEl.style.display = 'block';
      }
      
      // Hide alert if it exists (student is authenticated)
      if (alertEl) {
        alertEl.style.display = 'none';
      }
    }
    
  } catch (error) {
    console.error('Error parsing student info:', error);
    // Treat as no student info
    handleNoStudentInfo();
  }
} else {
  // No student info found
  handleNoStudentInfo();
}


// Only continue with quiz initialization if we have student info AND quiz is not completed
if (studentInfo && !isQuizAlreadyCompleted(uniqueId, subject)) {
  // Continue with the rest of the quiz code...

  // Questions Set - 20 Questions Total
  const studentQuestions = [
    {
      id: 1,
      question: "What is the capital of Nigeria?",
      options: ["Lagos", "Abuja", "Kano", "Port Harcourt"],
      answer: "Abuja"
    },
    {
      id: 2,
      question: "Solve: 15 + 9",
      options: ["24", "22", "21", "23"],
      answer: "24"
    },
    {
      id: 3,
      question: "Which gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
      answer: "Carbon dioxide"
    },
    {
      id: 4,
      question: "What is the result of 9 × 6?",
      options: ["54", "56", "64", "46"],
      answer: "54"
    },
    {
      id: 5,
      question: "What is the color of the Nigerian flag?",
      options: ["Green and White", "Green and Red", "Blue and White", "Red and White"],
      answer: "Green and White"
    },
    {
      id: 6,
      question: "Which shape is round?",
      options: ["Square", "Triangle", "Circle", "Rectangle"],
      answer: "Circle"
    },
    {
      id: 7,
      question: "Which of these is a domestic animal?",
      options: ["Lion", "Elephant", "Goat", "Tiger"],
      answer: "Goat"
    },
    {
      id: 8,
      question: "Which organ pumps blood?",
      options: ["Lungs", "Liver", "Heart", "Kidney"],
      answer: "Heart"
    },
    {
      id: 9,
      question: "What is the plural of 'child'?",
      options: ["Childs", "Children", "Childes", "Childer"],
      answer: "Children"
    },
    {
      id: 10,
      question: "How many legs does a spider have?",
      options: ["6", "8", "10", "12"],
      answer: "8"
    },
    {
      id: 11,
      question: "Which season comes after summer?",
      options: ["Spring", "Autumn", "Winter", "Rainy"],
      answer: "Autumn"
    },
    {
      id: 12,
      question: "What is the boiling point of water?",
      options: ["90°C", "100°C", "80°C", "110°C"],
      answer: "100°C"
    },
    {
      id: 13,
      question: "Which of these is a fruit?",
      options: ["Carrot", "Banana", "Potato", "Onion"],
      answer: "Banana"
    },
    {
      id: 14,
      question: "Which of the following is a verb?",
      options: ["Quick", "Run", "Happy", "Tall"],
      answer: "Run"
    },
    {
      id: 15,
      question: "Who is the current president of Nigeria (as of 2025)?",
      options: ["Buhari", "Tinubu", "Jonathan", "Obasanjo"],
      answer: "Tinubu"
    },
    {
      id: 16,
      question: "Which planet is closest to the sun?",
      options: ["Venus", "Mars", "Mercury", "Earth"],
      answer: "Mercury"
    },
    {
      id: 17,
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic", "Pacific", "Indian", "Arctic"],
      answer: "Pacific"
    },
    {
      id: 18,
      question: "Which continent is Nigeria located in?",
      options: ["Asia", "Europe", "Africa", "America"],
      answer: "Africa"
    },
    {
      id: 19,
      question: "What is 12 × 12?",
      options: ["144", "124", "142", "134"],
      answer: "144"
    },
    {
      id: 20,
      question: "Which of these is the longest river in the world?",
      options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
      answer: "Nile"
    }
  ];

  // Initialize user answers array
  const userAnswers = Array(studentQuestions.length).fill(null);

  // Generate random questions
  const questionPool = [...studentQuestions];
  for (let i = questionPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questionPool[i], questionPool[j]] = [questionPool[j], questionPool[i]];
  }
  const randomQuestions = questionPool.slice(0, questionsSet);

  // Load saved progress if exists
  function loadSavedProgress() {
    const savedData = localStorage.getItem(`quiz_${uniqueId}_${subject}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      index = data.index || 0;
      score = data.score || 0;
      secs = data.timeRemaining || 200;
      data.userAnswers.forEach((answer, i) => {
        if (answer !== null) userAnswers[i] = answer;
      });
      data.answeredStatus.forEach((status, i) => {
        answeredStatus[i] = status;
      });
      data.viewedStatus.forEach((status, i) => {
        viewedStatus[i] = status;
      });
      console.log('Progress loaded successfully');
    }
  }

  // Save progress to localStorage
  function saveProgress() {
    const progressData = {
      uniqueId: uniqueId,
      subject: subject,
      index: index,
      score: score,
      timeRemaining: secs,
      userAnswers: userAnswers,
      answeredStatus: answeredStatus,
      viewedStatus: viewedStatus,
      timestamp: Date.now()
    };
    localStorage.setItem(`quiz_${uniqueId}_${subject}`, JSON.stringify(progressData));
  }

  // UPDATED - Save final results and prevent retaking
  function saveFinalResults() {
    const percentage = Math.round((score / questionsSet) * 100);
    const resultsData = {
      uniqueId: uniqueId,
      subject: subject,
      score: score,
      totalQuestions: questionsSet,
      percentage: percentage,
      completedAt: new Date().toISOString(),
      userAnswers: userAnswers,
      questions: randomQuestions,
      isCompleted: true // NEW FLAG
    };
    
    // Save the final results
    localStorage.setItem(`results_${uniqueId}_${subject}`, JSON.stringify(resultsData));
    
    // Also save to a general results array
    let allResults = JSON.parse(localStorage.getItem('allQuizResults') || '[]');
    allResults.push(resultsData);
    localStorage.setItem('allQuizResults', JSON.stringify(allResults));
   let resultss = localStorage.getItem('allQuizResults');
     let loadResult = JSON.parse(resultss);
     console.log(loadResult)
    // IMPORTANT: Remove the progress data since quiz is now completed
    localStorage.removeItem(`quiz_${uniqueId}_${subject}`);
    
    console.log('Quiz completed and results saved. Progress data cleared.');
  }

  // Display questions function
  function displayQuestion() {
    if (randomQuestions[index]) {
      questions.textContent = randomQuestions[index].question;
      aItem.textContent = randomQuestions[index].options[0];
      bItem.textContent = randomQuestions[index].options[1];
      cItem.textContent = randomQuestions[index].options[2];
      dItem.textContent = randomQuestions[index].options[3];
      
      // Update button text
      if (index === randomQuestions.length - 1) {
        nextEl.textContent = 'Submit';
      } else {
        nextEl.textContent = 'Next';
      }
      
      // Mark as viewed
      viewedStatus[index] = true;
      updateQuestionStatus();
      saveProgress();
    }
  }

  // Mark result function
  function markResult() {
    let totalScore = 0;
    for (let i = 0; i < randomQuestions.length; i++) {
      if (userAnswers[i] !== null) {
        const correctAnswerIndex = randomQuestions[i].options.indexOf(randomQuestions[i].answer);
        if (userAnswers[i] === correctAnswerIndex) {
          totalScore++;
        }
      }
    }
    score = totalScore;
    return score;
  }

  // Save user selection
  function saveSelection() {
    let selectedIndex = -1;
    if (optionA.checked) selectedIndex = 0;
    if (optionB.checked) selectedIndex = 1;
    if (optionC.checked) selectedIndex = 2;
    if (optionD.checked) selectedIndex = 3;

    userAnswers[index] = selectedIndex;
    answeredStatus[index] = selectedIndex !== -1;
    saveProgress();
  }

  // Restore user selection
  function restoreSelection() {
    clearSelection();
    const savedIndex = userAnswers[index];

    if (savedIndex === 0) optionA.checked = true;
    if (savedIndex === 1) optionB.checked = true;
    if (savedIndex === 2) optionC.checked = true;
    if (savedIndex === 3) optionD.checked = true;
  }

  // Clear selection
  function clearSelection() {
    optionA.checked = false;
    optionB.checked = false;
    optionC.checked = false;
    optionD.checked = false;
  }

  // Next button functionality
  nextEl.addEventListener('click', () => {
    saveSelection();
    
    if (index === randomQuestions.length - 1) {
      // Submit quiz
      let confirmQuiz = confirm('Are you sure you want to submit the quiz?');
      if(confirmQuiz){
        markResult();
        saveFinalResults();
        clearInterval(timerInterval);
        finishBehaviour();
      }
      return;
    }
    
    index++;
    displayQuestion();
    restoreSelection();
  });

  function finishBehaviour(){
    mainEl.style.display = 'none';
    alertEl.style.display = 'block';
    alertEl.innerHTML = `
      <h3>Quiz Completed Successfully!</h3>
      <p>You have successfully completed the exam.</p>
      <p>You may now leave the hall.</p>
    `;
    alertEl.style.color = '#28a745';
    alertEl.style.textAlign = 'center';
    alertEl.style.padding = '20px';
  }

  // Previous button functionality
  prevEl.addEventListener('click', () => {
    saveSelection();
    
    if (index > 0) {
      index--;
      displayQuestion();
      restoreSelection();
    }
  });

  // Timer functionality
  function convertSeconds() {
    timerInterval = setInterval(() => {
      hour = Math.floor(secs / 3600);
      minutes = Math.floor((secs % 3600) / 60);
      seconds = Math.floor(secs % 60);
      
      hour = (hour >= 10) ? hour : `0${hour}`;  
      minutes = (minutes >= 10) ? minutes : `0${minutes}`;
      seconds = (seconds >= 10) ? seconds : `0${seconds}`;  
      
      timerEl.textContent = `${hour} : ${minutes} : ${seconds}`;
      
      secs--;
      
      if (secs < 0) {
        alert('Time is up! Quiz will be submitted automatically.');
        saveSelection(); // Save current selection before auto-submit
        markResult();
        saveFinalResults();
        clearInterval(timerInterval);
        
        // Auto-submit when time is up
        finishBehaviour();
      } else if (secs <= DangerTime) {
        timerEl.style.backgroundColor = 'red';
        questionContainer.classList.remove('warningSign');
        questionContainer.classList.add('dangerSign');
      } else if (secs <= WarningTime) {
        timerEl.style.backgroundColor = 'yellow';
        timerEl.style.color = 'black';
        questionContainer.classList.remove('dangerSign');
        questionContainer.classList.add('warningSign')
      } else {
        timerEl.style.backgroundColor = 'var(--blue-tourch-design)';
        questionContainer.classList.remove('dangerSign');
        questionContainer.classList.remove('warningSign');
      }
      
      // Save progress every minute
      if (secs % 60 === 0) {
        saveProgress();
      }
    }, 1000);
  }

  // Generate question numbers
  function generateQuestionNumbers() {
    generateNumbers.innerHTML = '';
    for (let i = 0; i < questionsSet; i++) {
      generateNumbers.innerHTML += `<div class="q-num" data-index="${i}">${i + 1}</div>`;
    }
    
    // Add click listeners to question numbers
    document.querySelectorAll('.q-num').forEach((el) => {
      el.addEventListener('click', () => {
        saveSelection();
        index = parseInt(el.dataset.index);
        displayQuestion();
        restoreSelection();
      });
    });
  }

  // Update question status colors
  function updateQuestionStatus() {
    const allBoxes = document.querySelectorAll('.q-num');

    allBoxes.forEach((el, i) => {
      el.classList.remove('answered', 'viewed', 'current', 'not-attempted', 'attempted-not-answered');

      if (i === index) {
        el.classList.add('current');
      } else if (answeredStatus[i]) {
        el.classList.add('answered');
      } else if (viewedStatus[i]) {
        el.classList.add('attempted-not-answered');
      } else {
        el.classList.add('not-attempted');
      }
    });
  }

  // Theme toggle functionality
  function toggle() {
    document.body.classList.toggle('light');
    let theme = document.body.classList.contains('light') ? '🌙' : '☀️';
    toggleEl.textContent = theme;
    localStorage.setItem('theme', theme);
  }

  // Load theme on page load
  function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === '🌙') {
      document.body.classList.add('light');
      toggleEl.textContent = '🌙';
    } else {
      document.body.classList.remove('light');
      toggleEl.textContent = '☀️';
    }
  }

  // Add event listeners to option divs for better UX
  optiondiv.forEach((optionDiv, i) => {
    optionDiv.addEventListener('click', () => {
      const radioBtn = optionDiv.querySelector('input[type="radio"]');
      if (radioBtn) {
        radioBtn.checked = true;
        saveSelection();
        updateQuestionStatus();
      }
    });
  });

  // Initialize quiz
  function initializeQuiz() {
    loadTheme();
    loadSavedProgress();
    generateQuestionNumbers();
    displayQuestion();
    restoreSelection();
    convertSeconds();
    
    // Set student info
    if (uniqueEl) uniqueEl.textContent = uniqueId;
   if (welcomeMessage && studentInfo) {
  const student = JSON.parse(studentInfo);
  welcomeMessage.textContent = `Welcome ${student.firstName} ${student.lastName}`;
}
    
    console.log('Quiz initialized successfully');
  }

  // UPDATED - Auto-save before page unload
  window.addEventListener('beforeunload', (e) => {
    // Only save if quiz is still active and not completed
    if (secs > 0 && !isQuizAlreadyCompleted(uniqueId, subject)) {
      saveSelection();
      saveProgress();
    }
  });

  // UPDATED - Auto-save periodically (every 30 seconds)
  const autoSaveInterval = setInterval(() => {
    // Only save if quiz is still active and not completed
    if (secs > 0 && !isQuizAlreadyCompleted(uniqueId, subject)) {
      saveSelection();
      saveProgress();
    } else {
      clearInterval(autoSaveInterval); // Stop auto-saving when quiz is complete
    }
  }, 30000);

  // Start the quiz
  initializeQuiz();
}