import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

// Getting Element Begins 
const timeSetEl = document.querySelector('.timeSet');
const classEl = document.querySelector('.class')
const subjectEl = document.querySelector('#subjectDisplay')
const teacherContentEl = document.querySelector('#teacherContent');
const markGuideEl = document.getElementById('mark');
const textInputEl = document.getElementById('textInput');
const submitEl = document.querySelector('.submit');
const questionsDisplayEl = document.getElementById('questionsDisplay');

// Getting Elements Ends;

// Get Variables Begins
let examConfig = [];
let currentQuestions = [];
let editingQuestionId = null;
// Get Variables End



// Get the use params begins
const urlParams = new URLSearchParams(window.location.search);
const selectedClassParam = urlParams.get('class');
const selectedSubjectParam = urlParams.get('subject');
// Get the use params ends

// Load Examination Config Begins 
async function loadExamConfig() {
  try {
    const storedConfig = sessionStorage.getItem('theoryExamConfig');
    
    if (storedConfig) {
      examConfig = JSON.parse(storedConfig);
      
      if (examConfig.classSelected === selectedClassParam && 
          examConfig.subjectSelected === selectedSubjectParam) {
        displayExamConfig();
        await loadExistingQuestions();
        return;
      }
    }

    const { data, error } = await supabase
      .from('theory_exam_configs')
      .select('*')
      .eq('class_selected', selectedClassParam)
      .eq('subject_selected', selectedSubjectParam)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      examConfig = {
        subjectSelected: data.subject_selected,
        theoryMarks: data.theory_marks,
        examDate: data.exam_date,
        examTime: data.exam_time,
        timeDuration: data.time_duration,
        teacherMessage: data.teacher_message,
        addPicture: data.add_picture,
        classSelected: data.class_selected
      };

      sessionStorage.setItem('theoryExamConfig', JSON.stringify(examConfig));
      displayExamConfig();
      changeTextArea()
      await loadExistingQuestions();

    } else {
      showAlert('No exam configuration found. Please set up the exam first.', 'danger');
      setTimeout(() => {
        window.location.href = '/ErrorPage/Error404.html';
      }, 3000);
    }
  } catch (error) {
    console.error('Error loading exam config:', error);
    showAlert('Error loading exam configuration. Please try again.', 'danger');
  }
}

// Function to display exam config
function displayExamConfig() {
  if (examConfig) {
    console.log(examConfig);
    timeSetEl.textContent = `Time Set: ${convertMinutesToTimeFormat(examConfig.timeDuration)}`;
    classEl.textContent = examConfig.classSelected;
    subjectEl.textContent = examConfig.subjectSelected;
    teacherContentEl.textContent = `Teacher Content: ${examConfig.teacherMessage}`
    markGuideEl.textContent = `Score Awarded: ${examConfig.theoryMarks} marks`;
  }
}

loadExamConfig();

// Function to convert minutes to hours
function convertMinutesToTimeFormat(minutes) {
  const totalSeconds = minutes * 60;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const h = String(hrs).padStart(2, '0');
  const m = String(mins).padStart(2, '0');
  const s = String(secs).padStart(2, '0');

  return `${h}:${m}:${s}`;
}
function changeTextArea(){
  if (examConfig.addPicture === true) {
    const changeInfoEL = document.querySelector('.info');

    changeInfoEL.innerHTML = `
      <div class='typeImage'>Type out your questions including the images</div>
      <input type="file" id="imageUpload" accept="image/*">
      <div id="editor" contenteditable="true" class="editor"></div>
    `;

    // ⬅ THE IMPORTANT FIX
    setupImageUpload();
  }
}
changeTextArea()



// Add this code after your changeTextArea() function

function setupImageUpload() {
  const imageUpload = document.getElementById('imageUpload');
  const editor = document.getElementById('editor');
  
  if (!imageUpload || !editor) return;

  // Handle file input change
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      insertImageIntoEditor(file, editor);
    }
  });

  // Drag and drop handlers
  editor.addEventListener('dragover', (e) => {
    e.preventDefault();
    editor.style.border = '2px dashed #4CAF50';
  });

  editor.addEventListener('dragleave', (e) => {
    e.preventDefault();
    editor.style.border = '1px solid #ccc';
  });

  editor.addEventListener('drop', (e) => {
    e.preventDefault();
    editor.style.border = '1px solid #ccc';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      insertImageIntoEditor(file, editor);
    }
  });
}

// Insert image into editor
function insertImageIntoEditor(file, editor) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '10px 0';
    img.setAttribute('data-image-base64', e.target.result);
    
    // Insert at cursor position or at the end
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(img);
      range.collapse(false);
    } else {
      editor.appendChild(img);
    }
  };
  
  reader.readAsDataURL(file);
}

// Call this after changeTextArea() is executed
if (examConfig.addPicture === true) {
  setTimeout(() => setupImageUpload(), 100);
}

// Modify your saveQuestion function to include images
async function saveQuestionWithImages(e) {
  e.preventDefault();
 
  if(textInputEl.value !== ''){
     parseNumber();
  if (!parseNumber()) {
    showAlert('Number your questions', 'danger');
    return;
  }
  }


  const editor = document.getElementById('editor');
  const questionContent = editor ? editor.innerHTML : textInputEl.value.trim();
  

  try {
    if (editingQuestionId) {
      const { data, error } = await supabase
        .from('theory_questions')
        .update({
          question_text: questionContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingQuestionId)
        .select();

      if (error) throw error;

      showAlert('Question updated successfully!', 'success');
      editingQuestionId = null;
      submitEl.textContent = 'Add Question';
    } else {
      await loadExistingQuestions();
      
      if (currentQuestions.length > 0) {
        showAlert('Edit and update the existing questions', 'danger');
        return;
      }

      const { data, error } = await supabase
        .from('theory_questions')
        .insert([{
          class_selected: selectedClassParam,
          subject_selected: selectedSubjectParam,
          question_text: questionContent,
          image_url: null
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          showAlert('A question with this number already exists.', 'warning');
        } else {
          throw error;
        }
        return;
      }

      showAlert('Question added successfully!', 'success');
    }

    if (editor) {
      editor.innerHTML = '';
    } else {
      textInputEl.value = '';
    }
    
    await loadExistingQuestions();
  } catch (error) {
    console.error('Error saving question:', error);
    showAlert('Error saving question. Please try again.', 'danger');
  }
}

// Update the displayQuestions function to render HTML content
function displayQuestionsWithImages() {
  if (!questionsDisplayEl) return;
  
  questionsDisplayEl.innerHTML = '';

  if (currentQuestions.length === 0) {
    questionsDisplayEl.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No questions added yet.</p>';
    return;
  }

  currentQuestions.forEach((question, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.innerHTML = `
      <div class="question-header">
        <div class="question-actions">
          <button class="btn-edit" onclick="editQuestionWithImages('${question.id}')">
            Edit
          </button>
          <button class="btn-delete" onclick="deleteQuestion('${question.id}')">
           Delete
          </button>
        </div>
      </div>
      <div class="question-content">
        ${question.question_text}
      </div>
    `;
    questionsDisplayEl.appendChild(questionCard);
  });
}

// Update edit function for images
window.editQuestionWithImages = async function(questionId) {
  try {
    const { data, error } = await supabase
      .from('theory_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;

    const editor = document.getElementById('editor');
    if (editor) {
      editor.innerHTML = data.question_text;
    } else {
      textInputEl.value = data.question_text;
    }
    
    editingQuestionId = questionId;
    submitEl.textContent = 'Update Question';
    
    if (editor) {
      editor.focus();
      editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      textInputEl.focus();
      textInputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    showAlert('Editing question. Click "Update Question" to save changes.', 'info');
  } catch (error) {
    console.error('Error loading question for edit:', error);
    showAlert('Error loading question.', 'danger');
  }
}

// Replace the submit button event listener
if (submitEl) {
  submitEl.removeEventListener('click', saveQuestion);
  submitEl.addEventListener('click', (e) => {
    if (examConfig.addPicture === true) {
      saveQuestionWithImages(e);
    } else {
      saveQuestion(e);
    }
  });
}



// Load existing questions from Supabase
async function loadExistingQuestions() {
  try {
    const { data, error } = await supabase
      .from('theory_questions')
      .select('*')
      .eq('class_selected', selectedClassParam)
      .eq('subject_selected', selectedSubjectParam)

    if (error) throw error;

    currentQuestions = data || [];
    displayQuestions();
  } catch (error) {
    console.error('Error loading questions:', error);
    showAlert('Error loading questions.', 'danger');
  }
}

// Display all questions
function displayQuestions() {
  if (!questionsDisplayEl) return;
  
  questionsDisplayEl.innerHTML = '';

  if (currentQuestions.length === 0) {
    questionsDisplayEl.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No questions added yet.</p>';
    return;
  }

  currentQuestions.forEach((question, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.innerHTML = `
      <div class="question-header">
        <div class="question-actions">
          <button class="btn-edit" onclick="editQuestion('${question.id}')">
            Edit
          </button>
          <button class="btn-delete" onclick="deleteQuestion('${question.id}')">
           Delete
          </button>
        </div>
      </div>
      <div class="question-content">
        <pre>${question.question_text}</pre>
      </div>
    `;
    questionsDisplayEl.appendChild(questionCard);
  });
}

// Save or update question
async function saveQuestion(e) {
 e.preventDefault()
 parseNumber();
 if(!parseNumber()){
  showAlert('Number your questions', 'danger')
  return
 }
  const questionText = textInputEl.value.trim();
  
  if (!questionText) {
    showAlert('Please enter a question.', 'warning');
    return;
  }

  try {
    if (editingQuestionId) {
      // Update existing question
      const { data, error } = await supabase
        .from('theory_questions')
        .update({
          question_text: textInputEl.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingQuestionId)
        .select();

      if (error) throw error;

      showAlert('Question updated successfully!', 'success');
      editingQuestionId = null;
      submitEl.textContent = 'Add Question';
    } else {
     await loadExistingQuestions()
     console.log(currentQuestions)
     if(currentQuestions.length > 0){
      showAlert('Edit and update the existing questions ', 'danger');
      return
     }
    //  if(currentQuestions){
    //   showAlert('You cannot add more than 1 question. Edit the existing questions')
    //  }
      // Insert new question
      const { data, error } = await supabase
        .from('theory_questions')
        .insert([{
          class_selected: selectedClassParam,
          subject_selected: selectedSubjectParam,
          question_text: textInputEl.value,
          image_url: null
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          showAlert('A question with this number already exists.', 'warning');
        } else {
          throw error;
        }
        return;
      }

      showAlert('Question added successfully!', 'success');
    }

    textInputEl.value = '';
    await loadExistingQuestions();
  } catch (error) {
    console.error('Error saving question:', error);
    showAlert('Error saving question. Please try again.', 'danger');
  }
}

// Edit question
window.editQuestion = async function(questionId) {
  try {
    const { data, error } = await supabase
      .from('theory_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;

    textInputEl.value = data.question_text;
    editingQuestionId = questionId;
    submitEl.textContent = 'Update Question';
    textInputEl.focus();
    
    // Scroll to textarea
    textInputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showAlert('Editing question. Click "Update Question" to save changes.', 'info');
  } catch (error) {
    console.error('Error loading question for edit:', error);
    showAlert('Error loading question.', 'danger');
  }
}

// Delete question
window.deleteQuestion = async function(questionId) {
  if (!confirm('Are you sure you want to delete this question?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('theory_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    showAlert('Question deleted successfully!', 'success');
    await loadExistingQuestions();
  } catch (error) {
    console.error('Error deleting question:', error);
    showAlert('Error deleting question.', 'danger');
  }
}

// Cancel edit
function cancelEdit() {
  editingQuestionId = null;
  textInputEl.value = '';
  submitEl.textContent = 'Add Question';
  showAlert('Edit cancelled.', 'info');
}

// Event listener for submit button
if (submitEl) {
  submitEl.addEventListener('click',(e)=> saveQuestion(e));
}

// Add cancel button functionality if editing
textInputEl.addEventListener('input', () => {
  if (editingQuestionId && textInputEl.value.trim() === '') {
    cancelEdit();
  }
});

// // Parse number beging
// function parseNumber(){
//   let digit = '123456789';
//   let istrue;
//   let digitfiorst = digit.includes(textInputEl.value[0]);
//   if(digitfiorst){
//     istrue = true;
//   }
//   else{
//     istrue = false
//   }
//   return istrue
// }
// Parse number Ends

function parseNumber() {
  let digit = '123456789';
  let firstChar;

  if (examConfig.addPicture === true) {
    const editor = document.getElementById('editor');
    if (!editor) return false;
    const text = editor.innerText.trim();
    firstChar = text[0];
  } 
  else {
    const text = textInputEl.value.trim();
    firstChar = text[0];
  }

  return digit.includes(firstChar);
}

// Show alert message
function showAlert(message, type) {
  const showAlertEl = document.getElementById('showAlerts');
  if (!showAlertEl) return;
  
  showAlertEl.style.display = 'block';
  showAlertEl.textContent = message;
  showAlertEl.className = `${type}`;
  
  setTimeout(() => {
    showAlertEl.style.display = 'none';
    showAlertEl.textContent = '';
    showAlertEl.className = '';
  }, 4000);
}