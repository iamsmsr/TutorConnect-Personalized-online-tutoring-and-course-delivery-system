
const heroSearchInput = document.querySelector('.hero-search');
const navbarSearchInput = document.querySelector('.search-bar');
const resultsDiv = document.getElementById('searchResults');

function handleSearchInput(inputElem) {
  const query = inputElem.value.trim();
  if (query.length === 0) {
    resultsDiv.innerHTML = '';
    return;
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
        resultsDiv.innerHTML = '<p>No courses found.';
        return;
      }
      resultsDiv.innerHTML = courses.map(course => `
        <div class="course-card" data-id="${course.id}" style="cursor:pointer;">
          <h4>${course.title}</h4>
          <p>${course.description}</p>
          <p><strong>Language:</strong> ${course.language}</p>
          <p><strong>Price:</strong> $${course.price}</p>
        </div>
      `).join('');
      // Add click event to each course card
      document.querySelectorAll('.course-card[data-id]').forEach(card => {
        card.addEventListener('click', function() {
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