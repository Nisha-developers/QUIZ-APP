import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

// Global state variables
let examConfig = {};
let questions = [];
let imageCount = 0;
let editingQuestionId = null;
let questionToDelete = null;
let valueQuestion = null;
let ischecked;
let passageQuestions = [];
let currentPassageIndex = 0;
let savedPassages = []; // Store saved passages
let passageaddedquestion = 0
let continues = true;

const urlParams = new URLSearchParams(window.location.search);
const selectedClassByUser = urlParams.get("class");
const selectedSubjectUser = urlParams.get('subject');
document.title = `${selectedSubjectUser} Questions for ${selectedClassByUser}`;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadExamConfig();
    setupEventListeners(); 
});

// Helper function to convert Data URL to File object for Supabase upload
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

async function loadExamConfig() {
    const stored = sessionStorage.getItem('storeResult');
    if (stored) {
        examConfig = JSON.parse(stored);
        updateConfigDisplay();
        await workExamConfigpassageInput();
         console.log(getTotalValue());
        await loadSavedQuestions();
        await loadSavedPassages();
        await determinetoaddpassageselectedRadio() // Load saved passages
        return;
    }

    if (selectedClassByUser && selectedSubjectUser) {
        try {
            await loadConfigFromSupabase(selectedClassByUser, selectedSubjectUser);
            await workExamConfigpassageInput();
            await loadSavedQuestions();
            await loadSavedPassages(); 
            await determinetoaddpassageselectedRadio() // Load saved passages
        } catch (error) {
            console.error('Error loading config', error);
            showAlert('Failed to load exam configuration', 'danger');
        }
    } else {
        showAlert('No examination configuration found. Redirecting...', 'danger');
        window.location.href = '/ErrorPage/Error404.html'; 
    }
}

// Load config directly from Supabase
async function loadConfigFromSupabase(selectedClassByUser, selectedSubjectUser) {
    try {
        const { data, error } = await supabase
            .from('exam_configs')
            .select('*')
            .eq('classes_student', selectedClassByUser)
            .eq('subject_selected', selectedSubjectUser)
            .single()

        if (error) {
            throw error;
        }

        if (data) {
            examConfig = {
                subjectSelected: data.subject_selected,
                totalScore: data.total_score,
                questionshowntostudent: data.questions_shown_to_student,
                imageset: data.image_set,
                classSelected: data.classes_student,
                secondsQuiz: data.seconds_quiz,
                passageInput: Array.isArray(data.passage_workings) ? data.passage_workings : []
            };

            sessionStorage.setItem('storeResult', JSON.stringify(examConfig));
            updateConfigDisplay();
        } else {
            throw new Error('No configuration found for this subject');
        }
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        throw error;
    }
}

async function workExamConfigpassageInput() {
    let answerViewer = document.querySelector('.answer-section');
    
    const passages = examConfig.passageInput;
    
    if (!passages || passages.length === 0) {
        return;
    }
    
    if (document.querySelector('.passageModeDesign')) {
        return;
    }
    
    const checkBoxCon = document.createElement('div');
    checkBoxCon.className = 'passageModeDesign';
    checkBoxCon.innerHTML = `
        <input id="passageMode" type="checkbox">
        <label for="passageMode">Passage mode?</label>
    `;
    answerViewer.append(checkBoxCon);
    
    const questionFormEl = document.getElementById('questionForm');
    const originalQuestionFormHTML = questionFormEl ? questionFormEl.innerHTML : '';
    
    const passageModeCheckbox = document.getElementById('passageMode');
    if (!passageModeCheckbox) return;
    
    passageModeCheckbox.addEventListener('change', (e) => {
        const isOn = e.target.checked;
        const questionAddContainer = document.querySelector('.questionAdd') || document.querySelector('#questionForm');
        
        if (isOn) {
            const selectedPassageValue = passages[0].value;
            initializePassageQuestions(selectedPassageValue);
            
            const passageHtml = `
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
                
                    <div style="text-align: center; font-weight: bold; font-size: 18px; margin: 10px 0;">
                        Question <span id="currentQuestionNumber">1</span> of <span id="totalQuestions">${passages[0].value}</span>
                    </div>
                    <textarea id="passageQuestionsTextarea" placeholder="Write your passage questions" rows="13" style="width:100%;"></textarea>

                    <label>Answer Options:</label>
                    <div class='nextforwardforard'>
                        <button type="button" id="prevBtn" style="padding: 8px 16px; cursor: pointer;">Prev</button>
                        <div class="options-container">
                            <div class="option-group">
                                <label for="optionA">Option A:</label>
                                <input type="text" id="optionA" placeholder="Option A" required>
                            </div>
                            <div class="option-group">
                                <label for="optionB">Option B:</label>
                                <input type="text" id="optionB" placeholder="Option B" required>
                            </div>
                            <div class="option-group">
                                <label for="optionC">Option C:</label>
                                <input type="text" id="optionC" placeholder="Option C" required>
                            </div>
                            <div class="option-group">
                                <label for="optionD">Option D:</label>
                                <input type="text" id="optionD" placeholder="Option D" required>
                            </div>
                        </div>
                        <button type="button" id="nextBtn" style="padding: 8px 16px; cursor: pointer;">Next</button>
                    </div>
                    
                    <div class='dotsContainer'>
                        ${createTheValueChecked(passages[0].value)}
                    </div>
                    
                    <div class="answer-section">
                        <div>
                            <label for="correctAnswer">Correct Answer:</label>
                            <select id="correctAnswer" required>
                                <option value="">Select correct answer</option>
                                <option value="0">Option A</option>
                                <option value="1">Option B</option>
                                <option value="2">Option C</option>
                                <option value="3">Option D</option>
                            </select>
                        </div>
                        
                        <div style="display:flex; justify-content: center; align-items:center">
                            <input type="checkbox" id="normalMode">
                            <label for="normalMode">Normal Mode?</label>
                        </div>
                    </div>
                </div>
            `;
            
            const submitQuestion = document.getElementById('submitQuestion');
            submitQuestion.textContent = 'Add Passage';
            submitQuestion.disabled = true;
            submitQuestion.classList.add('disabledcontent');
            
            if (questionAddContainer) {
                questionAddContainer.innerHTML = passageHtml;
                
                document.querySelectorAll('input[name="ChooseEachPassage"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        const dotsContainer = document.querySelector('.dotsContainer');
                        const totalQuestionsSpan = document.getElementById('totalQuestions');
                        
                        if (dotsContainer) {
                            dotsContainer.innerHTML = createTheValueChecked(e.target.value);
                        }
                        if (totalQuestionsSpan) {
                            totalQuestionsSpan.textContent = e.target.value;
                        }
                        
                        initializePassageQuestions(e.target.value);
                        loadPassageQuestion(0);
                        setupDotNavigation();
                    });
                });
                
                setupPassageNavigation();
                
                // Add event listener to "Add Passage" button
                submitQuestion.onclick = handlePassageSubmit;
            }
            
            const normalModeCheckbox = document.getElementById('normalMode');
            toggleNormalPassageMode(normalModeCheckbox, questionFormEl, originalQuestionFormHTML);
            
            const imgUploadEl = document.querySelector('.image-upload');
            if (imgUploadEl) imgUploadEl.style.display = 'none';
        } else {
            if (questionFormEl && originalQuestionFormHTML) {
                questionFormEl.innerHTML = originalQuestionFormHTML;
                setupEventListeners();
            }
            const imgUploadEl = document.querySelector('.image-upload');
            if (imgUploadEl) imgUploadEl.style.display = '';
        }
    });
}

function diplayrandomlyorno() {
    const currentQuestion = document.getElementById('currentQuestionNumber');
    const textarea = document.getElementById('passageQuestionsTextarea');

    if (!currentQuestion || !textarea) return;

    const questionNumber = parseInt(currentQuestion.textContent.trim(), 10);

    if (questionNumber === 1) {
        textarea.removeAttribute('readonly');
    } else {
        textarea.setAttribute('readonly', true);
    }
}

function createTheValueChecked(passageValue) {
    let dotsHtml = '';
    const value = Number(passageValue) || 0;
    for (let i = 0; i < value; i++) {
        dotsHtml += `<span class='dots ${i === 0 ? 'active' : ''}' data-index='${i}'></span>`;
    }
    return dotsHtml;
}

function initializePassageQuestions(totalQuestions) {
    const total = Number(totalQuestions) || 0;
    passageQuestions = Array.from({ length: total }, () => ({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: ''
    }));
    currentPassageIndex = 0;
}

function checkNextReachedEnd(btn){
    const submitQuestion = document.getElementById('submitQuestion');
    if(btn.style.cursor === 'not-allowed'){
        submitQuestion.disabled = false;
        submitQuestion.classList.remove('disabledcontent');
    } else {
        submitQuestion.disabled = true;
        submitQuestion.classList.add('disabledcontent');
    }
}

function setupPassageNavigation() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if(passageValidation() === true){
                saveCurrentQuestion();
                if (currentPassageIndex < passageQuestions.length - 1) {
                    currentPassageIndex++;
                    loadPassageQuestion(currentPassageIndex);
                    checkNextReachedEnd(nextBtn);
                }
            } else {
                showAlert('Input all the fields before you can continue', 'danger');
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            saveCurrentQuestion();
            if (currentPassageIndex > 0) {
                currentPassageIndex--;
                loadPassageQuestion(currentPassageIndex);
            }
        });
    }
    
    setupDotNavigation();
    loadPassageQuestion(0);
}
async function getPassageSelected(){
    let passagePositionArr = [];
 await loadSavedPassages();
savedPassages.forEach((el)=>{
passagePositionArr.push(el.passage_position);
})
    return passagePositionArr;
}
async function determinetoaddpassageselectedRadio(){
    const selectedRadio = document.querySelector('input[name="ChooseEachPassage"]:checked');
    const collectionOfRadio = document.querySelectorAll('input[name="ChooseEachPassage"]');
    let selectedIndexChecked = [...collectionOfRadio].indexOf(selectedRadio);
    let theIndexSelected = selectedIndexChecked + 1;
    const gotPassagePositionArray = await getPassageSelected();
    
    if(gotPassagePositionArray.includes(theIndexSelected)){
        selectedRadio.disabled = true;
        showAlert('Seems you have set this particular passage. Choose another passage to set', 'danger');
        return false; 
    }
    
    return true; 
}

function passageValidation(){
    const passageQuestion = document.getElementById('passageQuestionsTextarea');
    const optionA = document.getElementById('optionA');
    const optionB = document.getElementById('optionB');
    const optionC = document.getElementById('optionC');
    const optionD = document.getElementById('optionD');
    const correctAnswer = document.getElementById('correctAnswer');
    
    if(passageQuestion.value === '' || optionA.value === '' || optionB.value === '' || 
       optionC.value === '' || optionD.value === '' || correctAnswer.value === ''){
        return false;
    }
    return true;
}

function setupDotNavigation() {
    const dots = document.querySelectorAll('.dots');
    
    dots.forEach((dot, index) => {
        const newDot = dot.cloneNode(true);
        dot.parentNode.replaceChild(newDot, dot);
        
        newDot.addEventListener('click', () => {
            saveCurrentQuestion();
            currentPassageIndex = index;
            loadPassageQuestion(currentPassageIndex);
        });
        newDot.style.cursor = 'pointer';
    });
}

function saveCurrentQuestion() {
    const questionText = document.getElementById('passageQuestionsTextarea')?.value?.trim() || '';
    const optionA = document.getElementById('optionA')?.value?.trim() || '';
    const optionB = document.getElementById('optionB')?.value?.trim() || '';
    const optionC = document.getElementById('optionC')?.value?.trim() || '';
    const optionD = document.getElementById('optionD')?.value?.trim() || '';
    const correctAnswer = document.getElementById('correctAnswer')?.value || '';
    
    passageQuestions[currentPassageIndex] = {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer
    };
}

function loadPassageQuestion(index) {
    const question = passageQuestions[index];
    
    const questionTextArea = document.getElementById('passageQuestionsTextarea');
    const optionA = document.getElementById('optionA');
    const optionB = document.getElementById('optionB');
    const optionC = document.getElementById('optionC');
    const optionD = document.getElementById('optionD');
    const correctAnswer = document.getElementById('correctAnswer');
    
    if (questionTextArea) questionTextArea.value = passageQuestions[0].questionText;
    if (optionA) optionA.value = question.optionA;
    if (optionB) optionB.value = question.optionB;
    if (optionC) optionC.value = question.optionC;
    if (optionD) optionD.value = question.optionD;
    if (correctAnswer) correctAnswer.value = question.correctAnswer;
    
    const currentQuestionNumber = document.getElementById('currentQuestionNumber');
    if (currentQuestionNumber) {
        currentQuestionNumber.textContent = index + 1;
    }
    diplayrandomlyorno();
    
    const dots = document.querySelectorAll('.dots');
    dots.forEach((dot, i) => {
        if (i === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = index === 0;
        prevBtn.style.opacity = index === 0 ? '0.5' : '1';
        prevBtn.style.cursor = index === 0 ? 'not-allowed' : 'pointer';
    }
    
    if (nextBtn) {
        nextBtn.disabled = index === passageQuestions.length - 1;
        nextBtn.style.opacity = index === passageQuestions.length - 1 ? '0.5' : '1';
        nextBtn.style.cursor = index === passageQuestions.length - 1 ? 'not-allowed' : 'pointer';
        checkNextReachedEnd(nextBtn);
    }
}

// Handle passage submission to Supabase
async function handlePassageSubmit() {
     const canProceed = await determinetoaddpassageselectedRadio();
    if (!canProceed) {
        return; // Stop execution if passage already exists
    }
     const canContinue = await checkLimits();
        if (!canContinue) {
            return; 
        }

    saveCurrentQuestion(); // Save current question before submitting
    
    // Validate all questions are filled
    const allFilled = passageQuestions.every(q => 
        q.questionText && q.optionA && q.optionB && q.optionC && q.optionD && q.correctAnswer !== ''
    );
    
    if (!allFilled) {
        showAlert('Please fill all questions before submitting the passage', 'danger');
        return;
    }
    
    // Get selected passage info
    const selectedRadio = document.querySelector('input[name="ChooseEachPassage"]:checked');
    if (!selectedRadio) {
        showAlert('Please select a passage', 'danger');
        return;
    }
   

    const passagePosition = parseInt(selectedRadio.dataset.position) + 1;
    const passageData = {
        subject: examConfig.subjectSelected,
        classes_student: examConfig.classSelected,
        passage_text: passageQuestions[0].questionText,
        passage_number: parseInt(selectedRadio.value),
        is_compulsory: selectedRadio.dataset.compulsory === 'true',
        questions: passageQuestions,
        passage_position: passagePosition
    };
    
    try {
        const { data, error } = await supabase
            .from('exam_passages')
            .insert(passageData)
            .select()
            .single();
        
        if (error) throw error;        
        showAlert('Passage added successfully!', 'success');
        
       
        updateDisplay()
           
        // Reset passage form
        initializePassageQuestions(passageQuestions.length);
        loadPassageQuestion(0);
     
        // Reload saved passages to display
        await loadSavedPassages();
       await  checkLimits();
        getPassageSelected()
    
        
    } catch (error) {
        console.error('Error saving passage:', error);
        showAlert(`Failed to save passage: ${error.message}`, 'danger');
    }
}
async function askToSwitchTopassageMode(exam, questionss, totalvalue){
    console.log(exam);
    console.log(questionss)
    console.log(totalvalue)
    console.log((exam - questionss) <= totalvalue );
     await loadSavedPassages();
    console.log(savedPassages);
  const questionSum = savedPassages.reduce((sum, el)=>{
       sum += el.questions.length
       return sum
    },0)
   
    
if( (exam - questions) <= totalvalue - questionSum){
    showAlert(`Toggle to passage mode. You have ${totalvalue - questionSum} left`, 'danger')
}
}

// Load saved passages from Supabase


async function loadSavedPassages() {
    if (!examConfig.subjectSelected) {
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('exam_passages')
            .select('*')
            .eq('subject', examConfig.subjectSelected)
            .eq('classes_student', examConfig.classSelected)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        savedPassages = data || [];
        displaySavedPassages();
           const questionsAddedDisplay = document.getElementById('questionsAddedDisplay');
           questionsAddedDisplay.textContent = questions.length + getpassageTotalpassage();
        
    } catch (error) {
        console.error('Error loading passages:', error);
        showAlert('Failed to load passages', 'danger');
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
                     <button class="edit-btn" onclick='editPassage(${JSON.stringify(passage)})'
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
                                    <strong style="color: #00ff00;">A.</strong> ${q.optionA}
                                    ${q.correctAnswer === '0' ? ' <span style="color: #00ff00;">✓</span>' : ''}
                                </div>
                                <div class="option ${q.correctAnswer === '1' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '1' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '1' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">B.</strong> ${q.optionB}
                                    ${q.correctAnswer === '1' ? ' <span style="color: #00ff00;">✓</span>' : ''}
                                </div>
                                <div class="option ${q.correctAnswer === '2' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '2' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '2' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">C.</strong> ${q.optionC}
                                    ${q.correctAnswer === '2' ? ' <span style="color: #00ff00;">✓</span>' : ''}
                                </div>
                                <div class="option ${q.correctAnswer === '3' ? 'correct-answer' : ''}" style="padding: 10px; border: 1px solid ${q.correctAnswer === '3' ? '#00ff00' : '#666'}; border-radius: 5px; background: ${q.correctAnswer === '3' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};">
                                    <strong style="color: #00ff00;">D.</strong> ${q.optionD}
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
        await loadSavedPassages();
        
    } catch (error) {
        console.error('Error deleting passage:', error);
        showAlert('Failed to delete passage', 'danger');
    }
};

window.editPassage = (passage) => {
    // Set passage mode ON
    const passageCheckbox = document.getElementById('passageMode');


    if (passageCheckbox && !passageCheckbox.checked) {
        passageCheckbox.checked = true;
        passageCheckbox.dispatchEvent(new Event('change'));
    }
        const firstRadio = document.querySelectorAll('input[type="radio"][name="ChooseEachPassage"]');
firstRadio[passage.passage_position - 1].checked = true

    // Initialize passageQuestions with existing passage data
    passageQuestions = passage.questions.map(q => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer
    }));
    currentPassageIndex = 0;
    

    // Load first question into form
    loadPassageQuestion(0);
    console.log()
    // Change submit button text to "Update Passage"
    const submitButton = document.getElementById('submitQuestion');
    submitButton.textContent = 'Update Passage';
    submitButton.onclick = async () => {
        await updatePassage(passage.id);
    };
};

async function updatePassage(passageId) {
    saveCurrentQuestion(); // Save current edits
    try {
        const { error } = await supabase
            .from('exam_passages')
            .update({ questions: passageQuestions })
            .eq('id', passageId);
        if (error) throw error;

        showAlert('Passage updated successfully!', 'success');
        await loadSavedPassages();
    } catch (err) {
        console.error(err);
        showAlert('Failed to update passage', 'danger');
    }
}

function toggleNormalPassageMode(normalModeEl, questionFormEl, originalHTML) {
    if (!normalModeEl) return;
    normalModeEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (questionFormEl && originalHTML) {
                questionFormEl.innerHTML = originalHTML;
                setupEventListeners();
                const pm = document.querySelector('.passageModeDesign');
                if (pm && pm.parentNode) pm.parentNode.removeChild(pm);
            }
            workExamConfigpassageInput();
        }
    });
}

function getSubjectFromPath() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1];
    return filename.replace('.html', '');
}

function updateConfigDisplay() {
    const subjectDisplay = document.getElementById('subjectDisplay');
    const totalQuestionsDisplay = document.getElementById('totalQuestionsDisplay');
    const questionsToShowDisplay = document.getElementById('questionsToShowDisplay');
    const imagesAllowedDisplay = document.getElementById('imagesAllowedDisplay');
    const selectedClass = document.getElementById('selectedClass');
    const timeSet = document.querySelector('.timeSet');
    const questionImage = document.getElementById('questionImage');

    if (examConfig.subjectSelected) {
        if (subjectDisplay) subjectDisplay.textContent = examConfig.subjectSelected;
        if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = examConfig.totalScore || '0';
        if (questionsToShowDisplay) questionsToShowDisplay.textContent = examConfig.questionshowntostudent || '0';
        if (imagesAllowedDisplay) imagesAllowedDisplay.textContent = examConfig.imageset || '0';
        if (selectedClass) selectedClass.textContent = examConfig.classSelected.toUpperCase() || 'No Class';
        if (timeSet) timeSet.textContent = 'Time Set: ' + updateTime(examConfig.secondsQuiz) || '00:00:00';
        if (questionImage && parseInt(examConfig.imageset) > 0) {
            questionImage.disabled = false;
        }
    }
}

async function loadSavedQuestions() {
    if (!examConfig.subjectSelected) {
        return;
    }

    try {
        const { data, error } = await supabase
            .from('examQuestions')
            .select('*')
            .eq('subject', examConfig.subjectSelected)
            .eq('classes_student', examConfig.classSelected)
            .order('created_at', { ascending: true });

        if (error) throw error;

        questions = data ? data.map(q => ({
            id: q.id,
            questionText: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer,
            hasImage: q.has_image,
            imageUrl: q.image_url,
            createdAt: q.created_at,
        })) : [];
        
        imageCount = questions.filter(q => q.hasImage).length;

        refreshQuestionDisplay();
        updateDisplay();

    } catch (error) {
        console.error("Error loading questions:", error);
        showAlert("Failed to load questions", "danger");
    }
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


function updateTime(inputValue) {
    const totalMinutes = Math.max(0, parseInt(inputValue, 10) || 0);
    const seconds = totalMinutes * 60;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const formatted = [
        String(hrs).padStart(2, '0'),
        String(mins).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');

    return formatted;
}

function setupEventListeners() {
    const questionForm = document.getElementById('questionForm');
    const questionImage = document.getElementById('questionImage');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmationDialog = document.getElementById('confirmationDialog');

    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }
    
    if (questionImage) {
        questionImage.addEventListener('change', handleImagePreview);
    }
    
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

async function handleQuestionSubmit(e) {
    e.preventDefault();

    const questionText = document.getElementById('questionText')?.value?.trim();
    const optionA = document.getElementById('optionA')?.value?.trim();
    const optionB = document.getElementById('optionB')?.value?.trim();
    const optionC = document.getElementById('optionC')?.value?.trim();
    const optionD = document.getElementById('optionD')?.value?.trim();
    const correctAnswer = document.getElementById('correctAnswer')?.value;
    const imageFile = document.getElementById('questionImage')?.files[0];

    const options = [optionA, optionB, optionC, optionD];

    if (!questionText || !optionA || !optionB || !optionC || !optionD || correctAnswer === '' || correctAnswer === null) {
        return showAlert('Please fill in all required fields', 'danger');
    }
    
    if (questions.length >= parseInt(examConfig.totalScore)) {
        return showAlert('You have reached the maximum number of questions allowed', 'danger');
    }
    
    if (imageFile && imageCount >= parseInt(examConfig.imageset)) {
        return showAlert('You have reached the maximum number of images allowed', 'danger');
    }

    const newQuestion = {
        questionText: questionText,
        options: options,
        correctAnswer: parseInt(correctAnswer),
        hasImage: !!imageFile,
        subject: examConfig.subjectSelected,
        classes_student: examConfig.classSelected,
        imageUrl: null,
    };
 askToSwitchTopassageMode(examConfig.totalScore, questions.length, getTotalValue());
    await saveToSupabase(newQuestion, imageFile);
    
    document.getElementById('questionForm').reset();
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    if (imageCount >= parseInt(examConfig.imageset)) {
        const questionImageInput = document.getElementById('questionImage');
        if (questionImageInput) {
            questionImageInput.disabled = true;
        }
    }
    checkLimits();
}

async function saveToSupabase(question, imageFile = null) {
    let imageUrl = question.imageUrl;
    let hasImage = question.hasImage;

    try {
        if (imageFile) {
            const fileName = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const file = dataURLtoFile(await toBase64(imageFile), fileName);
            
            const { error: uploadError } = await supabase.storage
                .from('image')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('image')
                .getPublicUrl(fileName);
            
            imageUrl = urlData.publicUrl;
            hasImage = true;
        }

        const questionData = {
            subject: question.subject,
            classes_student: question.classes_student,
            question_text: question.questionText,
            options: question.options,
            correct_answer: question.correctAnswer,
            has_image: hasImage,
            image_url: imageUrl,
        };

        if (question.id) {
            const { error } = await supabase
                .from('examQuestions')
                .update(questionData)
                .eq('id', question.id);
            if (error) throw error;
            showAlert('Question updated successfully!', 'success');
        } else {
            const { data, error } = await supabase
                .from('examQuestions')
                .insert(questionData)
                .select()
                .single();
            if (error) throw error;
            questions.push({ ...question, id: data.id, imageUrl: data.image_url });
            showAlert('Question added successfully!', 'success');
        }
        
        await loadSavedQuestions();

    } catch (error) {
        console.error("Error saving", error);
        showAlert(`Failed to save question: ${error.message}`, "danger");
    }
}

function displayQuestion(question, index) {
    const questionsContainer = document.getElementById('questionsDisplay');
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
            <div class="question-text">${question.questionText}</div>
            ${question.hasImage && question.imageUrl ? `<img src="${question.imageUrl}" class="question-image" alt="Question Image">` : ''}
            <div class="question-options">
                ${question.options.map((option, i) => `
                    <div class="option ${i === question.correctAnswer ? 'correct-answer' : ''}">
                        ${String.fromCharCode(65 + i)}. ${option}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="edit-form" id="editForm_${question.id}" style="display: none;">
            <div class="form-group">
                <label>Question Text:</label>
                <textarea id="editQuestionText_${question.id}" rows="3" style="width: 100%;">${question.questionText}</textarea>
            </div>
            
            <div class="form-group">
                <label>Option A:</label>
                <input type="text" id="editOptionA_${question.id}" value="${question.options[0]}" style="width: 100%;">
            </div>
            
            <div class="form-group">
                <label>Option B:</label>
                <input type="text" id="editOptionB_${question.id}" value="${question.options[1]}" style="width: 100%;">
            </div>
            
            <div class="form-group">
                <label>Option C:</label>
                <input type="text" id="editOptionC_${question.id}" value="${question.options[2]}" style="width: 100%;">
            </div>
            
            <div class="form-group">
                <label>Option D:</label>
                <input type="text" id="editOptionD_${question.id}" value="${question.options[3]}" style="width: 100%;">
            </div>
            
            <div class="form-group">
                <label>Correct Answer:</label>
                <select id="editCorrectAnswer_${question.id}" style="width: 100%;">
                    <option value="0" ${question.correctAnswer === 0 ? 'selected' : ''}>A</option>
                    <option value="1" ${question.correctAnswer === 1 ? 'selected' : ''}>B</option>
                    <option value="2" ${question.correctAnswer === 2 ? 'selected' : ''}>C</option>
                    <option value="3" ${question.correctAnswer === 3 ? 'selected' : ''}>D</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Question Image (optional):</label>
                <input type="file" id="editQuestionImage_${question.id}" accept="image/*">
                ${question.hasImage && question.imageUrl ? `<p>Current image: <img src="${question.imageUrl}" style="max-width: 100px; max-height: 100px;"></p>` : ''}
            </div>
            
            <div class="edit-actions">
                <button class="save-btn" onclick="saveEdit(${question.id})">Save</button>
                <button class="cancel-btn" onclick="cancelEdit(${question.id})">Cancel</button>
            </div>
        </div>
    `;
    questionsContainer.appendChild(questionDiv);
}

window.editQuestion = function(questionId) {
    const displayDiv = document.getElementById(`display_${questionId}`);
    const editForm = document.getElementById(`editForm_${questionId}`);
    
    if (displayDiv && editForm) {
        displayDiv.style.display = 'none';
        editForm.style.display = 'block';
    }
};

window.cancelEdit = function(questionId) {
    const displayDiv = document.getElementById(`display_${questionId}`);
    const editForm = document.getElementById(`editForm_${questionId}`);
    
    if (displayDiv && editForm) {
        displayDiv.style.display = 'block';
        editForm.style.display = 'none';
    }
};

window.saveEdit = async function(questionId) {
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;
    
    const editQuestionText = document.getElementById(`editQuestionText_${questionId}`)?.value?.trim();
    const editOptionA = document.getElementById(`editOptionA_${questionId}`)?.value?.trim();
    const editOptionB = document.getElementById(`editOptionB_${questionId}`)?.value?.trim();
    const editOptionC = document.getElementById(`editOptionC_${questionId}`)?.value?.trim();
    const editOptionD = document.getElementById(`editOptionD_${questionId}`)?.value?.trim();
    const editCorrectAnswer = document.getElementById(`editCorrectAnswer_${questionId}`)?.value;
    const editQuestionImage = document.getElementById(`editQuestionImage_${questionId}`);
    
    if (!editQuestionText || !editOptionA || !editOptionB || !editOptionC || !editOptionD || editCorrectAnswer === '' || editCorrectAnswer === null) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    const question = questions[questionIndex];
    question.questionText = editQuestionText;
    question.options = [editOptionA, editOptionB, editOptionC, editOptionD];
    question.correctAnswer = parseInt(editCorrectAnswer);
    
    const imageFile = editQuestionImage ? editQuestionImage.files[0] : null;
    
    if (imageFile && !question.hasImage && imageCount >= parseInt(examConfig.imageset)) {
        showAlert('You have reached the maximum number of images allowed', 'danger');
        return;
    }
    
    try {
        await saveToSupabase(question, imageFile);
        
        const displayDiv = document.getElementById(`display_${questionId}`);
        const editForm = document.getElementById(`editForm_${questionId}`);
        
        if (displayDiv && editForm) {
            displayDiv.style.display = 'block';
            editForm.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error saving edit:', error);
        showAlert('Failed to save changes', 'danger');
    }
};

window.deleteQuestion = function(questionId) {
    questionToDelete = questionId;
    const confirmationDialog = document.getElementById('confirmationDialog');
    if (confirmationDialog) {
        confirmationDialog.classList.add('active');
    }
};

async function confirmDelete() {
    if (!questionToDelete) return;

    const questionIndex = questions.findIndex(q => q.id === questionToDelete);
    if (questionIndex === -1) return cancelDelete();
    
    const question = questions[questionIndex];

    try {
        if (question.hasImage && question.imageUrl) {
            try {
                const path = new URL(question.imageUrl).pathname.split('/image/')[1];
                const { error: storageError } = await supabase.storage
                    .from('image')
                    .remove([path]);
                if (storageError) console.error("Could not delete image:", storageError);
            } catch (urlError) {
                console.error("Error parsing image URL:", urlError);
            }
        }

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

function cancelDelete() {
    questionToDelete = null;
    const confirmationDialog = document.getElementById('confirmationDialog');
    if (confirmationDialog) {
        confirmationDialog.classList.remove('active');
    }
}

function refreshQuestionDisplay() {
    const questionsContainer = document.getElementById('questionsDisplay');
    if (questionsContainer) {
        questionsContainer.innerHTML = '';
        questions.forEach((question, index) => {
            displayQuestion(question, index);
        });
    }
}

function getpassageTotalpassage(){
  const totalValue = savedPassages.reduce((accumulation, el)=>{
       accumulation += el.questions.length;
       return accumulation
   }, 0)
  return totalValue;

} 

function updateDisplay() {
      const questionsAddedDisplay = document.getElementById('questionsAddedDisplay');
    let totalQuestionAdded = questions.length + getpassageTotalpassage();
    questionsAddedDisplay.textContent = totalQuestionAdded;
         
    imageCount = questions.filter(q => q.hasImage).length;
    const canAddImages = imageCount < parseInt(examConfig.imageset || 0);
    const questionImage = document.getElementById('questionImage');
    if (questionImage) {
        questionImage.disabled = !canAddImages;
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">`;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}
function getTotalValue(){
const passagegetting = examConfig.passageInput;
const total = passagegetting.reduce((sum, el)=>{
sum += el.value;
return sum
},0)
return total
}


async function checkLimits() {
    const maxQuestions = parseInt(examConfig.totalScore || 0);
    const maxImages = parseInt(examConfig.imageset || 0);
    const questionForm = document.getElementById('questionForm');
    const questionImage = document.getElementById('questionImage');
    const questionaddedsofar = document.getElementById('questionsAddedDisplay');
    const questionaddedtext = parseInt(questionaddedsofar.textContent.trim());

    const selectedRadio = document.querySelector('input[name="ChooseEachPassage"]:checked');
    const collectionOfRadio = document.querySelectorAll('input[name="ChooseEachPassage"]');
    let selectedIndexChecked = [...collectionOfRadio].indexOf(selectedRadio);
    let theIndexSelected = selectedIndexChecked + 1;

    await loadSavedPassages();
    const selectedInputValue = savedPassages[selectedIndexChecked]?.passage_number;

    console.log(maxQuestions);
    console.log(questionaddedtext);
    console.log(maxQuestions === questionaddedtext);
    
    if (maxQuestions === questionaddedtext) {
        questionForm.style.display = 'none';
        showAlert('Maximum questions reached', 'warning');
        return false; // Indicate failure
    } else if (maxQuestions - questionaddedtext < selectedInputValue || (maxQuestions - questionaddedtext) + selectedInputValue < selectedInputValue) {
        showAlert('Delete some of the general questions before continuing', 'warning');
        return false; // Indicate failure
    }
    
    if (imageCount >= maxImages && questionImage) {
        questionImage.disabled = true;
    }
    
    return true; // Indicate success
}

function showAlert(message, type) {
    const questionAdd = document.querySelector('.form-container');
    if (!questionAdd) {
        console.warn('Could not find .form-container element');
        console.log(message);
        return;
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    questionAdd.insertAdjacentElement('beforeend', alertDiv);
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});