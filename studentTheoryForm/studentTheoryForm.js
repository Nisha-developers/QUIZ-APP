 import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
 const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
  const supabase = createClient(supabaseUrl, supabaseKey);

// Get DOM elements
const theoryMarks = document.getElementById('questionShown');
const examDate = document.getElementById('examDate');
const examTime = document.getElementById('examTime');
const timeDuration = document.getElementById('timeDuration');
const teacherMessage = document.getElementById('teacherMessage');
const pictureYes = document.getElementById('pictureYes');
const pictureNo = document.getElementById('pictureNo');
const selectedClass = document.getElementById('selectedClass');
const selectSubject = document.getElementById('selectSubject');
const submitButton = document.getElementById('submit');
const continueButton = document.getElementById('continue');
const alertBox = document.getElementById('alertBox');

// Save default JSS subjects
const defaultJssSubjects = selectSubject.innerHTML;

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const selectedClassByUser = urlParams.get("class");
const selectedSubjectUser = urlParams.get('subject');

// Track current editing document ID
let currentEditingDocId = null;

// Subject arrays for senior classes
const seniorScienceSubject = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Further Mathematics", "Economics", "Computer", "Technical drawing",
  "Agricultural Science", "Animal husbandry", "Data Processing", "Marketing",
  "Painting and Decoration", "Food and nutrition", "Geography", "French", 
  "Cisco", "Civic Education"
];

const seniorArtSubject = [
  "Mathematics", "English", "Literature in English", "Christian Religious Studies",
  "Economics", "Government", "History", "Data Processing", "Marketing",
  "Printing and decoration", "Visual Art", "Home Management", "Food and Nutrition",
  "Civic Education", "Yoruba", "Igbo", "French", "Biology", "Cisco"
];

const seniorCommercialSubject = [
  "Mathematics", "English Language", "Commerce", "Financial Accounting",
  "Government", "Economics", "Further Mathematics", "Data Processing",
  "Marketing", "Painting and Decoration", "Cisco", "Civic Education"
];

// Handle dynamic subject loading based on class selection
selectedClass.addEventListener('change', () => {
  const value = selectedClass.value;

  // Reset to default JSS subjects for junior classes
  if (value.includes('jss')) {
    selectSubject.innerHTML = defaultJssSubjects;
    return;
  }

  // Determine subject list for senior classes
  let subjectList = [];

  if (value.includes('Art')) {
    subjectList = seniorArtSubject;
  } else if (value.includes('Science')) {
    subjectList = seniorScienceSubject;
  } else if (value.includes('Commercial')) {
    subjectList = seniorCommercialSubject;
  }

  // Populate subject dropdown
  selectSubject.innerHTML = '<option value="">Select the subject you want to set</option>';
  subjectList.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    selectSubject.appendChild(option);
  });
});

// ========================================
// SET/UPDATE EXAM BUTTON HANDLER
// ========================================
submitButton.addEventListener('click', async () => {
  const selectedSubjectValue = selectSubject.value;

  // Check if subject is selected
  if (!selectedSubjectValue) {
    showDangerAlert('Please select a subject before proceeding.');
    return;
  }

  // Check if class is selected
  if (!selectedClass.value) {
    showDangerAlert('Please select a class before proceeding.');
    return;
  }

  // If in update mode
  if (submitButton.textContent === 'Update Exam') {
    handleUpdateExam();
    return;
  }

  // Check if exam already exists
  try {
    const existingConfig = await findConfigInSupabase(selectedClass.value, selectedSubjectValue);

    if (existingConfig !== null) {
      const userWantsToEdit = confirm(`A theory exam for ${selectedSubjectValue} already exists. Do you want to edit it?`);

      if (userWantsToEdit) {
        // Load existing data into form
        theoryMarks.value = existingConfig.theory_marks;
        examDate.value = existingConfig.exam_date;
        examTime.value = existingConfig.exam_time;
        timeDuration.value = existingConfig.time_duration;
        teacherMessage.value = existingConfig.teacher_message || '';
        
        if (existingConfig.add_picture) {
          pictureYes.checked = true;
        } else {
          pictureNo.checked = true;
        }

        currentEditingDocId = existingConfig.id;
        selectedClass.disabled = true;
        selectSubject.disabled = true;

        // Add open/close radio buttons
        const openCloseDiv = document.createElement('div');
        openCloseDiv.classList.add('openClose');
        openCloseDiv.innerHTML = `
          <label for="open" style="color:green; margin-right: 0.5rem;" class="exam">Open Examination</label>
          <input type="radio" name="openAndClose" id="open" ${existingConfig.is_open ? 'checked' : ''}>
          <label for="close" style="color:red; margin-left: 1rem; margin-right: 0.5rem;" class="exam">Close Examination</label>
          <input type="radio" name="openAndClose" id="close" ${!existingConfig.is_open ? 'checked' : ''}>
        `;
        selectSubject.insertAdjacentElement('afterend', openCloseDiv);

        submitButton.textContent = 'Update Exam';
        showSuccessAlert('Now editing existing exam. Make your changes and click "Update Exam".');
      } else {
        showDangerAlert("Action cancelled. To proceed with the saved settings, click 'Continue Setting Exam Question'.");
      }
    } else {
      // Create new exam
      handleCreateNewExam();
    }
  } catch (error) {
    console.error("Error checking for existing config:", error);
    showDangerAlert("An error occurred. Please check your connection and try again.");
  }
});

// ========================================
// CONTINUE BUTTON HANDLER
// ========================================
continueButton.addEventListener('click', async () => {
  const selectedSubjectValue = selectSubject.value;

  if (!selectedSubjectValue) {
    showDangerAlert('Please select a subject to continue.');
    return;
  }

  if (!selectedClass.value) {
    showDangerAlert('Please select a class before proceeding.');
    return;
  }

  // Check sessionStorage first
  const storedConfig = sessionStorage.getItem('theoryExamConfig');
  if (storedConfig) {
    const config = JSON.parse(storedConfig);
    if (config.subjectSelected === selectedSubjectValue && config.classSelected === selectedClass.value) {
      showSuccessAlert('You will be redirected to the page in a moment to continue setting the exam');
      setTimeout(() => {
        redirectToTheoryQuestionPage(selectSubject.value, selectedClass.value);
      }, 3000);
      return;
    }
  }

  // Check Supabase
  try {
    const existingConfig = await findConfigInSupabase(selectedClass.value, selectedSubjectValue);

    if (existingConfig) {
      const configToStore = {
        subjectSelected: existingConfig.subject_selected,
        theoryMarks: existingConfig.theory_marks,
        examDate: existingConfig.exam_date,
        examTime: existingConfig.exam_time,
        timeDuration: existingConfig.time_duration,
        teacherMessage: existingConfig.teacher_message,
        addPicture: existingConfig.add_picture,
        classSelected: existingConfig.class_selected
      };
      sessionStorage.setItem('theoryExamConfig', JSON.stringify(configToStore));

      showSuccessAlert('You will be redirected to the page in a moment to continue setting the exam');
      setTimeout(() => {
        redirectToTheoryQuestionPage(selectSubject.value, selectedClass.value);
      }, 3000);
      return;
    } else {
      showDangerAlert('No exam setup found for this subject. Please use the "Set Student Exam" button first.');
    }
  } catch (error) {
    console.error("Error checking exam config:", error);
    showDangerAlert('Error checking exam configuration. Please try again.');
  }
});

// ========================================
// VALIDATION FUNCTION
// ========================================
function validateInputs() {
  const theoryMarksValue = theoryMarks.value;
  const examDateValue = examDate.value;
  const examTimeValue = examTime.value;
  const timeDurationValue = timeDuration.value;
  const selectedClassValue = selectedClass.value;
  const selectedSubjectValue = selectSubject.value;

  const yearDate = new Date().getFullYear();
  const month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`;
  const dayy = new Date().getDate() < 10 ? `0${new Date().getDate()}` : `${new Date().getDate()}`;
  const inputDay = `${yearDate}-${month}-${dayy}`;

  if (!theoryMarksValue || !examDateValue || !examTimeValue || !timeDurationValue || !selectedClassValue || !selectedSubjectValue) {
    return 'Please fill in all the required fields.';
  }

  if (Number(theoryMarksValue) > 250 || Number(theoryMarksValue) < 5) {
    return 'Theory marks must be between 5 and 250.';
  }

  if (Number(timeDurationValue) > 300 || Number(timeDurationValue) < 10) {
    return 'Time duration must be between 10 and 300 minutes.';
  }

  if (examDateValue < inputDay) {
    return 'You cannot set a previous date. Please choose a valid date.';
  }

  if (examTimeValue >= '18:00' || examTimeValue < '06:00') {
    return 'School is closed by that time. Choose a reasonable time between 6:00 AM and 6:00 PM.';
  }

  return true;
}

// ========================================
// CREATE NEW EXAM
// ========================================
async function handleCreateNewExam() {
  const validationResult = validateInputs();
  if (validationResult !== true) {
    showDangerAlert(validationResult);
    return;
  }

  const newConfig = {
    theory_marks: theoryMarks.value,
    exam_date: examDate.value,
    exam_time: examTime.value,
    time_duration: timeDuration.value,
    teacher_message: teacherMessage.value || '',
    add_picture: pictureYes.checked,
    class_selected: selectedClass.value,
    subject_selected: selectSubject.value,
    is_open: false,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('theory_exam_configs')
      .insert([newConfig])
      .select();

    if (error) {
      throw error;
    }

    console.log("Theory exam record created with ID:", data[0].id);

    const sessionConfig = {
      subjectSelected: newConfig.subject_selected,
      theoryMarks: newConfig.theory_marks,
      examDate: newConfig.exam_date,
      examTime: newConfig.exam_time,
      timeDuration: newConfig.time_duration,
      teacherMessage: newConfig.teacher_message,
      addPicture: newConfig.add_picture,
      classSelected: newConfig.class_selected
    };
    sessionStorage.setItem('theoryExamConfig', JSON.stringify(sessionConfig));

    showSuccessAlert('Success! Theory exam created. Redirecting...');
    setTimeout(() => {
      redirectToTheoryQuestionPage(newConfig.subject_selected, newConfig.class_selected);
    }, 3000);

  } catch (e) {
    console.error("Error adding theory exam record:", e);
    showDangerAlert("Failed to save exam settings. Please try again.");
  }
}

// ========================================
// UPDATE EXAM
// ========================================
async function handleUpdateExam() {
  const validationResult = validateInputs();
  if (validationResult !== true) {
    showDangerAlert(validationResult);
    return;
  }

  if (!currentEditingDocId) {
    showDangerAlert("Error: No exam selected for update. Please start over.");
    return;
  }

  const updatedConfig = {
    theory_marks: theoryMarks.value,
    exam_date: examDate.value,
    exam_time: examTime.value,
    time_duration: timeDuration.value,
    teacher_message: teacherMessage.value || '',
    add_picture: pictureYes.checked,
    class_selected: selectedClass.value,
    subject_selected: selectSubject.value,
    is_open: getExamOpenStatus(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('theory_exam_configs')
      .update(updatedConfig)
      .eq('id', currentEditingDocId)
      .select();

    if (error) {
      throw error;
    }

    const sessionConfig = {
      subjectSelected: updatedConfig.subject_selected,
      theoryMarks: updatedConfig.theory_marks,
      examDate: updatedConfig.exam_date,
      examTime: updatedConfig.exam_time,
      timeDuration: updatedConfig.time_duration,
      teacherMessage: updatedConfig.teacher_message,
      addPicture: updatedConfig.add_picture,
      classSelected: updatedConfig.class_selected
    };
    sessionStorage.setItem('theoryExamConfig', JSON.stringify(sessionConfig));

    showSuccessAlert('Success! Exam updated. Redirecting...');

    // Reset form state
    submitButton.textContent = 'Set Student Exam';
    selectedClass.disabled = false;
    selectSubject.disabled = false;
    currentEditingDocId = null;

    // Remove open/close radio buttons
    const openCloseDiv = document.querySelector('.openClose');
    if (openCloseDiv) {
      openCloseDiv.remove();
    }

    setTimeout(() => {
      redirectToTheoryQuestionPage(updatedConfig.subject_selected, updatedConfig.class_selected);
    }, 3000);

  } catch (error) {
    console.error("Error updating theory exam record:", error);
    showDangerAlert("Failed to update exam settings. Please try again.");
  }
}

// ========================================
// FIND CONFIG IN SUPABASE
// ========================================
async function findConfigInSupabase(classSelected, subjectSelected) {
  try {
    const { data, error } = await supabase
      .from('theory_exam_configs')
      .select('*')
      .eq('subject_selected', subjectSelected)
      .eq('class_selected', classSelected)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error finding theory exam config:", error);
    throw error;
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function getExamOpenStatus() {
  const openRadio = document.getElementById('open');
  const closeRadio = document.getElementById('close');
  
  if (openRadio && openRadio.checked) {
    return true;
  }
  return false;
}

function redirectToTheoryQuestionPage(subject, classSelected) {
  if (subject && classSelected) {
    // Redirect to your theory question setting page
    location.href = `/QUIZ-APP/TheoryQuestions/TheoryQuestions.html?class=${classSelected}&subject=${subject}`;
  } else {
    location.href = '/ErrorPage/Error404.html';
  }
}

function showDangerAlert(message) {
  alertBox.style.display = 'block';
  alertBox.className = 'alert danger';
  alertBox.textContent = message;

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 7000);
}

function showSuccessAlert(message) {
  alertBox.style.display = 'block';
  alertBox.className = 'alert success';
  alertBox.textContent = message;

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 6000);

}
