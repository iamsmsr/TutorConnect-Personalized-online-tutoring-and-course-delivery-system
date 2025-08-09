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
  if(type === 'all') url = 'http://localhost:8080/api/admin/courses';
  else url = 'http://localhost:8080/api/admin/search-course?query=' + encodeURIComponent(query);
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
    const res = await fetch('http://localhost:8080/api/admin/edit-course/' + form.id.value, {
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
    const res = await fetch('http://localhost:8080/api/admin/create-course', {
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
  if(type === 'all') url = 'http://localhost:8080/api/admin/tutors';
  else url = 'http://localhost:8080/api/admin/search-tutor?query=' + encodeURIComponent(query);
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
    const res = await fetch('http://localhost:8080/api/admin/edit-tutor/' + form.id.value, {
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
    const res = await fetch('http://localhost:8080/api/admin/create-user', {
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
    const res = await fetch('http://localhost:8080/api/admin/edit-tutor/' + form.id.value, {
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
