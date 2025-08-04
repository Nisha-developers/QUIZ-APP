document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let allStudents = [];
    let displayedStudents = [];
    let allQuizResults = []; // Store all quiz results
    let allSubjects = [];
    const seniorScienceSubject = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Further Mathematics", "Economics", "Computer", "Technical drawing",
  "Agricultural Science", "Animal husbandry", "Data Processing", "Marketing",
  "Painting and Decoration", "Food and nutrition", "Geography", "French", "Cisco", "Civic Education"
 ];

  const seniorArtSubject = [
  "Mathematics", "English", "Lit in English", "Christian Religious Studies",
  "Economics", "Government", "History", "Data Processing", "Marketing",
  "Printing and decoration", "Visual art", "Home management", "Food and nutrition",
  "Civic education", "Yoruba", "Igbo", "French", "Biology", "Cisco"
];

const seniorCommercialSubject = [
  "Mathematics", "English Language", "Commerce", "Financial Accounting",
  "Government", "Economics", "Further Mathematics", "Data Processing",
  "Marketing", "Painting and Decoration", "Cisco", "Civic Education"
];
const juniorSubject = ["Mathematics","English","Basic science","Basic tech","Business studies","Agric Science","French","Home Economics","History","Physical Health Education","National value","CCA Art","CCA Drama","CCA Music","Christian Religious Studies","Islamic Religious Studies","Yoruba","Igbo","Computer","Cisco","Guidance and Counseling"];

    let editingStudentId = null; // Will store the Supabase ID of the student being edited

    // Get the Supabase instance from the window object (initialized in HTML)
    const supabase = window.supabase;
    
    // Get the class from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedClass = urlParams.get("class");

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
    if (!selectedClass || !classes.includes(selectedClass)) {
      location.href = '../ErrorPage/Error404.html';
    }
 if (selectedClass.includes('JSS')) {
    allSubjects  = juniorSubject;
  } else if (selectedClass.includes('EKPE')) {
    allSubjects = seniorArtSubject;
  } else if (selectedClass.includes('DAMISA')) {
    allSubjects = seniorCommercialSubject;
  }
  else{
    allSubjects = seniorScienceSubject;
  }



    

    /**
     * -------------------------------------------------------------------
     * DATA FETCHING AND REAL-TIME LISTENER (SUPABASE)
     * -------------------------------------------------------------------
     */

    // Get student's quiz results from Supabase
    async function getStudentResults(uniqueId, subject = null) {
        try {
            let query = supabase
                .from('quiz_results')
                .select('*')
                .eq('unique_id', uniqueId)
                .order('completed_at', { ascending: false });
           
            if (subject) {
                query = query.eq('subject', subject);
            }
           
            const { data, error } = await query;
           
            if (error) {
                console.error('Error fetching student results:', error);
                return null;
            }
           
            return data;
        } catch (error) {
            console.error('Error fetching student results:', error);
            return null;
        }
    }

    // Fetch all quiz results for the class
    async function fetchAllQuizResults() {
        try {
            // Get all unique IDs for students in this class
            const uniqueIds = allStudents.map(student => student.UniqueId);
            
            if (uniqueIds.length === 0) return;

            const { data, error } = await supabase
                .from('quiz_results')
                .select('*')
                .in('unique_id', uniqueIds)
                .order('completed_at', { ascending: false });

            if (error) {
                console.error('Error fetching quiz results:', error);
                return;
            }

            allQuizResults = data || [];
            
            // Update students with their latest quiz scores
            updateStudentsWithQuizResults();
            
        } catch (error) {
            console.error('Error in fetchAllQuizResults:', error);
        }
    }

    // FIXED: Update students with their quiz results - Use stored percentage directly
    function updateStudentsWithQuizResults() {
        allStudents.forEach(student => {
            // Get quiz results for this student
            const studentResults = allQuizResults.filter(result => result.unique_id === student.UniqueId);
            
            // Create quiz scores object from results
            const quizScores = { ...student.quizScores }; // Preserve existing manual scores
            
            // For each subject, get the latest percentage from quiz results
            allSubjects.forEach(subject => {
                const subjectResults = studentResults.filter(result => result.subject === subject);
                if (subjectResults.length > 0) {
                    // Get the most recent result and use the stored percentage directly
                    const result = subjectResults[0];
                    // Use the percentage column directly from the database
                    quizScores[subject] = result.percentage || 0;
                }
            });
            
            // Update the student's quiz scores
            student.quizScores = quizScores;
        });
    }

    // Fetches all students and re-renders the table
    async function fetchAndDisplayStudents() {
        try {
            const { data, error } = await supabase
                .from('students') // Your table name in Supabase
                .select('*')
                .eq('class', selectedClass) // Only get students from this class
                .order('first_name', { ascending: true });
            
            if (error) {
                console.error("Error fetching students from Supabase:", error);
                document.getElementById('tableContainer').innerHTML = `<div class="no-data"><h3>Error loading data.</h3></div>`;
                return;
            }

            // Map Supabase snake_case columns to our JS camelCase properties
            allStudents = data.map(student => ({
                id: student.id, // Supabase primary key
                firstName: student.first_name,
                lastName: student.last_name,
                UniqueId: student.unique_id,
                subjects: student.subjects || [],
                quizScores: student.quiz_scores || {} // Initialize as empty object if null
            }));
            
            // Fetch quiz results after getting students
            await fetchAllQuizResults();
            
            filterAndSortStudents(); // Initial display
        } catch (error) {
            console.error("Error in fetchAndDisplayStudents:", error);
            document.getElementById('tableContainer').innerHTML = `<div class="no-data"><h3>Error loading data.</h3></div>`;
        }
    }

    // Listens for any changes in the 'students' table and re-fetches data
    function listenForStudentUpdates() {
        // Listen for student table changes
        supabase.channel('public:students')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'students',
                filter: `class=eq.${selectedClass}` // Only listen to changes for this class
            }, payload => {
                console.log('Student change received!', payload);
                fetchAndDisplayStudents();
            })
            .subscribe();

        // Listen for quiz results changes
        supabase.channel('public:quiz_results')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'quiz_results'
            }, payload => {
                console.log('Quiz result change received!', payload);
                // Check if this affects any student in our class
                const affectedStudent = allStudents.find(s => s.UniqueId === payload.new?.unique_id || s.UniqueId === payload.old?.unique_id);
                if (affectedStudent) {
                    fetchAllQuizResults().then(() => {
                        filterAndSortStudents();
                    });
                }
            })
            .subscribe();
    }

    /**
     * -------------------------------------------------------------------
     * DATA DISPLAY AND MANIPULATION
     * -------------------------------------------------------------------
     */
    function filterAndSortStudents() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const sortBy = document.getElementById('sortSelect').value;

        // 1. Filter
        displayedStudents = allStudents.filter(student =>
            student.firstName.toLowerCase().includes(searchTerm) ||
            student.lastName.toLowerCase().includes(searchTerm) ||
            student.UniqueId.toLowerCase().includes(searchTerm)
        );

        // 2. Sort
        displayedStudents.sort((a, b) => {
            switch (sortBy) {
                case 'firstName': return a.firstName.localeCompare(b.firstName);
                case 'lastName': return a.lastName.localeCompare(b.lastName);
                case 'UniqueId': return a.UniqueId.localeCompare(b.UniqueId);
                case 'subjects': return b.subjects.length - a.subjects.length;
                case 'average': return calculateAverage(b) - calculateAverage(a);
                default: return 0;
            }
        });

        // 3. Calculate positions based on average
        const studentsWithAverages = displayedStudents.map(student => ({
            ...student,
            average: calculateAverage(student)
        })).filter(student => student.average > 0); // Only students with scores

        // Sort by average for position calculation (highest first)
        studentsWithAverages.sort((a, b) => b.average - a.average);

        // Assign positions
        studentsWithAverages.forEach((student, index) => {
            student.position = index + 1;
        });

        // Update the displayed students with positions
        displayedStudents.forEach(student => {
            const studentWithPosition = studentsWithAverages.find(s => s.id === student.id);
            student.position = studentWithPosition ? studentWithPosition.position : null;
        });

        // 4. Re-generate table and update stats
        generateTable();
        updateStats();
    }

    function generateTable() {
        const container = document.getElementById('tableContainer');
        if (displayedStudents.length === 0) {
            container.innerHTML = `<div class="no-data"><h3>No Students Found</h3><p>Add a student using the form or check your search term.</p></div>`;
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
                        <th>Position</th>
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

            allSubjects.forEach(subject => {
                if (student.subjects.includes(subject)) {
                    const score = student.quizScores[subject] ?? '';
                    const isQuizScore = allQuizResults.some(result => 
                        result.unique_id === student.UniqueId && result.subject === subject
                    );
                    
                    tableHTML += `
                        <td>
                            <input
                                type="number"
                                class="score-input ${isQuizScore ? 'quiz-score' : 'manual-score'}"
                                value="${score}"
                                onchange="updateScore('${student.id}', '${subject}', this.value)"
                                placeholder="N/A"
                                min="0" max="100"
                                title="${isQuizScore ? 'Quiz Percentage (from examination system)' : 'Manual Percentage'}"
                            />
                            ${isQuizScore ? '<span class="quiz-indicator" title="From Quiz System">📝</span>' : ''}
                        </td>`;
                } else {
                    tableHTML += `<td class="no-subject">-</td>`;
                }
            });

            tableHTML += `
                    <td class="average-cell">${average > 0 ? average + '%' : '-'}</td>
                    <td class="position-cell">${student.position ? getPositionSuffix(student.position) : '-'}</td>
                    <td><span class="remark ${remark.class}">${remark.text}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit" onclick="editStudent('${student.id}')">Edit</button>
                            <button class="btn btn-delete" onclick="deleteStudent('${student.id}', '${student.firstName}')">Delete</button>
                            <button class="btn btn-result" onclick="viewIndividualResult('${student.id}')">View Result</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;
    }

    function updateStats() {
        const totalStudentsElement = document.getElementById('totalStudents');
        const totalSubjectsElement = document.getElementById('totalSubjects');
        const completedQuizElement = document.getElementById('completedQuiz');
        const avgScoreElement = document.getElementById('avgScore');
            
        const totalStudents = allStudents.length;
        totalStudentsElement.textContent = totalStudents;

        if (totalStudents > 0) {
            const completedQuizCount = allStudents.filter(s => Object.keys(s.quizScores || {}).length > 0).length;
            const allScores = allStudents.flatMap(s => Object.values(s.quizScores || {})).filter(score => score !== null && score !== '' && !isNaN(score));
            const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + parseFloat(b), 0) / allScores.length) : '-';

            totalSubjectsElement.textContent = allSubjects.length;
            completedQuizElement.textContent = completedQuizCount;
            avgScoreElement.textContent = avgScore !== '-' ? avgScore + '%' : '-';
        } else {
            totalSubjectsElement.textContent = '0';
            completedQuizElement.textContent = '0';
            avgScoreElement.textContent = '-';
        }
    }

    /**
     * -------------------------------------------------------------------
     * INDIVIDUAL RESULT FUNCTIONALITY
     * -------------------------------------------------------------------
     */
    function viewIndividualResult(studentId) {
        const student = allStudents.find(s => s.id == studentId);
        if (!student) return;

        const average = calculateAverage(student);
        const remark = getRemark(average);
        const position = student.position ? getPositionSuffix(student.position) : 'N/A';

        // Create modal content with black and white styling
        let resultHTML = `
            <div class="individual-result-modal" id="individualResultModal">
                <div class="individual-result-content">
                    <div class="result-header">
                        <h2>STUDENT RESULT REPORT</h2>
                        <span class="close-result" onclick="closeIndividualResult()">&times;</span>
                    </div>
                    <div class="result-body">
                        <div class="student-info">
                            <table class="info-table">
                                <tr>
                                    <td><strong>Name:</strong></td>
                                    <td>${student.firstName} ${student.lastName}</td>
                                </tr>
                                <tr>
                                    <td><strong>Student ID:</strong></td>
                                    <td>${student.UniqueId}</td>
                                </tr>
                                <tr>
                                    <td><strong>Class:</strong></td>
                                    <td>${selectedClass}</td>
                                </tr>
                                <tr>
                                    <td><strong>Position:</strong></td>
                                    <td>${position}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="scores-section">
                            <h3>SUBJECT SCORES</h3>
                            <table class="scores-table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Percentage (%)</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
        `;

        // Add subjects with scores
        student.subjects.forEach(subject => {
            const score = student.quizScores[subject] ?? 'N/A';
            const grade = getGrade(score);
            
            resultHTML += `
                <tr>
                    <td>${subject}</td>
                    <td>${score !== 'N/A' ? score + '%' : 'N/A'}</td>
                    <td>${grade}</td>
                </tr>
            `;
        });

        resultHTML += `
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="summary-section">
                            <table class="summary-table">
                                <tr>
                                    <td><strong>Average Percentage:</strong></td>
                                    <td>${average > 0 ? average + '%' : 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Overall Grade:</strong></td>
                                    <td>${getGrade(average)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Remark:</strong></td>
                                    <td>${remark.text}</td>
                                </tr>
                                <tr>
                                    <td><strong>Class Position:</strong></td>
                                    <td>${position}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div class="result-footer">
                        <button class="btn btn-print-result" onclick="printIndividualResult()">Print Result</button>
                        <button class="btn btn-close" onclick="closeIndividualResult()">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', resultHTML);
    }

    function closeIndividualResult() {
        const modal = document.getElementById('individualResultModal');
        if (modal) {
            modal.remove();
        }
    }

    function printIndividualResult() {
        const modal = document.getElementById('individualResultModal');
        if (modal) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Student Result</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            color: black;
                            background: white;
                        }
                        .result-header h2 { 
                            text-align: center; 
                            margin-bottom: 30px;
                            border-bottom: 2px solid black;
                            padding-bottom: 10px;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 20px;
                        }
                        th, td { 
                            border: 1px solid black; 
                            padding: 8px; 
                            text-align: left;
                        }
                        th { 
                            background-color: #f0f0f0;
                            font-weight: bold;
                        }
                        .info-table td:first-child { 
                            font-weight: bold; 
                            width: 30%;
                        }
                        .summary-table td:first-child { 
                            font-weight: bold; 
                            width: 50%;
                        }
                        h3 { 
                            margin-top: 30px; 
                            margin-bottom: 10px;
                            border-bottom: 1px solid black;
                            padding-bottom: 5px;
                        }
                        .close-result { display: none; }
                        .result-footer { display: none; }
                    </style>
                </head>
                <body>
                    ${modal.querySelector('.individual-result-content').innerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    /**
     * -------------------------------------------------------------------
     * CRUD OPERATIONS (SUPABASE)
     * -------------------------------------------------------------------
     */
    // FIXED: Improved updateScore function with better error handling
    async function updateScore(studentId, subject, newScore) {
        try {
            // Find the student
            const student = allStudents.find(s => s.id == studentId);
            if (!student) {
                console.error('Student not found:', studentId);
                return;
            }

            // Validate the score
            let scoreValue = null;
            if (newScore !== '' && newScore !== null && newScore !== undefined) {
                scoreValue = parseFloat(newScore);
                if (isNaN(scoreValue)) {
                    console.error('Invalid score value:', newScore);
                    alert('Please enter a valid number');
                    return;
                }
                if (scoreValue < 0 || scoreValue > 100) {
                    alert('Score must be between 0 and 100');
                    return;
                }
            }

            // Prepare the updated scores
            const updatedScores = { ...student.quizScores };
            updatedScores[subject] = scoreValue;

            // Update in Supabase
            const { error } = await supabase
                .from('students')
                .update({ quiz_scores: updatedScores })
                .eq('id', studentId);

            if (error) {
                console.error("Error updating score in Supabase:", error);
                alert("Failed to update score: " + error.message);
                return;
            }

            // Update local data
            student.quizScores = updatedScores;
            filterAndSortStudents();
            
            console.log(`Score updated successfully for student ${studentId}, subject ${subject}: ${scoreValue}`);
        } catch (error) {
            console.error("Error in updateScore:", error);
            alert("Failed to update score: " + error.message);
        }
    }

    function editStudent(studentId) {
        const student = allStudents.find(s => s.id == studentId);
        if (student) {
            editingStudentId = studentId;
            document.getElementById('editFirstName').value = student.firstName;
            document.getElementById('editLastName').value = student.lastName;
            document.getElementById('editUniqueId').value = student.UniqueId;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    async function saveEdit() {
        if (!editingStudentId) return;

        const newFirstName = document.getElementById('editFirstName').value.trim();
        const newLastName = document.getElementById('editLastName').value.trim();
        const newUniqueId = document.getElementById('editUniqueId').value.trim();

        if (!newFirstName || !newLastName || !newUniqueId) {
            alert('Please fill in all fields.');
            return;
        }
        if (newFirstName.length < 2) {
            alert('Enter a valid First Name');
            return;
        }
        if (newLastName.length < 2) {
            alert('Enter a valid Last Name');
            return;
        }
        if (!newUniqueId.includes('BY')) {
            alert('Unique ID must include "BY"');
            return;
        }
        
        // Check if another student has the same name (excluding the one being edited)
        const nameConflict = allStudents.some(stu =>
            stu.id !== editingStudentId &&
            stu.firstName === newFirstName &&
            stu.lastName === newLastName
        );

        // Check if another student has the same Unique ID
        const idConflict = allStudents.some(stu =>
            stu.id !== editingStudentId &&
            stu.UniqueId === newUniqueId
        );

        if (nameConflict) {
            alert('Another student already has this First and Last Name.');
            return;
        }

        if (idConflict) {
            alert('Another student already has this Unique ID.');
            return;
        }

        try {
            const { error } = await supabase
                .from('students')
                .update({
                    first_name: newFirstName,
                    last_name: newLastName,
                    unique_id: newUniqueId
                })
                .eq('id', editingStudentId);

            if (error) {
                console.error("Error saving edits to Supabase:", error);
                alert("Failed to save changes: " + error.message);
                return;
            }

            const studentIndex = allStudents.findIndex(s => s.id == editingStudentId);
            if (studentIndex !== -1) {
                allStudents[studentIndex].firstName = newFirstName;
                allStudents[studentIndex].lastName = newLastName;
                allStudents[studentIndex].UniqueId = newUniqueId;
            }

            closeModal();
            filterAndSortStudents();

        } catch (error) {
            console.error("Error in saveEdit:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    }

    async function deleteStudent(studentId, studentName) {
        if (!confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId);

            if (error) {
                console.error("Error deleting student from Supabase:", error);
                alert("Failed to delete student: " + error.message);
                return;
            }
            
            // Remove from local array
            allStudents = allStudents.filter(s => s.id != studentId);
            filterAndSortStudents();

        } catch (error) {
            console.error("Error in deleteStudent:", error);
            alert("An unexpected error occurred while deleting the student.");
        }
    }

    /**
     * -------------------------------------------------------------------
     * HELPER & UTILITY FUNCTIONS
     * -------------------------------------------------------------------
     */
    // FIXED: Improved calculateAverage function with better null checking
    function calculateAverage(student) {
        if (!student.quizScores || typeof student.quizScores !== 'object') {
            return 0;
        }
        
        const scores = Object.values(student.quizScores)
            .filter(score => score !== null && score !== '' && score !== undefined && !isNaN(score))
            .map(score => parseFloat(score));
            
        if (scores.length === 0) return 0;
        
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return Math.round(sum / scores.length);
    }

    function getRemark(average) {
        if (average === 0) return { text: '-', class: '' };
        if (average >= 80) return { text: 'Excellent', class: 'excellent' };
        if (average >= 70) return { text: 'Good', class: 'good' };
        if (average >= 60) return { text: 'Fair', class: 'fair' };
        return { text: 'Poor', class: 'poor' };
    }

    function getGrade(score) {
        if (score === 'N/A' || score === null || score === '' || isNaN(score)) return 'N/A';
        const percentage = parseFloat(score);
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    function getPositionSuffix(position) {
        const lastDigit = position % 10;
        const lastTwoDigits = position % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return position + 'th';
        }
        
        switch (lastDigit) {
            case 1: return position + 'st';
            case 2: return position + 'nd';
            case 3: return position + 'rd';
            default: return position + 'th';
        }
    }

    function closeModal() {
        document.getElementById('editModal').style.display = 'none';
        editingStudentId = null;
    }

    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        document.getElementById('themeText').textContent = isLight ? '🌙' : '☀️';
    }

    /**
     * -------------------------------------------------------------------
     * INITIALIZATION
     * -------------------------------------------------------------------
     */
    function initializeApp() {
        document.getElementById('searchInput').addEventListener('input', filterAndSortStudents);
        document.getElementById('sortSelect').addEventListener('change', filterAndSortStudents);

        window.addEventListener('click', (event) => {
            const modal = document.getElementById('editModal');
            if (event.target === modal) closeModal();
            
            const resultModal = document.getElementById('individualResultModal');
            if (event.target === resultModal) closeIndividualResult();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal();
                closeIndividualResult();
            }
        });

        fetchAndDisplayStudents();
        listenForStudentUpdates();
    }

    // Expose functions to global scope
    window.updateScore = updateScore;
    window.editStudent = editStudent;
    window.deleteStudent = deleteStudent;
    window.saveEdit = saveEdit;
    window.closeModal = closeModal;
    window.toggleTheme = toggleTheme;
    window.viewIndividualResult = viewIndividualResult;
    window.closeIndividualResult = closeIndividualResult;
    window.printIndividualResult = printIndividualResult;
    window.getStudentResults = getStudentResults;

    initializeApp();
});