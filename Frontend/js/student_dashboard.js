// New Student Dashboard with improved navigation structure
let currentCourse = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
});

function initializeDashboard() {
  // Main dashboard navigation
  setupMainNavigation();
  
  // Load user profile data
  loadUserProfile();
}

function setupMainNavigation() {
  // RAG Chatbot button
  document.getElementById('ragChatbotBtn').addEventListener('click', function() {
    const modal = document.getElementById('ragChatbotModal');
    const loading = document.getElementById('ragChatbotLoading');
    const iframe = document.getElementById('ragChatbotIframe');
    modal.style.display = 'flex';
    loading.style.display = 'flex';
    iframe.style.display = 'none';
    // Remove any previous error message
    if (document.getElementById('ragChatbotError')) {
      document.getElementById('ragChatbotError').remove();
    }
    // Listen for iframe load or error
    iframe.onload = function() {
      loading.style.display = 'none';
      iframe.style.display = 'block';
    };
    iframe.onerror = function() {
      loading.style.display = 'none';
      iframe.style.display = 'none';
      if (!document.getElementById('ragChatbotError')) {
        const errorMsg = document.createElement('div');
        errorMsg.id = 'ragChatbotError';
        errorMsg.style = 'color:#c00; text-align:center; padding:24px; font-weight:600;';
        errorMsg.textContent = 'Failed to load AI Chatbot. Please try again later.';
        loading.parentNode.appendChild(errorMsg);
      }
    };
    // Reload iframe src to trigger load each time
    iframe.src = 'https://tutorconnect-ragchatbot.onrender.com';
  });

  // Close RAG Chatbot modal
  document.getElementById('closeRagChatbotModal').addEventListener('click', function() {
    document.getElementById('ragChatbotModal').style.display = 'none';
    // Optionally reset iframe for next open
    const iframe = document.getElementById('ragChatbotIframe');
    iframe.src = '';
  });
  // Continue Learning button
  document.getElementById('continueLearningBtn').addEventListener('click', function() {
    showSection('continueLearningSection');
    loadEnrolledCourses();
  });

  // Browse Courses button
  document.getElementById('browseCoursesBtn').addEventListener('click', function() {
    showSection('browseCoursesSection');
    setupBrowseCourses();
  });

  // Edit Profile button
  document.getElementById('editProfileBtn').addEventListener('click', function() {
    showSection('editProfileSection');
    showEditProfileForm();
  });

  // Certificates button
  document.getElementById('certificatesBtn').addEventListener('click', function() {
    showSection('certificatesSection');
    loadCertificates();
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
  document.getElementById('backToMainBtn').addEventListener('click', function() {
    showSection('mainDashboard');
  });

  document.getElementById('backToCoursesBtn').addEventListener('click', function() {
    showSection('continueLearningSection');
  });

  document.getElementById('backToMainFromBrowseBtn').addEventListener('click', function() {
    showSection('mainDashboard');
  });

  document.getElementById('backToMainFromProfileBtn').addEventListener('click', function() {
    showSection('mainDashboard');
  });

  document.getElementById('backToMainFromCertificatesBtn').addEventListener('click', function() {
    showSection('mainDashboard');
  });
}

function setupCourseActionButtons() {
  document.getElementById('videoBtn').addEventListener('click', function() {
    showCourseContent('video');
  });

  document.getElementById('documentBtn').addEventListener('click', function() {
    showCourseContent('document');
  });

  document.getElementById('assignmentBtn').addEventListener('click', function() {
    showCourseContent('assignment');
  });

  document.getElementById('practiceBtn').addEventListener('click', function() {
    showCourseContent('practice');
  });

  document.getElementById('requestSessionBtn').addEventListener('click', function() {
    showCourseContent('session');
  });

  document.getElementById('courseDetailsBtn').addEventListener('click', function() {
    if (currentCourse) {
      window.location.href = `course_details.html?id=${currentCourse.id}`;
    }
  });
}

function showSection(sectionId) {
  // Hide all sections
  const sections = ['mainDashboard', 'continueLearningSection', 'courseViewSection', 'browseCoursesSection', 'editProfileSection', 'certificatesSection'];
  sections.forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  
  // Show the requested section
  document.getElementById(sectionId).style.display = 'block';
}

function loadEnrolledCourses() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    document.getElementById('enrolledCoursesList').innerHTML = '<p>Please log in to see your enrolled courses.</p>';
    return;
  }

  document.getElementById('enrolledCoursesList').innerHTML = 'Loading...';

  fetch('http://localhost:8080/api/courses/enrolled', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(courses => {
      if (!courses || courses.length === 0) {
        document.getElementById('enrolledCoursesList').innerHTML = '<p>You have not enrolled in any courses yet.</p>';
        return;
      }

      // Get student email from JWT
      let studentEmail = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        studentEmail = payload.sub || payload.email;
      } catch {}

      const coursesHtml = courses.map(course => {
        // Calculate progress
        let progress = 0, progressPercent = 0;
        let assignmentsDone = [];
        let assignmentCount = 0, completedAssignments = 0, assignmentPercent = 0;
        
        if (course.extra && course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
          const studentObj = course.extra.students.find(s => s.email === studentEmail);
          if (studentObj) {
            progress = studentObj.progress || 0;
            progressPercent = studentObj.progressPercent || 0;
            if (Array.isArray(studentObj.assignmentsDone)) {
              assignmentsDone = studentObj.assignmentsDone;
            }
          }
        }

        if (course.extra && course.extra.assignments && Array.isArray(course.extra.assignments)) {
          assignmentCount = course.extra.assignments.length;
          completedAssignments = course.extra.assignments.filter(([title]) => assignmentsDone.includes(title)).length;
          assignmentPercent = assignmentCount > 0 ? Math.round((completedAssignments / assignmentCount) * 100) : 0;
        }

        // Progress bar
        let progressBar = `
          <div style="margin:10px 0;">
            <label>Course Progress:</label>
            <div style="background:#eee;width:100%;height:20px;border-radius:10px;overflow:hidden;">
              <div style="background:#4caf50;width:${progressPercent}%;height:100%;transition:width 0.5s;"></div>
            </div>
            <span>${progressPercent}% (${progress} of ${course.extra && course.extra.video ? course.extra.video.length : 0} videos)</span>
          </div>
        `;

        // Assignment progress bar
        let assignmentProgressBar = '';
        if (assignmentCount > 0) {
          assignmentProgressBar = `
            <div style="margin:10px 0;">
              <label>Assignment Progress:</label>
              <div style="background:#eee;width:100%;height:16px;border-radius:8px;overflow:hidden;">
                <div style="background:#2196f3;width:${assignmentPercent}%;height:100%;transition:width 0.5s;"></div>
              </div>
              <span>${assignmentPercent}% (${completedAssignments} of ${assignmentCount} assignments done)</span>
            </div>
          `;
        }

        return `
          <div class="enrolled-course-item" onclick="selectCourse('${course.id}', '${course.title.replace(/'/g, "\\'")}')">
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <p><strong>Language:</strong> ${course.language}</p>
            <p><strong>Price:</strong> $${course.price}</p>
            ${progressBar}
            ${assignmentProgressBar}
          </div>
        `;
      }).join('');

      document.getElementById('enrolledCoursesList').innerHTML = coursesHtml;
    })
    .catch(() => {
      document.getElementById('enrolledCoursesList').innerHTML = '<p>Error loading enrolled courses.</p>';
    });
}

function selectCourse(courseId, courseTitle) {
  // Find the course data
  const token = localStorage.getItem('jwt');
  fetch('http://localhost:8080/api/courses/enrolled', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(courses => {
      currentCourse = courses.find(c => c.id === courseId);
      if (currentCourse) {
        document.getElementById('courseTitle').textContent = courseTitle;
        showSection('courseViewSection');
        // Setup course action buttons after showing the section
        setupCourseActionButtons();
      }
    });
}

function showCourseContent(contentType) {
  if (!currentCourse) return;

  const contentArea = document.getElementById('courseContentArea');
  
  switch(contentType) {
    case 'video':
      showVideos();
      break;
    case 'document':
      showDocuments();
      break;
    case 'assignment':
      showAssignments();
      break;
    case 'practice':
      showPractice();
      break;
    case 'session':
      showSessionRequests();
      break;
  }
}

function showVideos() {
  const contentArea = document.getElementById('courseContentArea');
  
  if (!currentCourse.extra || !currentCourse.extra.video || !Array.isArray(currentCourse.extra.video)) {
    contentArea.innerHTML = '<p>No videos available for this course.</p>';
    return;
  }

  const videosHtml = currentCourse.extra.video.map(([title, link], idx) => {
    let videoIdMatch = link.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    let videoId = videoIdMatch ? videoIdMatch[1] : null;
    let playerDiv = videoId ? `<div id="ytplayer-${currentCourse.id}-${idx}" class="ytplayer" style="margin-bottom:20px;"></div>` : '';
    let embedHtml = videoId ? playerDiv : `<a href="${link}" target="_blank">${link}</a>`;
    
    return `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
        <h4>${title}</h4>
        ${embedHtml}
      </div>
    `;
  }).join('');

  contentArea.innerHTML = `<h3>Course Videos</h3>${videosHtml}`;

  // Initialize YouTube players
  if (window.YT && window.YT.Player) {
    setTimeout(() => {
      currentCourse.extra.video.forEach(([title, link], idx) => {
        let videoIdMatch = link.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
        let videoId = videoIdMatch ? videoIdMatch[1] : null;
        let playerDivId = `ytplayer-${currentCourse.id}-${idx}`;
        
        if (videoId && document.getElementById(playerDivId)) {
          new YT.Player(playerDivId, {
            height: '270',
            width: '480',
            videoId: videoId,
            events: {
              'onStateChange': function(event) {
                if (event.data === YT.PlayerState.ENDED) {
                  updateVideoProgress();
                }
              }
            }
          });
        }
      });
    }, 100);
  }
}

function showDocuments() {
  const contentArea = document.getElementById('courseContentArea');
  
  if (!currentCourse.extra || !currentCourse.extra.docs || !Array.isArray(currentCourse.extra.docs)) {
    contentArea.innerHTML = '<p>No documents available for this course.</p>';
    return;
  }

  const docsHtml = currentCourse.extra.docs.map(([title, link]) => `
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span><strong>${title}</strong></span>
      <a href="${link}" target="_blank" style="background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Open Document</a>
    </div>
  `).join('');

  contentArea.innerHTML = `<h3>Course Documents</h3>${docsHtml}`;
}

function showAssignments() {
  const contentArea = document.getElementById('courseContentArea');
  
  if (!currentCourse.extra || !currentCourse.extra.assignments || !Array.isArray(currentCourse.extra.assignments)) {
    contentArea.innerHTML = '<p>No assignments available for this course.</p>';
    return;
  }

  // Get student progress
  const token = localStorage.getItem('jwt');
  let studentEmail = null;
  let assignmentsDone = [];
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    studentEmail = payload.sub || payload.email;
  } catch {}

  if (currentCourse.extra.students && Array.isArray(currentCourse.extra.students) && studentEmail) {
    const studentObj = currentCourse.extra.students.find(s => s.email === studentEmail);
    if (studentObj && Array.isArray(studentObj.assignmentsDone)) {
      assignmentsDone = studentObj.assignmentsDone;
    }
  }

  const assignmentsHtml = currentCourse.extra.assignments.map(([title, link]) => {
    const isDone = assignmentsDone.includes(title);
    return `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${title}</strong>
          <span style="color:${isDone ? '#4caf50' : '#888'};font-weight:bold; margin-left: 10px;">${isDone ? '✓ Completed' : 'Not completed'}</span>
        </div>
        <a href="${link}" target="_blank" style="background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Open Assignment</a>
      </div>
    `;
  }).join('');

  contentArea.innerHTML = `<h3>Course Assignments</h3>${assignmentsHtml}`;
}

function showPractice() {
  const contentArea = document.getElementById('courseContentArea');
  
  if (!currentCourse.extra || !currentCourse.extra.quizzes || !Array.isArray(currentCourse.extra.quizzes) || currentCourse.extra.quizzes.length === 0) {
    contentArea.innerHTML = '<p>No practice quizzes available for this course.</p>';
    return;
  }

  contentArea.innerHTML = `
    <h3>Practice Quiz</h3>
    <div style="text-align: center; padding: 40px;">
      <p>Test your knowledge with practice questions for this course.</p>
      <button onclick="startPracticeQuiz()" style="background: #28a745; color: white; border: none; border-radius: 6px; padding: 15px 30px; font-size: 16px; cursor: pointer;">Start Practice Quiz</button>
    </div>
  `;
}

function startPracticeQuiz() {
  // Save quiz questions to localStorage for quiz.html
  localStorage.setItem('practiceQuizData', JSON.stringify({
    courseId: currentCourse.id,
    questions: currentCourse.extra.quizzes
  }));
  window.location.href = 'quiz.html';
}

function showSessionRequests() {
  const contentArea = document.getElementById('courseContentArea');
  
  // Get student email and requests
  const token = localStorage.getItem('jwt');
  let studentEmail = null;
  let requests = [];
  let totalRequests = 0;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    studentEmail = payload.sub || payload.email;
  } catch {}

  if (currentCourse.extra && currentCourse.extra.students && Array.isArray(currentCourse.extra.students) && studentEmail) {
    const studentObj = currentCourse.extra.students.find(s => s.email === studentEmail);
    if (studentObj && Array.isArray(studentObj.requests)) {
      requests = studentObj.requests;
      totalRequests = requests.length;
    }
  }

  const requestsHtml = requests.length === 0 ? '<p><i>No session requests yet.</i></p>' : requests.map((r, index) => `
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: ${r.status === 'accepted' ? '#f0fff0' : r.status === 'rejected' ? '#fff0f0' : r.status === 'done' ? '#f0f8ff' : '#fffef0'}; ${r.isExtra ? 'border-left: 4px solid #ff9800;' : ''}">
      <b>${r.isExtra ? '🔶 EXTRA ' : ''}Request ${index + 1}:</b>
      ${r.isExtra ? '<br><span style="color: #ff9800; font-weight: bold; font-size: 12px;">⚠️ Extra request beyond 5-request limit</span>' : ''}
      <br><b>Status:</b> <span style="color: ${r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'done' ? 'blue' : 'orange'}; font-weight: bold;">${r.status.toUpperCase()}</span>
      ${r.status === 'accepted' ? `<br><b>Jitsi Link:</b> <a href='${r.jitsiLink}' target='_blank' style='color: #2196f3;'>${r.jitsiLink}</a>` : ''}
      ${r.scheduledTime ? `<br><b>Scheduled Time:</b> <span style='color: #333; font-weight: bold;'>${new Date(r.scheduledTime).toLocaleString()}</span>` : ''}
      ${r.comment ? `<br><b>Tutor Message:</b> <span style='color:#2196f3; font-style: italic;'>"${r.comment}"</span>` : ''}
      ${r.status === 'done' ? `<br><span style='color:green;font-weight:bold;'>✓ Session Completed</span>` : ''}
      ${r.requestedAt ? `<br><small style='color: #666;'>Requested: ${new Date(r.requestedAt).toLocaleString()}</small>` : ''}
    </div>
  `).join('');

  contentArea.innerHTML = `
    <h3>Session Requests</h3>
    <div style="margin-bottom: 20px;">
      <button id="newSessionRequestBtn" ${totalRequests >= 5 ? 'disabled' : ''} 
              style="background: ${totalRequests >= 5 ? '#ccc' : '#2196f3'}; color: white; padding: 12px 20px; border: none; border-radius: 6px; cursor: ${totalRequests >= 5 ? 'not-allowed' : 'pointer'}; margin-right: 10px;">
        Request Session (${totalRequests}/5)
      </button>
      ${totalRequests >= 5 ? `<button id="extraSessionRequestBtn" style="background: #ff9800; color: white; padding: 12px 20px; border: none; border-radius: 6px; cursor: pointer;">Extra Request</button>` : ''}
    </div>
    <div>
      <h4>Your Requests:</h4>
      ${requestsHtml}
    </div>
  `;

  // Add event listeners for request buttons
  setupSessionRequestButtons();
}

function setupSessionRequestButtons() {
  const newRequestBtn = document.getElementById('newSessionRequestBtn');
  const extraRequestBtn = document.getElementById('extraSessionRequestBtn');

  if (newRequestBtn && !newRequestBtn.disabled) {
    newRequestBtn.addEventListener('click', function() {
      makeSessionRequest(false);
    });
  }

  if (extraRequestBtn) {
    extraRequestBtn.addEventListener('click', function() {
      makeSessionRequest(true);
    });
  }
}

function makeSessionRequest(isExtra) {
  const token = localStorage.getItem('jwt');
  const endpoint = isExtra ? 'extra-session-request' : 'session-request';
  
  fetch(`http://localhost:8080/api/courses/${currentCourse.id}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        alert(isExtra ? 'Extra session request sent successfully!' : 'Session request sent successfully!');
        showSessionRequests(); // Refresh the display
      } else {
        alert(result.message || 'Error sending request');
      }
    })
    .catch((err) => {
      alert('Session request failed: ' + err);
    });
}

function updateVideoProgress() {
  const token = localStorage.getItem('jwt');
  fetch(`http://localhost:8080/api/courses/${currentCourse.id}/progress/video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log(`Progress updated: ${data.progressPercent}% (${data.progress} videos watched)`);
      } else {
        console.warn('Progress update failed:', data.message);
      }
    })
    .catch(err => {
      console.error('Progress update error:', err);
    });
}

function setupBrowseCourses() {
  const searchInput = document.getElementById('studentSearchBar');
  const resultsDiv = document.getElementById('studentSearchResults');

  if (searchInput && resultsDiv) {
    searchInput.addEventListener('input', function() {
      handleSearchInput(searchInput);
    });
  }
}

function handleSearchInput(inputElem) {
  const query = inputElem.value.trim();
  const resultsDiv = document.getElementById('studentSearchResults');
  
  if (query.length === 0) {
    resultsDiv.innerHTML = '';
    return;
  }

  const token = localStorage.getItem('jwt');
  let studentEmail = null;
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      studentEmail = payload.sub || payload.email;
    } catch {}
  }

  fetch(`http://localhost:8080/api/courses/search?query=${encodeURIComponent(query)}`)
    .then(res => {
      if (!res.ok) {
        resultsDiv.innerHTML = `<p>Error: ${res.status} ${res.statusText}</p>`;
        return [];
      }
      return res.json();
    })
    .then(courses => {
      if (!courses || courses.length === 0) {
        resultsDiv.innerHTML = '<p>No courses found.</p>';
        return;
      }

      resultsDiv.innerHTML = courses.map(course => {
        // Check if student is enrolled
        let enrolled = false;
        if (course.extra && course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
          enrolled = course.extra.students.some(s => s.email === studentEmail);
        }

        return `
          <div class="course-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <p><strong>Language:</strong> ${course.language}</p>
            <p><strong>Price:</strong> $${course.price}</p>
            <p><strong>Tutor:</strong> ${course.tutorName || 'N/A'}</p>
            ${enrolled ? 
              '<button disabled style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px;">Enrolled</button>' :
              `<button onclick="enrollInCourse('${course.id}')" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Enroll</button>`
            }
            <button onclick="window.location.href='course_details.html?id=${course.id}'" style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-left: 10px; cursor: pointer;">View Details</button>
          </div>
        `;
      }).join('');
    })
    .catch(error => {
      resultsDiv.innerHTML = '<p>Error searching courses.</p>';
      console.error('Search error:', error);
    });
}

function enrollInCourse(courseId) {
  const token = localStorage.getItem('jwt');
  fetch(`http://localhost:8080/api/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        alert('Enrollment successful!');
        // Refresh search results
        handleSearchInput(document.getElementById('studentSearchBar'));
      } else {
        alert(result.message || 'Enrollment failed');
      }
    })
    .catch(error => {
      alert('Enrollment failed: ' + error);
    });
}

function loadUserProfile() {
  // Load and display user information
  const token = localStorage.getItem('jwt');
  if (!token) return;

  fetch('http://localhost:8080/api/user/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (res.status === 401) {
        // Session expired, redirect to login
        window.location.href = 'login.html';
        return Promise.reject('Unauthorized');
      }
      return res.json();
    })
    .then(user => {
      if (user && user.username) {
        // Update welcome message with actual username
        const welcomeTitle = document.querySelector('.welcome-section h1');
        if (welcomeTitle) {
          welcomeTitle.textContent = `Welcome Back, ${user.username}! 🎓`;
        }
      }
    })
    .catch(error => {
      console.log('Could not load user profile:', error);
      // Keep default "Student" if there's an error
    });
}

function showEditProfileForm() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('You are not logged in. Please log in first.');
    window.location.href = 'login.html';
    return;
  }

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
        <form id="editProfileForm" style="max-width: 500px;">
          <div style="margin-bottom: 15px;">
            <label>Username:</label>
            <input type="text" name="username" placeholder="Username" value="${user.username || ''}" style="width: 100%; padding: 8px; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Email:</label>
            <input type="email" name="email" placeholder="Email" value="${user.email || ''}" style="width: 100%; padding: 8px; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Bio:</label>
            <textarea name="bio" placeholder="Bio" style="width: 100%; padding: 8px; margin-top: 5px; min-height: 80px;">${user.bio || ''}</textarea>
          </div>
          <div style="margin-bottom: 15px;">
            <label>Subjects (comma separated):</label>
            <input type="text" name="subjects" placeholder="Subjects" value="${Array.isArray(user.subjects) ? user.subjects.join(', ') : ''}" style="width: 100%; padding: 8px; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Languages (comma separated):</label>
            <input type="text" name="languages" placeholder="Languages" value="${Array.isArray(user.languages) ? user.languages.join(', ') : ''}" style="width: 100%; padding: 8px; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Availability:</label>
            <input type="text" name="availability" placeholder="Availability" value="${user.availability || ''}" style="width: 100%; padding: 8px; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>New Password (leave blank to keep current):</label>
            <input type="password" name="password" placeholder="New Password" style="width: 100%; padding: 8px; margin-top: 5px;">
          </div>
          <button type="submit" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Update Profile</button>
        </form>
        <div id="profileResult" style="margin-top:15px;"></div>
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
        
        if (form.password.value) {
          updates.password = form.password.value;
        }

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
          document.getElementById('profileResult').innerHTML = `<p style="color: green;">${result.success ? 'Profile updated successfully!' : (result.message || 'Error')}</p>`;
        } else {
          try {
            result = await res.json();
            document.getElementById('profileResult').innerHTML = `<p style="color: red;">${result.message || 'Error: ' + res.status}</p>`;
          } catch {
            document.getElementById('profileResult').innerHTML = `<p style="color: red;">Error: ${res.status}</p>`;
          }
        }
      };
    })
    .catch(err => {
      console.error(err);
    });
}

// Certificate functionality
async function loadCertificates() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Get enrolled courses
    const enrolledResponse = await fetch('http://localhost:8080/api/courses/enrolled', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (enrolledResponse.status === 401) {
      alert('Session expired. Please log in again.');
      window.location.href = 'login.html';
      return;
    }

    const enrolledCourses = await enrolledResponse.json();
    const certificatesList = document.getElementById('certificatesList');
    
    console.log('Enrolled courses:', enrolledCourses); // Debug log
    
    if (!enrolledCourses || enrolledCourses.length === 0) {
      certificatesList.innerHTML = '<div class="no-data">No enrolled courses found.</div>';
      return;
    }

    // Check each course for certificate eligibility
    const eligibleCourses = [];
    
    // Get student email from JWT
    let studentEmail = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      studentEmail = payload.sub || payload.email;
    } catch (e) {
      console.error('Error parsing JWT:', e);
    }
    
    for (const course of enrolledCourses) {
      const isEligible = checkCertificateEligibility(course, studentEmail);
      console.log(`Course ${course.title}: eligible = ${isEligible}`, course); // Debug log
      if (isEligible) {
        eligibleCourses.push(course);
      }
    }

    console.log('Eligible courses:', eligibleCourses); // Debug log
    displayCertificates(eligibleCourses);
    
  } catch (error) {
    console.error('Error loading certificates:', error);
    document.getElementById('certificatesList').innerHTML = '<div class="error">Error loading certificates. Please try again.</div>';
  }
}

function checkCertificateEligibility(course, studentEmail) {
  if (!course.extra || !studentEmail) {
    return false;
  }

  // Get student's progress data
  let progressPercent = 0;
  let assignmentsDone = [];
  
  if (course.extra.students && Array.isArray(course.extra.students)) {
    const studentObj = course.extra.students.find(s => s.email === studentEmail);
    if (studentObj) {
      progressPercent = studentObj.progressPercent || 0;
      if (Array.isArray(studentObj.assignmentsDone)) {
        assignmentsDone = studentObj.assignmentsDone;
      }
    }
  }

  // Check if all videos are watched (100% progress)
  const allVideosWatched = progressPercent >= 100;
  
  // Check if all assignments are completed
  let allAssignmentsCompleted = true;
  if (course.extra.assignments && Array.isArray(course.extra.assignments)) {
    const totalAssignments = course.extra.assignments.length;
    const completedAssignments = course.extra.assignments.filter(([title]) => assignmentsDone.includes(title)).length;
    allAssignmentsCompleted = totalAssignments === 0 || completedAssignments === totalAssignments;
  }

  return allVideosWatched && allAssignmentsCompleted;
}

function displayCertificates(eligibleCourses) {
  const certificatesList = document.getElementById('certificatesList');
  
  if (eligibleCourses.length === 0) {
    certificatesList.innerHTML = `
      <div class="no-certificates">
        <div class="icon">📜</div>
        <h3>No certificates available yet</h3>
        <p>Complete all videos and assignments in a course to earn your certificate!</p>
      </div>
    `;
    return;
  }

  const certificatesHTML = eligibleCourses.map((course, index) => `
    <div class="certificate-card">
      <div class="certificate-header">
        <div class="certificate-icon">🏆</div>
        <h3>${course.title}</h3>
      </div>
      <div class="certificate-details">
        <p><strong>Instructor:</strong> ${course.tutorName || 'N/A'}</p>
        <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p class="certificate-status">✅ Course Completed</p>
      </div>
      <div class="certificate-actions">
        <button class="certificate-btn view-btn" data-course-id="${course.id}" data-course-title="${course.title}" data-tutor-name="${course.tutorName || 'N/A'}" data-action="view">
          👁️ View Certificate
        </button>
        <button class="certificate-btn download-btn" data-course-id="${course.id}" data-course-title="${course.title}" data-tutor-name="${course.tutorName || 'N/A'}" data-action="download">
          📥 Download PDF
        </button>
      </div>
    </div>
  `).join('');

  certificatesList.innerHTML = certificatesHTML;
  
  // Add event listeners to all certificate buttons
  document.querySelectorAll('.certificate-btn').forEach(button => {
    button.addEventListener('click', function() {
      const courseId = this.getAttribute('data-course-id');
      const courseTitle = this.getAttribute('data-course-title');
      const tutorName = this.getAttribute('data-tutor-name');
      const action = this.getAttribute('data-action');
      
      if (action === 'view') {
        viewCertificate(courseId, courseTitle, tutorName);
      } else if (action === 'download') {
        downloadCertificate(courseId, courseTitle, tutorName);
      }
    });
  });
}

async function viewCertificate(courseId, courseTitle, tutorName) {
  const token = localStorage.getItem('jwt');
  
  try {
    // Get user profile for certificate
    const userResponse = await fetch('http://localhost:8080/api/user/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const user = await userResponse.json();
    
      // Create modal for certificate preview
      const modal = document.createElement('div');
      modal.className = 'certificate-modal';
      modal.innerHTML = `
        <div class="certificate-modal-content">
          <span class="certificate-close">&times;</span>
          <div class="certificate-preview">
            ${generateCertificateHTML(user.username || 'Student', courseTitle, tutorName)}
          </div>
          <div class="certificate-modal-actions">
            <button class="certificate-btn download-btn modal-download-btn">
              📥 Download PDF
            </button>
            <button class="certificate-btn cancel-btn modal-close-btn">
              ❌ Close
            </button>
          </div>
        </div>
      `;    document.body.appendChild(modal);
    
    // Add event listeners for modal buttons
    modal.querySelector('.certificate-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.modal-download-btn').addEventListener('click', () => {
      downloadCertificate(courseId, courseTitle, tutorName);
      document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
  } catch (error) {
    console.error('Error viewing certificate:', error);
    alert('Error viewing certificate: ' + error.message + '. Please try again.');
  }
}

function downloadCertificate(courseId, courseTitle, tutorName) {
  const token = localStorage.getItem('jwt');
  
  if (!token) {
    alert('Please log in to download certificate');
    return;
  }
  
  fetch('http://localhost:8080/api/user/me', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  })
  .then(user => {
    if (!user.username) {
      throw new Error('User profile incomplete - missing username');
    }
    
    const studentName = user.username;
    const certificateHTML = generateCertificateHTML(studentName, courseTitle, tutorName);
    
    // Create a blob with the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${courseTitle}</title>
        <style>
          ${getCertificateStyles()}
        </style>
      </head>
      <body>
        ${certificateHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;
    
    // Try to open print window
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Alternative: Create downloadable file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (printError) {
      console.error('Print window error:', printError);
      
      // Fallback: Direct download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Certificate downloaded as HTML file. Open it in your browser and print to PDF.');
    }
  })
  .catch(error => {
    console.error('Error downloading certificate:', error);
    alert('Error downloading certificate: ' + error.message + '. Please try again.');
  });
}

function generateCertificateHTML(studentName, courseTitle, tutorName) {
  const completionDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <div class="certificate">
      <div class="certificate-border">
        <div class="certificate-content">
          <div class="certificate-header">
            <h1>🏆 CERTIFICATE OF COMPLETION</h1>
            <div class="certificate-logo">TutorConnect</div>
          </div>
          
          <div class="certificate-body">
            <p class="certificate-text">This is to certify that</p>
            <h2 class="student-name">${studentName}</h2>
            <p class="certificate-text">has successfully completed the course</p>
            <h3 class="course-title">"${courseTitle}"</h3>
            <p class="certificate-text">under the guidance of</p>
            <p class="tutor-name">Instructor: ${tutorName}</p>
            <p class="completion-date">Completed on: ${completionDate}</p>
          </div>
          
          <div class="certificate-footer">
            <div class="signature-section">
              <div class="signature">
                <div class="signature-line"></div>
                <p>TutorConnect Platform</p>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <p>Course Instructor</p>
              </div>
            </div>
            <div class="certificate-seal">🎓</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getCertificateStyles() {
  return `
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Times New Roman', serif;
      background: white;
    }
    
    .certificate {
      width: 800px;
      margin: 0 auto;
      background: white;
      border: 3px solid #2c3e50;
    }
    
    .certificate-border {
      border: 2px solid #3498db;
      margin: 10px;
      padding: 30px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    }
    
    .certificate-content {
      text-align: center;
      position: relative;
    }
    
    .certificate-header h1 {
      font-size: 36px;
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }
    
    .certificate-logo {
      font-size: 24px;
      color: #3498db;
      font-weight: bold;
      margin-bottom: 30px;
    }
    
    .certificate-body {
      margin: 40px 0;
    }
    
    .certificate-text {
      font-size: 18px;
      color: #555;
      margin: 10px 0;
    }
    
    .student-name {
      font-size: 42px;
      color: #2c3e50;
      margin: 20px 0;
      font-weight: bold;
      text-decoration: underline;
      text-decoration-color: #3498db;
    }
    
    .course-title {
      font-size: 28px;
      color: #3498db;
      margin: 20px 0;
      font-style: italic;
    }
    
    .tutor-name {
      font-size: 20px;
      color: #555;
      margin: 15px 0;
    }
    
    .completion-date {
      font-size: 18px;
      color: #666;
      margin: 20px 0;
    }
    
    .certificate-footer {
      margin-top: 50px;
      position: relative;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    
    .signature {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-bottom: 2px solid #2c3e50;
      margin-bottom: 5px;
      height: 40px;
    }
    
    .signature p {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    
    .certificate-seal {
      position: absolute;
      right: 20px;
      top: -20px;
      font-size: 48px;
      opacity: 0.7;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .certificate { margin: 0; page-break-inside: avoid; }
    }
  `;
}
