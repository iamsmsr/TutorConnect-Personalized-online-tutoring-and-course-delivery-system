// API_BASE is provided by js/config.js
// Course Management UI
function showCourseManagement() {
  document.getElementById('courseForms').style.display = 'block';
  document.getElementById('courseResult').textContent = '';
  const html = `
    <div style="margin-bottom:20px;">
      <form id="searchCourseForm" style="display:inline-block;">
        <input type="text" name="query" placeholder="Search by title, subject, or tutorId" required>
        <button type="submit">Search</button>
      </form>
      <button id="showAllCoursesBtn" style="margin-left:10px;">Show All Courses</button>
      <button id="showCreateCourseBtn" style="margin-left:10px;">Create Course</button>
    </div>
    <div id="courseList"></div>
    <div id="editCourseContainer"></div>
    <div id="createCourseContainer"></div>
  `;
  document.getElementById('courseForms').innerHTML = html;

  // Real-time search
  const searchInput = document.querySelector('#searchCourseForm input[name="query"]');
  let debounceTimeout;
  searchInput.addEventListener('input', function(e) {
    clearTimeout(debounceTimeout);
    const query = e.target.value;
    debounceTimeout = setTimeout(() => {
      if (query.trim().length > 0) {
        fetchAndDisplayCourses('search', query);
      } else {
        document.getElementById('courseList').innerHTML = '';
      }
    }, 300);
  });
  document.getElementById('showAllCoursesBtn').onclick = async function() {
    await fetchAndDisplayCourses('all');
  };
  document.getElementById('showCreateCourseBtn').onclick = function() {
    showCreateCourseForm();
  };
}

async function fetchAndDisplayCourses(type, query) {
  const token = localStorage.getItem('jwt');
  let url = '';
  if(type === 'all') url = `${API_BASE}/api/admin/courses`;
  else url = `${API_BASE}/api/admin/search-course?query=` + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  let courses = [];
  if(res.ok) courses = await res.json();
  const listDiv = document.getElementById('courseList');
  if(courses.length === 0) {
    listDiv.innerHTML = '<p>No courses found.</p>';
    return;
  }
  let html = '<table border="1" style="width:100%;text-align:left;"><tr>' +
    '<th>Title</th><th>Description</th><th>Tutor ID</th><th>Subjects</th><th>Language</th><th>Price</th><th>Duration</th><th>Enrolled</th><th>Extra</th><th>Edit</th></tr>';
  courses.forEach(c => {
    html += `<tr>
      <td>${c.title}</td>
      <td>${c.description}</td>
      <td>${c.tutorId}</td>
      <td>${Array.isArray(c.subjects) ? c.subjects.join(', ') : ''}</td>
      <td>${c.language}</td>
      <td>${c.price}</td>
      <td>${c.duration}</td>
      <td>${c.studentsEnrolled}</td>
      <td>${Array.isArray(c.extra) ? c.extra.join(', ') : ''}</td>
      <td><button onclick="editCourse('${c.id}', '${encodeURIComponent(JSON.stringify(c))}')">Edit</button></td>
    </tr>`;
  });
  html += '</table>';
  listDiv.innerHTML = html;
}

window.editCourse = function(id, encodedCourse) {
  const c = JSON.parse(decodeURIComponent(encodedCourse));
  const formHtml = `
    <form id="editCourseForm">
      <h3>Edit Course</h3>
      <input type="hidden" name="id" value="${c.id}">
      <input type="text" name="title" placeholder="Title" value="${c.title}"><br>
      <textarea name="description" placeholder="Description">${c.description || ''}</textarea><br>
      <input type="text" name="tutorId" placeholder="Tutor ID" value="${c.tutorId}"><br>
      <input type="text" name="subjects" placeholder="Subjects (comma separated)" value="${Array.isArray(c.subjects) ? c.subjects.join(', ') : ''}"><br>
      <input type="text" name="language" placeholder="Language" value="${c.language}"><br>
      <input type="number" name="price" placeholder="Price" value="${c.price}"><br>
      <input type="text" name="duration" placeholder="Duration" value="${c.duration}"><br>
      <input type="number" name="studentsEnrolled" placeholder="Students Enrolled" value="${c.studentsEnrolled}"><br>
      <input type="text" name="extra" placeholder="Extra (comma separated)" value="${Array.isArray(c.extra) ? c.extra.join(', ') : ''}"><br>
      <button type="submit">Update</button>
    </form>
  `;
  document.getElementById('editCourseContainer').innerHTML = formHtml;
  document.getElementById('editCourseForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem('jwt');
    const data = {
      title: form.title.value,
      description: form.description.value,
      tutorId: form.tutorId.value,
      subjects: form.subjects.value.split(',').map(s => s.trim()),
      language: form.language.value,
      price: parseFloat(form.price.value),
      duration: form.duration.value,
      studentsEnrolled: parseInt(form.studentsEnrolled.value),
      extra: form.extra.value.split(',').map(e => e.trim())
    };
    const res = await fetch(`${API_BASE}/api/admin/edit-course/${form.id.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });
    let result;
    if (res.ok) {
      result = await res.json();
      document.getElementById('courseResult').textContent = result.success ? 'Course updated!' : (result.message || 'Error');
      await fetchAndDisplayCourses('all'); // Refresh list
      document.getElementById('editCourseContainer').innerHTML = '';
    } else {
      try {
        result = await res.json();
        document.getElementById('courseResult').textContent = result.message || 'Error: ' + res.status;
      } catch {
        document.getElementById('courseResult').textContent = 'Error: ' + res.status;
      }
    }
  };
}

function showCreateCourseForm() {
  const formHtml = `
    <form id="createCourseForm">
      <h3>Create Course</h3>
      <input type="text" name="title" placeholder="Title" required><br>
      <textarea name="description" placeholder="Description"></textarea><br>
      <input type="text" name="tutorId" placeholder="Tutor ID" required><br>
      <input type="text" name="subjects" placeholder="Subjects (comma separated)" required><br>
      <input type="text" name="language" placeholder="Language"><br>
      <input type="number" name="price" placeholder="Price"><br>
      <input type="text" name="duration" placeholder="Duration"><br>
      <input type="number" name="studentsEnrolled" placeholder="Students Enrolled" value="0"><br>
      <input type="text" name="extra" placeholder="Extra (comma separated)"><br>
      <button type="submit">Create</button>
    </form>
  `;
  document.getElementById('createCourseContainer').innerHTML = formHtml;
  document.getElementById('createCourseForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem('jwt');
    const data = {
      title: form.title.value,
      description: form.description.value,
      tutorId: form.tutorId.value,
      subjects: form.subjects.value.split(',').map(s => s.trim()),
      language: form.language.value,
      price: parseFloat(form.price.value),
      duration: form.duration.value,
      studentsEnrolled: parseInt(form.studentsEnrolled.value),
      extra: form.extra.value.split(',').map(e => e.trim())
    };
    const res = await fetch(`${API_BASE}/api/admin/create-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });
    let result;
    if (res.ok) {
      result = await res.json();
      document.getElementById('courseResult').textContent = result.success ? 'Course created!' : (result.message || 'Error');
      await fetchAndDisplayCourses('all'); // Refresh list
      document.getElementById('createCourseContainer').innerHTML = '';
    } else {
      try {
        result = await res.json();
        document.getElementById('courseResult').textContent = result.message || 'Error: ' + res.status;
      } catch {
        document.getElementById('courseResult').textContent = 'Error: ' + res.status;
      }
    }
  };
}
// Add UI for searching and viewing tutors
function showTutorSearchAndList() {
  const html = `
    <div style="margin-bottom:20px;">
      <form id="searchTutorForm" style="display:inline-block;">
        <input type="text" name="query" placeholder="Search by username or email" required>
        <button type="submit">Search</button>
      </form>
      <button id="showAllTutorsBtn" style="margin-left:10px;">Show All Tutors</button>
    </div>
    <div id="tutorList"></div>
    <div id="editTutorContainer"></div>
  `;
  document.getElementById('adminForms').style.display = 'block';
  document.getElementById('adminForms').innerHTML = html;
  document.getElementById('result').textContent = '';

  // Real-time search
  const searchInput = document.querySelector('#searchTutorForm input[name="query"]');
  let debounceTimeout;
  searchInput.addEventListener('input', function(e) {
    clearTimeout(debounceTimeout);
    const query = e.target.value;
    debounceTimeout = setTimeout(() => {
      if (query.trim().length > 0) {
        fetchAndDisplayTutors('search', query);
      } else {
        document.getElementById('tutorList').innerHTML = '';
      }
    }, 300);
  });
  document.getElementById('showAllTutorsBtn').onclick = async function() {
    await fetchAndDisplayTutors('all');
  };
}

async function fetchAndDisplayTutors(type, query) {
  const token = localStorage.getItem('jwt');
  let url = '';
  if(type === 'all') url = `${API_BASE}/api/admin/tutors`;
  else url = `${API_BASE}/api/admin/search-tutor?query=` + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  let tutors = [];
  if(res.ok) tutors = await res.json();
  const listDiv = document.getElementById('tutorList');
  if(tutors.length === 0) {
    listDiv.innerHTML = '<p>No tutors found.</p>';
    return;
  }
  let html = '<table border="1" style="width:100%;text-align:left;"><tr>' +
    '<th>Username</th><th>Email</th><th>Bio</th><th>Subjects</th><th>Languages</th><th>Availability</th><th>Edit</th></tr>';
  tutors.forEach(t => {
    html += `<tr>
      <td>${t.username}</td>
      <td>${t.email}</td>
      <td>${t.bio}</td>
      <td>${Array.isArray(t.subjects) ? t.subjects.join(', ') : ''}</td>
      <td>${Array.isArray(t.languages) ? t.languages.join(', ') : ''}</td>
      <td>${t.availability}</td>
      <td><button onclick="editTutor('${t.id}', '${encodeURIComponent(JSON.stringify(t))}')">Edit</button></td>
    </tr>`;
  });
  html += '</table>';
  listDiv.innerHTML = html;
}

window.editTutor = function(id, encodedTutor) {
  const t = JSON.parse(decodeURIComponent(encodedTutor));
  const formHtml = `
    <form id="editTutorForm">
      <h3>Edit Tutor Profile</h3>
      <input type="hidden" name="id" value="${t.id}">
      <input type="text" name="username" placeholder="Username" value="${t.username}"><br>
      <input type="email" name="email" placeholder="Email" value="${t.email}"><br>
      <textarea name="bio" placeholder="Bio">${t.bio || ''}</textarea><br>
      <input type="text" name="subjects" placeholder="Subjects (comma separated)" value="${Array.isArray(t.subjects) ? t.subjects.join(', ') : ''}"><br>
      <input type="text" name="languages" placeholder="Languages (comma separated)" value="${Array.isArray(t.languages) ? t.languages.join(', ') : ''}"><br>
      <input type="text" name="availability" placeholder="Availability" value="${t.availability || ''}"><br>
      <button type="submit">Update</button>
    </form>
  `;
  document.getElementById('editTutorContainer').innerHTML = formHtml;
  document.getElementById('editTutorForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem('jwt');
    const data = {
      username: form.username.value,
      email: form.email.value,
      bio: form.bio.value,
      subjects: form.subjects.value.split(',').map(s => s.trim()),
      languages: form.languages.value.split(',').map(l => l.trim()),
      availability: form.availability.value
    };
    const res = await fetch(`${API_BASE}/api/admin/edit-tutor/${form.id.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });
    let result;
    if (res.ok) {
      result = await res.json();
      document.getElementById('result').textContent = result.success ? 'Tutor updated!' : (result.message || 'Error');
      await fetchAndDisplayTutors('all'); // Refresh list
      document.getElementById('editTutorContainer').innerHTML = '';
    } else {
      try {
        result = await res.json();
        document.getElementById('result').textContent = result.message || 'Error: ' + res.status;
      } catch {
        document.getElementById('result').textContent = 'Error: ' + res.status;
      }
    }
  };
}
// Add button to show tutor search/list UI
const adminFormsDiv = document.getElementById('adminForms');
if (adminFormsDiv) {
  const tutorListBtn = document.createElement('button');
  tutorListBtn.textContent = 'Search/Edit Tutors';
  tutorListBtn.style.marginRight = '10px';
  tutorListBtn.onclick = showTutorSearchAndList;
  adminFormsDiv.parentNode.insertBefore(tutorListBtn, adminFormsDiv);
}
// admin_dashboard.js
function logout() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

function showCreateUserForm() {
  const formHtml = `
    <form id="createUserForm">
      <h3>Create User/Tutor</h3>
      <input type="text" name="username" placeholder="Username" required><br>
      <input type="email" name="email" placeholder="Email" required><br>
      <input type="password" name="password" placeholder="Password" required><br>
      <select name="role">
        <option value="STUDENT">Student</option>
        <option value="TUTOR">Tutor</option>
        <option value="ADMIN">Admin</option>
      </select><br>
      <textarea name="bio" placeholder="Bio"></textarea><br>
      <input type="text" name="subjects" placeholder="Subjects (comma separated)"><br>
      <button type="submit">Create</button>
    </form>
  `;
  document.getElementById('adminForms').style.display = 'block';
  document.getElementById('adminForms').innerHTML = formHtml;
  document.getElementById('result').textContent = '';
  document.getElementById('createUserForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem('jwt');
    const data = {
      username: form.username.value,
      email: form.email.value,
      passwordHash: form.password.value,
      role: form.role.value,
      bio: form.bio.value,
      subjects: form.subjects.value.split(',').map(s => s.trim()),
      languages: [],
      availability: ''
    };
    const res = await fetch(`${API_BASE}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });
    let result;
    if (res.ok) {
      result = await res.json();
      document.getElementById('result').textContent = result.success ? 'User created!' : (result.message || 'Error');
    } else {
      try {
        result = await res.json();
        document.getElementById('result').textContent = result.message || 'Error: ' + res.status;
      } catch {
        document.getElementById('result').textContent = 'Error: ' + res.status;
      }
    }
  };
}

function showEditTutorForm() {
  const formHtml = `
    <form id="editTutorForm">
      <h3>Edit Tutor Profile</h3>
      <input type="text" name="id" placeholder="Tutor ID" required><br>
      <input type="text" name="username" placeholder="Username"><br>
      <input type="email" name="email" placeholder="Email"><br>
      <textarea name="bio" placeholder="Bio"></textarea><br>
      <input type="text" name="subjects" placeholder="Subjects (comma separated)"><br>
      <button type="submit">Update</button>
    </form>
  `;
  document.getElementById('adminForms').style.display = 'block';
  document.getElementById('adminForms').innerHTML = formHtml;
  document.getElementById('result').textContent = '';
  document.getElementById('editTutorForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem('jwt');
    const data = {
      username: form.username.value,
      email: form.email.value,
      bio: form.bio.value,
      subjects: form.subjects.value.split(',').map(s => s.trim()),
      languages: [],
      availability: ''
    };
    const res = await fetch(`${API_BASE}/api/admin/edit-tutor/${form.id.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });
    let result;
    if (res.ok) {
      result = await res.json();
      document.getElementById('result').textContent = result.success ? 'Tutor updated!' : (result.message || 'Error');
    } else {
      try {
        result = await res.json();
        document.getElementById('result').textContent = result.message || 'Error: ' + res.status;
      } catch {
        document.getElementById('result').textContent = 'Error: ' + res.status;
      }
    }
  };
}
    // Admin Dashboard Navigation - Exactly like student dashboard
    document.addEventListener('DOMContentLoaded', function() {
      initializeAdminDashboard();
    });

    function initializeAdminDashboard() {
      setupAdminNavigation();
    }

    function setupAdminNavigation() {
      // Create User button
      document.getElementById('createUserBtn').addEventListener('click', function() {
        showAdminSection('createUserSection');
        // Clean up any unwanted elements before loading the form
        setTimeout(() => {
          cleanupCreateUserSection();
          loadCreateUserForm();
        }, 10);
      });

      // Edit Tutor button
      document.getElementById('editTutorBtn').addEventListener('click', function() {
        showAdminSection('editTutorSection');
        loadEditTutorForm();
      });

      // Manage Courses button
      document.getElementById('manageCourseBtn').addEventListener('click', function() {
        showAdminSection('manageCourseSection');
        loadCourseManagement();
      });

      // Site Settings button
      document.getElementById('siteSettingsBtn').addEventListener('click', function() {
        showAdminSection('siteSettingsSection');
      });

      // Chat button
      document.getElementById('chatBtn').addEventListener('click', function() {
        window.location.href = 'chat.html';
      });

      // Search Tutors button
      document.getElementById('searchTutorsBtn').addEventListener('click', function() {
        showAdminSection('searchTutorsSection');
        loadSearchTutors();
      });

      // Logout button
      document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
      });

      // Back navigation buttons
      document.getElementById('backToMainFromCreateBtn').addEventListener('click', function() {
        showAdminSection('mainDashboard');
      });

      document.getElementById('backToMainFromEditBtn').addEventListener('click', function() {
        showAdminSection('mainDashboard');
      });

      document.getElementById('backToMainFromCourseBtn').addEventListener('click', function() {
        showAdminSection('mainDashboard');
      });

      document.getElementById('backToMainFromSettingsBtn').addEventListener('click', function() {
        showAdminSection('mainDashboard');
      });

      document.getElementById('backToMainFromSearchBtn').addEventListener('click', function() {
        showAdminSection('mainDashboard');
      });
    }

    function showAdminSection(sectionId) {
      // Hide all sections
      const sections = ['mainDashboard', 'createUserSection', 'editTutorSection', 'manageCourseSection', 'siteSettingsSection', 'searchTutorsSection'];
      sections.forEach(id => {
        document.getElementById(id).style.display = 'none';
      });
      
      // Show the requested section
      document.getElementById(sectionId).style.display = 'block';
    }

    function cleanupCreateUserSection() {
      // Remove any unwanted buttons from the Create User section
      const createUserSection = document.getElementById('createUserSection');
      if (createUserSection) {
        const buttons = createUserSection.querySelectorAll('button');
        buttons.forEach(btn => {
          // Keep only the back button and form submit buttons
          if (!btn.classList.contains('back-btn') && 
              btn.type !== 'submit' && 
              !btn.closest('form') &&
              (btn.textContent.includes('Search') || 
               btn.textContent.includes('Tutor') ||
               btn.textContent.includes('Edit'))) {
            btn.remove();
          }
        });
        
        // Also clean up any extra elements that might be added
        const adminContainer = createUserSection.querySelector('.admin-container');
        if (adminContainer) {
          const children = Array.from(adminContainer.children);
          children.forEach(child => {
            if (child.id !== 'adminForms' && child.id !== 'result' && child.tagName === 'BUTTON') {
              child.remove();
            }
          });
        }
      }
    }

    function loadCreateUserForm() {
      // Clear the target divs first and prevent any external interference
      const adminFormsDiv = document.getElementById('adminForms');
      const resultDiv = document.getElementById('result');
      
      // Clear everything completely
      adminFormsDiv.innerHTML = '';
      resultDiv.innerHTML = '';
      
      // Also clear any potential interference from the original admin_dashboard.js
      const adminContainer = adminFormsDiv.parentElement;
      if (adminContainer) {
        // Remove any unwanted buttons that might be added by admin_dashboard.js
        const unwantedButtons = adminContainer.querySelectorAll('button:not(.back-btn)');
        unwantedButtons.forEach(btn => {
          if (btn.textContent.includes('Search') || btn.textContent.includes('Tutor') && !btn.closest('form')) {
            btn.remove();
          }
        });
      }
      
      // Create the form directly with a timeout to ensure it loads after any interference
      setTimeout(() => {
        const formHtml = `
          <form id="createUserForm">
            <h3 style="color: #2c3e50; margin-bottom: 20px;">Create User/Tutor</h3>
            <input type="text" name="username" placeholder="Username" required><br>
            <input type="email" name="email" placeholder="Email" required><br>
            <input type="password" name="password" placeholder="Password" required><br>
            <select name="role">
              <option value="STUDENT">Student</option>
              <option value="TUTOR">Tutor</option>
              <option value="ADMIN">Admin</option>
            </select><br>
            <textarea name="bio" placeholder="Bio"></textarea><br>
            <input type="text" name="subjects" placeholder="Subjects (comma separated)"><br>
            <button type="submit">Create User</button>
          </form>
        `;
        
        adminFormsDiv.innerHTML = formHtml;
        
        // Remove any buttons that might appear after form creation
        setTimeout(() => {
          const container = document.getElementById('createUserSection');
          if (container) {
            const unwantedBtns = container.querySelectorAll('button');
            unwantedBtns.forEach(btn => {
              if (btn.textContent.includes('Search') || (btn.textContent.includes('Tutors') && !btn.closest('form') && !btn.classList.contains('back-btn'))) {
                btn.remove();
              }
            });
          }
        }, 100);
        
        // Handle form submission
        document.getElementById('createUserForm').onsubmit = async function(e) {
          e.preventDefault();
          const form = e.target;
          const token = localStorage.getItem('jwt');
          const data = {
            username: form.username.value,
            email: form.email.value,
            passwordHash: form.password.value,
            role: form.role.value,
            bio: form.bio.value,
            subjects: form.subjects.value.split(',').map(s => s.trim()),
            languages: [],
            availability: ''
          };
          
          try {
            const res = await fetch(`${API_BASE}/api/admin/create-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify(data)
            });
            
            let result;
            if (res.ok) {
              result = await res.json();
              resultDiv.textContent = result.success ? 'User created successfully!' : (result.message || 'Error creating user');
              resultDiv.style.color = result.success ? 'green' : 'red';
              // Clear form on success
              if (result.success) {
                form.reset();
              }
            } else {
              try {
                result = await res.json();
                resultDiv.textContent = result.message || 'Error: ' + res.status;
                resultDiv.style.color = 'red';
              } catch {
                resultDiv.textContent = 'Error: ' + res.status;
                resultDiv.style.color = 'red';
              }
            }
          } catch (error) {
            resultDiv.textContent = 'Network error occurred';
            resultDiv.style.color = 'red';
          }
        };
      }, 50);
    }

    function loadEditTutorForm() {
      // For edit tutor, we need to use adminForms since original function uses it
      const targetDiv = document.getElementById('editTutorForms');
      const originalAdminForms = document.getElementById('adminForms');
      const originalResult = document.getElementById('result');
      
      // Temporarily redirect the original function to use our section
      if (typeof showEditTutorForm === 'function') {
        // Create temporary divs in the edit section to catch the original function output
        targetDiv.innerHTML = '<div id="tempAdminForms"></div><div id="tempResult"></div>';
        
        // Temporarily replace the original divs
        const tempAdminForms = document.getElementById('tempAdminForms');
        const tempResult = document.getElementById('tempResult');
        
        // Override the original function to use our divs
        const originalShow = showEditTutorForm;
        window.showEditTutorForm = function() {
          const formHtml = `
            <form id="editTutorForm">
              <h3>Edit Tutor Profile</h3>
              <input type="text" name="id" placeholder="Tutor ID" required><br>
              <input type="text" name="username" placeholder="Username"><br>
              <input type="email" name="email" placeholder="Email"><br>
              <textarea name="bio" placeholder="Bio"></textarea><br>
              <input type="text" name="subjects" placeholder="Subjects (comma separated)"><br>
              <button type="submit">Update</button>
            </form>
          `;
          targetDiv.innerHTML = formHtml;
          document.getElementById('editTutorResult').textContent = '';
          
          document.getElementById('editTutorForm').onsubmit = async function(e) {
            e.preventDefault();
            const form = e.target;
            const token = localStorage.getItem('jwt');
            const data = {
              username: form.username.value,
              email: form.email.value,
              bio: form.bio.value,
              subjects: form.subjects.value.split(',').map(s => s.trim()),
              languages: [],
              availability: ''
            };
            const res = await fetch(`${API_BASE}/api/admin/edit-tutor/${form.id.value}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify(data)
            });
            let result;
            if (res.ok) {
              result = await res.json();
              document.getElementById('editTutorResult').textContent = result.success ? 'Tutor updated!' : (result.message || 'Error');
            } else {
              try {
                result = await res.json();
                document.getElementById('editTutorResult').textContent = result.message || 'Error: ' + res.status;
              } catch {
                document.getElementById('editTutorResult').textContent = 'Error: ' + res.status;
              }
            }
          };
        };
        
        showEditTutorForm();
        // Restore original function
        window.showEditTutorForm = originalShow;
      }
    }

    function loadCourseManagement() {
      // For course management, we need to redirect to use our section
      const targetDiv = document.getElementById('courseForms');
      const resultDiv = document.getElementById('courseResult');
      
      if (typeof showCourseManagement === 'function') {
        // Override the function to use our divs with proper styling
        const originalShow = showCourseManagement;
        window.showCourseManagement = function() {
          const html = `
            <div style="margin-bottom:20px;">
              <form id="searchCourseForm" style="display:inline-block;">
                <input type="text" name="query" placeholder="Search by title, subject, or tutor" required style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; margin-right: 10px;">
                <button type="submit" style="background: #27ae60; color: white; border: none; border-radius: 25px; padding: 12px 25px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Search</button>
              </form>
              <button id="showAllCoursesBtn" style="background: #3498db; color: white; border: none; border-radius: 25px; padding: 12px 25px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-left: 10px;">Show All Courses</button>
              <button id="showCreateCourseBtn" style="background: #e67e22; color: white; border: none; border-radius: 25px; padding: 12px 25px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-left: 10px;">Create Course</button>
            </div>
            <div id="courseList"></div>
            <div id="editCourseContainer"></div>
            <div id="createCourseContainer"></div>
          `;
          targetDiv.innerHTML = html;
          resultDiv.textContent = '';

          // Add hover effects
          const buttons = targetDiv.querySelectorAll('button');
          buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
              this.style.transform = 'translateY(-2px)';
              this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
            });
            btn.addEventListener('mouseleave', function() {
              this.style.transform = 'translateY(0)';
              this.style.boxShadow = 'none';
            });
          });

          // Real-time search
          const searchInput = document.querySelector('#searchCourseForm input[name="query"]');
          let debounceTimeout;
          searchInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimeout);
            const query = e.target.value;
            debounceTimeout = setTimeout(() => {
              if (query.trim().length > 0) {
                fetchAndDisplayCourses('search', query);
              } else {
                document.getElementById('courseList').innerHTML = '';
              }
            }, 300);
          });
          
          document.getElementById('showAllCoursesBtn').onclick = async function() {
            await fetchAndDisplayCourses('all');
          };
          
          document.getElementById('showCreateCourseBtn').onclick = function() {
            showCreateCourseForm();
          };
        };
        
        showCourseManagement();
        // Restore original function  
        window.showCourseManagement = originalShow;
      }
    }

    function loadSearchTutors() {
      // For search tutors, we need to redirect to use our section
      const targetDiv = document.getElementById('searchTutorForms');
      const resultDiv = document.getElementById('searchTutorResult');
      
      if (typeof showTutorSearchAndList === 'function') {
        // Override the function to use our divs with proper styling
        const originalShow = showTutorSearchAndList;
        window.showTutorSearchAndList = function() {
          const html = `
            <div style="margin-bottom:20px;">
              <form id="searchTutorForm" style="display:inline-block;">
                <input type="text" name="query" placeholder="Search by username or email" required style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; margin-right: 10px;">
                <button type="submit" style="background: #27ae60; color: white; border: none; border-radius: 25px; padding: 12px 25px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Search</button>
              </form>
              <button id="showAllTutorsBtn" style="background: #3498db; color: white; border: none; border-radius: 25px; padding: 12px 25px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-left: 10px;">Show All Tutors</button>
            </div>
            <div id="tutorList"></div>
            <div id="editTutorContainer"></div>
          `;
          targetDiv.innerHTML = html;
          resultDiv.textContent = '';

          // Add hover effects to buttons
          const buttons = targetDiv.querySelectorAll('button');
          buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
              this.style.transform = 'translateY(-2px)';
              this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
            });
            btn.addEventListener('mouseleave', function() {
              this.style.transform = 'translateY(0)';
              this.style.boxShadow = 'none';
            });
          });

          // Real-time search
          const searchInput = document.querySelector('#searchTutorForm input[name="query"]');
          let debounceTimeout;
          searchInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimeout);
            const query = e.target.value;
            debounceTimeout = setTimeout(() => {
              if (query.trim().length > 0) {
                fetchAndDisplayTutors('search', query);
              } else {
                document.getElementById('tutorList').innerHTML = '';
              }
            }, 300);
          });
          document.getElementById('showAllTutorsBtn').onclick = async function() {
            await fetchAndDisplayTutors('all');
          };
        };
        
        showTutorSearchAndList();
        // Restore original function  
        window.showTutorSearchAndList = originalShow;
      }
    }

    // Add the fetchAndDisplayTutors function needed for search
    async function fetchAndDisplayTutors(type, query) {
      const token = localStorage.getItem('jwt');
      let url = '';
      if(type === 'all') url = `${API_BASE}/api/admin/tutors`;
      else url = `${API_BASE}/api/admin/search-tutor?query=` + encodeURIComponent(query);
      const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      let tutors = [];
      if(res.ok) tutors = await res.json();
      const listDiv = document.getElementById('tutorList');
      if(tutors.length === 0) {
        listDiv.innerHTML = '<p>No tutors found.</p>';
        return;
      }
      let html = '<table border="1" style="width:100%;text-align:left;"><tr>' +
        '<th>Username</th><th>Email</th><th>Bio</th><th>Subjects</th><th>Languages</th><th>Availability</th><th>Edit</th></tr>';
      tutors.forEach(t => {
        html += `<tr>
          <td>${t.username}</td>
          <td>${t.email}</td>
          <td>${t.bio}</td>
          <td>${Array.isArray(t.subjects) ? t.subjects.join(', ') : ''}</td>
          <td>${Array.isArray(t.languages) ? t.languages.join(', ') : ''}</td>
          <td>${t.availability}</td>
          <td><button onclick="editTutor('${t.id}', '${encodeURIComponent(JSON.stringify(t))}')">Edit</button></td>
        </tr>`;
      });
      html += '</table>';
      listDiv.innerHTML = html;
    }

    // Add the editTutor function for inline editing from search results
    window.editTutor = function(id, encodedTutor) {
      const t = JSON.parse(decodeURIComponent(encodedTutor));
      const formHtml = `
        <form id="editSelectedTutorForm">
          <h3>Edit Tutor Profile</h3>
          <input type="hidden" name="id" value="${t.id}">
          <input type="text" name="username" placeholder="Username" value="${t.username}"><br>
          <input type="email" name="email" placeholder="Email" value="${t.email}"><br>
          <textarea name="bio" placeholder="Bio">${t.bio || ''}</textarea><br>
          <input type="text" name="subjects" placeholder="Subjects (comma separated)" value="${Array.isArray(t.subjects) ? t.subjects.join(', ') : ''}"><br>
          <input type="text" name="languages" placeholder="Languages (comma separated)" value="${Array.isArray(t.languages) ? t.languages.join(', ') : ''}"><br>
          <input type="text" name="availability" placeholder="Availability" value="${t.availability || ''}"><br>
          <button type="submit">Update</button>
        </form>
      `;
      document.getElementById('editTutorContainer').innerHTML = formHtml;
      document.getElementById('editSelectedTutorForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const token = localStorage.getItem('jwt');
        const data = {
          username: form.username.value,
          email: form.email.value,
          bio: form.bio.value,
          subjects: form.subjects.value.split(',').map(s => s.trim()),
          languages: form.languages.value.split(',').map(l => l.trim()),
          availability: form.availability.value
        };
        const res = await fetch(`${API_BASE}/api/admin/edit-tutor/${form.id.value}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });
        let result;
        if (res.ok) {
          result = await res.json();
          document.getElementById('searchTutorResult').textContent = result.success ? 'Tutor updated!' : (result.message || 'Error');
          await fetchAndDisplayTutors('all'); // Refresh list
          document.getElementById('editTutorContainer').innerHTML = '';
        } else {
          try {
            result = await res.json();
            document.getElementById('searchTutorResult').textContent = result.message || 'Error: ' + res.status;
          } catch {
            document.getElementById('searchTutorResult').textContent = 'Error: ' + res.status;
          }
        }
      };
    };

    // Add the fetchAndDisplayCourses function needed for course management
    async function fetchAndDisplayCourses(type, query) {
      const token = localStorage.getItem('jwt');
      let url = '';
      if(type === 'all') url = `${API_BASE}/api/admin/courses`;
      else url = `${API_BASE}/api/admin/search-course?query=` + encodeURIComponent(query);
      const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      let courses = [];
      if(res.ok) courses = await res.json();
      const listDiv = document.getElementById('courseList');
      if(courses.length === 0) {
        listDiv.innerHTML = '<p>No courses found.</p>';
        return;
      }
      let html = '<table style="width:100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); margin-top: 20px;"><tr>' +
        '<th style="padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; background: #3498db; color: white; font-weight: 600;">Title</th>' +
        '<th style="padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; background: #3498db; color: white; font-weight: 600;">Subject</th>' +
        '<th style="padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; background: #3498db; color: white; font-weight: 600;">Description</th>' +
        '<th style="padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; background: #3498db; color: white; font-weight: 600;">Tutor ID</th>' +
        '<th style="padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; background: #3498db; color: white; font-weight: 600;">Edit</th></tr>';
      courses.forEach(c => {
        html += `<tr style="border-bottom: 1px solid #ecf0f1;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
          <td style="padding: 15px;">${c.title}</td>
          <td style="padding: 15px;">${c.subject}</td>
          <td style="padding: 15px;">${c.description || ''}</td>
          <td style="padding: 15px;">${c.tutorId}</td>
          <td style="padding: 15px;"><button onclick="editCourse('${c.id}', '${encodeURIComponent(JSON.stringify(c))}')" style="background: #3498db; color: white; border: none; border-radius: 15px; padding: 8px 16px; cursor: pointer; font-size: 0.9rem;">Edit</button></td>
        </tr>`;
      });
      html += '</table>';
      listDiv.innerHTML = html;
    }

    // Add the showCreateCourseForm function
    window.showCreateCourseForm = function() {
      const formHtml = `
        <form id="createCourseForm" style="background: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">Create New Course</h3>
          <input type="text" name="title" placeholder="Course Title" required style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px;"><br>
          <input type="text" name="subject" placeholder="Subject" required style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px;"><br>
          <textarea name="description" placeholder="Course Description" style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px; min-height: 100px;"></textarea><br>
          <input type="text" name="tutorId" placeholder="Tutor ID" required style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px;"><br>
          <button type="submit" style="background: #27ae60; color: white; border: none; border-radius: 25px; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px;">Create Course</button>
        </form>
      `;
      document.getElementById('createCourseContainer').innerHTML = formHtml;
      
      document.getElementById('createCourseForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const token = localStorage.getItem('jwt');
        const data = {
          title: form.title.value,
          subject: form.subject.value,
          description: form.description.value,
          tutorId: form.tutorId.value
        };
        const res = await fetch(`${API_BASE}/api/admin/create-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });
        let result;
        if (res.ok) {
          result = await res.json();
          document.getElementById('courseResult').textContent = result.success ? 'Course created successfully!' : (result.message || 'Error');
          document.getElementById('courseResult').style.color = result.success ? 'green' : 'red';
          if (result.success) {
            form.reset();
            await fetchAndDisplayCourses('all'); // Refresh list
          }
        } else {
          try {
            result = await res.json();
            document.getElementById('courseResult').textContent = result.message || 'Error: ' + res.status;
            document.getElementById('courseResult').style.color = 'red';
          } catch {
            document.getElementById('courseResult').textContent = 'Error: ' + res.status;
            document.getElementById('courseResult').style.color = 'red';
          }
        }
      };
    };

    // Add the editCourse function for inline editing from course search results
    window.editCourse = function(id, encodedCourse) {
      const c = JSON.parse(decodeURIComponent(encodedCourse));
      const formHtml = `
        <form id="editSelectedCourseForm" style="background: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">Edit Course</h3>
          <input type="hidden" name="id" value="${c.id}">
          <input type="text" name="title" placeholder="Course Title" value="${c.title}" style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px;"><br>
          <input type="text" name="subject" placeholder="Subject" value="${c.subject}" style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px;"><br>
          <textarea name="description" placeholder="Course Description" style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px; min-height: 100px;">${c.description || ''}</textarea><br>
          <input type="text" name="tutorId" placeholder="Tutor ID" value="${c.tutorId}" style="padding: 12px 15px; border: 2px solid #ecf0f1; border-radius: 10px; font-size: 1rem; background: #fff; width: 100%; margin-bottom: 15px;"><br>
          <button type="submit" style="background: #27ae60; color: white; border: none; border-radius: 25px; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px;">Update Course</button>
        </form>
      `;
      document.getElementById('editCourseContainer').innerHTML = formHtml;
      
      document.getElementById('editSelectedCourseForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const token = localStorage.getItem('jwt');
        const data = {
          title: form.title.value,
          subject: form.subject.value,
          description: form.description.value,
          tutorId: form.tutorId.value
        };
        const res = await fetch(`${API_BASE}/api/admin/edit-course/${form.id.value}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });
        let result;
        if (res.ok) {
          result = await res.json();
          document.getElementById('courseResult').textContent = result.success ? 'Course updated!' : (result.message || 'Error');
          document.getElementById('courseResult').style.color = result.success ? 'green' : 'red';
          await fetchAndDisplayCourses('all'); // Refresh list
          document.getElementById('editCourseContainer').innerHTML = '';
        } else {
          try {
            result = await res.json();
            document.getElementById('courseResult').textContent = result.message || 'Error: ' + res.status;
            document.getElementById('courseResult').style.color = 'red';
          } catch {
            document.getElementById('courseResult').textContent = 'Error: ' + res.status;
            document.getElementById('courseResult').style.color = 'red';
          }
        }
      };
    };