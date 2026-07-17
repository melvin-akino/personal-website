/* ===================================================
   Vin T. Aquino — main.js
   Handles: scroll-spy, reveal, mobile menu, contact form
   =================================================== */

/* ── 1. NAV SCROLL STATE ─────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

/* ── 2. SCROLL SPY ───────────────────────────────── */
const SECTIONS = ['about', 'services', 'stack', 'portfolio', 'contact'];

function updateActiveLink() {
  const offset = 140;
  let current = 'home';
  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
  }
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href').replace('#', '');
    a.classList.toggle('active', href === current);
  });
}
window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();

/* ── 3. MOBILE MENU ──────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close when a mobile link is clicked
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  });
});

/* ── 4. REVEAL ON SCROLL ─────────────────────────── */
function initReveal() {
  const els = Array.from(document.querySelectorAll('.reveal'));

  // Items already in view get .in immediately
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.classList.add('in');
    } else {
      el.classList.add('reveal-pending');
    }
  });

  if (!('IntersectionObserver' in window)) {
    els.forEach(el => { el.classList.remove('reveal-pending'); el.classList.add('in'); });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.remove('reveal-pending');
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });

  els.forEach(el => {
    if (el.classList.contains('reveal-pending')) io.observe(el);
  });

  // Safety net — reveal everything after 1.2 s
  setTimeout(() => {
    els.forEach(el => { el.classList.remove('reveal-pending'); el.classList.add('in'); });
  }, 1200);
}
initReveal();

/* ── 5. CONTACT FORM ─────────────────────────────── */
const form        = document.getElementById('contact-form');
const successBox  = document.getElementById('form-success');
const successMsg  = document.getElementById('success-msg');
const submitBtn   = document.getElementById('submit-btn');
const statusBanner= document.getElementById('form-status-banner');

// Field references
const fields = {
  name:    { input: document.getElementById('name'),    err: document.getElementById('err-name'),    wrap: document.getElementById('field-name')    },
  email:   { input: document.getElementById('email'),   err: document.getElementById('err-email'),   wrap: document.getElementById('field-email')   },
  details: { input: document.getElementById('details'), err: document.getElementById('err-details'), wrap: document.getElementById('field-details') },
};

function setError(key, msg) {
  fields[key].wrap.classList.toggle('error', !!msg);
  fields[key].err.textContent = msg || '';
}
function clearError(key) { setError(key, ''); }

// Live clear on input
Object.keys(fields).forEach(k => {
  fields[k].input.addEventListener('input', () => clearError(k));
});

function validate() {
  let ok = true;
  const name    = fields.name.input.value.trim();
  const email   = fields.email.input.value.trim();
  const details = fields.details.input.value.trim();

  if (!name) { setError('name', 'Required'); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('email', 'Valid email required'); ok = false;
  }
  if (details.length < 12) {
    setError('details', 'A sentence or two helps me prepare'); ok = false;
  }
  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const ARROW_SVG = '<svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function resetBtn(label) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = (label || 'Submit inquiry') + ' ' + ARROW_SVG;
  }

  function showBanner(msg) {
    statusBanner.removeAttribute('style'); // clear any inline override
    statusBanner.className   = 'form-status-banner error';
    statusBanner.textContent = msg;
  }

  submitBtn.disabled  = true;
  submitBtn.innerHTML = 'Sending… ' + ARROW_SVG;
  statusBanner.className = 'form-status-banner'; // hide via CSS class (no inline style)

  try {
    const res = await fetch(form.action, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     fields.name.input.value.trim(),
        email:    fields.email.input.value.trim(),
        company:  document.getElementById('company').value.trim(),
        service:  document.getElementById('service').value,
        details:  fields.details.input.value.trim(),
        budget:   document.getElementById('budget').value,
        timeline: document.getElementById('timeline').value,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      const firstName = fields.name.input.value.trim().split(' ')[0];
      successMsg.textContent   = `Thanks, ${firstName}! I'll respond within one business day.`;
      form.style.display       = 'none';
      successBox.style.display = 'block';
    } else {
      showBanner(json.error || 'Something went wrong — please try again or email directly.');
      resetBtn();
    }
  } catch (err) {
    showBanner('Network error — please check your connection and try again.');
    resetBtn();
  }
});
