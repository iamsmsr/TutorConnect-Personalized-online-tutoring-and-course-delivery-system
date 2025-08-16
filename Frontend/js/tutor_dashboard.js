      // Helper to generate Jitsi Meet link
      function generateJitsiLink(courseId, studentEmail) {
        const randomStr = Math.random().toString(36).substring(2, 8);
        const roomName = `TC_${courseId}_${studentEmail.replace(/[^a-zA-Z0-9]/g,'')}_${randomStr}`;
        return `https://meet.jit.si/${roomName}`;
      }
// Mark assignment as done for a student (called when tutor checks/unchecks box)
function markAssignmentDone(checkbox) {
  const courseId = checkbox.getAttribute('data-course');
  const studentEmail = checkbox.getAttribute('data-student');
  const assignmentTitle = checkbox.getAttribute('data-assignment');
  const done = checkbox.checked;
  const token = localStorage.getItem('jwt');
  if (!courseId || !studentEmail || !assignmentTitle || !token) return;
  fetch(`http://localhost:8080/api/courses/${courseId}/students/${studentEmail}/assignments`, {
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
        // Optionally refresh UI or show progress
      } else {
        checkbox.parentNode.style.color = 'red';
        alert(result.message || 'Error updating assignment status');
      }
    })
    .catch(err => {
      checkbox.parentNode.style.color = 'red';
      alert('Network error updating assignment status');
      console.error(err);
    });
}
// Add a new video input field
function addVideoField(courseId) {
  const container = document.getElementById(`videoFields_${courseId}`);
  const div = document.createElement('div');
  div.className = 'video-field';
  div.innerHTML = `<input type="text" name="videoTitle" placeholder="Video Title"> <input type="text" name="videoLink" placeholder="YouTube Link">`;
  container.appendChild(div);
}

// Add a new quiz input field
function addQuizField(courseId) {
  const container = document.getElementById(`quizFields_${courseId}`);
  const div = document.createElement('div');
  div.className = 'quiz-field';
  div.innerHTML = `
    <input type="text" name="quizQuestion" placeholder="Quiz Question"> <br>
    <input type="text" name="quizOption" placeholder="Option 1"> 
    <input type="text" name="quizOption" placeholder="Option 2"> 
    <input type="text" name="quizOption" placeholder="Option 3"> 
    <input type="text" name="quizOption" placeholder="Option 4"> <br>
    <input type="text" name="quizAnswer" placeholder="Correct Answer"> <br>
    <button type="button" onclick="this.parentNode.remove()">Remove Quiz</button>
    <hr>
  `;
  container.appendChild(div);
}

// Add a new doc input field
function addDocField(courseId) {
  const container = document.getElementById(`docFields_${courseId}`);
  const div = document.createElement('div');
  div.className = 'doc-field';
  div.innerHTML = `<input type="text" name="docTitle" placeholder="Doc Title"> <input type="text" name="docLink" placeholder="Doc Link">`;
  container.appendChild(div);
}

// Add a new assignment input field
function addAssignmentField(courseId) {
  const container = document.getElementById(`assignmentFields_${courseId}`);
  const div = document.createElement('div');
  div.className = 'assignment-field';
  div.innerHTML = `<input type="text" name="assignmentTitle" placeholder="Assignment Title"> <input type="text" name="assignmentLink" placeholder="Assignment Link">`;
  container.appendChild(div);
}


// Handle resource form submission for a course
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
  // Only one resources declaration
  const resources = { video: videos, docs: docs, assignments: assignments, quizzes: quizzes };
  fetch(`http://localhost:8080/api/tutor/courses/${courseId}/resources`, {
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
      document.getElementById(`resourceResult_${courseId}`).textContent = result.success ? 'Resources updated!' : (result.message || 'Error');
      if (result.success) showAssignedCourses(); // Refresh courses
    })
    .catch(err => {
      if (err !== 'Forbidden') {
        document.getElementById(`resourceResult_${courseId}`).textContent = 'Error updating resources.';
      }
      console.error(err);
    });
  return false;
}
// Fetch and display assigned courses for the logged-in tutor
function showAssignedCourses() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('You are not logged in. Please log in first.');
    window.location.href = 'login.html';
    return;
  }
  fetch('http://localhost:8080/api/tutor/courses', {
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
      let html = '<h3>My Assigned Courses</h3>';
      if (courses.length === 0) {
        html += '<p>No courses assigned yet.</p>';
      } else {
        html += '<ul>';
        courses.forEach(course => {
          // For each enrolled student, print Jitsi link in console
          html += `<li><strong>${course.title}</strong> - ${course.description}<br>`;
          // Show enrolled students and assignment marking UI
          if (course.extra && Array.isArray(course.extra.students) && course.extra.students.length > 0) {
            html += '<b>Enrolled Students:</b><ul>';
            course.extra.students.forEach(student => {
              html += `<li>${student.name || student.email}`;
              // Show assignments for this student
              if (course.extra.assignments && Array.isArray(course.extra.assignments)) {
                html += '<ul>';
                course.extra.assignments.forEach(([title, link], idx) => {
                  // Check if assignment is done for this student
                  const doneAssignments = Array.isArray(student.assignmentsDone) ? student.assignmentsDone : [];
                  const isDone = doneAssignments.includes(title);
                  html += `<li>
                    ${title}: <a href="${link}" target="_blank">${link}</a>
                    <label style="margin-left:10px;"><input type="checkbox" data-course="${course.id}" data-student="${student.email}" data-assignment="${title}" ${isDone ? 'checked' : ''} onchange="markAssignmentDone(this)"> Done</label>
                  </li>`;
                });
                html += '</ul>';
              }
              html += '</li>';
            });
            html += '</ul>';
          } else {
            html += '<i>No students enrolled yet.</i>';
          }
          // Session Requests Management UI
          let sessionRequestsHtml = '';
          sessionRequestsHtml += `<div style="margin:10px 0;">
            <b>Session Requests:</b>
            <div id="sessionRequests_${course.id}">Loading...</div>
          </div>`;
          html += sessionRequestsHtml;
          html += '<hr>';
        });
        html += '</ul>';
      }
      // Add resource edit form for each course
      courses.forEach(course => {
        // Prepare initial video/doc fields
        let videoFields = '';
        if (course.extra && course.extra.video) {
          course.extra.video.forEach(([title, link], idx) => {
            videoFields += `<div class="video-field"><input type="text" name="videoTitle" placeholder="Video Title" value="${title}"> <input type="text" name="videoLink" placeholder="YouTube Link" value="${link}"></div>`;
          });
        }
        let docFields = '';
        if (course.extra && course.extra.docs) {
          course.extra.docs.forEach(([title, link], idx) => {
            docFields += `<div class="doc-field"><input type="text" name="docTitle" placeholder="Doc Title" value="${title}"> <input type="text" name="docLink" placeholder="Doc Link" value="${link}"></div>`;
          });
        }
        let assignmentFields = '';
        if (course.extra && course.extra.assignments) {
          course.extra.assignments.forEach(([title, link], idx) => {
            assignmentFields += `<div class="assignment-field"><input type="text" name="assignmentTitle" placeholder="Assignment Title" value="${title}"> <input type="text" name="assignmentLink" placeholder="Assignment Link" value="${link}"></div>`;
          });
        }
        let quizFields = '';
        if (course.extra && course.extra.quizzes) {
          course.extra.quizzes.forEach((quiz, idx) => {
            quizFields += `<div class="quiz-field">
              <input type="text" name="quizQuestion" value="${quiz.question || ''}" placeholder="Quiz Question"><br>
              <input type="text" name="quizOption" value="${quiz.options?.[0] || ''}" placeholder="Option 1">
              <input type="text" name="quizOption" value="${quiz.options?.[1] || ''}" placeholder="Option 2">
              <input type="text" name="quizOption" value="${quiz.options?.[2] || ''}" placeholder="Option 3">
              <input type="text" name="quizOption" value="${quiz.options?.[3] || ''}" placeholder="Option 4"><br>
              <input type="text" name="quizAnswer" value="${quiz.answer || ''}" placeholder="Correct Answer"><br>
              <button type="button" onclick="this.parentNode.remove()">Remove Quiz</button>
              <hr>
            </div>`;
          });
        }
        html += `<div style="margin-bottom:20px;">
          <form onsubmit="return submitResourceForm(event, '${course.id}')" id="resourceForm_${course.id}">
            <h4>Edit/Add Resources for ${course.title}</h4>
            <label>Videos:</label><br>
            <div id="videoFields_${course.id}">${videoFields}</div>
            <button type="button" onclick="addVideoField('${course.id}')">Add Video</button><br><br>
            <label>Docs:</label><br>
            <div id="docFields_${course.id}">${docFields}</div>
            <button type="button" onclick="addDocField('${course.id}')">Add Doc</button><br><br>
            <label>Assignments:</label><br>
            <div id="assignmentFields_${course.id}">${assignmentFields}</div>
            <button type="button" onclick="addAssignmentField('${course.id}')">Add Assignment</button><br><br>
          <label>Quizzes:</label><br>
          <div id="quizFields_${course.id}">${quizFields}</div>
          <button type="button" onclick="addQuizField('${course.id}')">Add Quiz</button><br><br>
            <button type="submit">Save Resources</button>
          </form>
          <div id="resourceResult_${course.id}"></div>
        </div>`;
      });
      document.getElementById('assignedCoursesContainer').innerHTML = html;
      
      // Fetch and render session requests for each course
      courses.forEach(course => {
        fetch(`http://localhost:8080/api/courses/${course.id}/tutor-requests`, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(res => res.json())
          .then(data => {
            if (!data.success) return;
            const requests = data.requests || [];
            const container = document.getElementById(`sessionRequests_${course.id}`);
            if (!container) return;
            if (requests.length === 0) {
              container.innerHTML = '<i>No session requests yet.</i>';
              return;
            }
            container.innerHTML = `<div>${requests.map((r, index) => `
              <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; background: ${r.status === 'accepted' ? '#f0fff0' : r.status === 'rejected' ? '#fff0f0' : r.status === 'done' ? '#f0f8ff' : '#fffef0'}; ${r.isExtra ? 'border-left: 4px solid #ff9800;' : ''}">
                <b>${r.isExtra ? '🔶 EXTRA ' : ''}Request ${index + 1} from ${r.studentEmail}:</b>
                ${r.isExtra ? '<br><span style="color: #ff9800; font-weight: bold; font-size: 12px;">⚠️ This is an extra request beyond the 5-request limit</span>' : ''}
                <br><b>Status:</b> <span style="color: ${r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'done' ? 'blue' : 'orange'}; font-weight: bold;">${r.status.toUpperCase()}</span>
                ${r.status === 'pending' ? `<br><br>
                  <label><b>Schedule Date & Time:</b></label><br>
                  <input type='datetime-local' id='schedule_${r.id}' style='margin:5px 0; padding:5px; border-radius:3px; border:1px solid #ccc;'><br>
                  <label><b>Message for Student (Optional):</b></label><br>
                  <textarea id='comment_${r.id}' placeholder='${r.isExtra ? 'Consider explaining why you are accepting/rejecting this extra request...' : 'Optional message for student...'}' style='width:100%; max-width:400px; height:60px; margin:5px 0; padding:5px; border-radius:3px; border:1px solid #ccc;'></textarea><br>
                  <button class='acceptSessionBtn' data-course='${course.id}' data-id='${r.id}' data-student='${r.studentEmail}' style='background:#4CAF50; color:white; padding:8px 15px; border:none; border-radius:3px; margin-right:10px; cursor:pointer;'>✓ Accept & Send Jitsi</button>
                  <button class='rejectSessionBtn' data-course='${course.id}' data-id='${r.id}' style='background:#f44336; color:white; padding:8px 15px; border:none; border-radius:3px; cursor:pointer;'>✗ Reject</button>
                ` : ''}
                ${r.status === 'accepted' ? `<br><b>Jitsi Link:</b> <a href='${r.jitsiLink}' target='_blank' style='color: #2196f3;'>${r.jitsiLink}</a>` : ''}
                ${r.scheduledTime ? `<br><b>Scheduled Time:</b> <span style='color: #333; font-weight: bold;'>${new Date(r.scheduledTime).toLocaleString()}</span>` : ''}
                ${r.comment ? `<br><b>Your Message:</b> <span style='color:#2196f3; font-style: italic;'>"${r.comment}"</span>` : ''}
                ${r.status === 'done' ? `<br><span style='color:green;font-weight:bold;'>✓ Session Completed</span>` : ''}
                ${r.requestedAt ? `<br><small style='color: #666;'>Requested: ${new Date(r.requestedAt).toLocaleString()}</small>` : ''}
              </div>
            `).join('')}</div>`;
            
            // Accept button handler
            container.querySelectorAll('.acceptSessionBtn').forEach(btn => {
              btn.addEventListener('click', function() {
                const courseId = btn.getAttribute('data-course');
                const requestId = btn.getAttribute('data-id');
                const studentEmail = btn.getAttribute('data-student');
                const scheduleInput = document.getElementById(`schedule_${requestId}`);
                const commentInput = document.getElementById(`comment_${requestId}`);
                const scheduledTime = scheduleInput ? scheduleInput.value : null;
                const comment = commentInput ? commentInput.value.trim() : '';
                
                if (!scheduledTime) {
                  alert('Please select a date and time for the session.');
                  return;
                }
                const jitsiLink = generateJitsiLink(courseId, studentEmail);
                btn.disabled = true;
                btn.textContent = 'Sending...';
                
                const requestBody = { 
                  status: 'accepted', 
                  jitsiLink, 
                  scheduledTime: new Date(scheduledTime).toISOString() 
                };
                if (comment) requestBody.comment = comment;
                
                fetch(`http://localhost:8080/api/courses/${courseId}/session-request/${requestId}/respond`, {
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
                      btn.textContent = 'Accepted';
                    } else {
                      btn.textContent = result.message || 'Error';
                      btn.disabled = false;
                    }
                    setTimeout(() => showAssignedCourses(), 1200);
                  })
                  .catch(() => {
                    btn.textContent = 'Error';
                    btn.disabled = false;
                  });
              });
            });
            
            // Reject button handler
            container.querySelectorAll('.rejectSessionBtn').forEach(btn => {
              btn.addEventListener('click', function() {
                const courseId = btn.getAttribute('data-course');
                const requestId = btn.getAttribute('data-id');
                const commentInput = document.getElementById(`comment_${requestId}`);
                const comment = commentInput ? commentInput.value.trim() : '';
                
                btn.disabled = true;
                btn.textContent = 'Rejecting...';
                
                const requestBody = { status: 'rejected' };
                if (comment) requestBody.comment = comment;
                
                fetch(`http://localhost:8080/api/courses/${courseId}/session-request/${requestId}/respond`, {
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
                      btn.textContent = 'Rejected';
                    } else {
                      btn.textContent = result.message || 'Error';
                      btn.disabled = false;
                    }
                    setTimeout(() => showAssignedCourses(), 1200);
                  })
                  .catch(() => {
                    btn.textContent = 'Error';
                    btn.disabled = false;
                  });
              });
            });
          })
          .catch((err) => {
            const container = document.getElementById(`sessionRequests_${course.id}`);
            if (container) container.innerHTML = `<span style='color:red;'>Error loading session requests: ${err}</span>`;
          });
      });
    })
    .catch(err => {
      console.error(err);
    });
}

// Add a new video input field
function addVideoField(courseId) {
  const container = document.getElementById(`videoFields_${courseId}`);
  const div = document.createElement('div');
  div.className = 'video-field';
  div.innerHTML = `<input type="text" name="videoTitle" placeholder="Video Title"> <input type="text" name="videoLink" placeholder="YouTube Link">`;
  container.appendChild(div);
}

// Add a new doc input field
function addDocField(courseId) {
  const container = document.getElementById(`docFields_${courseId}`);
  const div = document.createElement('div');
  div.className = 'doc-field';
  div.innerHTML = `<input type="text" name="docTitle" placeholder="Doc Title"> <input type="text" name="docLink" placeholder="Doc Link">`;
  container.appendChild(div);
}

// Tutor Dashboard Profile Edit UI
function showEditProfileForm() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('You are not logged in. Please log in first.');
    window.location.href = 'login.html';
    return;
  }
  // Debug: log token value
  console.log('JWT token being sent:', token);
  fetch('http://localhost:8080/api/user/me', {
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
      const html = `
        <form id="editProfileForm">
          <h3>Edit Profile</h3>
          <input type="text" name="username" placeholder="Username" value="${user.username || ''}"><br>
          <input type="email" name="email" placeholder="Email" value="${user.email || ''}"><br>
          <textarea name="bio" placeholder="Bio">${user.bio || ''}</textarea><br>
          <input type="text" name="subjects" placeholder="Subjects (comma separated)" value="${Array.isArray(user.subjects) ? user.subjects.join(', ') : ''}"><br>
          <input type="text" name="languages" placeholder="Languages (comma separated)" value="${Array.isArray(user.languages) ? user.languages.join(', ') : ''}"><br>
          <input type="text" name="availability" placeholder="Availability" value="${user.availability || ''}"><br>
          <input type="password" name="password" placeholder="New Password (leave blank to keep current)"><br>
          <button type="submit">Update</button>
        </form>
        <div id="profileResult" style="margin-top:10px;"></div>
      `;
      document.getElementById('profileEditContainer').innerHTML = html;
      document.getElementById('editProfileForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const updates = {
          username: form.username.value,
          email: form.email.value,
          bio: form.bio.value,
          subjects: form.subjects.value.split(',').map(s => s.trim()),
          languages: form.languages.value.split(',').map(l => l.trim()),
          availability: form.availability.value
        };
        if (form.password.value) updates.password = form.password.value;
        const res = await fetch('http://localhost:8080/api/user/update-profile', {
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
          document.getElementById('profileResult').textContent = result.success ? 'Profile updated!' : (result.message || 'Error');
        } else {
          try {
            result = await res.json();
            document.getElementById('profileResult').textContent = result.message || 'Error: ' + res.status;
          } catch {
            document.getElementById('profileResult').textContent = 'Error: ' + res.status;
          }
        }
      };
    })
    .catch(err => {
      // Optionally handle other errors
      console.error(err);
    });
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

// Set up the handler when DOM loads and also as a fallback
document.addEventListener('DOMContentLoaded', setupJitsiButtonHandler);
setTimeout(setupJitsiButtonHandler, 1000);
