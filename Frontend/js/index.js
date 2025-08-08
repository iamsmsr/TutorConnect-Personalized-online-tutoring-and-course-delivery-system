document.querySelector('.search-btn').addEventListener('click', function() {
  const query = document.querySelector('.hero-search').value;
  alert('Search for: ' + query);
});

document.querySelector('.register-btn').addEventListener('click', function() {
  window.location.href = 'signup.html';
});
document.querySelector('.login-btn').addEventListener('click', function() {
  window.location.href = 'login.html';
});

// Hero background slideshow
const heroImages = [
  '../images/hero-bg1.jpg',
  '../images/hero-bg2.jpg',
  '../images/hero-bg3.jpg'
];
let currentHero = 0;
const heroSection = document.querySelector('.hero');

function changeHeroBg() {
  heroSection.style.backgroundImage = `url('${heroImages[currentHero]}')`;
  currentHero = (currentHero + 1) % heroImages.length;
}

changeHeroBg();
setInterval(changeHeroBg, 5000);