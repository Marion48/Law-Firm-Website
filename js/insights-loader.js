// js/insights-loader.js - COMPLETE WORKING VERSION
class InsightsLoader {
  constructor() {
    this.insights = [];
    this.baseURL = window.location.origin;
    this.cacheKey = 'byron_insights_cache';
    this.cacheTimestampKey = 'byron_insights_timestamp';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    
    // Check if we're on specific pages
    this.isHomepage = window.location.pathname === '/' || 
                     window.location.pathname === '/index.html' || 
                     window.location.pathname === '';
    this.isInsightsPage = window.location.pathname.includes('insights.html');
    this.isInsightPage = window.location.pathname.includes('/insight/');
    
    console.log('InsightsLoader initialized:', {
      isHomepage: this.isHomepage,
      isInsightsPage: this.isInsightsPage,
      isInsightPage: this.isInsightPage,
      path: window.location.pathname
    });
  }

  async init() {
    try {
      console.log('Starting insights loader initialization...');
      await this.loadInsights();
      this.renderInsights();
      this.setupEventListeners();
      console.log('Insights loader initialized successfully');
    } catch (error) {
      console.error('Insights loader initialization failed:', error);
      this.showErrorState();
    }
  }

  async loadInsights() {
    try {
      console.log('Loading insights...');
      
      // First try the simple GET endpoint
      console.log('Trying GET /api/get-insights...');
      const getResponse = await fetch('/api/get-insights');

      if (getResponse.ok) {
        this.insights = await getResponse.json();
        console.log(`Successfully loaded ${this.insights.length} insights from GET endpoint`);
        
        // Cache the data
        this.cacheData();
      } else {
        console.log('GET endpoint failed, trying POST...');
        
        // Fallback to POST endpoint
        const postResponse = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'get' })
        });

        if (postResponse.ok) {
          this.insights = await postResponse.json();
          console.log(`Loaded ${this.insights.length} insights from POST endpoint`);
          this.cacheData();
        } else {
          console.log('Both endpoints failed, trying cache...');
          
          // Try cache if API fails
          const cached = this.getCachedData();
          if (cached) {
            this.insights = cached;
            console.log(`Loaded ${cached.length} insights from cache`);
          } else {
            // Final fallback to local JSON file
            console.log('Trying local fallback...');
            await this.loadFallbackData();
          }
        }
      }

      console.log(`Total insights loaded: ${this.insights.length}`);
      
      // Log insight details for debugging
      if (this.insights.length > 0) {
        console.log('Sample insight:', {
          title: this.insights[0].title,
          status: this.insights[0].status,
          slug: this.insights[0].slug,
          url: this.insights[0].url
        });
      }
      
    } catch (error) {
      console.error('Failed to load insights:', error);
      
      // Try cache on error
      const cached = this.getCachedData();
      if (cached) {
        this.insights = cached;
        console.log('Fell back to cache after error');
      } else {
        this.insights = [];
        console.log('No cache available, using empty array');
      }
    }
  }

  async loadFallbackData() {
    try {
      console.log('Trying to load from public/data/insights.json...');
      const response = await fetch('/data/insights.json');
      if (response.ok) {
        this.insights = await response.json();
        console.log(`Loaded ${this.insights.length} insights from local JSON`);
        this.cacheData();
      } else {
        console.log('Local JSON not found');
        this.insights = [];
      }
    } catch (error) {
      console.log('Local JSON load failed:', error);
      this.insights = [];
    }
  }

  cacheData() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.insights));
      localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
      console.log('Insights cached to localStorage');
    } catch (error) {
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
          const insights = JSON.parse(cachedData);
          console.log(`Retrieved ${insights.length} insights from cache (${Math.round(age/1000)}s old)`);
          return insights;
        } else {
          console.log('Cache expired');
        }
      }
    } catch (error) {
      console.warn('Could not read cache:', error);
    }
    return null;
  }

  renderInsights() {
    console.log('Rendering insights...');
    
    // Render on homepage (first 3 published insights)
    if (this.isHomepage) {
      this.renderHomepageInsights();
    }
    
    // Render on insights page (all published insights)
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
    if (!container) {
      console.error('Homepage insights container (#insights-container) not found!');
      return;
    }

    // Filter to show only published insights
    const publishedInsights = this.insights.filter(insight => 
      insight.status === 'published'
    );
    
    console.log(`Homepage: ${publishedInsights.length} published insights found`);
    
    // Take first 3
    const latestInsights = publishedInsights.slice(0, 3);
    
    if (latestInsights.length === 0) {
      container.innerHTML = this.createEmptyState('No insights published yet. Check back soon!');
      return;
    }

    console.log(`Homepage: Rendering ${latestInsights.length} insights`);
    container.innerHTML = latestInsights.map(insight => this.createInsightCard(insight)).join('');
  }

  renderAllInsights() {
    const container = document.getElementById('all-insights');
    if (!container) {
      console.error('Insights page container (#all-insights) not found!');
      return;
    }

    // Filter to show only published insights
    const publishedInsights = this.insights.filter(insight => 
      insight.status === 'published'
    );
    
    console.log(`Insights page: ${publishedInsights.length} published insights found`);

    if (publishedInsights.length === 0) {
      container.innerHTML = this.createEmptyState('No insights published yet. Check back soon!');
      return;
    }

    console.log(`Insights page: Rendering ${publishedInsights.length} insights`);
    container.innerHTML = publishedInsights.map(insight => this.createInsightCard(insight)).join('');
  }

  createInsightCard(insight) {
    // Use default image if none provided
    const imageUrl = insight.image && insight.image.trim() !== '' 
      ? insight.image 
      : '/images/default-insight.jpg';
    
    const date = this.formatDate(insight.date || insight.createdAt);
    const url = insight.url || `/insight/${insight.slug}`;
    const excerpt = insight.excerpt ? 
      (insight.excerpt.length > 120 ? insight.excerpt.substring(0, 120) + '...' : insight.excerpt) : 
      'Read more about this legal insight...';
    
    // Determine featured badge
    const featuredBadge = insight.featured ? 
      '<span class="featured-badge" style="position: absolute; top: 10px; right: 10px; background: var(--gold); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; z-index: 2;">Featured</span>' : 
      '';

    return `
      <article class="post-card" style="position: relative;">
        <a href="${url}" class="insight-link" style="text-decoration: none; color: inherit; display: block;">
          <div class="blog-img" style="position: relative; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
            <img src="${imageUrl}" alt="${insight.title}" loading="lazy" 
                 style="width: 100%; height: 200px; object-fit: cover; transition: transform 0.3s ease;"
                 onerror="this.src='/images/default-insight.jpg'">
            ${featuredBadge}
          </div>
          <div class="post-content">
            <div class="post-meta" style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">
              <span class="post-date">${date}</span>
              ${insight.featured ? '<span style="color: var(--gold); margin-left: 0.5rem;">• Featured</span>' : ''}
            </div>
            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--navy); line-height: 1.3;">
              ${insight.title || 'Untitled Insight'}
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
    console.log('Loading individual insight page...');
    
    // Get slug from URL
    const path = window.location.pathname;
    const slug = path.split('/insight/')[1];
    
    console.log('Extracted slug from URL:', slug);
    
    if (!slug) {
      console.log('No slug found in URL');
      this.showNotFound();
      return;
    }

    // Clean the slug (remove any .html or query parameters)
    const cleanSlug = slug.replace('.html', '').split('?')[0];
    console.log('Looking for insight with slug:', cleanSlug);

    // Find the insight by slug
    let insight = this.insights.find(i => i.slug === cleanSlug);
    
    // If not found by exact slug, try URL field
    if (!insight) {
      insight = this.insights.find(i => i.url && i.url.includes(cleanSlug));
    }
    
    // If still not found, try by ID
    if (!insight) {
      insight = this.insights.find(i => i.id === cleanSlug);
    }

    if (!insight) {
      console.log('Insight not found for slug:', cleanSlug);
      this.showNotFound();
      return;
    }

    console.log('Found insight:', insight.title);
    
    // Display the insight
    const titleElement = document.getElementById('insight-title');
    const contentElement = document.getElementById('insight-content');
    
    if (titleElement) {
      titleElement.textContent = insight.title || 'Untitled Insight';
    }
    
    if (contentElement) {
      const date = this.formatDate(insight.date || insight.createdAt);
      const excerpt = insight.excerpt ? 
        `<div style="font-style: italic; color: #555; padding: 1.5rem; background: #f8f9fa; border-left: 4px solid var(--gold); margin: 2rem 0;">
          ${insight.excerpt}
        </div>` : '';
      
      contentElement.innerHTML = `
        <div style="color: #666; margin-bottom: 2rem;">
          <span><i class="fas fa-calendar"></i> ${date}</span>
          ${insight.featured ? '<span style="margin-left: 1rem; color: var(--gold);"><i class="fas fa-star"></i> Featured</span>' : ''}
        </div>
        ${excerpt}
        <div style="line-height: 1.8; font-size: 1.1rem;">
          ${insight.body || '<p>No content available.</p>'}
        </div>
      `;
    }
    
    // Update page metadata
    this.updateInsightPageMetadata(insight);
    
    console.log('Individual insight rendered successfully');
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
    
    // Update Open Graph tags if they exist
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && insight.title) {
      ogTitle.setAttribute('content', insight.title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && insight.excerpt) {
      ogDescription.setAttribute('content', insight.excerpt);
    }
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && insight.image) {
      ogImage.setAttribute('content', insight.image);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', window.location.href);
    }
  }

  showNotFound() {
    const titleElement = document.getElementById('insight-title');
    const contentElement = document.getElementById('insight-content');
    
    if (titleElement) {
      titleElement.textContent = 'Insight Not Found';
    }
    
    if (contentElement) {
      contentElement.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: #999;"></i>
          <h3 style="font-family: 'Cormorant Garamond', serif; color: var(--navy); margin-bottom: 1rem;">
            Insight Not Found
          </h3>
          <p style="color: var(--text); margin-bottom: 2rem;">
            The insight you're looking for doesn't exist or has been moved.
          </p>
          <a href="insights.html" 
             style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--navy); color: white; text-decoration: none; border-radius: 4px; font-weight: 600;">
            ← Back to Insights
          </a>
        </div>
      `;
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
      console.warn('Date formatting error:', error, 'for date:', dateString);
      return dateString;
    }
  }

  showErrorState() {
    console.log('Showing error state...');
    
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
        <button onclick="window.location.reload()" 
                style="background: var(--navy); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600; font-family: 'Inter', sans-serif;">
          Retry
        </button>
      </div>
    `;

    // Show error in both possible containers
    const containers = ['insights-container', 'all-insights'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = errorHtml;
      }
    });
    
    // Also handle individual insight page
    if (this.isInsightPage) {
      const titleElement = document.getElementById('insight-title');
      const contentElement = document.getElementById('insight-content');
      
      if (titleElement) {
        titleElement.textContent = 'Error Loading Insight';
      }
      
      if (contentElement) {
        contentElement.innerHTML = errorHtml;
      }
    }
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auto-refresh insights every 10 minutes on insights page
    if (this.isInsightsPage) {
      console.log('Setting up auto-refresh for insights page');
      setInterval(async () => {
        try {
          console.log('Auto-refreshing insights...');
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
  console.log('Setting up DOMContentLoaded listener for InsightsLoader');
  
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing InsightsLoader...');
    
    // Check if we're on a page that needs insights
    const path = window.location.pathname;
    const needsInsights = path.includes('/insight/') || 
                         path.includes('insights.html') || 
                         path === '/' || 
                         path === '/index.html' || 
                         path === '';
    
    if (needsInsights) {
      console.log('Page needs insights, creating InsightsLoader instance');
      try {
        window.insightsLoader = new InsightsLoader();
        window.insightsLoader.init();
      } catch (error) {
        console.error('Failed to create InsightsLoader:', error);
      }
    } else {
      console.log('Page does not need insights, skipping InsightsLoader');
    }
  });
  
  // Also initialize if DOM is already loaded
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('DOM already loaded, initializing InsightsLoader immediately');
    setTimeout(() => {
      if (!window.insightsLoader) {
        window.insightsLoader = new InsightsLoader();
        window.insightsLoader.init();
      }
    }, 100);
  }
}

// Global error handler for debugging
window.addEventListener('error', function(event) {
  console.error('Global JavaScript error in insights-loader.js:', event.error);
  console.error('In file:', event.filename);
  console.error('Line:', event.lineno);
  console.error('Col:', event.colno);
});

// Make it available globally for debugging
window.InsightsLoader = InsightsLoader;