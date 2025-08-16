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
          let assignmentsHtml = '';
          if (course.extra && course.extra.assignments && Array.isArray(course.extra.assignments)) {
            // Find student assignment completion
            let assignmentsDone = [];
            if (course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
              const studentObj = course.extra.students.find(s => s.email === studentEmail);
              if (studentObj && Array.isArray(studentObj.assignmentsDone)) {
                assignmentsDone = studentObj.assignmentsDone;
              }
            }
            let completedCount = 0;
            assignmentsHtml = '<b>Assignments:</b><ul>' + course.extra.assignments.map(([title, link]) => {
              const isDone = assignmentsDone.includes(title);
              if (isDone) completedCount++;
              return `<li>${title}: <a href="${link}" target="_blank">${link}</a> <span style="color:${isDone ? '#4caf50' : '#888'};font-weight:bold;">${isDone ? '✓ Done' : 'Not done'}</span></li>`;
            }).join('') + '</ul>';
            // Assignment progress bar
            if (course.extra.assignments.length > 0) {
              const percent = Math.round((completedCount / course.extra.assignments.length) * 100);
              assignmentsHtml += `<div style="margin:10px 0;"><label>Assignment Progress:</label>
                <div style="background:#eee;width:100%;height:16px;border-radius:8px;overflow:hidden;">
                  <div style="background:#2196f3;width:${percent}%;height:100%;transition:width 0.5s;"></div>
                </div>
                <span>${percent}% (${completedCount} of ${course.extra.assignments.length} assignments done)</span>
              </div>`;
            }
          }
          let quizzesHtml = '';
          let practiceBtn = '';
          if (course.extra && course.extra.quizzes && Array.isArray(course.extra.quizzes) && course.extra.quizzes.length > 0) {
            quizzesHtml = '';
            practiceBtn = `<button class="practice-quiz-btn" data-id="${course.id}" style="margin-top:10px;">Practice Quiz</button>`;
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
          if (progressPercent === 100 && assignmentPercent === 100) {
            certBtn = `<button class="cert-btn" data-id="${course.id}" style="margin-top:10px;">Get Certificate</button>`;
          }
          
          // Session Requests UI
          let sessionRequestsHtml = '';
          let totalRequests = 0;
          let requests = [];
          if (course.extra && course.extra.students && Array.isArray(course.extra.students) && studentEmail) {
            const studentObj = course.extra.students.find(s => s.email === studentEmail);
            if (studentObj && Array.isArray(studentObj.requests)) {
              requests = studentObj.requests;
              totalRequests = requests.length; // Count all requests, not just active ones
            }
          }
          sessionRequestsHtml += `<div style="margin:10px 0;">
            <b>Session Requests:</b>
            <div style="margin-bottom:10px;">
              <button class="requestSessionBtn" data-id="${course.id}" ${totalRequests >= 5 ? 'disabled' : ''} style="margin-bottom:5px; background: ${totalRequests >= 5 ? '#ccc' : '#2196f3'}; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: ${totalRequests >= 5 ? 'not-allowed' : 'pointer'};">Request Session (${totalRequests}/5)</button>
              ${totalRequests >= 5 ? `<button class="extraRequestBtn" data-id="${course.id}" style="margin-left:10px; background: #ff9800; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer;">Extra Request</button>` : ''}
            </div>
            <div style="margin-top:10px;">
              ${requests.length === 0 ? '<p><i>No session requests yet.</i></p>' : requests.map((r, index) => `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; background: ${r.status === 'accepted' ? '#f0fff0' : r.status === 'rejected' ? '#fff0f0' : r.status === 'done' ? '#f0f8ff' : '#fffef0'}; ${r.isExtra ? 'border-left: 4px solid #ff9800;' : ''}">
                  <b>${r.isExtra ? '🔶 EXTRA ' : ''}Request ${index + 1}:</b>
                  ${r.isExtra ? '<br><span style="color: #ff9800; font-weight: bold; font-size: 12px;">⚠️ Extra request beyond 5-request limit</span>' : ''}
                  <br><b>Status:</b> <span style="color: ${r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'done' ? 'blue' : 'orange'}; font-weight: bold;">${r.status.toUpperCase()}</span>
                  ${r.status === 'accepted' ? `<br><b>Jitsi Link:</b> <a href='${r.jitsiLink}' target='_blank' style='color: #2196f3;'>${r.jitsiLink}</a>` : ''}
                  ${r.scheduledTime ? `<br><b>Scheduled Time:</b> <span style='color: #333; font-weight: bold;'>${new Date(r.scheduledTime).toLocaleString()}</span>` : ''}
                  ${r.comment ? `<br><b>Tutor Message:</b> <span style='color:#2196f3; font-style: italic;'>"${r.comment}"</span>` : ''}
                  ${r.status === 'done' ? `<br><span style='color:green;font-weight:bold;'>✓ Session Completed</span>` : ''}
                  ${r.requestedAt ? `<br><small style='color: #666;'>Requested: ${new Date(r.requestedAt).toLocaleString()}</small>` : ''}
                </div>
              `).join('')}
            </div>
          </div>`;
          
          return `
            <div class="course-card" data-id="${course.id}" style="cursor:pointer;">
              <h4>${course.title}</h4>
              <p>${course.description}</p>
              <p><strong>Language:</strong> ${course.language}</p>
              <p><strong>Price:</strong> $${course.price}</p>
              ${progressBar}
              ${videosHtml}
              ${docsHtml}
              ${assignmentsHtml}
              ${quizzesHtml}
              ${practiceBtn}
              ${certBtn}
              ${sessionRequestsHtml}
              <button onclick="window.location.href='course_details.html?id=${course.id}'">View Details</button>
            </div>
          `;
        }).join('');
        
        // Setup event handlers after DOM is updated
        setTimeout(() => {
        // Session Request button click handler
        document.querySelectorAll('.requestSessionBtn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const courseId = btn.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Requesting...';
            fetch(`http://localhost:8080/api/courses/${courseId}/session-request`, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt')
              }
            })
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  btn.textContent = 'Requested';
                } else {
                  btn.textContent = result.message || 'Error';
                  btn.disabled = false;
                }
                // Optionally refresh UI
                setTimeout(() => window.location.reload(), 1200);
              })
              .catch((err) => {
                btn.textContent = 'Error';
                btn.disabled = false;
                alert('Session request failed: ' + err);
              });
          });
        });
        
        // Extra Request button click handler
        document.querySelectorAll('.extraRequestBtn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const courseId = btn.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Requesting...';
            fetch(`http://localhost:8080/api/courses/${courseId}/extra-session-request`, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt')
              }
            })
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  btn.textContent = 'Extra Request Sent';
                } else {
                  btn.textContent = result.message || 'Error';
                  btn.disabled = false;
                }
                // Optionally refresh UI
                setTimeout(() => window.location.reload(), 1200);
              })
              .catch((err) => {
                btn.textContent = 'Error';
                btn.disabled = false;
                alert('Extra session request failed: ' + err);
              });
          });
        });
        
        // Practice Quiz button click handler
        document.querySelectorAll('.practice-quiz-btn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const courseId = btn.getAttribute('data-id');
            const course = courses.find(c => c.id === courseId);
            if (!course || !course.extra || !Array.isArray(course.extra.quizzes) || course.extra.quizzes.length === 0) {
              alert('No quiz questions available for this course.');
              return;
            }
            // Save quiz questions to localStorage for quiz.html
            localStorage.setItem('practiceQuizData', JSON.stringify({
              courseId: courseId,
              questions: course.extra.quizzes
            }));
            window.location.href = 'quiz.html';
          });
        });
        
        // Certificate button click handler
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
            });
          });
        });
        }, 100);
          // After rendering, load YouTube IFrame API if needed
          // Note: Ad blocker errors from DoubleClick/Google Ads are harmless and expected
          if (courses.some(course => {
            return course.extra && course.extra.video && course.extra.video.some(videoArr => {
              return videoArr[1] && (videoArr[1].includes('youtube.com') || videoArr[1].includes('youtu.be'));
            });
          })) {
            if (!window.YT) {
              let tag = document.createElement('script');
              tag.src = "https://www.youtube.com/iframe_api";
              tag.onerror = function() {
                console.warn('YouTube IFrame API failed to load. Videos may not work properly.');
              };
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
