// login.js

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    email: form.email.value,
    password: form.password.value
  };
  fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if(result.token) {
      alert('Login successful!');
      localStorage.setItem('token', result.token);
      // Redirect based on role
      if(result.role === 'STUDENT') {
        window.location.href = 'student_dashboard.html';
      } else if(result.role === 'TUTOR') {
        window.location.href = 'tutor_dashboard.html';
      } else if(result.role === 'ADMIN') {
        window.location.href = 'admin_dashboard.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } else {
      alert(result.message || 'Login failed');
    }
  })
  .catch(() => alert('Error connecting to server'));
});
