// Student Dashboard Profile Edit UI
function showEditProfileForm() {
  const token = localStorage.getItem('token');
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
