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
    // Collect quiz fields
    const quizFields = Array.from(form.querySelectorAll('.quiz-field'));
    const quizzes = quizFields.map(div => {
      const question = div.querySelector('input[name="quizQuestion"]')?.value.trim();
      const options = Array.from(div.querySelectorAll('input[name="quizOption"]')).map(opt => opt.value.trim()).filter(Boolean);
      const answer = div.querySelector('input[name="quizAnswer"]')?.value.trim();
      return question && options.length > 1 && answer ? { question, options, answer } : null;
    }).filter(Boolean);
  // Only one resources declaration
  const resources = { video: videos, docs: docs, quizzes: quizzes };
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
          html += `<li><strong>${course.title}</strong> - ${course.description}<br>`;
          if (course.extra && course.extra.video) {
            html += '<b>Videos:</b><ul>';
            course.extra.video.forEach(([title, link]) => {
              html += `<li>${title}: <a href="${link}" target="_blank">${link}</a></li>`;
            });
            html += '</ul>';
          }
          if (course.extra && course.extra.docs) {
            html += '<b>Documents:</b><ul>';
            course.extra.docs.forEach(([title, link]) => {
              html += `<li>${title}: <a href="${link}" target="_blank">${link}</a></li>`;
            });
            html += '</ul>';
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
          html += '</li>';
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
          <label>Quizzes:</label><br>
          <div id="quizFields_${course.id}">${quizFields}</div>
          <button type="button" onclick="addQuizField('${course.id}')">Add Quiz</button><br><br>
            <button type="submit">Save Resources</button>
          </form>
          <div id="resourceResult_${course.id}"></div>
        </div>`;
      });
      document.getElementById('assignedCoursesContainer').innerHTML = html;
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
