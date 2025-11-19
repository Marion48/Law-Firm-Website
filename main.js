// main.js - dynamic loader + basic interactions + form handling
document.addEventListener('DOMContentLoaded', () => {
  // NAV toggle
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
  }

  // footer year
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Scroll reveal (IntersectionObserver)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.animate-up, .animate-fade, .post-card, .hero-card').forEach(el => {
    observer.observe(el);
  });

  // Load content.json and populate the page
  fetch('content.json').then(r => {
    if (!r.ok) throw new Error('Failed to fetch content.json');
    return r.json();
  }).then(data => {
    // HERO
    if (data.hero) {
      const ht = document.getElementById('hero-title');
      const hs = document.getElementById('hero-subtitle');
      const hb = document.getElementById('hero-btn');
      if (ht) ht.textContent = data.hero.title || ht.textContent;
      if (hs) hs.textContent = data.hero.subtitle || hs.textContent;
      if (hb) hb.textContent = data.hero.button_text || hb.textContent;
    }

    // PRACTICE AREAS
    const pa = document.getElementById('practice-area-list');
    if (pa && Array.isArray(data.practiceAreas)) {
      pa.innerHTML = '';
      data.practiceAreas.forEach(area => {
        const a = document.createElement('a');
        a.className = 'practice-card';
        a.href = area.file || '#';
        a.innerHTML = `<h3>${area.title}</h3><p class="small">${area.summary || ''}</p>`;
        pa.appendChild(a);
      });
    }

    // TEAM
    const tg = document.getElementById('team-grid');
    if (tg && Array.isArray(data.team)) {
      tg.innerHTML = '';
      data.team.forEach(member => {
        const fig = document.createElement('figure');
        fig.className = 'team-card';
        fig.innerHTML = `
          <img src="${member.image || 'images/placeholder-team.jpg'}" alt="${member.name || 'Team member'}" loading="lazy">
          <figcaption>
            <p class="name">${member.name}</p>
            <p class="role">${member.role}</p>
          </figcaption>
        `;
        tg.appendChild(fig);
      });
    }

    // INSIGHTS (homepage preview)
    const ic = document.getElementById('insights-container');
    if (ic && Array.isArray(data.insights)) {
      ic.innerHTML = '';
      data.insights.forEach(item => {
        const div = document.createElement('div');
        div.className = 'post-card';
        div.innerHTML = `
          <img src="${item.image || 'images/insight-cover.jpg'}" alt="${item.title}">
          <div style="padding:12px;">
            <h3>${item.title}</h3>
            <p class="excerpt">${item.excerpt || ''}</p>
            <p style="margin-top:10px;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-sm">Read Article</a></p>
          </div>
        `;
        ic.appendChild(div);
      });
    }

    // INSIGHTS PAGE (all insights)
    const all = document.getElementById('all-insights');
    if (all && Array.isArray(data.insights)) {
      all.innerHTML = '';
      data.insights.forEach(item => {
        const div = document.createElement('div');
        div.className = 'post-card';
        div.innerHTML = `
          <img src="${item.image || 'images/insight-cover.jpg'}" alt="${item.title}">
          <div style="padding:12px;">
            <h3>${item.title}</h3>
            <p class="excerpt">${item.excerpt || ''}</p>
            <p style="margin-top:10px;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-sm">Read on LinkedIn</a></p>
          </div>
        `;
        all.appendChild(div);
      });
    }
  }).catch(err => {
    console.error('Failed to load content.json', err);
  });

  // Contact form handling (Formspree)
  const form = document.getElementById('contact-form');
  const msg = document.getElementById('form-msg');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = 'Sending...';
      const data = new FormData(form);
      try {
        const res = await fetch(form.action, {
          method: form.method,
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          if (msg) msg.textContent = "Thanks — we received your message. We'll be in touch.";
          form.reset();
        } else {
          const text = await res.text();
          console.log('Form error status', res.status, text);
          let json = null;
          try { json = JSON.parse(text); } catch(e){/*not json*/}
          if (msg) msg.textContent = (json && json.error) ? json.error : "An error occurred. Please try again.";
        }
      } catch (err) {
        console.error('Form submission failed', err);
        if (msg) msg.textContent = "Network error. Please try again later.";
      }
    });
  }
});
