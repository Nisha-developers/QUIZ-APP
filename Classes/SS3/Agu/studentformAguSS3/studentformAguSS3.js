// Seclecting Elements
const toggleEl  = document.querySelector('.dark-mode');
const UniqueIdInputEl = document.getElementById('uniqueId');
const firstNameInputEl = document.getElementById('firstName');
const lastNameInputEl = document.getElementById('lastName');
const AgricEl = document.getElementById('Agric');
const technicalEl = document.getElementById('Technical');
const geographyEl = document.getElementById('Geography');
const EconomicsEl = document.getElementById('Economics');
const addStudentEl = document.getElementById('addStudent');
const messageCon = document.querySelector('.container');
const iconError = document.querySelector('i.fa-solid');
const alldesign = document.querySelector('.all');
// Selecting Elements Ends

// Getting inial values
const studentInfo = JSON.parse(localStorage.getItem('studentValueAguSS3')) || [];
let message;
const studentObj = function(firstName, lastName, UniqueId, subject){
  this.firstName = firstName;
  this.lastName = lastName;
  this.UniqueId = UniqueId;
  this.subject = subject;
}
//Getting initial values Ends 

addStudentEl.addEventListener('click', () => {
  const optionalSubject = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Computer'];

  if (geographyEl.checked) optionalSubject.push(geographyEl.value);
  if (EconomicsEl.checked) optionalSubject.push(EconomicsEl.value);
  if (technicalEl.checked) optionalSubject.push(technicalEl.value);
  if (AgricEl.checked) optionalSubject.push(AgricEl.value);

  // Form validation
  if (firstNameInputEl.value.trim().length < 2) {
    message = 'Enter a valid firstName';
    iconError.style.color = 'red'
    iconError.classList.replace('fa-check-double', 'fa-xmark');
    addStudentEl.disabled= true;
    messageCon.classList.add('shake');
  } else if (lastNameInputEl.value.trim().length < 2) {
    message = 'Enter a valid lastName';
     iconError.style.color = 'red'
     iconError.classList.replace('fa-check-double', 'fa-xmark');
      addStudentEl.disabled= true;
       messageCon.classList.add('shake');

  } else if (!UniqueIdInputEl.value.includes('BY')) {
    message = 'Must include "BY"';
     iconError.style.color = 'red'
     iconError.classList.replace('fa-check-double', 'fa-xmark');
    addStudentEl.disabled= true;
       messageCon.classList.add('shake');
}
 else if (studentInfo.some(student => student.UniqueId === UniqueIdInputEl.value)) {
  message = 'This Unique ID already exists!';
  iconError.style.color = 'red';
  iconError.classList.replace('fa-check-double', 'fa-xmark');
 addStudentEl.disabled= true;
  messageCon.classList.add('shake');
} 
 else if (studentInfo.some(student =>
  student.firstName.toLowerCase() === firstNameInputEl.value.toLowerCase() &&
  student.lastName.toLowerCase() === lastNameInputEl.value.toLowerCase()
)) {
  message = 'This full name already exists!';
  iconError.style.color = 'red';
  iconError.classList.replace('fa-check-double', 'fa-xmark');
  addStudentEl.disabled = true;
  messageCon.classList.add('shake');

}
   else {
    message = 'You have successfully Added a student';
     addStudentEl.disabled = true;
    const StudentInfo = new studentObj(
      firstNameInputEl.value,
      lastNameInputEl.value,
      UniqueIdInputEl.value,
      optionalSubject
    );
    studentInfo.push(StudentInfo);
    localStorage.setItem('studentValueAguSS3', JSON.stringify(studentInfo));
    let result = JSON.parse(localStorage.getItem('studentValueAguSS3'))
    console.log(result);
     iconError.style.color = 'green'
     iconError.classList.replace('fa-xmark', 'fa-check-double')
      messageCon.classList.remove('shake');
     UniqueIdInputEl.value = '';
     lastNameInputEl.value = '';
     firstNameInputEl.value = '';
     technicalEl.checked = false;
     EconomicsEl.checked = false;
     geographyEl.checked = false;
     AgricEl.checked = false;
  }
  // Clear any previous messages
const existingMessage = messageCon.querySelector('.message');
if (existingMessage) {
  existingMessage.remove();
}
  messageCon.style.display = 'flex';
  let newEl = document.createElement('div');
  newEl.classList.add('message');
  newEl.textContent = message;
  messageCon.appendChild(newEl);
  alldesign.style.filter = 'blur(10px)';

  setTimeout(() => {
    alldesign.style.filter = 'blur(0px)';
    messageCon.style.display = 'none';
    newEl.textContent = '';
       addStudentEl.disabled = false;
  }, 5000);
});
// Theme getting
 const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    }

  // Toggle theme on button click
    toggleEl.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      localStorage.setItem('theme', currentTheme);
    });