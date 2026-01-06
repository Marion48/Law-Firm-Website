// js/insights-loader.js — PREMIUM VERSION (CLEAN)
class InsightsLoader {
  constructor() {
    this.insights = [];
    this.cacheKey = 'byron_insights_cache';
    this.cacheTimestampKey = 'byron_insights_timestamp';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes

    const path = window.location.pathname;
    this.isHomepage =
      path === '/' ||
      path === '/index.html' ||
      path === '';

    this.isInsightsPage = path.includes('insights.html');
  }

  async init() {
    try {
      await this.loadInsights();
      this.render();
    } catch (error) {
      console.error('InsightsLoader init failed:', error);
      this.showError();
    }
  }

  async loadInsights() {
    try {
      const res = await fetch('/api/get-insights');

      if (res.ok) {
        const data = await res.json();
        this.insights = Array.isArray(data) ? data : [];
        this.cache();
        return;
      }

      throw new Error('API failed');
    } catch {
      const cached = this.getCache();
      this.insights = cached || [];
    }
  }

  cache() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.insights));
      localStorage.setItem(this.cacheTimestampKey, Date.now());
    } catch {}
  }

  getCache() {
    try {
      const ts = localStorage.getItem(this.cacheTimestampKey);
      const data = localStorage.getItem(this.cacheKey);
      if (!ts || !data) return null;

      if (Date.now() - Number(ts) > this.cacheDuration) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  render() {
    const published = this.insights.filter(i => i.status === 'published');

    if (this.isHomepage) {
      this.renderHomepage(published.slice(0, 3));
    }

    if (this.isInsightsPage) {
      this.renderInsightsPage(published);
    }
  }

  renderHomepage(items) {
    const el = document.getElementById('insights-container');
    if (!el) return;

    if (!items.length) {
      el.innerHTML = this.empty('No insights published yet.');
      return;
    }

    // Add premium container styling
    el.className = 'premium-insights-grid homepage-grid';
    el.innerHTML = items.map(i => this.premiumCard(i)).join('');
  }

  renderInsightsPage(items) {
    const el = document.getElementById('all-insights');
    if (!el) return;

    if (!items.length) {
      el.innerHTML = this.empty('No insights published yet.');
      return;
    }

    // Add premium container styling
    el.className = 'premium-insights-grid insights-page-grid';
    el.innerHTML = items.map(i => this.premiumCard(i, true)).join('');
  }

  premiumCard(insight, isInsightsPage = false) {
    const img = insight.image || '/images/default-insight.jpg';
    const date = this.formatDate(insight.date || insight.createdAt);
    const url = `/api/insight-page?slug=${insight.slug}`;
    const excerpt = insight.excerpt
      ? insight.excerpt.slice(0, 150) + '…'
      : '';
    
    // REMOVED: Category badge - no longer showing "Legal Insight"

    return `
      <article class="premium-insight-card ${isInsightsPage ? 'full-width' : ''}">
        <!-- Image Container with Overlay -->
        <div class="card-image-container">
          <img src="${img}" alt="${insight.title}" loading="lazy" class="card-image">
          <div class="image-overlay"></div>
          
          <!-- Date Badge Only -->
          <div class="date-badge">
            <i class="far fa-calendar"></i> ${date}
          </div>
        </div>
        
        <!-- Card Content -->
        <div class="card-content">
          <h3 class="card-title">${insight.title}</h3>
          
          <p class="card-excerpt">${excerpt}</p>
          
          <div class="card-footer">
            <a href="${url}" class="premium-read-btn">
              Read Insight
              <i class="fas fa-arrow-right"></i>
            </a>
            
            <!-- REMOVED: Card meta section (removed 5 min read and Byron N. & Co.) -->
          </div>
        </div>
      </article>
    `;
  }

  formatDate(d) {
    try {
      return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }

  empty(msg) {
    return `
      <div class="empty-state">
        <i class="fas fa-newspaper"></i>
        <p>${msg}</p>
      </div>
    `;
  }

  showError() {
    const ids = ['insights-container', 'all-insights'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load insights. Please try again later.</p>
          </div>
        `;
      }
    });
  }
}

// Add CSS styles dynamically
const premiumStyles = `
/* Premium Insights Grid */
.premium-insights-grid {
  display: grid;
  gap: 2rem;
  margin: 2rem 0;
}

.homepage-grid {
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

.insights-page-grid {
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

/* Premium Insight Card */
.premium-insight-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
  border: 1px solid rgba(128, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.premium-insight-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  border-color: rgba(128, 0, 0, 0.3);
}

/* Image Container */
.card-image-container {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}

.premium-insight-card:hover .card-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
}

/* Date Badge Only */
.date-badge {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #0A2463;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* REMOVED: .category-badge styles */

/* Card Content */
.card-content {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0A2463;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-excerpt {
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 4.8em; /* Ensures consistent height even if excerpt is short */
}

/* Card Footer */
.card-footer {
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 1.5rem;
  display: flex;
  justify-content: flex-start; /* Changed from space-between to flex-start */
  align-items: center;
}

.premium-read-btn {
  background: linear-gradient(135deg, #800000, #a00000);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(128, 0, 0, 0.2);
}

.premium-read-btn:hover {
  background: linear-gradient(135deg, #a00000, #c00000);
  transform: translateX(5px);
  box-shadow: 0 6px 16px rgba(128, 0, 0, 0.3);
  color: white;
}

/* REMOVED: .card-meta and .meta-item styles */

/* Empty and Error States */
.empty-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
}

.empty-state i, .error-state i {
  font-size: 3rem;
  color: #C6A961;
  margin-bottom: 1rem;
}

.empty-state p, .error-state p {
  color: #4a5568;
  font-size: 1.1rem;
}

.error-state i {
  color: #e53e3e;
}

/* Responsive Design */
@media (max-width: 768px) {
  .homepage-grid,
  .insights-page-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .card-image-container {
    height: 200px;
  }
  
  .card-title {
    font-size: 1.3rem;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .premium-read-btn {
    align-self: stretch;
    justify-content: center;
  }
}

@media (min-width: 1024px) {
  .homepage-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .insights-page-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
`;

// Add styles to the page
document.addEventListener('DOMContentLoaded', () => {
  // Inject the premium styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = premiumStyles;
  document.head.appendChild(styleSheet);
  
  // Initialize the loader
  new InsightsLoader().init();
});