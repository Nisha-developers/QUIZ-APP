import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the elements
const inputTotal = document.querySelector('.totalQuestion');
const shownQuestionToStudent = document.querySelector('.shownQuestion');
const seletedSubject = document.getElementById('selectSubject');
const selectedClass = document.querySelector('#selectedClass');
const timeSelected = document.getElementById('seconds');
const submitExam = document.querySelector('#submit');
const alertEl = document.querySelector('.alert');
const examTime = document.getElementById('timeExam');
const examDate = document.getElementById('DateExam');
const continueButton = document.getElementById('continue');
const passageTrue = document.getElementById('Yes');
const passageFalse = document.getElementById('No');


// Save the default JSS subjects (initial HTML options)
const defaultJssSubjects = seletedSubject.innerHTML;

const urlParams = new URLSearchParams(window.location.search);
const selectedClassByUser = urlParams.get("class");
const selectedSubjectUser = urlParams.get('subject');
const passageInput = [];
let isOpen;


const seniorScienceSubject = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Further Mathematics", "Economics", "Computer", "Technical drawing",
  "Agricultural Science", "Animal husbandry", "Data Processing", "Marketing",
  "Painting and Decoration", "Food and nutrition", "Geography", "French", "Cisco", "Civic Education"
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
    // Load data into form
    inputTotal.value = existingConfig.total_score;
    shownQuestionToStudent.value = existingConfig.questions_shown_to_student;
    timeSelected.value = existingConfig.seconds_quiz;
    examDate.value = existingConfig.date_exam;
    examTime.value = existingConfig.time_exam;
    currentEditingDocId = existingConfig.id;
    selectedClass.disabled = true;
    seletedSubject.disabled = true;

    // Update passage section if applicable
    if (existingConfig.passage_workings && existingConfig.passage_workings.length > 0) {
         tohandlePassage(); // render radio buttons and container 
        passageTrue.checked = true;
      

        // Select the correct radio for number of passages
        const numberOfPassages = existingConfig.passage_workings.length;
        tohandlePassage();
        const passageRadio = passageLabelEl.querySelector(`input[value="${numberOfPassages}"]`);
        if (passageRadio) {
            passageRadio.checked = true;
        }

        // Now create the inputs dynamically
        handleNumberOfPassageChoosen(numberOfPassages);

        // Fill in values for each passage input
        const userInputPassage = document.querySelectorAll('.passageNumber');
        existingConfig.passage_workings.forEach((obj, index) => {
            if (userInputPassage[index]) {
                userInputPassage[index].value = obj.value;
                passageInput[index] = obj.value; // update global array
                const yesRadio = document.querySelector(`input[name="comp${index+1}"][value="yes"]`);
            const noRadio = document.querySelector(`input[name="comp${index+1}"][value="no"]`);
            if (obj.compulsory) {
                yesRadio.checked = true;
            } else {
                noRadio.checked = true;
            }
            }
        });
    } else {
        passageFalse.checked = true;
        tohandlePassage(); // ensure passage section removed
    }

    // Change button to "Update" mode
    submitExam.textContent = 'Update Exam';

    // Add open/close radio buttons
    const createElement = document.createElement('div');
    createElement.classList.add('openClose');
    createElement.innerHTML = `
        <label for="open" style="color:green" class="exam">Open Examination</label>
        <input type="radio" name="openAndClose" id="open" ${existingConfig.is_open ? 'checked' : ''}>
        <label for="close" style="color:red" class="exam">Close Examination</label>
        <input type="radio" name="openAndClose" id="close" ${!existingConfig.is_open ? 'checked' : ''}>
    `;
    seletedSubject.insertAdjacentElement('afterend', createElement);

    successSignal('Now editing existing exam. Make your changes and click "Update Exam".');
}
else {
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
                classSelected: existingConfig.classes_student,
                secondsQuiz: existingConfig.seconds_quiz,
                dateExam: existingConfig.date_exam,
                timeExam: existingConfig.time_exam,
                passageInput: Array.isArray(existingConfig.passage_workings) ? existingConfig.passage_workings : []
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
    const selectedClassValue = selectedClass.value;
    const timeSelectedValue = timeSelected.value;
    const dateExamValue = examDate.value;
    const timeExamValue = examTime.value;   
    const yearDate = new Date().getFullYear();
    const month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`;
    const dayy =   new Date().getDate() < 10 ? `0${new Date().getDate()}` : `${new Date().getDate()}`;
    const inputDay = `${yearDate}-${month}-${dayy}`;

    let passageOk = true;
    let valueGreater = true;
    if(passageTrue.checked){
        const selectedPassage = passageLabelEl.querySelectorAll('input[name="NumberOfPassage"]');
       let emptyInput = Array.from(selectedPassage).every((passage)=>passage.checked === false)
       if(emptyInput){
        passageOk = false;
       }
       else{
        const passageNumbers = document.querySelectorAll('.passageNumber');
        passageNumbers.forEach((no)=>{
          if(no.value === ''){
            passageOk = false; 
          }
          else{
          const totalInput =  Array.from(passageNumbers).reduce((sum, values)=>{return sum + Number(values.value)},0);
          if(totalInput > shownQuestionToStudentValue - 10){
            valueGreater = false;
          }
           
          }
        })

       }
     
    }
    if(passageFalse.checked){
        passageOk = true;
    }

     
    if (!inputTotalValue || !shownQuestionToStudentValue || !seletedSubject.value || !selectedClassValue || !timeSelectedValue || !dateExamValue || !timeExamValue || passageOk === false){
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
    if(Number(timeSelectedValue) > 360){
        return 'You cannot set time for more than six hours. Please choose a reasonable time';
    }
    if(Number(timeSelectedValue) < 1){
        return 'You cannot set time for less than one minutes. Please choose a reasonable time';
    }
    if( dateExamValue < inputDay){
         return 'You cannot set previous date. Please choose a valid date';
}
    if (timeExamValue >= '18:00' || timeExamValue < '06:00') {
       
    return 'School is closed by that time. Choose a reasonable time';
   
}
validationOfpassageInput()
     if(valueGreater === false){
        return 'The total input must be lower than the number shown to student by 10 try again'
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
        created_at: new Date().toISOString(), // Timestamp for good practice
        classes_student: selectedClass.value,
        seconds_quiz: timeSelected.value,
        date_exam: examDate.value,
        time_exam: examTime.value,
        passage_workings: toGetPassageInputs(),
        is_open: false
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
            classSelected: newConfig.classes_student,
            secondsQuiz: newConfig.seconds_quiz,
            dateExam: newConfig.date_exam,
            timeExam: newConfig.time_exam,
            passageInput: newConfig.passage_workings
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

let passageLabelEl; // persist reference

function tohandlePassage() {
  const passageTrue = document.getElementById('Yes');
  const passageFalse = document.getElementById('No');

  if (passageTrue.checked) {
    if (!passageLabelEl) {
      passageLabelEl = document.createElement('div');
      passageLabelEl.innerHTML = `
        <div class="numberOfPassages">Choose the number of passage:
          <label class='passage'>1</label>
          <input type="radio" name="NumberOfPassage" value="1"/>
          <label class='passage'>2</label>
          <input type="radio" name="NumberOfPassage" value="2"/>
          <label class='passage'>3</label>
          <input type="radio" name="NumberOfPassage" value="3"/>
          <label class='passage'>4</label>
          <input type="radio" name="NumberOfPassage" value="4"/>
          <label class='passage'>5</label>
          <input type="radio" name="NumberOfPassage" value="5"/>
        </div>
        <div id="passageInputs"></div>
      `;
      passageFalse.insertAdjacentElement('afterend', passageLabelEl);

      // ✅ attach listeners AFTER radios are in DOM
      passageLabelEl.querySelectorAll('input[name="NumberOfPassage"]').forEach(radio => {
        radio.addEventListener("change", () => {
          const selectedPassage = passageLabelEl.querySelector('input[name="NumberOfPassage"]:checked');
          if (selectedPassage) {
            handleNumberOfPassageChoosen(selectedPassage.value);
          }
        });
      });
    }
  } else {
    if (passageLabelEl) {
      passageLabelEl.remove();
      passageLabelEl = null;
    }
  }
}

function handleNumberOfPassageChoosen(labelChoosen) {
  const inputsContainer = document.getElementById("passageInputs");
  inputsContainer.innerHTML = ""; // clear old inputs
  

  for (let i = 1; i <= labelChoosen; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <label class='passage' style="margin-top: 1.5rem; display: block">Passage ${i}</label>
      <input type="number" class="passageNumber" placeholder="Enter how many questions you want to set for passage${i}"/>
     <label class="CheckCom">Is it compulsory?</label>
     <label class="CheckCom">
     <input type="radio" class="YesCom" name="comp${i}" value="yes"/> Yes
     </label>
    <label class="CheckCom">
    <input type="radio" class="NoCom" name="comp${i}" value="no"/> No
</label>
   <label class="CheckComs">Is image Included</label>
     <label class="CheckImg">
     <input type="radio" class="YesCom" name="comps${i}" value="yess"/> Yes
     </label>
    <label class="CheckImg">
    <input type="radio" class="NoCom" name="comps${i}" value="noo"/> No
</label>

    `;   
     inputsContainer.appendChild(div);
  }
   
  let allInput = document.querySelectorAll('.passageNumber');
  allInput.forEach((input, index) => {
  input.addEventListener('input', () => {
    passageInput[index] = Number(input.value) || 0;
  });
});
}
function toGetPassageInputs() {
  const allPassageNumbers = document.querySelectorAll('.passageNumber');
  const input_working = [];
  const input_reference = [];

  allPassageNumbers.forEach((input, index) => {
    const yesRadio = document.querySelector(`input[name="comp${index+1}"][value="yes"]`);
    const includeImageYes = document.querySelector(`input[name="comps${index+1}"][value="yess"]`)
     const includeImageNo = document.querySelector(`input[name="comps${index+1}"][value="noo"]`)
    const noRadio = document.querySelector(`input[name="comp${index+1}"][value="no"]`);

    input_working.push({
      value: Number(input.value) || 0,
      compulsory: yesRadio.checked ? true : false,
      addImage: includeImageYes.checked ? true : false
    });
    input_reference.push({
    includeImageNos: includeImageNo.checked ? true : false,
    noradios: noRadio.checked ? true : false
  })
  });
  

  return [input_working, input_reference];
}
function validationOfpassageInput(){
    let imagechecked;
    let radiochecked
    const inputValue = toGetPassageInputs()[0];
    const secondInputValue = toGetPassageInputs()[1];
    inputValue.some((val)=>{
        if(val.value < 2){
        return 'You cannot input less than two for the passage value'
}
if(val.compulsory === false){
    imagechecked = true;
}
if(val.noradios === false){
    radiochecked = true;
}
    })
    
   
  if((imagechecked === true && secondInputValue.includeImageNos === false) || (radiochecked === true &&secondInputValue.noradios === false)){
    return 'Answer all the input questions'
  }
}


function todetermineOpen(){
    const isopenEl = document.getElementById('open');
    const isClosedEl = document.getElementById('close');
    if(isopenEl.checked){
        isOpen = true
    }
    else{
        isOpen = false
    }
    return isOpen
}


// attach listeners to Yes/No
passageTrue.addEventListener('change', tohandlePassage);
passageFalse.addEventListener('change', tohandlePassage);


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
        classes_student: selectedClass.value,
        seconds_quiz: timeSelected.value,
        date_exam:  examDate.value,
        time_exam:  examTime.value,
        passage_workings: toGetPassageInputs()[0],
        updated_at: new Date().toISOString(), // Update timestamp
        is_open: todetermineOpen()
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
            classSelected: updatedConfig.classes_student,
            secondsQuiz: updatedConfig.seconds_quiz,
            dateExam: updatedConfig.date_exam,
            timeExam: updatedConfig.time_exam,
            passageInput: updatedConfig.passage_workings
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
