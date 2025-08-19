

// Health check before running main logic
function runMainFrontend() {
  const heroSearchInput = document.querySelector('.hero-search');
  const navbarSearchInput = document.querySelector('.search-bar');
  const resultsDiv = document.getElementById('searchResults');

  function handleSearchInput(inputElem) {
    const query = inputElem.value.trim();
    if (query.length === 0) {
      resultsDiv.innerHTML = '';
      return;
    }
    const token = localStorage.getItem('jwt');
    let studentEmail = null;
    let isStudent = false;
    // Decode JWT to get email and role (simple base64 decode, not secure, for demo)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        studentEmail = payload.sub || payload.email;
        const role = payload.role || payload.authorities;
        isStudent = role === 'STUDENT' || (Array.isArray(role) && role.includes('STUDENT'));
      } catch {}
    }
    fetch(`https://tutorconnect-backend-0yki.onrender.com/api/courses/search?query=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) {
          resultsDiv.innerHTML = `<p>Error: ${res.status} ${res.statusText}</p>`;
          return [];
        }
        return res.json();
      })
      .then(courses => {
        if (!courses || courses.length === 0) {
          resultsDiv.innerHTML = '<p>No courses found.';
          return;
        }
        resultsDiv.innerHTML = courses.map(course => {
          // Check if student is enrolled
          let enrolled = false;
          if (course.extra && course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
            enrolled = course.extra.students.some(s => s.email === studentEmail);
          }
          return `
            <div class="course-card" data-id="${course.id}" style="cursor:pointer;">
              <h4>${course.title}</h4>
              <p>${course.description}</p>
              <p><strong>Language:</strong> ${course.language}</p>
              <p><strong>Price:</strong> $${course.price}</p>
              <button class="enroll-btn" data-id="${course.id}" ${enrolled ? 'disabled' : ''}>${enrolled ? 'Enrolled' : 'Enroll'}</button>
            </div>
          `;
        }).join('');
        // Add enroll click event
        document.querySelectorAll('.enroll-btn').forEach(btn => {
          let loginPrompted = false;
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const courseId = btn.getAttribute('data-id');
            if (!isStudent || !token) {
              if (!loginPrompted) {
                btn.textContent = 'Login to enroll in course';
                loginPrompted = true;
                return;
              } else {
                window.location.href = 'login.html';
                return;
              }
            }
            btn.disabled = true;
            btn.textContent = 'Enrolling...';
            fetch(`https://tutorconnect-backend-0yki.onrender.com/api/courses/${courseId}/enroll`, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token
              }
            })
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  btn.textContent = 'Enrolled';
                } else {
                  btn.textContent = result.message || 'Error';
                  btn.disabled = false;
                }
              })
              .catch(() => {
                btn.textContent = 'Error';
                btn.disabled = false;
              });
          });
        });
        // Add click event to each course card
        document.querySelectorAll('.course-card[data-id]').forEach(card => {
          card.addEventListener('click', function(e) {
            // Prevent click if enroll button was clicked
            if (e.target.classList.contains('enroll-btn')) return;
            const courseId = card.getAttribute('data-id');
            window.location.href = `course_details.html?id=${courseId}`;
          });
        });
      })
      .catch(err => {
        resultsDiv.innerHTML = `<p>Network or server error.</p>`;
      });
  }

  if (heroSearchInput) {
    heroSearchInput.addEventListener('input', function() {
      handleSearchInput(heroSearchInput);
    });
  }
  if (navbarSearchInput) {
    navbarSearchInput.addEventListener('input', function() {
      handleSearchInput(navbarSearchInput);
    });
  }

  document.querySelector('.register-btn').addEventListener('click', function() {
    window.location.href = 'signup.html';
  });
  document.querySelector('.login-btn').addEventListener('click', function() {
    window.location.href = 'login.html';
  });

  // Set a simple solid background for the hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.style.background = 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)';
  }
}

// Wait for backend health before running main logic
function waitForBackendHealth() {
  fetch('https://tutorconnect-backend-0yki.onrender.com/api/health')
    .then(res => res.ok ? res.text() : Promise.reject())
    .then(() => {
      // Hide the loading overlay
      const overlay = document.getElementById('healthLoadingOverlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
      runMainFrontend();
    })
    .catch(() => {
      setTimeout(waitForBackendHealth, 2000);
    });
}

waitForBackendHealth();