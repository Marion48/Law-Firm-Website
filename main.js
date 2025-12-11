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

  // Animated hero title word rotation
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    const words = ['Here To Make Your Path Forward Simpler.','Sharp and Reliable Legal insights.'];
    let currentWordIndex = 0;
    
    // Set initial text
    heroTitle.textContent = words[0];
    
    function rotateWords() {
      // Fade out current word
      heroTitle.style.opacity = '0';
      heroTitle.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        // Change to next word
        currentWordIndex = (currentWordIndex + 1) % words.length;
        heroTitle.textContent = words[currentWordIndex];
        
        // Fade in new word
        heroTitle.style.opacity = '0.9';
        heroTitle.style.transform = 'translateY(0)';
      }, 800); // Wait for fade out to complete
    }
    
    // Start rotation every 3 seconds
    setInterval(rotateWords, 3000);
  }

  // Smooth Scroll with Scroll-triggered Animations
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const navHeight = document.querySelector('.nav').offsetHeight;
          const targetPosition = targetElement.offsetTop - navHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Scroll-triggered Reveal Animations - Works both directions
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      const revealPoint = 100;
      
      revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        
        // Check if element is in viewport
        if (elementTop < windowHeight - revealPoint && elementBottom > 0) {
          element.classList.add('revealed');
        } else {
          element.classList.remove('revealed');
        }
      });
    };
    
    // Initial check
    revealOnScroll();
    
    // Check on scroll with throttling for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          revealOnScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
    
    // Also check on resize
    window.addEventListener('resize', revealOnScroll);
  }

  // Initialize smooth scroll and scroll reveal
  initSmoothScroll();
  initScrollReveal();

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
// Floating page scroll effects
document.addEventListener('DOMContentLoaded', function() {
  let lastScrollTop = 0;
  const scrollProgress = document.querySelector('.scroll-progress');
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const body = document.body;
    
    // Update scroll progress
    if (scrollProgress) {
      const winHeight = document.documentElement.clientHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
      scrollProgress.style.width = scrollPercent + '%';
    }
    
    // Determine scroll direction
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      body.classList.add('scrolling-down');
      body.classList.remove('scrolling-up');
    } else if (scrollTop < lastScrollTop && scrollTop > 100) {
      body.classList.add('scrolling-up');
      body.classList.remove('scrolling-down');
    } else {
      body.classList.remove('scrolling-down', 'scrolling-up');
    }
    
    // Dynamic side lighting
    const scrollPercentage = (scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    const dynamicOpacity = 0.4 + (scrollPercentage * 0.005);
    const dynamicWidth = 80 + (scrollPercentage * 0.4);
    
    document.body.style.setProperty('--side-opacity', Math.min(0.9, dynamicOpacity));
    document.body.style.setProperty('--side-width', Math.min(120, dynamicWidth) + 'px');
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
});