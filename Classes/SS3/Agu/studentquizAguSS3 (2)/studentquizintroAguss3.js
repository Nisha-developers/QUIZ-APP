 // Student data and subjects from the provided code
        let allStudents = [];
        let allSubjects = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Computer', 'Geography', 'Economics', 'Technical', 'Agriculture'];

        // Load students from localStorage
        function loadStudents() {
            const storedData = localStorage.getItem('studentValueAguSS3');
            if (storedData) {
                allStudents = JSON.parse(storedData);
            }
            populateSubjects();
        }

        // Populate subjects dropdown
        function populateSubjects() {
            const subjectSelect = document.getElementById('subject');
            subjectSelect.innerHTML = '<option value="">Choose a subject...</option>';
            
            allSubjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectSelect.appendChild(option);
            });
        }

        // Show alert message
        function showAlert(message, type = 'error') {
            const alertContainer = document.getElementById('alertContainer');
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.innerHTML = `
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
                ${message}
            `;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alertDiv);
            alertDiv.style.display = 'block';

            // Auto hide after 5 seconds
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 5000);
        }

        // Validate student and start exam
        function validateAndStartExam() {
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const uniqueId = document.getElementById('uniqueId').value.trim();
            const subject = document.getElementById('subject').value;
           
            // Basic validation
            if (!firstName || !lastName || !uniqueId || !subject) {
                showAlert('Please fill in all required fields!', 'error');
                return;
            }

            if (firstName.length < 2 || lastName.length < 2) {
                showAlert('First name and last name must be at least 2 characters long!', 'error');
                return;
            }

            if (!uniqueId.includes('BY')) {
                showAlert('Unique ID must contain "BY"!', 'error');
                return;
            }

            // Check if student exists in stored data
            const student = allStudents.find(s => 
                s.firstName.toLowerCase() === firstName.toLowerCase() &&
                s.lastName.toLowerCase() === lastName.toLowerCase() &&
                s.UniqueId === uniqueId
            );

            if (!student) {
                showAlert('Invalid student details! Please check your information and try again.', 'error');
                return;
            }

            // Check if student is registered for the selected subject
            if (!student.subject.includes(subject)) {
                showAlert(`You are not registered for ${subject}. Please select a subject you are registered for.`, 'error');
                return;
            }

            // Success - student is validated
            showAlert(`Welcome ${firstName} ${lastName}! Redirecting to ${subject} examination...`, 'success');
            
            // Store current student session
            const studentSession = {
                firstName: firstName,
                lastName: lastName,
                uniqueId: uniqueId,
                subject: subject,
                loginTime: new Date().toISOString()
            };
            
            // In a real application, you would redirect to the actual quiz page
            // For now, we'll just show a confirmation
            setTimeout(() => {
                alert(`Examination Access Granted!\n\nStudent: ${firstName} ${lastName}\nID: ${uniqueId}\nSubject: ${subject}\n\n[In a real application, you would be redirected to the quiz page]`);


              
   const studentSession = {
        uniqueId: uniqueId,
        firstName: firstName,
        lastName: lastName,
       subject: subject
};
sessionStorage.setItem('currentStudentSession', JSON.stringify(studentSession));

 location.href = `./SubjectToBedoneAguSS3/${subject}.html`;
              
            }, 2000);
        }

        // Theme toggle functionality
        function toggleTheme() {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            
            document.getElementById('themeIcon').textContent = isLight ? '☀️' : '🌙';
            // Save theme preference
            try {
                localStorage.setItem('quizTheme', isLight ? 'light' : 'dark');
            } catch (e) {
                console.log('Theme preference not saved');
            }
        }

        // Initialize theme on page load
        function initializeTheme() {
            try {
                const savedTheme = localStorage.getItem('quizTheme');
                if (savedTheme === 'light') {
                    document.body.classList.add('light-mode');
                    document.getElementById('themeIcon').textContent = '☀️';
                    document.getElementById('themeText').textContent = 'Dark Mode';
                }
            } catch (e) {
                console.log('Theme not loaded from storage');
            }
        }

        // Form submission with Enter key
        document.getElementById('studentForm').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                validateAndStartExam();
            }
        });

        // Initialize page when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            initializeTheme();
            loadStudents();
        });

        // Load students when page loads
        window.addEventListener('load', function() {
            loadStudents();
        });