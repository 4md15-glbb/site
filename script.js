const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    obs.unobserve(entry.target);
  });
}, { threshold: 0.16 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelector('.consultation-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const initialText = button.textContent;

  button.disabled = true;
  button.textContent = 'Заявка отправлена';

  setTimeout(() => {
    form.reset();
    button.disabled = false;
    button.textContent = initialText;
  }, 1500);
});
