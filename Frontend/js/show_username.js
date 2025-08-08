// Utility to get username from JWT
function getUsernameFromJWT() {
  const token = localStorage.getItem('jwt');
  console.log('JWT Token:', token); // Debug
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('JWT Payload:', payload); // Debug
    return payload.sub || payload.username || null;
  } catch (e) {
    console.error('JWT Parse Error:', e); // Debug
    return null;
  }
}

function showUsernameInNavbar() {
  const token = localStorage.getItem('jwt');
  console.log('JWT Token:', token); // Debug
  
  // Find navbar buttons container
  const navbarButtons = document.querySelector('.navbar-buttons');
  
  if (token && navbarButtons) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT Payload:', payload); // Debug
      const username = payload.username || payload.sub.split('@')[0];
      // Hide login/register buttons and show username
      navbarButtons.innerHTML = `<span style="color: white; font-weight: bold;">Welcome, ${username}</span>`;
    } catch (e) {
      console.error('JWT Parse Error:', e);
    }
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showUsernameInNavbar);
} else {
  showUsernameInNavbar();
}
