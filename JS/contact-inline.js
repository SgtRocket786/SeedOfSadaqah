document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const msg = document.getElementById('contactMsg');
  msg.textContent = 'Thanks! We\'ll get back to you.';
  e.target.reset();
});