// js/insights-loader.js - Optimized Version
class InsightsLoader {
  constructor() {
    this.insights = [];
    this.baseURL = window.location.origin;
    this.cacheKey = 'byron_insights_cache';
    this.cacheTimestampKey = 'byron_insights_timestamp';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    
    // Check if we're on specific pages
    this.isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    this.isInsightsPage = window.location.pathname.includes('insights.html');
    this.isInsightPage = window.location.pathname.includes('/insight/');
  }

  async init() {
    try {
      await this.loadInsights();
      this.renderInsights();
      this.setupEventListeners();
    } catch (error) {
      console.error('Insights loader initialization failed:', error);
      this.showErrorState();
    }
  }

  async loadInsights() {
    try {
      // Try to load from API first
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'get' })
      });

      if (response.ok) {
        this.insights = await response.json();
        
        // Cache the data
        this.cacheData();
      } else {
        // Try cache if API fails
        const cached = this.getCachedData();
        if (cached) {
          this.insights = cached;
          console.log('Loaded insights from cache');
        } else {
          // Fallback to local JSON file
          await this.loadFallbackData();
        }
      }

      console.log(`Loaded ${this.insights.length} insights`);
      
    } catch (error) {
      console.error('Failed to load insights:', error);
      
      // Try cache on error
      const cached = this.getCachedData();
      if (cached) {
        this.insights = cached;
      } else {
        this.insights = [];
      }
    }
  }

  async loadFallbackData() {
    try {
      const response = await fetch('public/data/insights.json');
      if (response.ok) {
        this.insights = await response.json();
        this.cacheData();
      } else {
        this.insights = [];
      }
    } catch (error) {
      this.insights = [];
    }
  }

  cacheData() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.insights));
      localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
    } catch (error) {
      // Local storage might be full or not available
      console.warn('Could not cache insights:', error);
    }
  }

  getCachedData() {
    try {
      const cachedData = localStorage.getItem(this.cacheKey);
      const cachedTimestamp = localStorage.getItem(this.cacheTimestampKey);
      
      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp);
        if (age < this.cacheDuration) {
          return JSON.parse(cachedData);
        }
      }
    } catch (error) {
      console.warn('Could not read cache:', error);
    }
    return null;
  }

  renderInsights() {
    // Render on homepage (first 3 insights)
    if (this.isHomepage) {
      this.renderHomepageInsights();
    }
    
    // Render on insights page (all insights)
    if (this.isInsightsPage) {
      this.renderAllInsights();
    }
    
    // Render individual insight page
    if (this.isInsightPage) {
      this.renderIndividualInsight();
    }
  }

  renderHomepageInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const latestInsights = this.insights.slice(0, 3);
    
    if (latestInsights.length === 0) {
      container.innerHTML = this.createEmptyState('No insights published yet. Check back soon!');
      return;
    }

    container.innerHTML = latestInsights.map(insight => this.createInsightCard(insight)).join('');
  }

  renderAllInsights() {
    const container = document.getElementById('all-insights');
    if (!container) return;

    if (this.insights.length === 0) {
      container.innerHTML = this.createEmptyState('No insights published yet. Check back soon!');
      return;
    }

    container.innerHTML = this.insights.map(insight => this.createInsightCard(insight)).join('');
  }

  createInsightCard(insight) {
    const imageUrl = insight.image || '/images/default-insight.jpg';
    const date = this.formatDate(insight.date || insight.createdAt);
    const url = insight.url || `/insight/${insight.slug}`;
    const excerpt = insight.excerpt ? 
      (insight.excerpt.length > 120 ? insight.excerpt.substring(0, 120) + '...' : insight.excerpt) : 
      '';
    
    // Determine featured badge
    const featuredBadge = insight.featured ? 
      '<span class="featured-badge" style="position: absolute; top: 10px; right: 10px; background: var(--gold); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; z-index: 2;">Featured</span>' : 
      '';

    return `
      <article class="post-card" style="position: relative;">
        <a href="${url}" class="insight-link" style="text-decoration: none; color: inherit; display: block;">
          <div class="blog-img" style="position: relative; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
            <img src="${imageUrl}" alt="${insight.title}" loading="lazy" 
                 style="width: 100%; height: 200px; object-fit: cover; transition: transform 0.3s ease;">
            ${featuredBadge}
          </div>
          <div class="post-content">
            <div class="post-meta" style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">
              <span class="post-date">${date}</span>
              ${insight.status === 'published' ? '<span style="margin-left: 0.5rem; color: #10b981;">• Published</span>' : ''}
            </div>
            <h3 style="font-family: \'Cormorant Garamond\', serif; font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--navy); line-height: 1.3;">
              ${insight.title}
            </h3>
            <p style="color: var(--text); margin-bottom: 1rem; line-height: 1.5;">
              ${excerpt}
            </p>
            <span class="read-more" style="color: var(--gold); font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
              Read Insight →
            </span>
          </div>
        </a>
      </article>
    `;
  }

  createEmptyState(message) {
    return `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <div style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
          <i class="fas fa-file-lines" style="font-size: 2rem; color: #999;"></i>
        </div>
        <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--navy);">
          No Insights Yet
        </h3>
        <p style="color: var(--text); margin-bottom: 1.5rem;">
          ${message}
        </p>
      </div>
    `;
  }

  renderIndividualInsight() {
    // If we're on an individual insight page, the dynamic page generator will handle it
    // This is just a fallback for static insight pages
    const slug = window.location.pathname.split('/insight/')[1]?.replace('.html', '');
    if (!slug) return;

    const insight = this.insights.find(i => i.slug === slug);
    if (insight) {
      // Update any dynamic elements on the page
      this.updateInsightPageMetadata(insight);
    }
  }

  updateInsightPageMetadata(insight) {
    // Update page title
    if (insight.title) {
      document.title = `${insight.title} • Byron N. & Co. Advocates`;
    }
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && insight.excerpt) {
      metaDescription.setAttribute('content', insight.excerpt);
    }
  }

  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  showErrorState() {
    const errorHtml = `
      <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <div style="width: 80px; height: 80px; background: #fee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ef4444;"></i>
        </div>
        <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--navy);">
          Unable to Load Insights
        </h3>
        <p style="color: var(--text); margin-bottom: 1.5rem;">
          Please check your internet connection and try again.
        </p>
        <button onclick="window.location.reload()" style="background: var(--navy); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">
          Retry
        </button>
      </div>
    `;

    const containers = ['insights-container', 'all-insights'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = errorHtml;
      }
    });
  }

  setupEventListeners() {
    // Auto-refresh insights every 10 minutes on insights page
    if (this.isInsightsPage) {
      setInterval(async () => {
        try {
          await this.loadInsights();
          this.renderInsights();
        } catch (error) {
          console.log('Background refresh failed:', error);
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  }
}

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.insightsLoader = new InsightsLoader();
    window.insightsLoader.init();
  });
}