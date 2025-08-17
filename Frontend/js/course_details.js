// Handles loading and displaying course details, and enroll button
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const courseId = getQueryParam('id');
const courseDetailsDiv = document.getElementById('courseDetails');

function renderCourseDetails(course) {
  // Get student info from JWT
  const token = localStorage.getItem('jwt');
  let studentEmail = null;
  let isStudent = false;
  let enrolled = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      studentEmail = payload.sub || payload.email;
      const role = payload.role || payload.authorities;
      isStudent = role === 'STUDENT' || (Array.isArray(role) && role.includes('STUDENT'));
    } catch {}
  }
  if (course.extra && course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
    enrolled = course.extra.students.some(s => s.email === studentEmail);
  }
  courseDetailsDiv.innerHTML = `
    <div class="course-card">
      <h2>${course.title}</h2>
      <p><strong>Description:</strong> ${course.description}</p>
      <p><strong>Language:</strong> ${course.language}</p>
      <p><strong>Price:</strong> $${course.price}</p>
      <p><strong>Subjects:</strong> ${course.subjects ? course.subjects.join(', ') : ''}</p>
      <p><strong>Tutor:</strong> ${course.tutorName || course.tutorId}</p>
      <button id="enrollBtn" class="enroll-btn" ${enrolled ? 'disabled' : ''}>${enrolled ? 'Enrolled' : 'Enroll'}</button>
    </div>
    <div id="averageRating" style="margin-top:16px;"></div>
    <div id="ratingsList" style="margin-top:16px;"></div>
    <div id="ratingFormContainer" style="margin-top:16px;">
      <h3>Leave a Rating & Comment</h3>
      <form id="ratingForm">
        <label>Stars:
          <select id="starsInput">
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </label>
        <br>
        <label>Comment:<br>
          <textarea id="commentInput" rows="2" cols="40"></textarea>
        </label>
        <br>
        <button type="submit">Submit</button>
      </form>
      <div id="ratingError" style="color:red;"></div>
    </div>
  `;
  const enrollBtn = document.getElementById('enrollBtn');
  if (enrolled) {
    enrollBtn.disabled = true;
    enrollBtn.textContent = 'Enrolled';
  } else {
    enrollBtn.disabled = false;
    enrollBtn.textContent = 'Enroll';
    let loginPrompted = false;
    enrollBtn.onclick = function() {
      if (!isStudent || !token) {
        if (!loginPrompted) {
          enrollBtn.textContent = 'Login to enroll in course';
          loginPrompted = true;
          return;
        } else {
          window.location.href = 'login.html';
          return;
        }
      }
      enrollBtn.disabled = true;
      enrollBtn.textContent = 'Enrolling...';
      fetch(`http://localhost:8080/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            enrollBtn.textContent = 'Enrolled';
          } else {
            enrollBtn.textContent = result.message || 'Error';
            enrollBtn.disabled = false;
          }
        })
        .catch(() => {
          enrollBtn.textContent = 'Error';
          enrollBtn.disabled = false;
        });
    };
  }
  fetchAverageRating();
  fetchRatingsList();
  setupRatingForm();
}

function renderStars(avg) {
  const fullStars = Math.round(avg);
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
}

function fetchAverageRating() {
  fetch(`http://localhost:8080/api/ratings/course/${courseId}/average`)
    .then(res => res.json())
    .then(avg => {
      document.getElementById('averageRating').innerHTML = `<strong>Average Rating:</strong> ${renderStars(avg)} (${avg.toFixed(2)})`;
    })
    .catch(() => {
      document.getElementById('averageRating').innerHTML = '';
    });
}

function fetchRatingsList() {
  fetch(`http://localhost:8080/api/ratings/course/${courseId}`)
    .then(res => res.json())
    .then(ratings => {
      if (!ratings || ratings.length === 0) {
        document.getElementById('ratingsList').innerHTML = '<p>No ratings yet.</p>';
        return;
      }
      document.getElementById('ratingsList').innerHTML = ratings.map(r => `
        <div class="rating-card">
          <span>${renderStars(r.stars)} (${r.stars})</span>
          <p>${r.comment ? r.comment : ''}</p>
          <small>By ${r.studentName || r.studentId} on ${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</small>
        </div>
      `).join('');
    })
    .catch(() => {
      document.getElementById('ratingsList').innerHTML = '';
    });
}

function setupRatingForm() {
  const form = document.getElementById('ratingForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const stars = parseInt(document.getElementById('starsInput').value);
    const comment = document.getElementById('commentInput').value;
    const token = localStorage.getItem('jwt');
    if (!token) {
      document.getElementById('ratingError').textContent = 'You must be logged in as a student to submit a rating.';
      return;
    }
    fetch('http://localhost:8080/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ courseId, stars, comment })
    })
    .then(res => {
      if (!res.ok) throw new Error('Not allowed or error occurred');
      return res.json();
    })
    .then(() => {
      document.getElementById('ratingError').textContent = '';
      fetchAverageRating();
      fetchRatingsList();
      form.reset();
    })
    .catch(() => {
      document.getElementById('ratingError').textContent = 'Error: Only students can submit ratings.';
    });
  });
}

if (courseId) {
  fetch(`http://localhost:8080/api/courses/${courseId}`)
    .then(res => res.json())
    .then(course => {
      renderCourseDetails(course);
    })
    .catch(() => {
      courseDetailsDiv.innerHTML = '<p>Error loading course details.</p>';
    });
} else {
  courseDetailsDiv.innerHTML = '<p>No course selected.</p>';
}

// Navbar buttons
const registerBtn = document.querySelector('.register-btn');
if (registerBtn) registerBtn.addEventListener('click', function() {
  window.location.href = 'signup.html';
});
const loginBtn = document.querySelector('.login-btn');
if (loginBtn) loginBtn.addEventListener('click', function() {
  window.location.href = 'login.html';
});