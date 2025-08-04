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

const urlParams = new URLSearchParams(window.location.search);
const selectedClassByUser = urlParams.get("class");
const selectedSubjectUser = urlParams.get('subject');
console.log(selectedClassByUser)
console.log(selectedSubjectUser)
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
        console.log('Loaded config from sessionStorage:', examConfig);
        // Load questions after config is loaded
        await loadSavedQuestions();
        return;
    }

    if (selectedClassByUser && selectedSubjectUser) {
        try {
            await loadConfigFromSupabase(selectedClassByUser, selectedSubjectUser);
            // Load questions after config is loaded
            await loadSavedQuestions();
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
            // Convert Supabase format to the format expected by the app
            examConfig = {
                subjectSelected: data.subject_selected,
                totalScore: data.total_score,
                questionshowntostudent: data.questions_shown_to_student,
                imageset: data.image_set,
                classesSelected: data.classes_student,
                quizSetQuestion: data.seconds_quiz
            };
           

            // Store in sessionStorage for future use
            sessionStorage.setItem('storeResult', JSON.stringify(examConfig));
            
            updateConfigDisplay();
            console.log('Loaded config from Supabase:', examConfig);
        } else {
            throw new Error('No configuration found for this subject');
        }
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        throw error;
    }
}

// Extract subject from file path (fallback method)
function getSubjectFromPath() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Remove .html extension and return subject name
    return filename.replace('.html', '');
}

// Update the display with config values
function updateConfigDisplay() {
    // Check if elements exist before updating
    const subjectDisplay = document.getElementById('subjectDisplay');
    const totalQuestionsDisplay = document.getElementById('totalQuestionsDisplay');
    const questionsToShowDisplay = document.getElementById('questionsToShowDisplay');
    const imagesAllowedDisplay = document.getElementById('imagesAllowedDisplay');
    const selectedClass = document.getElementById('selectedClass');
    const timeSet = document.querySelector('.timeSet');
    const questionImage = document.getElementById('questionImage');
  console.log(updateTime(examConfig.quizSetQuestion));
    if (examConfig.subjectSelected) {
        if (subjectDisplay) subjectDisplay.textContent = examConfig.subjectSelected;
        if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = examConfig.totalScore || '0';
        if (questionsToShowDisplay) questionsToShowDisplay.textContent = examConfig.questionshowntostudent || '0';
        if (imagesAllowedDisplay) imagesAllowedDisplay.textContent = examConfig.imageset || '0';
        if (selectedClass) selectedClass.textContent = examConfig.classSelected.toUpperCase() || 'No Class';
        if (timeSet) timeSet.textContent ='Time Set: ' + updateTime(examConfig.secondsQuiz) || '00:00:00';
        if (questionImage && parseInt(examConfig.imageset) > 0) {
            questionImage.disabled = false;
        }
    }
}

async function loadSavedQuestions() {
    // Make sure we have exam config before loading questions
    if (!examConfig.subjectSelected) {
        console.log('No exam config available, skipping question load');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('examQuestions')
            .select('*')
            .eq('subject',  examConfig.subjectSelected)
            .eq('classes_student',  examConfig.classSelected)
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
        
        console.log(`Successfully loaded ${questions.length} questions`);

    } catch (error) {
        console.error("Error loading questions:", error);
        showAlert("Failed to load questions", "danger");
    }
}

function updateTime(inputValue) {
    // Convert input to a number of minutes, and make sure it's not negative
    const totalMinutes = Math.max(0, parseInt(inputValue, 10) || 0);

    // Convert minutes to total seconds
    const seconds = totalMinutes * 60;

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format the time as HH:MM:SS
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
// Replace your displayQuestion function with this corrected version
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
        
        <!-- Display Mode -->
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
        
        <!-- Edit Mode -->
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

// Updated editQuestion function
window.editQuestion = function(questionId) {
    const displayDiv = document.getElementById(`display_${questionId}`);
    const editForm = document.getElementById(`editForm_${questionId}`);
    
    if (displayDiv && editForm) {
        displayDiv.style.display = 'none';
        editForm.style.display = 'block';
    }
    console.log('Edit question:', questionId);
};

// Updated cancelEdit function
window.cancelEdit = function(questionId) {
    const displayDiv = document.getElementById(`display_${questionId}`);
    const editForm = document.getElementById(`editForm_${questionId}`);
    
    if (displayDiv && editForm) {
        displayDiv.style.display = 'block';
        editForm.style.display = 'none';
    }
    console.log('Cancel edit:', questionId);
};

// Updated saveEdit function
window.saveEdit = async function(questionId) {
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;
    
    // Get all the edit form values
    const editQuestionText = document.getElementById(`editQuestionText_${questionId}`)?.value?.trim();
    const editOptionA = document.getElementById(`editOptionA_${questionId}`)?.value?.trim();
    const editOptionB = document.getElementById(`editOptionB_${questionId}`)?.value?.trim();
    const editOptionC = document.getElementById(`editOptionC_${questionId}`)?.value?.trim();
    const editOptionD = document.getElementById(`editOptionD_${questionId}`)?.value?.trim();
    const editCorrectAnswer = document.getElementById(`editCorrectAnswer_${questionId}`)?.value;
    const editQuestionImage = document.getElementById(`editQuestionImage_${questionId}`);
    
    // Validate required fields
    if (!editQuestionText || !editOptionA || !editOptionB || !editOptionC || !editOptionD || editCorrectAnswer === '' || editCorrectAnswer === null) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    // Update the question object
    const question = questions[questionIndex];
    question.questionText = editQuestionText;
    question.options = [editOptionA, editOptionB, editOptionC, editOptionD];
    question.correctAnswer = parseInt(editCorrectAnswer);
    
    // Handle image file if provided
    const imageFile = editQuestionImage ? editQuestionImage.files[0] : null;
    
    // Check image limits if new image is being added
    if (imageFile && !question.hasImage && imageCount >= parseInt(examConfig.imageset)) {
        showAlert('You have reached the maximum number of images allowed', 'danger');
        return;
    }
    
    try {
        await saveToSupabase(question, imageFile);
        
        // Hide edit form and show display
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

function updateDisplay() {
    const questionsAddedDisplay = document.getElementById('questionsAddedDisplay');
    if (questionsAddedDisplay) {
        questionsAddedDisplay.textContent = questions.length;
    }
    
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

function checkLimits() {
    const maxQuestions = parseInt(examConfig.totalScore || 0);
    const maxImages = parseInt(examConfig.imageset || 0);
    
    const questionForm = document.getElementById('questionForm');
    const questionImage = document.getElementById('questionImage');
    
    if (questions.length >= maxQuestions && questionForm) {
        questionForm.style.display = 'none';
        showAlert('Maximum questions reached', 'warning');
    }
    
    if (imageCount >= maxImages && questionImage) {
        questionImage.disabled = true;
    }
}

function showAlert(message, type) {
    const questionAdd = document.querySelector('.form-container');
    if (!questionAdd) {
        console.warn('Could not find .form-container element');
        console.log(message); // Fallback to console
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