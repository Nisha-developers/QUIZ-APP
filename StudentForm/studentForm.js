// Selecting Elements
const toggleEl = document.querySelector('.dark-mode');
const UniqueIdInputEl = document.getElementById('uniqueId');
const firstNameInputEl = document.getElementById('firstName');
const lastNameInputEl = document.getElementById('lastName');  
const addStudentEl = document.getElementById('addStudent');
const messageCon = document.querySelector('.container');
const iconError = document.querySelector('i.fa-solid');
const alldesign = document.querySelector('.all');   
const h1Title = document.querySelector('.title');
const optionalGroup = document.getElementsByClassName('optional-group')
const checkboxContainer = document.getElementById('optionalSubjectsContainer');

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

const classes = [];
const jssBranches = ['agu', 'ayam', 'barama', 'damisa', 'ekpe', 'ekun'];
const ssBranches = ['agu', 'ayam', 'barama', 'damisa', 'ekpe'];

// Add JSS1 to JSS3 with all 6 branches
for (let i = 1; i <= 3; i++) {
  jssBranches.forEach(branch => {
    classes.push(`JSS${i}${branch.toUpperCase()}`);
  });
}

// Add SS1 to SS3 with only 5 branches (excluding ekun)
for (let i = 1; i <= 3; i++) {
  ssBranches.forEach(branch => {
    classes.push(`SSS${i}${branch.toUpperCase()}`);
  });
}

// Theme toggle logic
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
}
toggleEl.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
});

// Get the class from the URL
const urlParams = new URLSearchParams(window.location.search);
const selectedClass = urlParams.get("class");
h1Title.textContent = `Welcome to ${selectedClass || 'Not chosen'}`

if (!selectedClass || !classes.includes(selectedClass)) {
    
         location.href = '../ErrorPage/Error404.html';
 }
 else {
    // Define subject groups for mutual exclusion
    const subjectGroups = {
        group1: ['Economics', 'Computer'],
        group2: ['Data-Processing', 'Marketing', 'Painting'],
        group3: ['Data Processing', 'Marketing', 'Printing and decoration'],
        group4: ['Visual art', 'Home management', 'Food and nutrition'],
        group5: ['Yoruba', 'Igbo', 'French']
    };

    let compulsorySubjects = [];
    let electiveSubjects = [];

    // Set subjects based on class
    if (selectedClass.includes('JSS')) {
        compulsorySubjects = [
            "Mathematics", "English", "Basic science", "Basic tech", "Business studies",
            "Agric Science", "French", "Home Economics", "History", "Physical Health Education",
            "National value", "CCA Art", "CCA Drama", "CCA Music", "Christian Religious Studies",
            "Islamic Religious Studies", "Yoruba", "Igbo", "Computer", "Cisco", "Guidance and Counseling"
        ];
        electiveSubjects = []; // JSS has no elective subjects
    } else if (selectedClass.includes('AGU') || selectedClass.includes('AYAM') || selectedClass.includes('BARAMA')) {
        compulsorySubjects = [
            "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Mathematics",
            "Technical drawing", "Agricultural Science", "Animal husbandry", "Food and nutrition",
            "Geography", "French", "Cisco", "Civic Education"
        ];
        electiveSubjects = ['Economics', 'Computer', 'Data-Processing', 'Marketing', 'Painting'];
    } else if (selectedClass.includes('DAMISA')) {
        compulsorySubjects = [
            "Mathematics", "English Language", "Commerce", "Financial Accounting",
            "Government", "Economics", "Further Mathematics", "Cisco", "Civic Education"
        ];
        electiveSubjects = ["Data Processing", "Marketing", "Printing and decoration"];
    } else if (selectedClass.includes('EKPE')) {
        compulsorySubjects = [
            "Mathematics", "English", "Lit in English", "Christian Religious Studies",
            "Economics", "Civic education", "Biology", "Cisco"
        ];
        electiveSubjects = [
            "Government", "History", "Data Processing", "Marketing", "Printing and decoration",
            "Visual art", "Home management", "Food and nutrition", "Yoruba", "Igbo", "French"
        ];
    }

    // Function to populate checkboxes for elective subjects
   function populateCheckboxes(subjects, container) {
    container.innerHTML = '';

    if (subjects.length === 0) {
        Array.from(optionalGroup).forEach((el) => {
            el.style.display = 'none';
        });
        return;
    } else {
        // Show the container by letting the CSS handle the display property.
        Array.from(optionalGroup).forEach((el) => {
            el.style.display = ''; // Remove the inline style to use the CSS rule.
        });
    }

    subjects.forEach(subject => {
        // Create a valid ID by replacing spaces with hyphens.
        const subjectId = subject.replace(/\s+/g, '-'); 
        container.innerHTML += `
            <div class="checkbox-item">
                <input type="checkbox" id="${subjectId}" value="${subject}" name="subjects">
                <label for="${subjectId}">${subject}</label>
            </div>`;
    });

    addGroupRestrictions();
}

    // Function to find which group a subject belongs to
    function findSubjectGroup(subjectId) {
        for (const [groupName, subjects] of Object.entries(subjectGroups)) {
            if (subjects.some(subject => 
                subject.toLowerCase().replace(/\s+/g, '-') === subjectId.toLowerCase() ||
                subject.toLowerCase().replace(/\s+/g, '') === subjectId.toLowerCase() ||
                subject.toLowerCase() === subjectId.toLowerCase()
            )) {
                return subjects;
            }
        }
        return null;
    }

    // Function to handle group selection restrictions
   function handleGroupSelection(changedCheckbox) {
    // Find the group of subjects this checkbox belongs to
    const subjectGroup = findSubjectGroup(changedCheckbox.id);
    
    if (!subjectGroup) return; // Exit if the subject is not in a restricted group

    if (changedCheckbox.checked) {
        // If this checkbox is checked, disable others in the same group
        subjectGroup.forEach(subject => {
            // Create the valid ID to find the correct element
            const subjectId = subject.replace(/\s+/g, '-');
            const checkbox = document.getElementById(subjectId);
            
            // Disable the checkbox if it's not the one that was just clicked
            if (checkbox && checkbox.id !== changedCheckbox.id) {
                checkbox.disabled = true;
            }
        });
    } else {
        // If this checkbox is unchecked, re-enable all checkboxes in its group
        subjectGroup.forEach(subject => {
            // Create the valid ID to find the correct element
            const subjectId = subject.replace(/\s+/g, '-');
            const checkbox = document.getElementById(subjectId);
            
            if (checkbox) {
                checkbox.disabled = false;
            }
        });
    }
}
    // Function to add group restrictions to checkboxes
    function addGroupRestrictions() {
        const allCheckboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        
        allCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                handleGroupSelection(checkbox);
                console.log("Changed checkbox:", checkbox.id);
                console.log("Checked:", checkbox.checked);
            });
        });
    }

    // Populate elective subjects
    populateCheckboxes(electiveSubjects, checkboxContainer);

    // Add student functionality
    addStudentEl.addEventListener("click", async () => {
        addStudentEl.disabled = true;

        // Data gathering
        const uniqueId = UniqueIdInputEl.value.trim();
        const firstName = firstNameInputEl.value.trim();
        const lastName = lastNameInputEl.value.trim();

        // Validation
        if (firstName.length < 2) {
            showMessage('Enter a valid First Name', true);
            addStudentEl.disabled = false;
            return;
        }
        if (lastName.length < 2) {
            showMessage('Enter a valid Last Name', true);
            addStudentEl.disabled = false;
            return;
        }
        if (!uniqueId.includes('BY')) {
            showMessage('Unique ID must include "BY"', true);
            addStudentEl.disabled = false;
            return;
        }

        // Get selected elective subjects
        const selectedElectives = [];
        const checkedBoxes = checkboxContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkedBoxes.forEach(cb => selectedElectives.push(cb.value));

        // Combine compulsory and selected elective subjects
        const allSubjects = [...compulsorySubjects, ...selectedElectives];

        // Add to Supabase
        try {
            const { data, error } = await supabase
                .from('students')
                .insert([{
                    unique_id: uniqueId,
                    first_name: firstName,
                    last_name: lastName,
                    class: selectedClass,
                    subjects: allSubjects, // Include both compulsory and selected subjects
                }]);

            if (error) {
                console.error("Supabase error:", error.message);
                if (error.message.includes('unique_id')) {
                    showMessage('This Unique ID already exists!', true);
                } else if (error.message.includes('unique_full_name')) {
                    showMessage('This full name already exists!', true);
                } else {
                    showMessage('Failed to add student. See console for details.', true);
                }
                return;
            }

            showMessage('You have successfully added a student!');
            document.getElementById('studentForm').reset();
            
            // Re-enable all checkboxes after reset
            const allCheckboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
            allCheckboxes.forEach(cb => cb.disabled = false);

        } catch (error) {
            console.error("An unexpected error occurred: ", error);
            showMessage('An unexpected error occurred. Check console.', true);
        } finally {
            addStudentEl.disabled = false;
        }
    });
}

// Function to show messages to the user
function showMessage(msg, isError = false) {
    const existingMessage = messageCon.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    messageCon.style.display = 'flex';
    let newEl = document.createElement('div');
    newEl.classList.add('message');
    newEl.textContent = msg;
    messageCon.appendChild(newEl);
    alldesign.style.filter = 'blur(10px)';
    
    if (isError) {
        iconError.style.color = 'red';
        iconError.classList.replace('fa-check-double', 'fa-xmark');
        messageCon.classList.add('shake');
    } else {
        iconError.style.color = 'green';
        iconError.classList.replace('fa-xmark', 'fa-check-double');
        messageCon.classList.remove('shake');
    }
    
    setTimeout(() => {
        alldesign.style.filter = 'blur(0px)';
        messageCon.style.display = 'none';
        newEl.textContent = '';
        messageCon.classList.remove('shake');
    }, 5000);
}