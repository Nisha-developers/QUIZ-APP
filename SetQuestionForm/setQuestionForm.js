 import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

  const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
 const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
  const supabase = createClient(supabaseUrl, supabaseKey);

// Get the elements
const inputTotal = document.querySelector('.totalQuestion');
const shownQuestionToStudent = document.querySelector('.shownQuestion');
const seletedSubject = document.getElementById('selectSubject');
const selectedClass = document.querySelector('#selectedClass');
const timeSelected = document.getElementById('seconds');
const imageSet = document.getElementById('images');
const submitExam = document.querySelector('#submit');
const alertEl = document.querySelector('.alert');
const continueButton = document.getElementById('continue');
// Save the default JSS subjects (initial HTML options)
const defaultJssSubjects = seletedSubject.innerHTML;

const urlParams = new URLSearchParams(window.location.search);
const selectedClassByUser = urlParams.get("class");
const selectedSubjectUser = urlParams.get('subject');


const seniorScienceSubject = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Further Mathematics", "Economics", "Computer", "Technical drawing",
  "Agricultural Science", "Animal husbandry", "Data Processing", "Marketing",
  "Painting and Decoration", "Food and nutrition", "Geography", "French", "Cisco", "Civic Education"
];

const seniorArtSubject = [
  "Mathematics", "English", "Literature in English", "Christian Religious Studies",
  "Economics", "Government", "History", "Data Processing", "Marketing",
  "Printing and Decoration", "Visual Art", "Home Management", "Food and Nutrition",
  "Civic Education", "Yoruba", "Igbo", "French", "Biology", "Cisco"
];

const seniorCommercialSubject = [
  "Mathematics", "English Language", "Commerce", "Financial Accounting",
  "Government", "Economics", "Further Mathematics", "Data Processing",
  "Marketing", "Painting and Decoration", "Cisco", "Civic Education"
];

selectedClass.addEventListener('change', () => {
  const value = selectedClass.value;

  // If user selects JSS1, JSS2, or JSS3, reset to default options
  if (value.includes('jss')) {
    seletedSubject.innerHTML = defaultJssSubjects;
    return;
  }

  // Else, determine the subject list to show
  let subjectList = [];

  if (value.includes('Art')) {
    subjectList = seniorArtSubject;
  } else if (value.includes('Science')) {
    subjectList = seniorScienceSubject;
  } else if (value.includes('Commercial')) {
    subjectList = seniorCommercialSubject;
  }

  // Replace with new senior subject options
  seletedSubject.innerHTML = '<option value="">Select the subject you want to set</option>';
  subjectList.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    seletedSubject.appendChild(option);
  });
});


// This variable will hold the ID of the Supabase record we are editing.
let currentEditingDocId = null;
let classes = selectedClass.value;
// EVENT LISTENER FOR "SET / UPDATE STUDENT EXAM" BUTTON

submitExam.addEventListener('click', async () => {
    const seletedSubjectValue = seletedSubject.value;

    // 1. First and most important: check if a subject is selected.
    if (!seletedSubjectValue) {
        dangerSignal('Please select a subject before proceeding.');
        return;
    }
    
    

    // If we are in "update mode"
    if (submitExam.textContent === 'Update Exam') {
        handleUpdateExam();
        return;
    }

    // If we are in "set new exam mode" (default)
    try {
        // 2. Check if a config for this subject already exists in Supabase.
       const existingConfig = await findConfigInSupabase(selectedClass.value, seletedSubjectValue);
        if (existingConfig !== null) {
            // 3. If it exists, ask the user if they want to edit it.
            const userWantsToEdit = confirm(`An exam for ${seletedSubjectValue} already exists. Do you want to edit it?`);

            if (userWantsToEdit) {
                // Load data into the form for editing
                inputTotal.value = existingConfig.total_score;
                shownQuestionToStudent.value = existingConfig.questions_shown_to_student;
                imageSet.value = existingConfig.image_set;
                currentEditingDocId = existingConfig.id; // Store the record ID

                // Change button to "Update" mode
                submitExam.textContent = 'Update Exam';
                successSignal('Now editing existing exam. Make your changes and click "Update Exam".');
            } else {
                // User clicked "Cancel"
                dangerSignal("Action cancelled. To proceed with the saved settings, click 'Continue Setting Exam'.");
            }
        } else {
            // 4. If no config exists, proceed to create a new one.
            handleCreateNewExam();
        }
    } catch (error) {
        console.error("Error checking for existing config:", error);
        dangerSignal("An error occurred. Please check your connection and try again.");
    }
});

// =================================================================
// EVENT LISTENER FOR "CONTINUE SETTING EXAM" BUTTON
// =================================================================
continueButton.addEventListener('click', async () => {
    const seletedSubjectValue = seletedSubject.value;

    if (!seletedSubjectValue) {
        dangerSignal('Please select a subject to continue.');
        return;
    }
     if(!selectedClass.value){
        dangerSignal('Please select a class before proceeding')
    };

    // 1. First, check sessionStorage for quick access
    const storedConfig = sessionStorage.getItem('storeResult');
    if (storedConfig) {
        const config = JSON.parse(storedConfig);
        // Make sure the stored config matches the selected subject
        if (config.subjectSelected === seletedSubjectValue) {
            successSignal('You will be redirected to the page in a moment to continue setting the exam');
            setTimeout(()=>{
                 redirectToSubjectPage(seletedSubject.value, selectedClass.value);
            }, 3000)
            return;
        }
    }

    // 2. If not in sessionStorage, check Supabase
    try {
       const existingConfig = await findConfigInSupabase(selectedClass.value, seletedSubjectValue);


        if (existingConfig) {
            // Found it! Store it in session for next time and redirect.
            const configToStore = {
                subjectSelected: existingConfig.subject_selected,
                totalScore: existingConfig.total_score,
                questionshowntostudent: existingConfig.questions_shown_to_student,
                imageset: existingConfig.image_set,
                classSelected: existingConfig.classes_student,
                secondsQuiz: existingConfig.seconds_quiz
            };
            sessionStorage.setItem('storeResult', JSON.stringify(configToStore));
             successSignal('You will be redirected to the page in a moment to continue setting the exam');
            setTimeout(()=>{
                 redirectToSubjectPage(seletedSubject.value, selectedClass.value);
            }, 3000)
            return;
        } else {
            // If we get here, no config was found anywhere.
            dangerSignal('No exam setup found for this subject. Please use the "Set Student Exam" button first.');
        }
    } catch (error) {
        console.error("Error checking exam config:", error);
        dangerSignal('Error checking exam configuration. Please try again.');
    }
});
// Validates all form inputs and returns true or an error message.
 
function validateInputs() {
    const inputTotalValue = inputTotal.value;
    const shownQuestionToStudentValue = shownQuestionToStudent.value;
    const imagesValue = imageSet.value;
    const selectedClassValue = selectedClass.value;
    const timeSelectedValue = timeSelected.value;

    if (!inputTotalValue || !shownQuestionToStudentValue || !seletedSubject.value || !selectedClassValue || !timeSelectedValue) {
        return 'Please fill in all the required fields.';
    }
    if (Number(inputTotalValue) > parseInt(inputTotal.getAttribute('max')) || Number(inputTotalValue) < parseInt(inputTotal.getAttribute('min'))) {
        return 'Total questions must be between 20 and 350.';
    }
    if (Number(shownQuestionToStudentValue) > parseInt(shownQuestionToStudent.getAttribute('max')) || Number(shownQuestionToStudentValue) < parseInt(shownQuestionToStudent.getAttribute('min'))) {
        return 'Questions shown to student must be between 5 and 150.';
    }
    if (Number(shownQuestionToStudentValue) >= Number(inputTotalValue)) {
        return 'Questions shown to student cannot be greater  OR equal than the total questions.';
    }
    if (Number(imagesValue) > Number(shownQuestionToStudentValue)) {
        return 'Image questions cannot be greater than the questions shown to the student.';
    }
    if(Number(timeSelectedValue) > 21600){
        return 'You cannot set time for more than six hours. Please choose a reasonable time';
    }
    if(Number(timeSelectedValue) < 60){
        return 'You cannot set time for less than one minutes. Please choose a reasonable time'
    }
    return true; // Validation passed
}


/**
 * Handles the logic for creating a new exam configuration.
 */
async function handleCreateNewExam() {
    const validationResult = validateInputs();
    if (validationResult !== true) {
        dangerSignal(validationResult);
        return;
    }

    const newConfig = {
        total_score: inputTotal.value,
        questions_shown_to_student: shownQuestionToStudent.value,
        subject_selected: seletedSubject.value,
        image_set: imageSet.value || "0", // Default to 0 if empty
        created_at: new Date().toISOString(), // Timestamp for good practice
        classes_student: selectedClass.value,
        seconds_quiz: timeSelected.value
    };

    try {
        const { data, error } = await supabase
            .from('exam_configs')
            .insert([newConfig])
            .select();

        if (error) {
            throw error;
        }

        console.log("Record created with ID: ", data[0].id);

        // Store in sessionStorage with original format for compatibility
        const sessionConfig = {
            subjectSelected: newConfig.subject_selected,
            totalScore: newConfig.total_score,
            questionshowntostudent: newConfig.questions_shown_to_student,
            imageset: newConfig.image_set,
            classSelected: newConfig.classes_student,
            secondsQuiz: newConfig.seconds_quiz
        };
        sessionStorage.setItem('storeResult', JSON.stringify(sessionConfig));
        
        successSignal('Success! Exam created. Redirecting...');
        setTimeout(() => {
            redirectToSubjectPage(newConfig.subject_selected, newConfig.classes_student);
        }, 3000);

    } catch (e) {
        console.error("Error adding record: ", e);
        dangerSignal("Failed to save exam settings. Please try again.");
    }
}

/**
 * Handles the logic for updating an existing exam configuration.
 */
async function handleUpdateExam() {
    const validationResult = validateInputs();
    if (validationResult !== true) {
        dangerSignal(validationResult);
        return;
    }

    if (!currentEditingDocId) {
        dangerSignal("Error: No exam selected for update. Please start over.");
        return;
    }

    const updatedConfig = {
        total_score: inputTotal.value,
        questions_shown_to_student: shownQuestionToStudent.value,
        subject_selected: seletedSubject.value,
        image_set: imageSet.value || "0",
        classes_student: selectedClass.value,
        seconds_quiz: timeSelected.value,
        updated_at: new Date().toISOString() // Update timestamp
    };

    try {
        const { data, error } = await supabase
            .from('exam_configs')
            .update(updatedConfig)
            .eq('id', currentEditingDocId)
            .select();

        if (error) {
            throw error;
        }

        // Store in sessionStorage with original format for compatibility
        const sessionConfig = {
            subjectSelected: updatedConfig.subject_selected,
            totalScore: updatedConfig.total_score,
            questionshowntostudent: updatedConfig.questions_shown_to_student,
            imageset: updatedConfig.image_set,
            classSelected: updatedConfig.classes_student,
            secondsQuiz: updatedConfig.seconds_quiz
        };
        sessionStorage.setItem('storeResult', JSON.stringify(sessionConfig));
        
        successSignal('Success! Exam updated. Redirecting...');

        // Reset the form state
        submitExam.textContent = 'Set Student Exam';
        currentEditingDocId = null;

        setTimeout(() => {
            redirectToSubjectPage(updatedConfig.subject_selected, updatedConfig.classes_student);
        }, 3000);

    } catch (error) {
        console.error("Error updating record: ", error);
        dangerSignal("Failed to update exam settings. Please try again.");
    }
}

/**
 * Finds a configuration record in Supabase for a given subject.
 * Returns the record if found, otherwise null.
 */
async function findConfigInSupabase(selectedClassByUser, selectedSubjectUser) {
   
    try {
        const { data, error } = await supabase
            .from('exam_configs')
            .select('*')
            .eq('subject_selected', selectedSubjectUser)
            .eq('classes_student', selectedClassByUser)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw error;
        }

        return data; // Will be null if no record found
    } catch (error) {
        console.error("Error finding config:", error);
        throw error;
    }
}

function redirectToSubjectPage(subject, selectedClass) {
    if (subject && selectedClass) {
        location.href = `/RealStudentQuestion/RealStudentQuestion.html?class=${selectedClass}&subject=${subject}`;
    } else {
        location.href = 'ErrorPage/Error404.html';
    }
}


function dangerSignal(message) {
    alertEl.style.display = 'block';
    alertEl.classList.remove('alert', 'success');
    alertEl.classList.add('danger');
    alertEl.textContent = message;

    setTimeout(() => {
        alertEl.style.display = 'none';
    }, 7000);
}

function successSignal(message) {
    alertEl.style.display = 'block';
    alertEl.classList.remove('danger');
    alertEl.classList.add('alert', 'success'); // Using 'alert' as a base class
    alertEl.textContent = message;

    setTimeout(() => {
        alertEl.style.display = 'none';
    }, 6000);
}