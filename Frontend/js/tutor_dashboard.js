// New Tutor Dashboard with improved navigation structure - Fixed version
document.addEventListener('DOMContentLoaded', function() {
  initializeTutorDashboard();
});

function initializeTutorDashboard() {
  setupTutorNavigation();
  setupJitsiButtonHandler();
}

function setupTutorNavigation() {
  // Assigned Courses button
  document.getElementById('assignedCoursesBtn').addEventListener('click', function() {
    showTutorSection('assignedCoursesSection');
    loadAssignedCourses();
  });

  // Generate Link button
  document.getElementById('generateLinkBtn').addEventListener('click', function() {
    showTutorSection('generateLinkSection');
    setupLinkGenerator();
  });

  // Edit Profile button
  document.getElementById('editProfileBtn').addEventListener('click', function() {
    showTutorSection('editProfileSection');
    loadEditProfileForm();
  });

  // Chat button
  document.getElementById('chatBtn').addEventListener('click', function() {
    window.location.href = 'chat.html';
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
  });

  // Back navigation buttons
  document.getElementById('backToMainFromCoursesBtn').addEventListener('click', function() {
    showTutorSection('mainDashboard');
  });

  document.getElementById('backToMainFromLinkBtn').addEventListener('click', function() {
    showTutorSection('mainDashboard');
  });

  document.getElementById('backToMainFromProfileBtn').addEventListener('click', function() {
    showTutorSection('mainDashboard');
  });

  document.getElementById('backToCoursesBtn').addEventListener('click', function() {
    showTutorSection('assignedCoursesSection');
    loadAssignedCourses();
  });

  // Course action buttons
  if (document.getElementById('enrolledStudentsBtn')) {
    document.getElementById('enrolledStudentsBtn').addEventListener('click', function() {
      loadEnrolledStudents();
    });
  }

  if (document.getElementById('editResourcesBtn')) {
    document.getElementById('editResourcesBtn').addEventListener('click', function() {
      loadEditResources();
    });
  }

  if (document.getElementById('sessionRequestsBtn')) {
    document.getElementById('sessionRequestsBtn').addEventListener('click', function() {
      loadSessionRequests();
    });
  }
}

function showTutorSection(sectionId) {
  // Hide all sections
  const sections = ['mainDashboard', 'assignedCoursesSection', 'courseDetailsSection', 'generateLinkSection', 'editProfileSection'];
  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });
  
  // Show the requested section
  const targetElement = document.getElementById(sectionId);
  if (targetElement) targetElement.style.display = 'block';
}

let currentCourseId = null;
let currentCourseTitle = '';

function loadAssignedCourses() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('You are not logged in. Please log in first.');
    window.location.href = 'login.html';
    return;
  }
  
  const coursesList = document.getElementById('coursesList');
  if (!coursesList) return;
  
  coursesList.innerHTML = '<p style="text-align: center; margin: 40px 0;">Loading courses...</p>';
  
  fetch('https://tutorconnect-backend-0yki.onrender.com/api/tutor/courses', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (res.status === 401) {
        alert('Session expired or unauthorized. Please log in again.');
        window.location.href = 'login.html';
        return Promise.reject('Unauthorized');
      }
      return res.json();
    })
    .then(courses => {
      if (!Array.isArray(courses)) return;
      
      let html = '';
      if (courses.length === 0) {
        html = '<p style="text-align: center; color: #7f8c8d; font-size: 1.1rem; margin: 40px 0;">No courses assigned yet.</p>';
      } else {
        courses.forEach(course => {
          const studentCount = course.extra && course.extra.students ? course.extra.students.length : 0;
          html += `
            <div class="course-item" onclick="openCourseDetails('${course.id}', '${course.title.replace(/'/g, "\\'")}')">
              <div class="course-title">${course.title}</div>
              <div class="course-description">${course.description || 'No description available'}</div>
              <div class="student-count">👥 ${studentCount} student${studentCount !== 1 ? 's' : ''} enrolled</div>
            </div>
          `;
        });
      }
      
      coursesList.innerHTML = html;
    })
    .catch(err => {
      if (err !== 'Unauthorized') {
        coursesList.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading courses. Please try again.</p>';
      }
      console.error(err);
    });
}

function openCourseDetails(courseId, courseTitle) {
  currentCourseId = courseId;
  currentCourseTitle = courseTitle;
  const titleElement = document.getElementById('courseDetailsTitle');
  if (titleElement) titleElement.textContent = `📚 ${courseTitle}`;
  showTutorSection('courseDetailsSection');
  const contentElement = document.getElementById('courseActionContent');
  if (contentElement) {
    contentElement.innerHTML = '<p style="text-align: center; color: #7f8c8d; margin: 40px 0;">Select an action above to get started.</p>';
  }
}

function setupLinkGenerator() {
  const generateBtn = document.getElementById('generateJitsiBtn');
  if (generateBtn) {
    // Remove any existing event listeners by cloning the element
    const newBtn = generateBtn.cloneNode(true);
    generateBtn.parentNode.replaceChild(newBtn, generateBtn);
    
    newBtn.addEventListener('click', function() {
      const randomStr = Math.random().toString(36).substring(2, 8);
      const roomName = `TutorConnect_${Date.now()}_${randomStr}`;
      const jitsiLink = `https://meet.jit.si/${roomName}`;
      
      const linkContainer = document.getElementById('jitsiLinkContainer');
      if (linkContainer) {
        linkContainer.innerHTML = `
          <div style="text-align: center;">
            <p style="margin-bottom: 15px; color: #27ae60; font-weight: 600;">✅ Meeting link generated successfully!</p>
            <div style="background: white; padding: 15px; border-radius: 10px; border: 2px solid #27ae60; margin-bottom: 15px;">
              <p style="margin: 0; word-break: break-all;">
                <a href="${jitsiLink}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: 500;">${jitsiLink}</a>
              </p>
            </div>
            <button onclick="copyToClipboard('${jitsiLink}')" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 500;">📋 Copy Link</button>
          </div>
        `;
      }
    });
  }
}

function loadEditProfileForm() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('You are not logged in. Please log in first.');
    window.location.href = 'login.html';
    return;
  }
  
  const profileContainer = document.getElementById('profileEditContainer');
  const resultContainer = document.getElementById('profileResult');
  
  if (!profileContainer) return;
  
  // First load the user's current profile data
  fetch('https://tutorconnect-backend-0yki.onrender.com/api/user/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (res.status === 401) {
        alert('Session expired or unauthorized. Please log in again.');
        window.location.href = 'login.html';
        return Promise.reject('Unauthorized');
      }
      return res.json();
    })
    .then(user => {
      if (!user) return;
      
      // Create modern styled profile edit form with current data
      const formHtml = `
        <form id="editProfileForm" style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">Edit Your Profile</h3>
          <div class="form-group">
            <label>👤 Username:</label>
            <input type="text" name="username" placeholder="Enter your username" value="${user.username || ''}" required>
          </div>
          <div class="form-group">
            <label>📧 Email:</label>
            <input type="email" name="email" placeholder="Enter your email" value="${user.email || ''}" required>
          </div>
          <div class="form-group">
            <label>📝 Bio:</label>
            <textarea name="bio" placeholder="Tell us about yourself" rows="4">${user.bio || ''}</textarea>
          </div>
          <div class="form-group">
            <label>📚 Subjects (comma separated):</label>
            <input type="text" name="subjects" placeholder="e.g., Mathematics, Physics, Chemistry" value="${Array.isArray(user.subjects) ? user.subjects.join(', ') : ''}">
          </div>
          <div class="form-group">
            <label>🌍 Languages (comma separated):</label>
            <input type="text" name="languages" placeholder="e.g., English, Spanish, French" value="${Array.isArray(user.languages) ? user.languages.join(', ') : ''}">
          </div>
          <div class="form-group">
            <label>⏰ Availability:</label>
            <input type="text" name="availability" placeholder="e.g., Mon-Fri 9AM-5PM" value="${user.availability || ''}">
          </div>
          <div class="form-group">
            <label>🔒 New Password (leave blank to keep current):</label>
            <input type="password" name="password" placeholder="Enter new password">
          </div>
          <button type="submit" class="btn-submit">💾 Update Profile</button>
        </form>
      `;
      
      profileContainer.innerHTML = formHtml;
      if (resultContainer) resultContainer.textContent = '';
      
      // Handle form submission with the correct API endpoint
      document.getElementById('editProfileForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const resultDiv = resultContainer || document.getElementById('profileResult');
        
        const updates = {
          username: form.username.value,
          email: form.email.value,
          bio: form.bio.value,
          subjects: form.subjects.value.split(',').map(s => s.trim()).filter(s => s),
          languages: form.languages.value.split(',').map(l => l.trim()).filter(l => l),
          availability: form.availability.value
        };
        
        if (form.password.value) {
          updates.password = form.password.value;
        }
        
        try {
          const res = await fetch('https://tutorconnect-backend-0yki.onrender.com/api/user/update-profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(updates)
          });
          
          if (res.status === 401) {
            alert('Session expired or unauthorized. Please log in again.');
            window.location.href = 'login.html';
            return;
          }
          
          let result;
          if (res.ok) {
            result = await res.json();
            if (resultDiv) {
              resultDiv.textContent = result.success ? '✅ Profile updated successfully!' : (result.message || 'Error updating profile');
              resultDiv.style.color = result.success ? '#27ae60' : '#e74c3c';
              resultDiv.style.fontWeight = '600';
            }
          } else {
            try {
              result = await res.json();
              if (resultDiv) {
                resultDiv.textContent = '❌ ' + (result.message || 'Error: ' + res.status);
                resultDiv.style.color = '#e74c3c';
                resultDiv.style.fontWeight = '600';
              }
            } catch {
              if (resultDiv) {
                resultDiv.textContent = '❌ Error: ' + res.status;
                resultDiv.style.color = '#e74c3c';
                resultDiv.style.fontWeight = '600';
              }
            }
          }
        } catch (error) {
          if (resultDiv) {
            resultDiv.textContent = '❌ Network error occurred';
            resultDiv.style.color = '#e74c3c';
            resultDiv.style.fontWeight = '600';
          }
          console.error(error);
        }
      };
    })
    .catch(err => {
      if (err !== 'Unauthorized') {
        profileContainer.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading profile. Please try again.</p>';
      }
      console.error(err);
    });
}

function loadEnrolledStudents() {
  if (!currentCourseId) return;
  
  const content = document.getElementById('courseActionContent');
  if (!content) return;
  
  content.innerHTML = '<div style="text-align: center; margin: 40px 0;"><div class="spinner"></div><p>Loading enrolled students...</p></div>';
  
  // Use the existing functionality but render in our modern interface
  const token = localStorage.getItem('jwt');
  fetch('https://tutorconnect-backend-0yki.onrender.com/api/tutor/courses', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(courses => {
      const course = courses.find(c => c.id === currentCourseId);
      if (!course) {
        content.innerHTML = '<p style="text-align: center; color: #e74c3c;">Course not found.</p>';
        return;
      }
      
      let html = '<h3 style="color: #2c3e50; margin-bottom: 20px;">Enrolled Students & Assignments</h3>';
      
      if (!course.extra || !course.extra.students || course.extra.students.length === 0) {
        html += '<p style="text-align: center; color: #7f8c8d; margin: 40px 0;">No students enrolled yet.</p>';
      } else {
        html += '<div class="students-list">';
        course.extra.students.forEach((student, index) => {
          html += `
            <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h4 style="color: #2c3e50; margin-bottom: 10px;">👤 ${student.name || student.email}</h4>
          `;
          
          if (course.extra.assignments && course.extra.assignments.length > 0) {
            html += '<div style="margin-top: 15px;"><strong>Assignments:</strong><ul style="margin-top: 10px;">';
            course.extra.assignments.forEach(([title, link]) => {
              const doneAssignments = Array.isArray(student.assignmentsDone) ? student.assignmentsDone : [];
              const isDone = doneAssignments.includes(title);
              html += `
                <li style="margin: 8px 0; padding: 10px; background: ${isDone ? '#e8f5e8' : '#fff3cd'}; border-radius: 8px; border-left: 4px solid ${isDone ? '#27ae60' : '#f39c12'};">
                  <strong>${title}:</strong> <a href="${link}" target="_blank" style="color: #3498db; text-decoration: none;">${link}</a>
                  <label style="margin-left: 15px; display: inline-flex; align-items: center; gap: 5px;">
                    <input type="checkbox" data-course="${course.id}" data-student="${student.email}" data-assignment="${title}" ${isDone ? 'checked' : ''} onchange="markAssignmentDone(this)" style="transform: scale(1.2);">
                    <span style="color: ${isDone ? '#27ae60' : '#f39c12'}; font-weight: 500;">${isDone ? 'Completed' : 'Pending'}</span>
                  </label>
                </li>
              `;
            });
            html += '</ul></div>';
          } else {
            html += '<p style="color: #7f8c8d; font-style: italic; margin-top: 10px;">No assignments available for this course.</p>';
          }
          
          html += '</div>';
        });
        html += '</div>';
      }
      
      content.innerHTML = html;
    })
    .catch(err => {
      content.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading students. Please try again.</p>';
      console.error(err);
    });
}

function loadEditResources() {
  if (!currentCourseId) return;
  
  const content = document.getElementById('courseActionContent');
  if (!content) return;
  
  content.innerHTML = '<div style="text-align: center; margin: 40px 0;"><div class="spinner"></div><p>Loading resources...</p></div>';
  
  // Load the existing edit resources functionality but with modern styling
  const token = localStorage.getItem('jwt');
  fetch('https://tutorconnect-backend-0yki.onrender.com/api/tutor/courses', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(courses => {
      const course = courses.find(c => c.id === currentCourseId);
      if (!course) {
        content.innerHTML = '<p style="text-align: center; color: #e74c3c;">Course not found.</p>';
        return;
      }
      
      // Generate form with existing functionality but modern styling
      let html = `<h3 style="color: #2c3e50; margin-bottom: 20px;">Edit/Add Resources for ${course.title}</h3>`;
      html += `<form onsubmit="return submitResourceForm(event, '${course.id}')" id="resourceForm_${course.id}" style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">`;
      
      // Videos section
      html += '<div class="form-group"><label>📹 Videos:</label>';
      html += `<div id="videoFields_${course.id}">`;
      if (course.extra && course.extra.video) {
        course.extra.video.forEach(([title, link]) => {
          html += `<div class="video-field" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="text" name="videoTitle" placeholder="Video Title" value="${title}" style="flex: 1;">
            <input type="text" name="videoLink" placeholder="YouTube Link" value="${link}" style="flex: 2;">
          </div>`;
        });
      }
      html += '</div>';
      html += `<button type="button" onclick="addVideoField('${course.id}')" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 20px; margin-top: 10px; cursor: pointer;">+ Add Video</button></div>`;
      
      // Documents section
      html += '<div class="form-group"><label>📄 Documents:</label>';
      html += `<div id="docFields_${course.id}">`;
      if (course.extra && course.extra.docs) {
        course.extra.docs.forEach(([title, link]) => {
          html += `<div class="doc-field" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="text" name="docTitle" placeholder="Document Title" value="${title}" style="flex: 1;">
            <input type="text" name="docLink" placeholder="Document Link" value="${link}" style="flex: 2;">
          </div>`;
        });
      }
      html += '</div>';
      html += `<button type="button" onclick="addDocField('${course.id}')" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 20px; margin-top: 10px; cursor: pointer;">+ Add Document</button></div>`;
      
      // Assignments section
      html += '<div class="form-group"><label>📝 Assignments:</label>';
      html += `<div id="assignmentFields_${course.id}">`;
      if (course.extra && course.extra.assignments) {
        course.extra.assignments.forEach(([title, link]) => {
          html += `<div class="assignment-field" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="text" name="assignmentTitle" placeholder="Assignment Title" value="${title}" style="flex: 1;">
            <input type="text" name="assignmentLink" placeholder="Assignment Link" value="${link}" style="flex: 2;">
          </div>`;
        });
      }
      html += '</div>';
      html += `<button type="button" onclick="addAssignmentField('${course.id}')" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 20px; margin-top: 10px; cursor: pointer;">+ Add Assignment</button></div>`;
      
      // Quizzes section
      html += '<div class="form-group"><label>🧠 Quizzes:</label>';
      html += `<div id="quizFields_${course.id}">`;
      if (course.extra && course.extra.quizzes) {
        course.extra.quizzes.forEach((quiz) => {
          html += `<div class="quiz-field" style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <input type="text" name="quizQuestion" value="${quiz.question || ''}" placeholder="Quiz Question" style="width: 100%; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <input type="text" name="quizOption" value="${quiz.options?.[0] || ''}" placeholder="Option 1">
              <input type="text" name="quizOption" value="${quiz.options?.[1] || ''}" placeholder="Option 2">
              <input type="text" name="quizOption" value="${quiz.options?.[2] || ''}" placeholder="Option 3">
              <input type="text" name="quizOption" value="${quiz.options?.[3] || ''}" placeholder="Option 4">
            </div>
            <input type="text" name="quizAnswer" value="${quiz.answer || ''}" placeholder="Correct Answer" style="width: 100%; margin-bottom: 10px;">
            <button type="button" onclick="this.parentNode.remove()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 15px; cursor: pointer;">Remove Quiz</button>
          </div>`;
        });
      }
      html += '</div>';
      html += `<button type="button" onclick="addQuizField('${course.id}')" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 20px; margin-top: 10px; cursor: pointer;">+ Add Quiz</button></div>`;
      
      html += '<button type="submit" class="btn-submit">💾 Save Resources</button>';
      html += '</form>';
      html += `<div id="resourceResult_${course.id}" style="text-align: center; margin-top: 20px; font-weight: 500;"></div>`;
      
      content.innerHTML = html;
    })
    .catch(err => {
      content.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading resources. Please try again.</p>';
      console.error(err);
    });
}

function loadSessionRequests() {
  if (!currentCourseId) return;
  
  const content = document.getElementById('courseActionContent');
  if (!content) return;
  
  content.innerHTML = '<div style="text-align: center; margin: 40px 0;"><div class="spinner"></div><p>Loading session requests...</p></div>';
  
  const token = localStorage.getItem('jwt');
  fetch(`https://tutorconnect-backend-0yki.onrender.com/api/courses/${currentCourseId}/tutor-requests`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        content.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading session requests.</p>';
        return;
      }
      
      const requests = data.requests || [];
      let html = '<h3 style="color: #2c3e50; margin-bottom: 20px;">Session Requests</h3>';
      
      if (requests.length === 0) {
        html += '<p style="text-align: center; color: #7f8c8d; margin: 40px 0;">No session requests yet.</p>';
      } else {
        requests.forEach((r, index) => {
          const statusColor = r.status === 'accepted' ? '#27ae60' : 
                             r.status === 'rejected' ? '#e74c3c' : 
                             r.status === 'done' ? '#3498db' : '#f39c12';
          const bgColor = r.status === 'accepted' ? '#e8f5e8' : 
                         r.status === 'rejected' ? '#ffeaea' : 
                         r.status === 'done' ? '#e8f4f8' : '#fff8e1';
          
          html += `
            <div style="background: ${bgColor}; border: 2px solid ${statusColor}; border-radius: 15px; padding: 20px; margin-bottom: 15px; ${r.isExtra ? 'border-left: 6px solid #ff9800;' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <h4 style="color: #2c3e50; margin: 0;">
                  ${r.isExtra ? '🔶 EXTRA ' : ''}Request #${index + 1}
                </h4>
                <span style="background: ${statusColor}; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
                  ${r.status.toUpperCase()}
                </span>
              </div>
              <p style="margin-bottom: 10px;"><strong>From:</strong> ${r.studentEmail}</p>
              ${r.isExtra ? '<p style="color: #ff9800; font-weight: bold; font-size: 0.9rem; margin-bottom: 15px;">⚠️ This is an extra request beyond the 5-request limit</p>' : ''}
          `;
          
          if (r.status === 'pending') {
            html += `
              <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 15px;">
                <div class="form-group">
                  <label>📅 Schedule Date & Time:</label>
                  <input type="datetime-local" id="schedule_${r.id}" style="width: 100%;">
                </div>
                <div class="form-group">
                  <label>💬 Message for Student (Optional):</label>
                  <textarea id="comment_${r.id}" placeholder="${r.isExtra ? 'Consider explaining why you are accepting/rejecting this extra request...' : 'Optional message for student...'}" style="width: 100%; height: 80px; resize: vertical;"></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                  <button class="acceptSessionBtn" data-course="${currentCourseId}" data-id="${r.id}" data-student="${r.studentEmail}" style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: 600;">✓ Accept & Send Jitsi</button>
                  <button class="rejectSessionBtn" data-course="${currentCourseId}" data-id="${r.id}" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: 600;">✗ Reject</button>
                </div>
              </div>
            `;
          } else if (r.status === 'accepted' && r.scheduledTime) {
            html += `<p><strong>📅 Scheduled:</strong> ${new Date(r.scheduledTime).toLocaleString()}</p>`;
            if (r.jitsiLink) {
              html += `<p><strong>🔗 Meeting Link:</strong> <a href="${r.jitsiLink}" target="_blank" style="color: #3498db; text-decoration: none;">${r.jitsiLink}</a></p>`;
            }
            if (r.comment) {
              html += `<p><strong>💬 Message:</strong> ${r.comment}</p>`;
            }
          }
          
          html += '</div>';
        });
      }
      
      content.innerHTML = html;
      
      // Add event listeners for accept/reject buttons
      content.querySelectorAll('.acceptSessionBtn').forEach(btn => {
        btn.addEventListener('click', function() {
          acceptSessionRequest(this);
        });
      });
      
      content.querySelectorAll('.rejectSessionBtn').forEach(btn => {
        btn.addEventListener('click', function() {
          rejectSessionRequest(this);
        });
      });
    })
    .catch(err => {
      content.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading session requests. Please try again.</p>';
      console.error(err);
    });
}

function acceptSessionRequest(button) {
  const courseId = button.getAttribute('data-course');
  const requestId = button.getAttribute('data-id');
  const studentEmail = button.getAttribute('data-student');
  const scheduleInput = document.getElementById(`schedule_${requestId}`);
  const commentInput = document.getElementById(`comment_${requestId}`);
  
  if (!scheduleInput || !scheduleInput.value) {
    alert('Please select a date and time for the session.');
    return;
  }
  
  const jitsiLink = generateJitsiLink(courseId, studentEmail);
  button.disabled = true;
  button.textContent = 'Sending...';
  
  const requestBody = { 
    status: 'accepted', 
    jitsiLink, 
    scheduledTime: new Date(scheduleInput.value).toISOString() 
  };
  if (commentInput && commentInput.value) requestBody.comment = commentInput.value;
  
  const token = localStorage.getItem('jwt');
  fetch(`https://tutorconnect-backend-0yki.onrender.com/api/courses/${courseId}/session-request/${requestId}/respond`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(requestBody)
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        button.textContent = 'Accepted';
        alert('Session request accepted successfully!');
        setTimeout(() => loadSessionRequests(), 1200);
      } else {
        button.textContent = result.message || 'Error';
        button.disabled = false;
        alert(result.message || 'Error accepting request');
      }
    })
    .catch(() => {
      button.textContent = 'Error';
      button.disabled = false;
      alert('Network error occurred');
    });
}

function rejectSessionRequest(button) {
  const courseId = button.getAttribute('data-course');
  const requestId = button.getAttribute('data-id');
  const commentInput = document.getElementById(`comment_${requestId}`);
  
  button.disabled = true;
  button.textContent = 'Rejecting...';
  
  const requestBody = { status: 'rejected' };
  if (commentInput && commentInput.value) requestBody.comment = commentInput.value;
  
  const token = localStorage.getItem('jwt');
  fetch(`https://tutorconnect-backend-0yki.onrender.com/api/courses/${courseId}/session-request/${requestId}/respond`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(requestBody)
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        button.textContent = 'Rejected';
        alert('Session request rejected.');
        setTimeout(() => loadSessionRequests(), 1200);
      } else {
        button.textContent = result.message || 'Error';
        button.disabled = false;
        alert(result.message || 'Error rejecting request');
      }
    })
    .catch(() => {
      button.textContent = 'Error';
      button.disabled = false;
      alert('Network error occurred');
    });
}

// Utility functions
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    alert('Link copied to clipboard!');
  }).catch(function() {
    alert('Failed to copy link. Please copy manually.');
  });
}

// Ensure markAssignmentDone function refreshes the view properly
function markAssignmentDone(checkbox) {
  const courseId = checkbox.getAttribute('data-course');
  const studentEmail = checkbox.getAttribute('data-student');
  const assignmentTitle = checkbox.getAttribute('data-assignment');
  const done = checkbox.checked;
  const token = localStorage.getItem('jwt');
  
  if (!courseId || !studentEmail || !assignmentTitle || !token) return;
  
  const originalColor = checkbox.parentNode.style.color;
  checkbox.parentNode.style.color = '#3498db';
  
  fetch(`https://tutorconnect-backend-0yki.onrender.com/api/courses/${courseId}/students/${studentEmail}/assignments`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ assignmentTitle, done })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        checkbox.parentNode.style.color = '#4caf50';
        const statusSpan = checkbox.parentNode.querySelector('span');
        if (statusSpan) {
          statusSpan.textContent = done ? 'Completed' : 'Pending';
          statusSpan.style.color = done ? '#27ae60' : '#f39c12';
        }
        const listItem = checkbox.closest('li');
        if (listItem) {
          listItem.style.background = done ? '#e8f5e8' : '#fff3cd';
          listItem.style.borderLeftColor = done ? '#27ae60' : '#f39c12';
        }
        // Refresh the enrolled students view to show updated status
        setTimeout(() => loadEnrolledStudents(), 1000);
      } else {
        checkbox.parentNode.style.color = 'red';
        checkbox.checked = !done; // Revert checkbox state
        alert(result.message || 'Error updating assignment status');
      }
    })
    .catch(err => {
      checkbox.parentNode.style.color = 'red';
      checkbox.checked = !done; // Revert checkbox state
      alert('Network error updating assignment status');
      console.error(err);
    });
}

      // Helper to generate Jitsi Meet link
      function generateJitsiLink(courseId, studentEmail) {
        const randomStr = Math.random().toString(36).substring(2, 8);
        const roomName = `TC_${courseId}_${studentEmail.replace(/[^a-zA-Z0-9]/g,'')}_${randomStr}`;
        return `https://meet.jit.si/${roomName}`;
      }
      function generateJitsiLink(courseId, studentEmail) {
        const randomStr = Math.random().toString(36).substring(2, 8);
        const roomName = `TC_${courseId}_${studentEmail.replace(/[^a-zA-Z0-9]/g,'')}_${randomStr}`;
        return `https://meet.jit.si/${roomName}`;
      }
// Mark assignment as done for a student (called when tutor checks/unchecks box)


// Set up the handler when DOM loads and also as a fallback
document.addEventListener('DOMContentLoaded', setupJitsiButtonHandler);
setTimeout(setupJitsiButtonHandler, 1000);

// Preserve the working functions for resource management
function submitResourceForm(event, courseId) {
  event.preventDefault();
  const token = localStorage.getItem('jwt');
  const form = event.target;
  
  // Collect video fields (pair by parent div)
  const videoFields = Array.from(form.querySelectorAll('.video-field'));
  const videos = videoFields.map(div => {
    const title = div.querySelector('input[name="videoTitle"]')?.value.trim();
    const link = div.querySelector('input[name="videoLink"]')?.value.trim();
    return title && link ? [title, link] : null;
  }).filter(Boolean);
  
  // Collect doc fields (pair by parent div)
  const docFields = Array.from(form.querySelectorAll('.doc-field'));
  const docs = docFields.map(div => {
    const title = div.querySelector('input[name="docTitle"]')?.value.trim();
    const link = div.querySelector('input[name="docLink"]')?.value.trim();
    return title && link ? [title, link] : null;
  }).filter(Boolean);
  
  // Collect assignment fields (pair by parent div)
  const assignmentFields = Array.from(form.querySelectorAll('.assignment-field'));
  const assignments = assignmentFields.map(div => {
    const title = div.querySelector('input[name="assignmentTitle"]')?.value.trim();
    const link = div.querySelector('input[name="assignmentLink"]')?.value.trim();
    return title && link ? [title, link] : null;
  }).filter(Boolean);
  
  // Collect quiz fields
  const quizFields = Array.from(form.querySelectorAll('.quiz-field'));
  const quizzes = quizFields.map(div => {
    const question = div.querySelector('input[name="quizQuestion"]')?.value.trim();
    const options = Array.from(div.querySelectorAll('input[name="quizOption"]')).map(opt => opt.value.trim()).filter(Boolean);
    const answer = div.querySelector('input[name="quizAnswer"]')?.value.trim();
    return question && options.length > 1 && answer ? { question, options, answer } : null;
  }).filter(Boolean);
  
  const resources = { video: videos, docs: docs, assignments: assignments, quizzes: quizzes };
  
  fetch(`https://tutorconnect-backend-0yki.onrender.com/api/tutor/courses/${courseId}/resources`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(resources)
  })
    .then(res => {
      if (res.status === 403) {
        document.getElementById(`resourceResult_${courseId}`).textContent = 'Not authorized. Please log in as a tutor.';
        return Promise.reject('Forbidden');
      }
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(result => {
      const resultDiv = document.getElementById(`resourceResult_${courseId}`);
      if (resultDiv) {
        resultDiv.textContent = result.success ? '✅ Resources updated successfully!' : (result.message || 'Error');
        resultDiv.style.color = result.success ? '#27ae60' : '#e74c3c';
      }
      if (result.success) {
        // Refresh the resources view
        setTimeout(() => loadEditResources(), 1000);
      }
    })
    .catch(err => {
      if (err !== 'Forbidden') {
        const resultDiv = document.getElementById(`resourceResult_${courseId}`);
        if (resultDiv) {
          resultDiv.textContent = '❌ Error updating resources.';
          resultDiv.style.color = '#e74c3c';
        }
      }
      console.error(err);
    });
  return false;
}

// Add a new video input field
function addVideoField(courseId) {
  const container = document.getElementById(`videoFields_${courseId}`);
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'video-field';
  div.style.display = 'flex';
  div.style.gap = '10px';
  div.style.marginBottom = '10px';
  div.innerHTML = `
    <input type="text" name="videoTitle" placeholder="Video Title" style="flex: 1;">
    <input type="text" name="videoLink" placeholder="YouTube Link" style="flex: 2;">
    <button type="button" onclick="this.parentNode.remove()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Remove</button>
  `;
  container.appendChild(div);
}

// Add a new quiz input field
function addQuizField(courseId) {
  const container = document.getElementById(`quizFields_${courseId}`);
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'quiz-field';
  div.style.background = '#f8f9fa';
  div.style.padding = '15px';
  div.style.borderRadius = '10px';
  div.style.marginBottom = '15px';
  div.innerHTML = `
    <input type="text" name="quizQuestion" placeholder="Quiz Question" style="width: 100%; margin-bottom: 10px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <input type="text" name="quizOption" placeholder="Option 1">
      <input type="text" name="quizOption" placeholder="Option 2">
      <input type="text" name="quizOption" placeholder="Option 3">
      <input type="text" name="quizOption" placeholder="Option 4">
    </div>
    <input type="text" name="quizAnswer" placeholder="Correct Answer" style="width: 100%; margin-bottom: 10px;">
    <button type="button" onclick="this.parentNode.remove()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 15px; cursor: pointer;">Remove Quiz</button>
  `;
  container.appendChild(div);
}

// Add a new doc input field
function addDocField(courseId) {
  const container = document.getElementById(`docFields_${courseId}`);
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'doc-field';
  div.style.display = 'flex';
  div.style.gap = '10px';
  div.style.marginBottom = '10px';
  div.innerHTML = `
    <input type="text" name="docTitle" placeholder="Document Title" style="flex: 1;">
    <input type="text" name="docLink" placeholder="Document Link" style="flex: 2;">
    <button type="button" onclick="this.parentNode.remove()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Remove</button>
  `;
  container.appendChild(div);
}

// Add a new assignment input field
function addAssignmentField(courseId) {
  const container = document.getElementById(`assignmentFields_${courseId}`);
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'assignment-field';
  div.style.display = 'flex';
  div.style.gap = '10px';
  div.style.marginBottom = '10px';
  div.innerHTML = `
    <input type="text" name="assignmentTitle" placeholder="Assignment Title" style="flex: 1;">
    <input type="text" name="assignmentLink" placeholder="Assignment Link" style="flex: 2;">
    <button type="button" onclick="this.parentNode.remove()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Remove</button>
  `;
  container.appendChild(div);
}

// Add handler for the standalone Jitsi Meet button in dashboard
function setupJitsiButtonHandler() {
  const jitsiBtn = document.getElementById('generateJitsiBtn');
  if (jitsiBtn) {
    jitsiBtn.onclick = function() {
      const randomStr = Math.random().toString(36).substring(2, 10);
      const roomName = `TC_${randomStr}`;
      const link = `https://meet.jit.si/${roomName}`;
      const linkContainer = document.getElementById('jitsiLinkContainer');
      if (linkContainer) {
        linkContainer.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
      }
      console.log('Jitsi Meet link:', link);
    };
  }
}
