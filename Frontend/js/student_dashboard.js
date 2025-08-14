// Browse Courses logic (reuse index.js search)
document.addEventListener('DOMContentLoaded', function() {
  // Show enrolled courses on dashboard load
  const enrolledCoursesDiv = document.createElement('div');
  enrolledCoursesDiv.id = 'enrolledCoursesContainer';
  enrolledCoursesDiv.innerHTML = '<h3>My Enrolled Courses</h3><div id="enrolledCoursesList">Loading...</div>';
  document.querySelector('.login-container').insertBefore(enrolledCoursesDiv, document.getElementById('browseCoursesSection'));

  const token = localStorage.getItem('jwt');
  if (token) {
    fetch('http://localhost:8080/api/courses/enrolled', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(courses => {
        const listDiv = document.getElementById('enrolledCoursesList');
        if (!courses || courses.length === 0) {
          listDiv.innerHTML = '<p>You have not enrolled in any courses yet.</p>';
          return;
        }
        // Get student email from JWT
        let studentEmail = null;
        const token = localStorage.getItem('jwt');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            studentEmail = payload.sub || payload.email;
          } catch {}
        }
        listDiv.innerHTML = courses.map(course => {
          // Find student progress for this course
          let progress = 0, progressPercent = 0;
          if (course.extra && course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
            const studentObj = course.extra.students.find(s => s.email === studentEmail);
            if (studentObj) {
              progress = studentObj.progress || 0;
              progressPercent = studentObj.progressPercent || 0;
            }
          }
          let videosHtml = '';
          if (course.extra && course.extra.video && Array.isArray(course.extra.video)) {
            videosHtml = '<b>Videos:</b><ul>' + course.extra.video.map(([title, link], idx) => {
              let videoIdMatch = link.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
              let videoId = videoIdMatch ? videoIdMatch[1] : null;
              let playerDiv = videoId ? `<div id="ytplayer-${course.id}-${idx}" class="ytplayer" style="margin-bottom:10px;"></div>` : '';
              let embedHtml = videoId ? playerDiv : `<a href="${link}" target="_blank">${link}</a>`;
              return `<li>${title}: ${embedHtml}</li>`;
            }).join('') + '</ul>';
          }
          let docsHtml = '';
          if (course.extra && course.extra.docs && Array.isArray(course.extra.docs)) {
            docsHtml = '<b>Documents:</b><ul>' + course.extra.docs.map(([title, link]) => `<li>${title}: <a href="${link}" target="_blank">${link}</a></li>`).join('') + '</ul>';
          }
          let quizzesHtml = '';
          if (course.extra && course.extra.quizzes && Array.isArray(course.extra.quizzes)) {
            quizzesHtml = '<b>Quizzes:</b><ul>' + course.extra.quizzes.map(quiz => `
              <li>
                <b>Q:</b> ${quiz.question}<br>
                <b>Options:</b> ${quiz.options ? quiz.options.join(', ') : ''}<br>
                <b>Answer:</b> ${quiz.answer}<br>
                <span style="color:orange;">Writing answers coming soon</span>
              </li>
            `).join('') + '</ul>';
          }
          // Progress meter
          let progressBar = `<div style="margin:10px 0;">
            <label>Progress:</label>
            <div style="background:#eee;width:100%;height:20px;border-radius:10px;overflow:hidden;">
              <div style="background:#4caf50;width:${progressPercent}%;height:100%;transition:width 0.5s;"></div>
            </div>
            <span>${progressPercent}% (${progress} of ${course.extra && course.extra.video ? course.extra.video.length : 0} videos)</span>
          </div>`;
          // Certificate button
          let certBtn = '';
          if (progressPercent === 100) {
            certBtn = `<button class="cert-btn" data-id="${course.id}" style="margin-top:10px;">Get Certificate</button>`;
          }
          return `
            <div class="course-card" data-id="${course.id}" style="cursor:pointer;">
              <h4>${course.title}</h4>
              <p>${course.description}</p>
              <p><strong>Language:</strong> ${course.language}</p>
              <p><strong>Price:</strong> $${course.price}</p>
              ${progressBar}
              ${videosHtml}
              ${docsHtml}
              ${quizzesHtml}
              ${certBtn}
              <button onclick="window.location.href='course_details.html?id=${course.id}'">View Details</button>
            </div>
          `;
        }).join('');
        // Certificate button click handler
        setTimeout(() => {
          document.querySelectorAll('.cert-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const courseId = btn.getAttribute('data-id');
              // Generate certificate PDF
              const course = courses.find(c => c.id === courseId);
              
              // Fetch user profile to get actual username
              fetch('http://localhost:8080/api/user/me', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
              })
              .then(res => res.json())
              .then(user => {
                const studentName = user.username || studentEmail || 'Student';
                
                // Open new window with certificate for printing as PDF
                const certWindow = window.open('', '_blank');
                certWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Certificate - ${course.title}</title>
                    <style>
                      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                      .certificate { 
                        width: 800px; 
                        height: 600px; 
                        margin: 0 auto; 
                        padding: 60px; 
                        text-align: center; 
                        border: 8px solid #4caf50; 
                        background: #fff;
                        box-sizing: border-box;
                      }
                      h1 { color: #388e3c; font-size: 42px; margin-bottom: 20px; }
                      h2 { color: #222; font-size: 32px; margin: 20px 0; }
                      h3 { color: #388e3c; font-size: 28px; margin: 20px 0; }
                      p { font-size: 18px; margin: 12px 0; }
                      hr { border: 2px solid #4caf50; margin: 30px 0; }
                      .footer { margin-top: 40px; }
                      .brand { font-size: 24px; color: #4caf50; font-weight: bold; }
                      .small { font-size: 14px; color: #888; }
                      @media print {
                        body { margin: 0; }
                        .certificate { page-break-inside: avoid; }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="certificate">
                      <h1>Certificate of Completion</h1>
                      <hr>
                      <p>This is to certify that</p>
                      <h2>${studentName}</h2>
                      <p>has successfully completed the course</p>
                      <h3>${course.title}</h3>
                      <p>Course Description: ${course.description}</p>
                      <p>Tutor: ${course.tutorId || 'N/A'}</p>
                      <p>Duration: ${course.duration || 'N/A'}</p>
                      <p>Language: ${course.language || 'N/A'}</p>
                      <hr>
                      <p>Date of Completion: <b>${new Date().toLocaleDateString()}</b></p>
                      <div class="footer">
                        <div class="brand">Tutor Connect</div>
                        <div class="small">This certificate is auto-generated and not valid for all official purposes.</div>
                      </div>
                    </div>
                    <script>
                      window.onload = function() {
                        setTimeout(function() {
                          window.print();
                        }, 500);
                      };
                    </script>
                  </body>
                  </html>
                `);
                certWindow.document.close();
              })
              .catch(err => {
                console.error('Error fetching user profile:', err);
                // Fallback to email if profile fetch fails
                const studentName = studentEmail || 'Student';
                // (same certificate generation code as above but with fallback name)
              });
            });
          });
        }, 500);
          // After rendering, load YouTube IFrame API if needed
          if (courses.some(course => course.extra && course.extra.video && course.extra.video.some(([_, link]) => link.includes('youtube.com') || link.includes('youtu.be')))) {
            if (!window.YT) {
              let tag = document.createElement('script');
              tag.src = "https://www.youtube.com/iframe_api";
              document.body.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = function() {
              courses.forEach(course => {
                if (course.extra && course.extra.video && Array.isArray(course.extra.video)) {
                  course.extra.video.forEach(([title, link], idx) => {
                    let videoIdMatch = link.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
                    let videoId = videoIdMatch ? videoIdMatch[1] : null;
                    let playerDivId = `ytplayer-${course.id}-${idx}`;
                    if (videoId && document.getElementById(playerDivId)) {
                      let player = new YT.Player(playerDivId, {
                        height: '270',
                        width: '480',
                        videoId: videoId,
                        events: {
                          'onStateChange': function(event) {
                            if (event.data === YT.PlayerState.ENDED) {
                              console.log(`Video completed: ${title} (${link})`);
                              // Call backend to mark video as completed for progress
                              const token = localStorage.getItem('jwt');
                              fetch(`http://localhost:8080/api/courses/${course.id}/progress/video`, {
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
                          }
                        }
                      });
                    }
                  });
                }
              });
            };
          }
      })
      .catch(() => {
        document.getElementById('enrolledCoursesList').innerHTML = '<p>Error loading enrolled courses.</p>';
      });
  } else {
    document.getElementById('enrolledCoursesList').innerHTML = '<p>Please log in to see your enrolled courses.</p>';
  }
  const browseBtn = document.getElementById('browseCoursesBtn');
  const browseSection = document.getElementById('browseCoursesSection');
  const searchInput = document.getElementById('studentSearchBar');
  const resultsDiv = document.getElementById('studentSearchResults');

  if (browseBtn && browseSection && searchInput && resultsDiv) {
    browseBtn.addEventListener('click', function() {
      browseSection.style.display = 'block';
      searchInput.focus();
    });

    function handleSearchInput(inputElem) {
      const query = inputElem.value.trim();
      if (query.length === 0) {
        resultsDiv.innerHTML = '';
        return;
      }
      const token = localStorage.getItem('jwt');
      let studentEmail = null;
      // Decode JWT to get email (simple base64 decode, not secure, for demo)
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
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const courseId = btn.getAttribute('data-id');
              btn.disabled = true;
              btn.textContent = 'Enrolling...';
              fetch(`http://localhost:8080/api/courses/${courseId}/enroll`, {
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
          // Add click event to each course card (for details)
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

    searchInput.addEventListener('input', function() {
      handleSearchInput(searchInput);
    });
  }
});
// Student Dashboard Profile Edit UI
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
