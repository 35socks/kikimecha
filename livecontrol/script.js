// Copy-to-clipboard for the setup command
document.querySelectorAll('[data-copy]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var el = document.querySelector(btn.dataset.copy);
    if (!el || !navigator.clipboard) return;
    navigator.clipboard.writeText(el.textContent).then(function () {
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = 'Copy'; }, 1400);
    });
  });
});

// Gentle fade-in as sections scroll into view
var targets = document.querySelectorAll('.card, .steps li, .panel, .download, details');
targets.forEach(function (t) { t.classList.add('reveal'); });
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  targets.forEach(function (t) { io.observe(t); });
} else {
  targets.forEach(function (t) { t.classList.add('in'); });
}
