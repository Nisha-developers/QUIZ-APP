import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);
const urlParams = new URLSearchParams(window.location.search);
const selectedClassByUser = urlParams.get("class");
const selectedSubjectUser = urlParams.get('subject');

// Superbase and normal keypath initiation ends


const totalQuestion = document.getElementById('totalQuestionsDisplay');
const questionsToDisplay = document.getElementById('questionsToShowDisplay')
const timeDurationEl = document.querySelector('.timeSet');
const selectClassEl = document.getElementById('selectedClass');
const selectSubjectEl = document.getElementById('subjectDisplay')
const alertMessageEl = document.getElementById('alertMessage');
const editor = document.getElementById("questionText");
const imageInput = document.getElementById("questionImage");
const addQuestionEl = document.getElementById('submitQuestion');
const correctAnswerEl = document.getElementById('correctAnswer');
const optionAEl = document.getElementById('optionA');
const optionBEl = document.getElementById('optionB');
const optionCEl = document.getElementById('optionC');
const optionDEl = document.getElementById('optionD');
const questionAdded = document.getElementById('questionsAddedDisplay');
const formContainerEl = document.querySelector('.form-container');
const questionsContainer = document.getElementById('questionsDisplay');
const allEditableDivs = document.querySelectorAll('[contenteditable="true"]');
const inputContainerEl = document.querySelector('.inputContainer')

// html tergeting elements ends


let savedRange = null;
let examConfig = [];
let  questions = [];
let questionToDelete = null;
let questionToEdit = null;
let passageQuestions = {};
let passageOption = [];
let currentPassageIndex = 0;
let savedPassages = [];
let increase = 0;
let currentPassageSelected = 0;
let editedquestion = 0;
let savedpassagelength = 0

// initialization of elements ends

document.title = `${selectedSubjectUser} Questions for ${selectedClassByUser}`; //Naming the title


const loadexamconfig = async function(){
    try{
let { data: exam_configs, error } = await supabase
  .from('exam_configs')
  .select('*')
  .eq('subject_selected', selectedSubjectUser)
  .eq('classes_student', selectedClassByUser);
  if(error){
    throw error
  }
  examConfig = exam_configs;
return examConfig
    }
    catch(err){
        showAlert('No internet connection check and try again')
        console.log('oops an error has happened' + err)
    }
}
// Load exam config ends


async function displayExamConfig(){
    await loadexamconfig();
   const examconfigs = examConfig[0]
     totalQuestion.textContent = examconfigs.total_score || 0;
     questionsToDisplay.textContent = examconfigs.questions_shown_to_student || 0;
     timeDurationEl.textContent = `Time Set: ${examconfigs.time_exam}`;
     selectClassEl.textContent = examconfigs.classes_student;
     selectSubjectEl.textContent = examconfigs.subject_selected;
}
// display exam config ends


async function ifnoexamconfig(){
  await loadexamconfig();
  const examconfigs = examConfig[0];
  if(examconfigs === undefined){
showAlert('No examination config. Set the exam config and try again', 'danger');
window.location ='../ErrorPage/Error404.html'
  }
}
// Action if exam is not set


const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        savedRange = sel.getRangeAt(0);
    }
};
// Function to save the cursor position ends


allEditableDivs.forEach(div => {
    div.addEventListener('keyup', saveSelection);
    div.addEventListener('mouseup', saveSelection);
    div.addEventListener('click', saveSelection);
    div.addEventListener('input', saveSelection); 
});


imageInput.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;

    try {
        const fileName = `${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
            .from('image')
            .upload(fileName, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('image')
            .getPublicUrl(fileName);

        const img = document.createElement('img');
        img.src = data.publicUrl;
        img.loading = "lazy"; // ⚡ performance boost
        img.className = 'inputImages';

        insertImageAtCursor(img);

    } catch (err) {
        console.error(err);
        showAlert('Image upload failed', 'danger');
    }

    this.value = '';
});

document.addEventListener('change', async function(e) {
    if (e.target.id === 'passageQuestionImage') {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileName = `${Date.now()}-${file.name}`;

            const { error } = await supabase.storage
                .from('image')
                .upload(fileName, file);

            if (error) throw error;

            const { data } = supabase.storage
                .from('image')
                .getPublicUrl(fileName);

            const img = document.createElement('img');
            img.src = data.publicUrl;
            img.loading = "lazy";
            img.className = 'inputImages';

            insertImageAtCursor(img);

        } catch (err) {
            console.error(err);
            showAlert('Image upload failed', 'danger');
        }

        e.target.value = '';
    }
});
function updatecursor(){
    document.addEventListener('keyup', function(e) {
        if (e.target.matches('#passageQuestionsTextarea, #OptionA, #OptionB, #OptionC, #OptionD')) {
            saveSelection();
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (e.target.matches('#passageQuestionsTextarea, #OptionA, #OptionB, #OptionC, #OptionD')) {
            saveSelection();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.matches('#passageQuestionsTextarea, #OptionA, #OptionB, #OptionC, #OptionD')) {
            saveSelection();
        }
    });
    
    document.addEventListener('input', function(e) {
        if (e.target.matches('#passageQuestionsTextarea, #OptionA, #OptionB, #OptionC, #OptionD')) {
            saveSelection();
        }
    });
}
async function loadSavedQuestions() {
    if (!examConfig.length) return;

    const config = examConfig[0];

    try {
        const { data, error } = await supabase
            .from('examQuestions')
            .select('*')
            .eq('subject', config.subject_selected)
            .eq('classes_student', config.classes_student)
            .order('created_at', { ascending: true });

        if (error) throw error;

        questions = data.map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer,
            createdAt: q.created_at
        }));

        refreshQuestionDisplay();
        updateDisplay();

    } catch (err) {
        console.error(err);
        showAlert("Failed to load questions", "danger");
    }
}


function insertImageAtCursor(imgNode) {
    if (savedRange) {
        // Delete any text currently selected (highlighted) by the user
        savedRange.deleteContents();
        
        // Insert the image
        savedRange.insertNode(imgNode);
        
        // OPTIONAL: Move cursor AFTER the image so user can keep typing
        savedRange.setStartAfter(imgNode);
        savedRange.setEndAfter(imgNode); 
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
        
    } else {
        // Fallback: If no cursor was tracked, append to the main Question box
        editor.appendChild(imgNode);
        optionAEl.appendChild(imgNode);
        optionBEl.appendChild(imgNode);
        optionCEl.appendChild(imgNode);
        optionDEl.appendChild(imgNode);

    }
}
window.saveEdit = async function(questionId) {

    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;
   const editEditor = editor.innerText.trim();
   const editoptionA = optionAEl.innerText.trim()
    const editoptionB = optionBEl.innerText.trim()
     const editoptionC = optionCEl.innerText.trim()
      const editoptionD = optionDEl.innerText.trim()
      const editcorrectAnswer = correctAnswerEl.value;
    
    const question = questions[questionIndex];
    question.question_text = editEditor;
    question.options = [editoptionA, editoptionB, editoptionC, editoptionD];
    question.correctAnswer = parseInt(editcorrectAnswer);
    
    try {
        await updateQuestionInSupabase(question)
        refreshQuestionDisplay();

questionToEdit = null;
addQuestionEl.textContent = 'Add Question';

editor.innerHTML = '';
optionAEl.textContent = '';
optionBEl.textContent = '';
optionCEl.textContent = '';
optionDEl.textContent = '';
correctAnswerEl.value = '';;
        showAlert('You have successfully edited the questions', 'success') 
    } catch (error) {
        console.error('Error saving edit:', error);
        showAlert('Failed to save changes', 'danger');
    }

};

addQuestionEl.addEventListener('click', (e)=>{
    e.preventDefault()
    if(addQuestionEl.innerText.trim() === 'Update Question'){
        saveEdit(questionToEdit);
    }
else{
validationOfUserInput();
 refreshQuestionDisplay() 
  updateDisplay()
}

})
//function handle submit ends 
window.deleteQuestion = function(questionId) {
 questionToDelete = questionId;
    const confirmationDialog = document.getElementById('confirmationDialog');
    if (confirmationDialog) {
        confirmationDialog.classList.add('active');
    }
};
function setupEventListeners() {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmationDialog = document.getElementById('confirmationDialog');

    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', cancelDelete);
    }
    
    if (confirmationDialog) {
        confirmationDialog.addEventListener('click', function(e) {
            if (e.target === this) cancelDelete();
        });
    }
}
function cancelDelete() {
    questionToDelete = null;
    const confirmationDialog = document.getElementById('confirmationDialog');
    if (confirmationDialog) {
        confirmationDialog.classList.remove('active');
    }
}

async function confirmDelete() {
    if (!questionToDelete) return;

    const questionIndex = questions.findIndex(q => q.id === questionToDelete);
    if (questionIndex === -1) return cancelDelete();
    
    const question = questions[questionIndex];

    try {

        const { error: dbError } = await supabase
            .from('examQuestions')
            .delete()
            .eq('id', questionToDelete);

        if (dbError) throw dbError;

        showAlert('Question deleted successfully!', 'success');
        await loadSavedQuestions();

    } catch (error) {
        console.error("Error deleting from Supabase:", error);
        showAlert(`Failed to delete question: ${error.message}`, "danger");
    } finally {
        cancelDelete();
    }
}
async function validationOfUserInput(){
    if(checkLimit()){
        showAlert('You have reached the maximum questions, delete some questions and try again', 'danger');
        return;
    }
let editorContent = editor.innerText.trim() === '';
let optionAValue = optionAEl.innerText.trim() === '';
let optionBValue = optionBEl.innerText.trim() === '';
let optionCValue = optionCEl.innerText.trim() === '';
let optionDValue = optionDEl.innerText.trim() === '';
let correctAnswerValue = correctAnswerEl.value;
if(editorContent || optionAValue || optionBValue || optionCValue || optionDValue ||!correctAnswerValue){
    showAlert('Input all fields', 'danger');
    return
}
else{
await insertValueToSupabase()
editor.textContent = '';
optionAEl.textContent = '';
optionBEl.textContent = '';
optionCEl.textContent = '';
optionDEl.textContent = '';
correctAnswerEl.value = ''
}
}

async function insertValueToSupabase() {
    const valueObjectQuestions = {
        subject: selectedSubjectUser,
        question_text: editor.innerHTML.trim(), // keep images
        options: [
            optionAEl.innerHTML.trim(),
            optionBEl.innerHTML.trim(),
            optionCEl.innerHTML.trim(),
            optionDEl.innerHTML.trim()
        ],
        correct_answer: parseInt(correctAnswerEl.value),
        classes_student:selectedClassByUser,
    };
     questions.push(valueObjectQuestions)
    const { data, error } = await supabase
        .from('examQuestions')
        .insert([valueObjectQuestions]);

    if (error) {
        console.error(error);
        showAlert('Failed to save question', 'danger');
        return;
    }

    showAlert('Question added successfully', 'success');
}
function refreshQuestionDisplay() { 
   
    if (questionsContainer) {
        questionsContainer.innerHTML = '';
        questions.forEach((question, index) => {
            displayQuestion(question, index);
        });
    }
}
function displayQuestion(question, index) {
    if (!questionsContainer) return;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.setAttribute('data-question-id', question.id);

    const displayIndex = index + 1;
    questionDiv.innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${displayIndex}</span>
            <div class="question-actions">
                <button class="edit-btn" onclick="editQuestion(${question.id})">Edit</button>
                <button class="delete-btn" onclick="deleteQuestion(${question.id})">Delete</button>
            </div>
        </div>
        
        <div class="question-display" id="display_${question.id}">
            <div class="question-text">${question.question_text}</div>
            <div class="question-options">
                ${question.options.map((option, i) => `
                    <div class="option ${i === question.correctAnswer ? 'correct-answer' : ''}">
                        ${String.fromCharCode(65 + i)}. ${option}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    questionsContainer.appendChild(questionDiv);
}
window.editQuestion = function(questionId) {
  window.scrollTo({
  top: 250,
  left: 0,
  behavior: 'smooth'
});
questionToEdit = questionId;
let getEditPosition = questions.findIndex((q)=>q.id === questionId);
let theValue =  questions[getEditPosition];
editor.innerHTML =theValue.question_text;
optionAEl.innerHTML = theValue.options[0];
optionBEl.innerHTML = theValue.options[1];
optionCEl.innerHTML = theValue.options[2];
optionDEl.innerHTML = theValue.options[3];
correctAnswerEl.value = correctAnswerEl[theValue.correctAnswer].value;
addQuestionEl.textContent = 'Update Question';
};


async function updateQuestionInSupabase(question) {
  const { data, error } = await supabase
    .from('examQuestions')
    .update({
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correctAnswer
    })
    .eq('id', question.id)
    .select();

  if (error) {
    throw error;
  }

  return data;
}
async function todisplaypassage(){
await loadexamconfig();
let passagetodisplay = examConfig[0].passage_workings;
if(passagetodisplay.length > 0){
inputContainerEl.innerHTML = `
<input type="checkbox" id='passagebox'>
<label for='passagebox'>Passage Mode?</label>
`;

  switchToPassageMode()
}
}
function switchToPassageMode(){
    const passageEl = document.getElementById('passagebox');
    passageEl.addEventListener('change', async (e)=>{
        let isOn = e.target.checked;
        if(isOn){
             actualSwitchMode()
        }
    });
}
async function actualSwitchMode(){
    const exampassage = await loadexamconfig();
            const passages = exampassage[0].passage_workings;
            const questionContainer = document.getElementById('passagedelete');
            questionContainer.style.display = 'none';
            const createElforPassage = document.createElement('div');
            createElforPassage.id = 'passageContts'

            createElforPassage.innerHTML = `
                <div class="theInputShow">
                    <div class="passageTop">
                        ${passages.map((eachPassage, eachPassageIndex) => `
                            <div style="margin-bottom: 0.6rem;">
                                <div style="display:flex; align-items:center; gap:0.6rem;">
                                    <input type="radio" name="ChooseEachPassage" value="${eachPassage.value}" data-compulsory="${eachPassage.compulsory}" data-position ='${eachPassageIndex}'  style="margin-top:8px; display:inline-block;" ${eachPassageIndex === 0 ? 'checked': ''}>
                                    <label style="font-weight:bold; font-size:17px; margin-left:6px;">Passage ${eachPassageIndex + 1}</label>
                                </div>
                                <div>Input Value: ${eachPassage.value ?? ''}</div>
                                <div>Compulsory Passage: ${eachPassage.compulsory ? 'Yes' : 'No'}</div>
                            </div>
                        `).join('')}
                    </div>
    
    
                    <div>
                        <div class="passage-question-number">
                            Passage <span id="passageQuestionIndex">1</span>
                        </div>

                        <label class='questiontext'>Passage Question</label>
                        <div id="passageQuestionsTextarea" class="questionText" contenteditable='true'></div>
                        <div class="image-upload">
                            <div>
                                <label for="passageQuestionImage">Question Image (Optional):</label>
                                <input type="file" id="passageQuestionImage" accept="image/*">
                            </div>
                        </div>
                        <div class='getOption'>Option 1</div>
                        <div class='next-prev-main-con'>
                            <div id='prev'><i class="fa-solid fa-chevron-left"></i></div>
                            <div class="options-container">
                                <div class="option-group">
                                    <label for="optionA">Option A:</label>
                                    <div id="OptionA" class="editable-option" contenteditable="true"></div>
                                </div>
                                <div class="option-group">
                                    <label for="optionB">Option B:</label>
                                    <div id="OptionB" class="editable-option" contenteditable="true"></div>
                                </div>
                                <div class="option-group">
                                    <label for="optionC">Option C:</label>
                                    <div id="OptionC" class="editable-option" contenteditable="true"></div>
                                </div>
                                <div class="option-group">
                                    <label for="optionD">Option D:</label>
                                    <div id="OptionD" class="editable-option" contenteditable="true"></div>
                                </div>
                                <div class="answer-section">
                                    <div>
                                        <label for="correctAnswer">Correct Answer:</label>
                                        <select id="correctAnswerS" required>
                                            <option value="">Select correct answer</option>
                                            <option value="0">Option A</option>
                                            <option value="1">Option B</option>
                                            <option value="2">Option C</option>
                                            <option value="3">Option D</option>
                                        </select>
                                    </div>
                                </div>
                                <div class='normalMode'>
                                                <input id='normal_mode' type='checkbox'>
                        <label for='normal_mode'>Normal mode?</label>
                        </div>
                            </div>
                            <div id='next'><i class="fa-solid fa-chevron-right"></i></div>
                        </div>
                       
                        <div class="dotsContainer">
                            ${createTheValueChecked(passages[currentPassageIndex].value)}
                        </div>
                        <button id='addPassage' disabled>Add Passage</button>
                    </div>
                </div>
            `;
            
            formContainerEl.insertAdjacentElement('afterbegin', createElforPassage);
            const nextEL = document.getElementById('next');
            const prevEl = document.getElementById('prev');
             knowpassagework()
            nextEL.addEventListener('click', nextBehaviour);
            prevEl.addEventListener('click', prevBehaviour);
            normalModeSwitching()
            addQuestionEl.remove();
}
function knowpassagework(){
    const addPassageEl = document.getElementById('addPassage');
    addPassageEl.addEventListener('click', ()=>{
      if(addPassageEl.textContent.trim() === 'Update Passage'){
        editPassageBehaviour()
      }
      else{
         behaviortoaddPassage();
      }
    })

}




document.addEventListener('change', async(e) => {
     const exampassage = await loadexamconfig();
    const passages = exampassage[0].passage_workings;
    if (e.target.matches('input[name="ChooseEachPassage"]')) {
increase = 0; 
 passageOption = [];
turnremainingtexttoreadonly()
document.querySelector('.getOption').textContent = 'Option 1';
document.getElementById('next').classList.remove('disable-next');

initializepassagevalue();
        currentPassageIndex = Number(e.target.dataset.position);
        // update number
        document.getElementById('passageQuestionIndex').textContent =
            currentPassageIndex + 1;

        // update dots
        document.querySelector('.dotsContainer').innerHTML =
            createTheValueChecked(passages[currentPassageIndex].value);
    }
});
async function nextBehaviour() {
    const addPassageel = document.getElementById('addPassage');
    const nextEL = document.getElementById('next');
    const exampassage = await loadexamconfig();
    const passages = exampassage[0].passage_workings;
 const prevEl = document.getElementById('prev');
    const maxQuestions = Number(passages[currentPassageIndex].value);
    const getoptionel = document.querySelector('.getOption');
prevEl.classList.remove('disable-next');
    if (!validationOfContent()) {
        showAlert('Input all fields and try again', 'danger');
        return;
    }
     pushoptionValue();

    // Stop if last question reached
    if (increase >= maxQuestions - 1) {
        nextEL.classList.add('disable-next');
           showAlert(`You are done setting passage ${currentPassageIndex + 1} click to add passage`,'success')
        
        if(getComputedStyle(nextEL).opacity === '0.5'){
            addPassageel.disabled = false;
            return;
        }
    }
     
 increase++;
 turnremainingtexttoreadonly();
    // UPDATE UI
    getoptionel.textContent = `Option ${increase + 1}`;
     removeInitializeOnquestionText()
    updateActiveDot(increase); 
}
function removeInitializeOnquestionText(){
const optionAPassage = document.getElementById('OptionA');
const optionBPassage = document.getElementById('OptionB');
const optionCPassage = document.getElementById('OptionC');
const optionDPassage = document.getElementById('OptionD');
const selectCorrectAnswer = document.getElementById('correctAnswerS');
optionAPassage.textContent = '';
optionBPassage.textContent = '';
optionCPassage.textContent = '';
optionDPassage.textContent = '';
selectCorrectAnswer.value = '';
}
 function normalModeSwitching(){
    const normalMode = document.getElementById('normal_mode');
    normalMode.addEventListener('change', (e)=>{
        let wantsNormalMode = e.target.checked;
        if(wantsNormalMode){
   const createElforPassage = document.getElementById('passageContts');
    const passageMode = document.getElementById('passagebox');
   const passageDeleteEl = document.getElementById('passagedelete');
    passageMode.checked = false;
    createElforPassage.style.display = 'none';
    passageDeleteEl.style.display = 'block';
    passageDeleteEl.insertAdjacentElement('afterend', addQuestionEl);
        }
    }) 
 
  }

function turnremainingtexttoreadonly(){
    const passagetext = document.getElementById('passageQuestionsTextarea');
    if(increase > 0){
        passagetext.contentEditable = false;
    }
    else{
         passagetext.contentEditable = true;
    }
}
 function prevBehaviour(){
    const prevEl = document.getElementById('prev');
     const nextEl = document.getElementById('next');
     const optionAPassage = document.getElementById('OptionA');
     const optionBPassage = document.getElementById('OptionB');
     const optionCPassage = document.getElementById('OptionC');
     const optionDPassage = document.getElementById('OptionD');
     const selectCorrectAnswer = document.getElementById('correctAnswerS');
     let optionAPassageGET = passageOption[increase - 1].optionATextContent;
     let optionBPassageGET = passageOption[increase - 1].optionBTextContent;
     let optionCPassageGET = passageOption[increase - 1].optionCTextContent;
     let optionDPassageGET = passageOption[increase - 1].optionDTextContent;
     let selectCorrectAnswerGET =  passageOption[increase -1].correctAnswer;
     optionAPassage.innerHTML = optionAPassageGET;
     optionBPassage.innerHTML = optionBPassageGET;
     optionCPassage.innerHTML = optionCPassageGET;
     optionDPassage.innerHTML = optionDPassageGET;
     selectCorrectAnswer.value = selectCorrectAnswerGET;
     
     const getoptionel = document.querySelector('.getOption');
     nextEl.classList.remove('disable-next');
    if(increase === 0){
       prevEl.classList.add('disable-next');
    }
    else{
        increase--
         getoptionel.textContent = `Option ${increase + 1}`
         updateActiveDot(increase); 
    }

 }
 async function loadSavedPassages() {
    
    if (!selectedSubjectUser) {
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('exam_passages')
            .select('*')
            .eq('subject', selectedSubjectUser)
            .eq('classes_student', selectedClassByUser)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        savedPassages = data || [];
        displaySavedPassages(); 
    } catch (error) {
        console.error('Error loading passages:', error);
        showAlert('Failed to load passages', 'danger');
    }
}
// Delete passage
window.deletePassage = async function(passageId) {
    if (!confirm('Are you sure you want to delete this passage?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('exam_passages')
            .delete()
            .eq('id', passageId);
        
        if (error) throw error;
        
        showAlert('Passage deleted successfully!', 'success');
        updateDisplay()
        await loadSavedPassages();
        
    } catch (error) {
        console.error('Error deleting passage:', error);
        showAlert('Failed to delete passage', 'danger');
    }
};

window.editPassage = async (passageId) => {
     const addpassage = document.getElementById('addPassage');
    if(!addpassage){
        actualSwitchMode()
        showAlert('Wait to load the passage', 'warning');
        setTimeout(()=>{
             editedlogicContinues(passageId)
             return;
        }, 2000);
    }
   editedlogicContinues(passageId) 
   
};
async function editedlogicContinues(passageId){
      const addpassage = document.getElementById('addPassage');
     const getAllSelectedPassage = document.querySelectorAll('input[name="ChooseEachPassage"]')
    const dotsContainers = document.querySelector('.dotsContainer');
const whatPassage = document.getElementById('passageQuestionIndex');
    
    window.scrollTo({
  top: 250,
  left: 0,
  behavior: 'smooth'
});
 await loadSavedPassages();
 editedquestion = passageId
 addpassage.textContent = 'Update Passage';


const editedValue = savedPassages.findIndex((q)=>q.id === passageId);
const valueSavingPassage = savedPassages[editedValue];
const theSelectedEl = getAllSelectedPassage[editedValue];
theSelectedEl.checked = true;
whatPassage.innerHTML = editedValue + 1;

dotsContainers.innerHTML = `${createTheValueChecked(valueSavingPassage.passage_number)}`

// 
loadQuestions(valueSavingPassage);
}
async function editPassageBehaviour(){
  const passageText = document.querySelector('#passageQuestionsTextarea');
    const passageTextValue = passageText.innerHTML.trim();
    const exampassage = await loadexamconfig();
      const passages = exampassage[0].passage_workings;
     const maxQuestions = Number(passages[currentPassageIndex].value);
      await loadSavedPassages();
      console.log(savedPassages)
  
    passageQuestions = {
        subject: selectedSubjectUser.trim(),
        classes_student: selectedClassByUser.trim(),
        passage_text: passageTextValue,
         passage_number: parseInt(passages[currentPassageIndex].value),
         is_compulsory: passages[currentPassageIndex].compulsory,
         questions: passageOption,
         passage_position: currentPassageIndex + 1
    };
      if (!passageTextValue) {
    showAlert('Passage text cannot be empty', 'danger');
    return;
  }
  if (!validatePassageBeforeSave(maxQuestions)) {
    showAlert('Complete all passage questions before saving', 'danger');
    return;
  }

updatePassage(editedquestion); 
}



function renderPassageQuestion(passage, index) {
  const optionAPassage = document.getElementById('OptionA');
  const optionBPassage = document.getElementById('OptionB');
  const optionCPassage = document.getElementById('OptionC');
  const optionDPassage = document.getElementById('OptionD');
  const selectCorrectAnswer = document.getElementById('correctAnswerS');

  const q = passage.questions[index];
  if (!q) return;

  optionAPassage.innerHTML = q.optionATextContent;
  optionBPassage.innerHTML = q.optionBTextContent;
  optionCPassage.innerHTML = q.optionCTextContent;
  optionDPassage.innerHTML = q.optionDTextContent;
  selectCorrectAnswer.value = q.correctAnswer;

  updateActiveDot(index);
}


function loadQuestions(passage) {
  const nextEL = document.getElementById('next');
  const prevEl = document.getElementById('prev');
  const passageText = document.getElementById('passageQuestionsTextarea');
  const addPassageEls = document.getElementById('addPassage');

  // reset global state
  increase = 0;
  passageOption = [...passage.questions];

  passageText.innerHTML = passage.passage_text;
  turnremainingtexttoreadonly();

  //  REMOVE OLD LISTENERS
  nextEL.replaceWith(nextEL.cloneNode(true));
  prevEl.replaceWith(prevEl.cloneNode(true));

  const newNext = document.getElementById('next');
  const newPrev = document.getElementById('prev');

  renderPassageQuestion(passage, increase);

  newNext.addEventListener('click', () => {
    if (increase >= passage.questions.length - 1) {
        newNext.classList.add('disable-next');
        showAlert('You have completed the passage', 'success');
       addPassageEls.disabled = false;
        return
    };

    if (!validationOfContent()) {
      showAlert('Complete this question first', 'danger');
      return;
    }

    pushoptionValue();
    increase++;
    renderPassageQuestion(passage, increase);
  });

  newPrev.addEventListener('click', () => {
    if (increase === 0) return;
    increase--;
    renderPassageQuestion(passage, increase);
  });
}


 async function updatePassage(passageId) {
     try {
         const { error } = await supabase
             .from('exam_passages')
             .update([passageQuestions])
             .eq('id', passageId);
         if (error) throw error;

         showAlert('Passage updated successfully!', 'success');
         await loadSavedPassages();
         initializepassagevalue()
     } catch (err) {
         console.error(err);
         showAlert('Failed to update passage', 'danger');
     }
 }

// Display saved passages
function displaySavedPassages() {
    let passagesContainer = document.getElementById('passagesDisplay');
    
    if (!passagesContainer) {
        // Create passages display container if it doesn't exist
        const questionsDisplay = document.getElementById('questionsDisplay');
        if (questionsDisplay && questionsDisplay.parentNode) {
            passagesContainer = document.createElement('div');
            passagesContainer.id = 'passagesDisplay';
            passagesContainer.className = 'questions-display';
            passagesContainer.style.marginBottom = '30px';
            
            const heading = document.createElement('h1');
            heading.textContent = '';
            heading.style.textAlign = 'center';
            heading.style.margin = '20px';
            heading.style.color = 'yellow';
            
            questionsDisplay.parentNode.insertBefore(heading, questionsDisplay);
            questionsDisplay.parentNode.insertBefore(passagesContainer, questionsDisplay);
        }
    }
    
    if (!passagesContainer) return;
    
    passagesContainer.innerHTML = '';
    
    savedPassages.forEach((passage, index) => {
        const passageDiv = document.createElement('div');
        passageDiv.className = 'passage-item question-item';
        
        passageDiv.innerHTML = `
            <div class="question-header">
                <div>
                    <span class="question-number">Passage ${index + 1}</span>
                    <span style="color: #00ff00; margin-left: 10px;">(${passage.passage_number} questions)</span>
                    ${passage.is_compulsory ? '<span style="color: #ffa500; margin-left: 10px; font-size: 12px;">⚠ COMPULSORY</span>' : ''}
                </div>
                <div class="question-actions">
                    <button class="delete-btn" onclick="deletePassage(${passage.id})">Delete</button>
                     <button class="edit-btn" onclick='editPassage(${passage.id})'
">Edit</button>
                </div>
            </div>
            
            <div class="passage-content">
                <div style="background: rgba(0, 100, 255, 0.15); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid blue;">
                    <div style="color: #00ff00; font-weight: bold; margin-bottom: 10px; font-size: 16px;">Passage Question</div>
                    <div class="question-text" style="line-height: 1.8; padding: 10px; background: rgba(0, 0, 0, 0.3); border-radius: 5px;">
                        ${passage.passage_text}
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    ${passage.questions.map((q, qIndex) => `
                        <div style="margin-bottom: 25px; padding: 20px; border: 1px solid #666; border-radius: 8px; background: rgba(0, 0, 0, 0.3); border-left: 4px solid ${q.correctAnswer === '0' ? '#00ff00' : q.correctAnswer === '1' ? '#00bfff' : q.correctAnswer === '2' ? '#ffa500' : '#ff69b4'};">
                            <div style="font-weight: bold; color: #00ff00; margin-bottom: 12px; font-size: 15px;">
                                Option ${qIndex + 1}
                            </div>
                           
                            <div class="question-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="option ${q.correctAnswer === '0' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '0' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '0' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">A.</strong> ${q.optionATextContent}
                                    ${q.correctAnswer === '0' ? ' <span style="color: #040704ff;">✓</span>' : ''}
                                </div>
                                <div class="option ${q.correctAnswer === '1' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '1' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '1' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">B.</strong> ${q.optionBTextContent}
                                    ${q.correctAnswer === '1' ? ' <span style="color: #00ff00;">✓</span>' : ''}
                                </div>
                                <div class="option ${q.correctAnswer === '2' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '2' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '2' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">C.</strong> ${q.optionCTextContent}
                                    ${q.correctAnswer === '2' ? ' <span style="color: #00ff00;">✓</span>' : ''}
                                </div>
                                <div class="option ${q.correctAnswer === '3' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '3' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '3' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">D.</strong> ${q.optionDTextContent}
                                    ${q.correctAnswer === '3' ? ' <span style="color: #00ff00;">✓</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        passagesContainer.appendChild(passageDiv);
    });
}

async function addPassageQuetionLength(){
await loadSavedPassages()
console.log(savedPassages)
let totalquestion = savedPassages.reduce((sum, values)=> sum += values.passage_number,0);
savedpassagelength = totalquestion;
return totalquestion;
}












 function pushoptionValue() {
  const optionAPassage = document.getElementById('OptionA');
  const optionBPassage = document.getElementById('OptionB');
  const optionCPassage = document.getElementById('OptionC');
  const optionDPassage = document.getElementById('OptionD');
  const selectCorrectAnswer = document.getElementById('correctAnswerS');

  passageOption[increase] = {
    optionATextContent: optionAPassage.innerHTML.trim(),
    optionBTextContent: optionBPassage.innerHTML.trim(),
    optionCTextContent: optionCPassage.innerHTML.trim(),
    optionDTextContent: optionDPassage.innerHTML.trim(),
    correctAnswer: selectCorrectAnswer.value
  };
}


function updateActiveDot(activeIndex) {
    const dots = document.querySelectorAll('.dots');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
    });
}
async function behaviortoaddPassage(){
    const passageText = document.querySelector('#passageQuestionsTextarea');
    const passageTextValue = passageText.innerHTML.trim();
    const exampassage = await loadexamconfig();
      const passages = exampassage[0].passage_workings;
     const maxQuestions = Number(passages[currentPassageIndex].value);
      await loadSavedPassages();
  
    passageQuestions = {
        subject: selectedSubjectUser.trim(),
        classes_student: selectedClassByUser.trim(),
        passage_text: passageTextValue,
         passage_number: parseInt(passages[currentPassageIndex].value),
         is_compulsory: passages[currentPassageIndex].compulsory,
         questions: passageOption,
         passage_position: currentPassageIndex + 1
    };
let targetifPassage = savedPassages.some((q)=>q.passage_position === passageQuestions.passage_position);
if(targetifPassage){
    showAlert('The selected passage is available. Edit it to make changes', 'warning');
    return;
}
     if (!passageTextValue) {
    showAlert('Passage text cannot be empty', 'danger');
    return;
  }

  if (!validatePassageBeforeSave(maxQuestions)) {
    showAlert('Complete all passage questions before saving', 'danger');
    return;
  }
    try {
    const { error } = await supabase
      .from('exam_passages')
      .insert([passageQuestions]);

    if (error) throw error;
    await loadSavedPassages()
    updateDisplay()
 displaySavedPassages()

    showAlert(
      `Passage ${currentPassageIndex + 1} saved successfully`,
      'success'
    );

    // RESET STATE AFTER SAVE
    passageOption = [];
    increase = 0;
    initializepassagevalue();
    passageQuestions = [];

  } catch (err) {
    console.error(err);
    showAlert('Failed to save passage', 'danger');
  }
}









function validationOfContent(){
  let  isempty = true
const passageText = document.getElementById('passageQuestionsTextarea');
const optionAPassage = document.getElementById('OptionA');
const optionBPassage = document.getElementById('OptionB');
const optionCPassage = document.getElementById('OptionC');
const optionDPassage = document.getElementById('OptionD');
const selectCorrectAnswer = document.getElementById('correctAnswerS');
let passageTextvalue = passageText.innerText.trim() === '';
let optionAPassagevalue = optionAPassage.innerText.trim() === '';
let optionBPassagevalue = optionBPassage.innerText.trim() === '';
let optionCPassagevalue = optionCPassage.innerText.trim() === '';
let optionDPassagevalue = optionDPassage.innerText.trim() === '';
if(passageTextvalue||optionAPassagevalue || optionBPassagevalue || optionCPassagevalue || optionDPassagevalue || selectCorrectAnswer.value === ''){
    isempty = false;
}
return isempty
}
function initializepassagevalue(){
   const passageText = document.getElementById('passageQuestionsTextarea');
const optionAPassage = document.getElementById('OptionA');
const optionBPassage = document.getElementById('OptionB');
const optionCPassage = document.getElementById('OptionC');
const optionDPassage = document.getElementById('OptionD');
const selectCorrectAnswer = document.getElementById('correctAnswerS');
passageText.textContent = '';
optionAPassage.textContent = '';
optionBPassage.textContent = '';
optionCPassage.textContent = '';
optionDPassage.textContent = '';
selectCorrectAnswer.value = '';
}

function createTheValueChecked(passageValue) {
    let dotsHtml = '';
    const value = Number(passageValue) || 0;
    for (let i = 0; i < value; i++) {
        dotsHtml += `<span class='dots ${i === 0 ? 'active' : ''}' data-index='${i}'></span>`;
    }
    return dotsHtml;
}
function getContenttitle(){
    const titleEl = document.querySelector('.title');
    if(window.innerWidth <= 758){
        titleEl.textContent = 'Navy School';
    } else {
        titleEl.textContent = 'Navy Secondary School Abeokuta'; 
    }
}
window.addEventListener('resize', getContenttitle);

getContenttitle();
async function updateDisplay() {
    let totalQuestionAdded = questions.length;
    console.log(savedpassagelength)
   questionAdded.textContent = totalQuestionAdded + await addPassageQuetionLength();
}
function checkLimit(){
    let hasreachedmax = false;
let questionAddedValue = parseInt(questionAdded.textContent.trim());   
let totalQuestiontextValue = parseInt(totalQuestion.textContent.trim());
if(totalQuestiontextValue === questionAddedValue){
   hasreachedmax = true;
}
return hasreachedmax; 

}
function showAlert(message, classnames){
 alertMessageEl.textContent = message;
 alertMessageEl.className = `alert alert-${classnames}`;
 setTimeout(()=>{
  alertMessageEl.textContent = '';
  alertMessageEl.className = ''
 }, 5000);
}
function validatePassageBeforeSave(maxQuestions) {
  if (passageOption.length !== maxQuestions) return false;

  return passageOption.every(q =>
    q.optionATextContent &&
    q.optionBTextContent &&
    q.optionCTextContent &&
    q.optionDTextContent &&
    q.correctAnswer !== ''
  );
}


document.addEventListener('DOMContentLoaded', async () => {
    await loadexamconfig();
    await ifnoexamconfig();
    await displayExamConfig();
    await loadSavedPassages()
    await loadSavedQuestions();
    setupEventListeners()
   await todisplaypassage()
   updatecursor()
 addPassageQuetionLength();
});



// Initial initialization of the website on lo
