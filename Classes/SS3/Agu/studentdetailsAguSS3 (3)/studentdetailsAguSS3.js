 let allStudents = [];
        let displayedStudents = [];
        let allSubjects = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Computer', 'Geography', 'Economics', 'Technical', 'Agriculture'];
        let editingStudentId = null;

        function loadStudents() {
            const storedData = localStorage.getItem('studentValueAguSS3');
            if (storedData) {
                allStudents = JSON.parse(storedData);
            displayedStudents = [...allStudents];
                updateStats();
                generateTable();
            } else {
                document.getElementById('tableContainer').innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-user-slash"></i>
                        <h3>No Students Found</h3>
                        <p>Please add students using the registration form first.</p>
                    </div>
                `;
            }
        }

        function updateStats() {
            const totalStudents = allStudents.length;
            document.getElementById('totalStudents').textContent = totalStudents;
            
            if (totalStudents > 0) {
                // Count unique subjects across all students
                const uniqueSubjects = new Set();
                let completedQuizCount = 0;
                let totalScores = 0;
                let scoreCount = 0;
                
                allStudents.forEach(student => {
                    student.subject.forEach(subject => uniqueSubjects.add(subject));
                    
                    if (student.quizScores && Object.keys(student.quizScores).length > 0) {
                        completedQuizCount++;
                        Object.values(student.quizScores).forEach(score => {
                            if (score !== null && score !== undefined && score !== '') {
                                totalScores += parseFloat(score);
                                scoreCount++;
                            }
                        });
                    }
                });
                
                document.getElementById('totalSubjects').textContent = uniqueSubjects.size;
                document.getElementById('completedQuiz').textContent = completedQuizCount;
                
                const avgScore = scoreCount > 0 ? Math.round(totalScores / scoreCount) : '-';
                document.getElementById('avgScore').textContent = avgScore !== '-' ? avgScore + '%' : '-';
            }
        }

        function generateTable() {
            const container = document.getElementById('tableContainer');
            
            if (displayedStudents.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-search"></i>
                        <h3>No Students Match Your Search</h3>
                    </div>
                `;
                return;
            }

            let tableHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Unique ID</th>
                            ${allSubjects.map(subject => `<th>${subject}</th>`).join('')}
                            <th>Average</th>
                            <th>Remark</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            displayedStudents.forEach((student, index) => {
                const average = calculateAverage(student);
                const remark = getRemark(average);
                
                tableHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${student.firstName}</td>
                        <td>${student.lastName}</td>
                        <td><strong>${student.UniqueId}</strong></td>
                `;

                // Generate subject columns
               // Inside your generateTable function, in the loop for subjects:
allSubjects.forEach(subject => {
    if (student.subject.includes(subject)) {
        const score = student.quizScores && student.quizScores[subject] !== undefined ? student.quizScores[subject] : '';
        tableHTML += `
            <td>
                <input
                    type="number"
                    class="score-input"
                    value="${score}"
                    onchange="updateScore('${student.UniqueId}', '${subject}', this.value)"
                    placeholder="N/A"
                />
            </td>
        `;
    } else {
        tableHTML += `<td class="no-subject">-</td>`;
    }
});

                // Average and Remark
                if (average > 0) {
                    tableHTML += `
                        <td class="average-cell">${average}%</td>
                        <td><span class="remark ${remark.class}">${remark.text}</span></td>
                    `;
                } else {
                    tableHTML += `
                        <td class="average-cell">-</td>
                        <td>-</td>
                    `;
                }

                // Actions
                tableHTML += `
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit" onclick="editStudent('${student.UniqueId}')">
                               Edit
                            </button>
                            <button class="btn btn-delete" onclick="deleteStudent('${student.UniqueId}')">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            container.innerHTML = tableHTML;
        }

        function calculateAverage(student) {
            if (!student.quizScores) return 0;
            
            const scores = Object.values(student.quizScores).filter(score => 
                score !== null && score !== undefined && score !== '' && !isNaN(score)
            );
            
            if (scores.length === 0) return 0;
            
            const sum = scores.reduce((acc, score) => acc + parseFloat(score), 0);
            return Math.round(sum / scores.length);
        }

        function getRemark(average) {
            if (average === 0) return { text: '-', class: '' };
            if (average >= 80) return { text: 'Excellent', class: 'excellent' };
            if (average >= 70) return { text: 'Good', class: 'good' };
            if (average >= 60) return { text: 'Fair', class: 'fair' };
            return { text: 'Poor', class: 'poor' };
        }

        function updateScore(studentId, subject, newScore) {
            const student = allStudents.find(s => s.UniqueId === studentId);
            if (student) {
                if (!student.quizScores) student.quizScores = {};
                student.quizScores[subject] = newScore === '' ? '' : parseFloat(newScore);
                
                localStorage.setItem('studentValueAguSS3', JSON.stringify(allStudents));
                updateStats();
                generateTable();
            }
        }

        function editStudent(studentId) {
            const student = allStudents.find(s => s.UniqueId === studentId);
            if (student) {
                editingStudentId = studentId;
                document.getElementById('editFirstName').value = student.firstName;
                document.getElementById('editLastName').value = student.lastName;
                document.getElementById('editUniqueId').value = student.UniqueId;
                document.getElementById('editModal').style.display = 'block';
            }
        }

        function saveEdit() {
            const student = allStudents.find(s => s.UniqueId === editingStudentId);
            if (student) {
                const newFirstName = document.getElementById('editFirstName').value.trim();
                const newLastName = document.getElementById('editLastName').value.trim();
                const newUniqueId = document.getElementById('editUniqueId').value.trim();

                if (newFirstName.length < 2 || newLastName.length < 2 || !newUniqueId.includes('NAV')) {
                    alert('Please enter valid details. First name and last name must be at least 2 characters, and ID must include "NAV".');
                    return;
                }

                // Check for duplicate ID (excluding current student)
                if (newUniqueId !== editingStudentId && allStudents.some(s => s.UniqueId === newUniqueId)) {
                    alert('This Unique ID already exists!');
                    return;
                }

                student.firstName = newFirstName;
                student.lastName = newLastName;
                student.UniqueId = newUniqueId;

                localStorage.setItem('studentValueAguSS3', JSON.stringify(allStudents));
                closeModal();
                loadStudents();
            }
        }

        function deleteStudent(studentId) {
            if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                allStudents = allStudents.filter(s => s.UniqueId !== studentId);
                localStorage.setItem('studentValueAguSS3', JSON.stringify(allStudents));
                loadStudents();
            }
        }

        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
            editingStudentId = null;
        }

        function filterStudents() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            displayedStudents = allStudents.filter(student => 
                student.firstName.toLowerCase().includes(searchTerm) ||
                student.lastName.toLowerCase().includes(searchTerm) ||
                student.UniqueId.toLowerCase().includes(searchTerm)
            );
            generateTable();
        }

        function sortStudents() {
            const sortBy = document.getElementById('sortSelect').value;
            
            displayedStudents.sort((a, b) => {
                switch(sortBy) {
                    case 'firstName':
                        return a.firstName.localeCompare(b.firstName);
                    case 'lastName':
                        return a.lastName.localeCompare(b.lastName);
                    case 'UniqueId':
                        return a.UniqueId.localeCompare(b.UniqueId);
                    case 'subjects':
                        return b.subject.length - a.subject.length;
                    case 'average':
                        return calculateAverage(b) - calculateAverage(a);
                    default:
                        return 0;
                }
            });
            
            generateTable();
        }

        function toggleTheme() {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            document.getElementById('themeText').textContent = isLight ? '🌙' : '☀️';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        }

        // Initialize theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            document.getElementById('themeText').textContent = '🌙';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // Load data when page loads
        window.addEventListener('load', loadStudents);
        
        // Refresh data every 5 seconds
        setInterval(loadStudents, 5000);
        function updateStudentScoresFromQuizResults() {
    // 1. Get the Quiz Results
    const quizResults = localStorage.getItem('allQuizResults');
    const allStudentsData = localStorage.getItem('studentValueAguSS3');

    if (quizResults && allStudentsData) {
        const parsedResults = JSON.parse(quizResults);
        let allStudents = JSON.parse(allStudentsData);

        // 2. Iterate through each quiz result
        parsedResults.forEach(result => {
            const { uniqueId, subject, percentage } = result;

            // 3. Find the matching student in the database
            const studentToUpdate = allStudents.find(student => student.UniqueId === uniqueId);

            if (studentToUpdate) {
                // 4. Update the score for the specific subject
                if (!studentToUpdate.quizScores) {
                    studentToUpdate.quizScores = {};
                }
                studentToUpdate.quizScores[subject] = percentage;
            }
        });

        // 5. Save the updated student database
        localStorage.setItem('studentValueAguSS3', JSON.stringify(allStudents));
        
        // Optional: Refresh the table to show the new scores immediately
        generateTable();
        updateStats();
    }
}
window.addEventListener('load', () => {
    loadStudents();
    updateStudentScoresFromQuizResults(); // Call the function here
});
// Refresh data and update scores every 5 seconds
setInterval(() => {
    loadStudents();
    updateStudentScoresFromQuizResults();
}, 5000);