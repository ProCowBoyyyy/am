// ========================================
// Ambition Care - Firebase Application Logic
// ========================================

let currentUser = null;

// ========================================
// Authentication & Login
// ========================================

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Check default admin first
    if (username === 'adsajjadmen' && password === 'adsajjadmen123') {
        showDashboard('admin', { 
            username: 'adsajjadmen', 
            firstName: 'Admin',
            lastName: 'User',
            userType: 'admin'
        });
        return;
    }

    // Check in Firebase
    database.ref('users').once('value')
        .then((snapshot) => {
            const users = snapshot.val() || {};
            let userFound = null;

            Object.keys(users).forEach(key => {
                const user = users[key];
                if (user.username === username && user.password === password) {
                    userFound = { ...user, firebaseKey: key };
                }
            });

            if (userFound) {
                showDashboard(userFound.userType, userFound);
            } else {
                alert('❌ Invalid credentials! Please check your username and password.');
            }
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert('❌ Login failed! Please try again.');
        });
}

function showDashboard(userType, user) {
    currentUser = user;
    document.getElementById('loginScreen').style.display = 'none';

    if (userType === 'student') {
        document.getElementById('studentDashboard').style.display = 'block';
        document.getElementById('studentName').textContent = `${user.firstName} ${user.lastName}`;
        loadStudentData(user.id);
    } else if (userType === 'teacher') {
        document.getElementById('teacherDashboard').style.display = 'block';
        document.getElementById('teacherName').textContent = `${user.firstName} ${user.lastName}`;
        loadTeacherData(user.id);
    } else if (userType === 'admin') {
        document.getElementById('adminDashboard').style.display = 'block';
        loadAllAdminData();
    }
}

function logout() {
    currentUser = null;
    document.getElementById('studentDashboard').style.display = 'none';
    document.getElementById('teacherDashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginForm').reset();
}

// ========================================
// Navigation Functions
// ========================================

function showStudentSection(section) {
    document.querySelectorAll('#studentDashboard .section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#studentDashboard .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(section + 'Section').classList.add('active');
    document.getElementById('nav' + section.charAt(0).toUpperCase() + section.slice(1)).classList.add('active');
}

function showTeacherSection(section) {
    document.querySelectorAll('#teacherDashboard .section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#teacherDashboard .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('teacher' + section.charAt(0).toUpperCase() + section.slice(1) + 'Section').classList.add('active');
    document.getElementById('navTeacher' + section.charAt(0).toUpperCase() + section.slice(1)).classList.add('active');
}

function showAdminSection(section) {
    document.querySelectorAll('#adminDashboard .section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('admin' + section.charAt(0).toUpperCase() + section.slice(1) + 'Section').classList.add('active');
    document.getElementById('navAdmin' + section.charAt(0).toUpperCase() + section.slice(1)).classList.add('active');
    
    // Load specific data when switching sections
    if (section === 'users') loadRegisteredUsers();
    else if (section === 'results') loadAllResults();
    else if (section === 'attendance') loadAllAttendance();
    else if (section === 'payments') loadAllPayments();
    else if (section === 'exams') loadAllExams();
    else if (section === 'routine') loadAllRoutine();
    else if (section === 'lectures') loadAllLectures();
}

// ========================================
// Admin Functions - User Management
// ========================================

function registerUser(event) {
    event.preventDefault();

    const userData = {
        userType: document.getElementById('adminRegUserType').value,
        firstName: document.getElementById('adminRegFirstName').value,
        lastName: document.getElementById('adminRegLastName').value,
        email: document.getElementById('adminRegEmail').value,
        phone: document.getElementById('adminRegPhone').value || '',
        id: document.getElementById('adminRegID').value,
        department: document.getElementById('adminRegDepartment').value || '',
        username: document.getElementById('adminRegUsername').value,
        password: document.getElementById('adminRegPassword').value,
        address: document.getElementById('adminRegAddress').value || ''
    };

    // Validate required fields
    if (!userData.userType || !userData.firstName || !userData.lastName || 
        !userData.email || !userData.id || !userData.username || !userData.password) {
        alert('❌ Please fill all required fields!');
        return;
    }

    // Check if username or ID already exists
    database.ref('users').once('value')
        .then((snapshot) => {
            const users = snapshot.val() || {};
            const existingUsers = Object.values(users);

            if (existingUsers.find(u => u.username === userData.username)) {
                alert('❌ Username already exists!');
                return;
            }

            if (existingUsers.find(u => u.id === userData.id)) {
                alert('❌ ID already exists!');
                return;
            }

            // Add to Firebase
            const newUserRef = database.ref('users').push();
            newUserRef.set(userData)
                .then(() => {
                    alert('✅ User registered successfully!');
                    document.getElementById('adminRegisterForm').reset();
                    loadRegisteredUsers();
                })
                .catch((error) => {
                    console.error('Error registering user:', error);
                    alert('❌ Failed to register user!');
                });
        });
}

function loadRegisteredUsers() {
    database.ref('users').once('value')
        .then((snapshot) => {
            const users = snapshot.val() || {};
            const tbody = document.getElementById('registeredUsersTable');

            if (Object.keys(users).length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No registered users yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(users).forEach(key => {
                const user = users[key];
                const badgeClass = user.userType === 'student' ? 'status-unpaid' : 
                                  user.userType === 'teacher' ? 'status-pending' : 'status-paid';
                
                html += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td><span class="status-badge ${badgeClass}">${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}</span></td>
                        <td>${user.email}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${user.department || '-'}</td>
                        <td>
                            <button class="btn-download" onclick="deleteUser('${key}')" style="background: #e74c3c;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading users:', error);
        });
}

function deleteUser(firebaseKey) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    database.ref('users/' + firebaseKey).remove()
        .then(() => {
            alert('✅ User deleted successfully!');
            loadRegisteredUsers();
        })
        .catch((error) => {
            console.error('Error deleting user:', error);
            alert('❌ Failed to delete user!');
        });
}

// ========================================
// Admin Functions - Results Management
// ========================================

function addResult(event) {
    event.preventDefault();

    const result = {
        studentId: document.getElementById('resultStudentId').value,
        examName: document.getElementById('resultExamName').value,
        subject: document.getElementById('resultSubject').value,
        marks: document.getElementById('resultMarks').value,
        grade: document.getElementById('resultGrade').value,
        date: document.getElementById('resultDate').value,
        timestamp: Date.now()
    };

    database.ref('results').push(result)
        .then(() => {
            alert('✅ Result added successfully!');
            document.getElementById('adminResultsForm').reset();
            loadAllResults();
        })
        .catch((error) => {
            console.error('Error adding result:', error);
            alert('❌ Failed to add result!');
        });
}

function loadAllResults() {
    database.ref('results').once('value')
        .then((snapshot) => {
            const results = snapshot.val() || {};
            const tbody = document.getElementById('adminResultsTable');

            if (Object.keys(results).length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No results added yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(results).forEach(key => {
                const r = results[key];
                html += `
                    <tr>
                        <td>${r.studentId}</td>
                        <td>${r.examName}</td>
                        <td>${r.subject}</td>
                        <td>${r.marks}</td>
                        <td>${r.grade}</td>
                        <td>${r.date}</td>
                        <td>
                            <button class="btn-logout" onclick="deleteResult('${key}')" style="padding: 8px 15px; font-size: 14px;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading results:', error);
        });
}

function deleteResult(firebaseKey) {
    if (!confirm('Delete this result?')) return;

    database.ref('results/' + firebaseKey).remove()
        .then(() => {
            alert('✅ Result deleted!');
            loadAllResults();
        })
        .catch((error) => {
            console.error('Error deleting result:', error);
            alert('❌ Failed to delete result!');
        });
}

// ========================================
// Admin Functions - Attendance Management
// ========================================

function addAttendance(event) {
    event.preventDefault();

    const attendance = {
        studentId: document.getElementById('attendanceStudentId').value,
        date: document.getElementById('attendanceDate').value,
        subject: document.getElementById('attendanceSubject').value,
        status: document.getElementById('attendanceStatus').value,
        timestamp: Date.now()
    };

    database.ref('attendance').push(attendance)
        .then(() => {
            alert('✅ Attendance marked successfully!');
            document.getElementById('adminAttendanceForm').reset();
            loadAllAttendance();
        })
        .catch((error) => {
            console.error('Error adding attendance:', error);
            alert('❌ Failed to mark attendance!');
        });
}

function loadAllAttendance() {
    database.ref('attendance').once('value')
        .then((snapshot) => {
            const attendance = snapshot.val() || {};
            const tbody = document.getElementById('adminAttendanceTable');

            if (Object.keys(attendance).length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No attendance records yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(attendance).forEach(key => {
                const a = attendance[key];
                const statusClass = a.status === 'Present' ? 'status-present' : 'status-absent';
                html += `
                    <tr>
                        <td>${a.date}</td>
                        <td>${a.studentId}</td>
                        <td>${a.subject}</td>
                        <td><span class="status-badge ${statusClass}">${a.status}</span></td>
                        <td>
                            <button class="btn-logout" onclick="deleteAttendance('${key}')" style="padding: 8px 15px; font-size: 14px;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading attendance:', error);
        });
}

function deleteAttendance(firebaseKey) {
    if (!confirm('Delete this attendance record?')) return;

    database.ref('attendance/' + firebaseKey).remove()
        .then(() => {
            alert('✅ Attendance record deleted!');
            loadAllAttendance();
        })
        .catch((error) => {
            console.error('Error deleting attendance:', error);
            alert('❌ Failed to delete attendance!');
        });
}

// ========================================
// Admin Functions - Payment Management
// ========================================

function addPayment(event) {
    event.preventDefault();

    const payment = {
        studentId: document.getElementById('paymentStudentId').value,
        amount: document.getElementById('paymentAmount').value,
        purpose: document.getElementById('paymentPurpose').value,
        status: document.getElementById('paymentStatus').value,
        date: document.getElementById('paymentDate').value,
        timestamp: Date.now()
    };

    database.ref('payments').push(payment)
        .then(() => {
            alert('✅ Payment record added successfully!');
            document.getElementById('adminPaymentsForm').reset();
            loadAllPayments();
        })
        .catch((error) => {
            console.error('Error adding payment:', error);
            alert('❌ Failed to add payment!');
        });
}

function loadAllPayments() {
    database.ref('payments').once('value')
        .then((snapshot) => {
            const payments = snapshot.val() || {};
            const tbody = document.getElementById('adminPaymentsTable');

            if (Object.keys(payments).length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No payment records yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(payments).forEach(key => {
                const p = payments[key];
                const statusClass = p.status === 'Paid' ? 'status-paid' : 
                                  p.status === 'Pending' ? 'status-pending' : 'status-unpaid';
                html += `
                    <tr>
                        <td>${p.date}</td>
                        <td>${p.studentId}</td>
                        <td>$${p.amount}</td>
                        <td>${p.purpose}</td>
                        <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                        <td>
                            <button class="btn-logout" onclick="deletePayment('${key}')" style="padding: 8px 15px; font-size: 14px;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading payments:', error);
        });
}

function deletePayment(firebaseKey) {
    if (!confirm('Delete this payment record?')) return;

    database.ref('payments/' + firebaseKey).remove()
        .then(() => {
            alert('✅ Payment record deleted!');
            loadAllPayments();
        })
        .catch((error) => {
            console.error('Error deleting payment:', error);
            alert('❌ Failed to delete payment!');
        });
}

// ========================================
// Admin Functions - Exam Management
// ========================================

function addExam(event) {
    event.preventDefault();

    const exam = {
        subject: document.getElementById('examSubject').value,
        date: document.getElementById('examDate').value,
        time: document.getElementById('examTime').value,
        room: document.getElementById('examRoom').value,
        duration: document.getElementById('examDuration').value,
        timestamp: Date.now()
    };

    database.ref('exams').push(exam)
        .then(() => {
            alert('✅ Exam scheduled successfully!');
            document.getElementById('adminExamsForm').reset();
            loadAllExams();
        })
        .catch((error) => {
            console.error('Error scheduling exam:', error);
            alert('❌ Failed to schedule exam!');
        });
}

function loadAllExams() {
    database.ref('exams').once('value')
        .then((snapshot) => {
            const exams = snapshot.val() || {};
            const tbody = document.getElementById('adminExamsTable');

            if (Object.keys(exams).length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No exams scheduled yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(exams).forEach(key => {
                const e = exams[key];
                html += `
                    <tr>
                        <td>${e.date}</td>
                        <td>${e.subject}</td>
                        <td>${e.time}</td>
                        <td>${e.room}</td>
                        <td>${e.duration}</td>
                        <td>
                            <button class="btn-logout" onclick="deleteExam('${key}')" style="padding: 8px 15px; font-size: 14px;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading exams:', error);
        });
}

function deleteExam(firebaseKey) {
    if (!confirm('Delete this exam?')) return;

    database.ref('exams/' + firebaseKey).remove()
        .then(() => {
            alert('✅ Exam deleted!');
            loadAllExams();
        })
        .catch((error) => {
            console.error('Error deleting exam:', error);
            alert('❌ Failed to delete exam!');
        });
}

// ========================================
// Admin Functions - Routine Management
// ========================================

function addRoutine(event) {
    event.preventDefault();

    const routine = {
        day: document.getElementById('routineDay').value,
        time: document.getElementById('routineTime').value,
        subject: document.getElementById('routineSubject').value,
        room: document.getElementById('routineRoom').value,
        teacher: document.getElementById('routineTeacher').value,
        timestamp: Date.now()
    };

    database.ref('routine').push(routine)
        .then(() => {
            alert('✅ Class added to routine successfully!');
            document.getElementById('adminRoutineForm').reset();
            loadAllRoutine();
        })
        .catch((error) => {
            console.error('Error adding routine:', error);
            alert('❌ Failed to add routine!');
        });
}

function loadAllRoutine() {
    database.ref('routine').once('value')
        .then((snapshot) => {
            const routine = snapshot.val() || {};
            const tbody = document.getElementById('adminRoutineTable');

            if (Object.keys(routine).length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No routine added yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(routine).forEach(key => {
                const r = routine[key];
                html += `
                    <tr>
                        <td>${r.day}</td>
                        <td>${r.time}</td>
                        <td>${r.subject}</td>
                        <td>${r.room}</td>
                        <td>${r.teacher}</td>
                        <td>
                            <button class="btn-logout" onclick="deleteRoutine('${key}')" style="padding: 8px 15px; font-size: 14px;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading routine:', error);
        });
}

function deleteRoutine(firebaseKey) {
    if (!confirm('Delete this routine?')) return;

    database.ref('routine/' + firebaseKey).remove()
        .then(() => {
            alert('✅ Routine deleted!');
            loadAllRoutine();
        })
        .catch((error) => {
            console.error('Error deleting routine:', error);
            alert('❌ Failed to delete routine!');
        });
}

// ========================================
// Admin Functions - Lecture Materials Management
// ========================================

function addLecture(event) {
    event.preventDefault();

    const lecture = {
        subject: document.getElementById('lectureSubject').value,
        topic: document.getElementById('lectureTopic').value,
        teacher: document.getElementById('lectureTeacher').value,
        date: document.getElementById('lectureDate').value,
        timestamp: Date.now()
    };

    database.ref('lectures').push(lecture)
        .then(() => {
            alert('✅ Lecture material uploaded successfully!');
            document.getElementById('adminLecturesForm').reset();
            loadAllLectures();
        })
        .catch((error) => {
            console.error('Error uploading lecture:', error);
            alert('❌ Failed to upload lecture material!');
        });
}

function loadAllLectures() {
    database.ref('lectures').once('value')
        .then((snapshot) => {
            const lectures = snapshot.val() || {};
            const tbody = document.getElementById('adminLecturesTable');

            if (Object.keys(lectures).length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No materials uploaded yet</td></tr>';
                return;
            }

            let html = '';
            Object.keys(lectures).forEach(key => {
                const l = lectures[key];
                html += `
                    <tr>
                        <td>${l.subject}</td>
                        <td>${l.topic}</td>
                        <td>${l.teacher}</td>
                        <td>${l.date}</td>
                        <td>
                            <button class="btn-logout" onclick="deleteLecture('${key}')" style="padding: 8px 15px; font-size: 14px;">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading lectures:', error);
        });
}

function deleteLecture(firebaseKey) {
    if (!confirm('Delete this lecture material?')) return;

    database.ref('lectures/' + firebaseKey).remove()
        .then(() => {
            alert('✅ Lecture material deleted!');
            loadAllLectures();
        })
        .catch((error) => {
            console.error('Error deleting lecture:', error);
            alert('❌ Failed to delete lecture!');
        });
}

// ========================================
// Load All Admin Data
// ========================================

function loadAllAdminData() {
    loadRegisteredUsers();
    loadAllResults();
    loadAllAttendance();
    loadAllPayments();
    loadAllExams();
    loadAllRoutine();
    loadAllLectures();
}

// ========================================
// Student Data Functions
// ========================================

function loadStudentData(studentId) {
    // Load Results
    database.ref('results').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            const results = snapshot.val() || {};
            const tbody = document.getElementById('studentResultsTable');
            const resultsArray = Object.values(results);

            if (resultsArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No results available</td></tr>';
            } else {
                let html = '';
                resultsArray.forEach(r => {
                    html += `
                        <tr>
                            <td>${r.examName}</td>
                            <td>${r.subject}</td>
                            <td>${r.marks}</td>
                            <td>${r.grade}</td>
                            <td>${r.date}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;

                // Calculate GPA
                const gradePoints = {
                    'A+': 4.0, 'A': 3.75, 'A-': 3.5,
                    'B+': 3.25, 'B': 3.0, 'B-': 2.75,
                    'C+': 2.5, 'C': 2.25, 'C-': 2.0,
                    'D': 1.0, 'F': 0.0
                };
                const gpa = resultsArray.reduce((sum, r) => sum + (gradePoints[r.grade] || 0), 0) / resultsArray.length;
                document.getElementById('studentGPA').textContent = gpa.toFixed(2);
            }
        });

    // Load Attendance
    database.ref('attendance').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            const attendance = snapshot.val() || {};
            const tbody = document.getElementById('studentAttendanceTable');
            const attendanceArray = Object.values(attendance);

            if (attendanceArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #999;">No attendance records</td></tr>';
            } else {
                let html = '';
                let presentCount = 0;
                attendanceArray.forEach(a => {
                    if (a.status === 'Present') presentCount++;
                    const statusClass = a.status === 'Present' ? 'status-present' : 'status-absent';
                    html += `
                        <tr>
                            <td>${a.date}</td>
                            <td>${a.subject}</td>
                            <td><span class="status-badge ${statusClass}">${a.status}</span></td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;

                const attendanceRate = ((presentCount / attendanceArray.length) * 100).toFixed(0);
                document.getElementById('studentAttendanceRate').textContent = attendanceRate + '%';
            }
        });

    // Load Payments
    database.ref('payments').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            const payments = snapshot.val() || {};
            const tbody = document.getElementById('studentPaymentsTable');
            const paymentsArray = Object.values(payments);

            if (paymentsArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No payment records</td></tr>';
            } else {
                let html = '';
                let totalPaid = 0;
                paymentsArray.forEach(p => {
                    if (p.status === 'Paid') totalPaid += parseFloat(p.amount);
                    const statusClass = p.status === 'Paid' ? 'status-paid' : 
                                      p.status === 'Pending' ? 'status-pending' : 'status-unpaid';
                    html += `
                        <tr>
                            <td>${p.date}</td>
                            <td>$${p.amount}</td>
                            <td>${p.purpose}</td>
                            <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
                document.getElementById('studentTotalPaid').textContent = '$' + totalPaid;
            }
        });

    // Load Exams
    database.ref('exams').once('value')
        .then((snapshot) => {
            const exams = snapshot.val() || {};
            const tbody = document.getElementById('studentExamsTable');
            const examsArray = Object.values(exams);

            if (examsArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No exams scheduled</td></tr>';
            } else {
                let html = '';
                examsArray.forEach(e => {
                    html += `
                        <tr>
                            <td>${e.date}</td>
                            <td>${e.subject}</td>
                            <td>${e.time}</td>
                            <td>${e.room}</td>
                            <td>${e.duration}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
                document.getElementById('studentUpcomingExams').textContent = examsArray.length;
            }
        });

    // Load Routine
    database.ref('routine').once('value')
        .then((snapshot) => {
            const routine = snapshot.val() || {};
            const tbody = document.getElementById('studentRoutineTable');
            const routineArray = Object.values(routine);

            if (routineArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No class routine available</td></tr>';
            } else {
                let html = '';
                routineArray.forEach(r => {
                    html += `
                        <tr>
                            <td>${r.day}</td>
                            <td>${r.time}</td>
                            <td>${r.subject}</td>
                            <td>${r.room}</td>
                            <td>${r.teacher}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        });

    // Load Lectures
    database.ref('lectures').once('value')
        .then((snapshot) => {
            const lectures = snapshot.val() || {};
            const tbody = document.getElementById('studentLecturesTable');
            const lecturesArray = Object.values(lectures);

            if (lecturesArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No lecture materials available</td></tr>';
            } else {
                let html = '';
                lecturesArray.forEach(l => {
                    html += `
                        <tr>
                            <td>${l.subject}</td>
                            <td>${l.topic}</td>
                            <td>${l.teacher}</td>
                            <td>${l.date}</td>
                            <td><button class="btn-download" onclick="alert('Download feature coming soon!')">Download</button></td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        });
}

// ========================================
// Teacher Data Functions
// ========================================

function loadTeacherData(teacherId) {
    // Load Routine
    database.ref('routine').once('value')
        .then((snapshot) => {
            const routine = snapshot.val() || {};
            const tbody = document.getElementById('teacherRoutineTable');
            const routineArray = Object.values(routine);

            if (routineArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No class routine available</td></tr>';
            } else {
                let html = '';
                routineArray.forEach(r => {
                    html += `
                        <tr>
                            <td>${r.day}</td>
                            <td>${r.time}</td>
                            <td>${r.subject}</td>
                            <td>${r.room}</td>
                            <td>All Students</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        });

    // Load All Attendance
    Promise.all([
        database.ref('attendance').once('value'),
        database.ref('users').once('value')
    ]).then(([attendanceSnapshot, usersSnapshot]) => {
        const attendance = attendanceSnapshot.val() || {};
        const users = usersSnapshot.val() || {};
        const tbody = document.getElementById('teacherAttendanceTable');
        const attendanceArray = Object.values(attendance);

        if (attendanceArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No attendance records available</td></tr>';
        } else {
            let html = '';
            attendanceArray.forEach(a => {
                const user = Object.values(users).find(u => u.id === a.studentId);
                const studentName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
                const statusClass = a.status === 'Present' ? 'status-present' : 'status-absent';
                
                html += `
                    <tr>
                        <td>${a.date}</td>
                        <td>${a.studentId}</td>
                        <td>${studentName}</td>
                        <td>${a.subject}</td>
                        <td><span class="status-badge ${statusClass}">${a.status}</span></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    });

    // Load All Results
    Promise.all([
        database.ref('results').once('value'),
        database.ref('users').once('value')
    ]).then(([resultsSnapshot, usersSnapshot]) => {
        const results = resultsSnapshot.val() || {};
        const users = usersSnapshot.val() || {};
        const tbody = document.getElementById('teacherResultsTable');
        const resultsArray = Object.values(results);

        if (resultsArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No results available</td></tr>';
        } else {
            let html = '';
            resultsArray.forEach(r => {
                const user = Object.values(users).find(u => u.id === r.studentId);
                const studentName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
                
                html += `
                    <tr>
                        <td>${r.studentId}</td>
                        <td>${studentName}</td>
                        <td>${r.examName}</td>
                        <td>${r.subject}</td>
                        <td>${r.marks}</td>
                        <td>${r.grade}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    });

    // Load Lectures
    database.ref('lectures').once('value')
        .then((snapshot) => {
            const lectures = snapshot.val() || {};
            const tbody = document.getElementById('teacherMaterialsTable');
            const lecturesArray = Object.values(lectures);

            if (lecturesArray.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No materials uploaded yet</td></tr>';
            } else {
                let html = '';
                lecturesArray.forEach(l => {
                    html += `
                        <tr>
                            <td>${l.subject}</td>
                            <td>${l.topic}</td>
                            <td>${l.date}</td>
                            <td>All Students</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Ambition Care - Firebase Edition Loaded!');
});
