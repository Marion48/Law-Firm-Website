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

// Enhanced Horizontal Scroll with Dot Navigation for Services
function initServicesCarousel() {
  const scrollContainer = document.getElementById('services-scroll');
  const dotsContainer = document.getElementById('scroll-dots');

  
  // Only run if the new scroll container exists
  if (!scrollContainer || !dotsContainer) return;
  
  const cards = scrollContainer.querySelectorAll('.service-card-hz');
  const cardCount = cards.length;
  
  // Create navigation dots
  for (let i = 0; i < cardCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'scroll-dot';
    dot.setAttribute('aria-label', `Go to service ${i + 1}`);
    dot.addEventListener('click', () => {
      scrollToCard(i);
    });
    dotsContainer.appendChild(dot);
  }
  
  const dots = dotsContainer.querySelectorAll('.scroll-dot');
  if (dots.length > 0) dots[0].classList.add('active');
  
  function updateDots() {
    if (!scrollContainer.firstElementChild) return;
    
    const scrollLeft = scrollContainer.scrollLeft;
    const cardWidth = scrollContainer.firstElementChild.offsetWidth + 
                      parseInt(getComputedStyle(scrollContainer).gap);
    const activeIndex = Math.min(cardCount - 1, Math.round(scrollLeft / cardWidth));
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === activeIndex);
    });
  }
  
  function scrollToCard(index) {
    const cardWidth = scrollContainer.firstElementChild.offsetWidth + 
                      parseInt(getComputedStyle(scrollContainer).gap);
    const targetScroll = index * cardWidth;
    
    scrollContainer.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }
  
  scrollContainer.addEventListener('scroll', updateDots);
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateDots, 150);
  });
  
  updateDots();
}

// Call this function after the DOM is loaded
initServicesCarousel();
    });

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

    // PRACTICE AREAS (comment out or remove this section)
/*
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
*/

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
            <p style="margin-top:10px;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-sm">Read Article</a></p>
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
async function loadAllInsights() {
  const container = document.getElementById("all-insights");
  if (!container) return;

  try {
    const res = await fetch("insights/data.json");
    const insights = await res.json();

    container.innerHTML = insights.map(insight => `
      <article class="post-card">
        <a href="${insight.url}" target="_blank" rel="noopener noreferrer" class="insight-link">
          <div class="blog-img">
            <img src="${insight.image}" alt="${insight.title}">
          </div>
          <div class="post-content">
            <h3>${insight.title}</h3>
            <p>${insight.excerpt}</p>
            <span class="read-article">Read Article</span>
          </div>
        </a>
      </article>
    `).join("");
  } catch (err) {
    console.error("Failed to load insights", err);
  }
}

document.addEventListener("DOMContentLoaded", loadAllInsights);

// Add this at the END of your main.js file:

// ============================================
// HERO VIDEO AUTO-RESTART FIX
// ============================================
function initHeroVideo() {
  const heroVideo = document.querySelector('.hero-video');
  
  if (!heroVideo) return;
  
  console.log('Initializing hero video...');
  
  // Function to restart video
  function restartVideo() {
    // Reset to beginning
    heroVideo.currentTime = 0;
    
    // Load and play
    heroVideo.load();
    
    // Try to play with a small delay
    setTimeout(() => {
      const playPromise = heroVideo.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Video autoplay was prevented:", error.name);
          // Add a fallback for user interaction
          const playOnInteraction = () => {
            heroVideo.play();
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
        });
      }
    }, 300); // Increased delay for better reliability
  }
  
  // Initial play
  restartVideo();
  
  // Restart when page becomes visible again
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && heroVideo.paused) {
      console.log('Page visible again - restarting video');
      restartVideo();
    }
  });
  
  // Restart on pageshow event (browser back/forward navigation)
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      console.log('Page restored from cache - restarting video');
      restartVideo();
    }
  });
  
  // Also restart on page load (extra safety)
  window.addEventListener('load', function() {
    setTimeout(restartVideo, 500);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroVideo);
} else {
  // DOM already loaded
  initHeroVideo();
}