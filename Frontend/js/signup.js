
// signup.js

document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    username: form.username.value,
    email: form.email.value,
    passwordHash: form.password.value
  };
  fetch('https://tutorconnect-backend-0yki.onrender.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if(result.success) {
      alert('Sign up successful! Please log in.');
      window.location.href = 'login.html';
    } else {
      alert(result.message || 'Sign up failed');
    }
  })
  .catch(() => alert('Error connecting to server'));
});
