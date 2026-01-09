// js/insights-loader.js — RELIABLE MOBILE IMAGE FIX
class InsightsLoader {
  constructor() {
    this.insights = [];
    this.cacheKey = 'byron_insights_cache';
    this.cacheTimestampKey = 'byron_insights_timestamp';
    this.cacheDuration = 5 * 60 * 1000;

    const path = window.location.pathname;
    this.isHomepage = path === '/' || path === '/index.html' || path === '';
    this.isInsightsPage = path.includes('insights.html');
    
    // Detect mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.imagesLoaded = new Set(); // Track loaded images
    console.log('Device:', this.isMobile ? 'Mobile' : 'Desktop');
  }

  async init() {
    try {
      await this.loadInsights();
      this.render();
      
      // Use a more reliable image loading strategy
      this.loadImagesWithRetry();
    } catch (error) {
      console.error('InsightsLoader init failed:', error);
      this.showError();
    }
  }

  async loadInsights() {
    try {
      console.log('Loading insights from API...');
      const res = await fetch('/api/get-insights');

      if (res.ok) {
        const data = await res.json();
        this.insights = Array.isArray(data) ? data : [];
        
        // Debug log images
        this.insights.forEach((insight, i) => {
          console.log(`Insight ${i}: "${insight.title}"`, {
            hasImage: !!insight.image,
            imageUrl: insight.image
          });
        });
        
        this.cache();
        return;
      }

      throw new Error('API failed');
    } catch (error) {
      console.error('Error loading from API:', error);
      const cached = this.getCache();
      this.insights = cached || [];
    }
  }

  cache() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.insights));
      localStorage.setItem(this.cacheTimestampKey, Date.now());
    } catch (error) {
      console.warn('Failed to cache insights:', error);
    }
  }

  getCache() {
    try {
      const ts = localStorage.getItem(this.cacheTimestampKey);
      const data = localStorage.getItem(this.cacheKey);
      if (!ts || !data) return null;

      if (Date.now() - Number(ts) > this.cacheDuration) return null;
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  render() {
    const published = this.insights.filter(i => i.status === 'published');
    console.log(`Rendering ${published.length} published insights`);

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

    el.className = 'premium-insights-grid insights-page-grid';
    el.innerHTML = items.map(i => this.premiumCard(i, true)).join('');
  }

  premiumCard(insight, isInsightsPage = false) {
    // PROCESS IMAGE URL FOR MOBILE COMPATIBILITY
    let img = insight.image || '';
    
    if (img) {
      img = img.toString().trim().replace(/['"]/g, '');
      
      // Ensure it's a valid URL
      const isValidUrl = img.startsWith('http://') || 
                         img.startsWith('https://') || 
                         img.startsWith('data:') ||
                         img.startsWith('/');
      
      if (!isValidUrl) {
        console.warn(`Invalid image URL:`, img);
        img = '';
      }
    }
    
    const date = this.formatDate(insight.date || insight.createdAt);
    const url = `/api/insight-page?slug=${insight.slug}`;
    const excerpt = insight.excerpt
      ? insight.excerpt.slice(0, 150) + '…'
      : '';
    
    // CRITICAL: Use eager loading for mobile on initial render
    // but we'll handle loading more carefully below
    const loadingStrategy = this.isMobile ? 'eager' : 'lazy';
    
    // Generate unique ID for this image
    const imageId = `insight-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const imageHtml = img ? `
      <div class="image-wrapper" data-image-id="${imageId}">
        <img src="${img}" 
             alt="${insight.title}" 
             class="card-image"
             loading="${loadingStrategy}"
             decoding="async"
             id="${imageId}"
             data-original-src="${img}"
             onload="window.insightsLoader?.imageLoaded(this);"
             onerror="window.insightsLoader?.imageError(this);">
        <div class="image-loading">Loading...</div>
      </div>
    ` : `
      <div class="no-image-placeholder">
        <i class="fas fa-newspaper"></i>
        <span>No Image</span>
      </div>
    `;
    
    return `
      <article class="premium-insight-card ${isInsightsPage ? 'full-width' : ''}">
        <div class="card-image-container">
          ${imageHtml}
          <div class="image-overlay"></div>
          
          <div class="date-badge">
            <i class="far fa-calendar"></i> ${date}
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="card-title">${insight.title}</h3>
          <p class="card-excerpt">${excerpt}</p>
          <div class="card-footer">
            <a href="${url}" class="premium-read-btn">
              Read Insight
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  // Image load handlers
  imageLoaded(imgElement) {
    console.log('Image loaded successfully:', imgElement.src);
    imgElement.classList.add('loaded');
    imgElement.classList.remove('error');
    
    // Hide loading indicator
    const loadingIndicator = imgElement.parentNode.querySelector('.image-loading');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Add to loaded set
    const imageId = imgElement.id || imgElement.dataset.imageId;
    if (imageId) {
      this.imagesLoaded.add(imageId);
    }
  }

  imageError(imgElement) {
    console.error('Image failed to load:', imgElement.src);
    imgElement.classList.add('error');
    imgElement.style.display = 'none';
    
    // Try retry on mobile
    if (this.isMobile) {
      this.retryImageLoad(imgElement);
    }
  }

  // Reliable image loading with retry
  loadImagesWithRetry() {
    if (!this.isMobile) return;
    
    console.log('Starting reliable mobile image loading...');
    
    // Wait for DOM to be fully ready
    setTimeout(() => {
      const images = document.querySelectorAll('.card-image[data-original-src]');
      console.log(`Found ${images.length} images to load on mobile`);
      
      images.forEach((img, index) => {
        if (!img.complete || img.naturalHeight === 0) {
          this.loadImageWithFallback(img, index);
        }
      });
      
      // Check again after 2 seconds for any missed images
      setTimeout(() => {
        this.checkAndFixMissingImages();
      }, 2000);
      
    }, 100);
  }

  loadImageWithFallback(imgElement, index) {
    const originalSrc = imgElement.dataset.originalSrc;
    if (!originalSrc) return;
    
    console.log(`Loading image ${index}: ${originalSrc}`);
    
    // Method 1: Try loading with a small delay to prevent race conditions
    setTimeout(() => {
      if (imgElement.src !== originalSrc) {
        imgElement.src = originalSrc;
      }
      
      // Method 2: Preload with Image object as backup
      const preloader = new Image();
      preloader.src = originalSrc;
      preloader.onload = () => {
        console.log(`Preloaded image ${index}:`, originalSrc);
        // If original still hasn't loaded after 500ms, replace it
        setTimeout(() => {
          if (!imgElement.complete || imgElement.naturalHeight === 0) {
            console.log(`Using preloaded image for ${index}`);
            imgElement.src = originalSrc;
          }
        }, 500);
      };
      
      preloader.onerror = () => {
        console.log(`Preload failed for image ${index}`);
      };
      
    }, index * 200); // Stagger loading to prevent congestion
  }

  retryImageLoad(imgElement) {
    const originalSrc = imgElement.dataset.originalSrc;
    if (!originalSrc) return;
    
    console.log(`Retrying image load: ${originalSrc}`);
    
    // Add cache busting only if previous load failed
    const separator = originalSrc.includes('?') ? '&' : '?';
    const retrySrc = `${originalSrc}${separator}_retry=${Date.now()}`;
    
    // Try with fresh URL
    const retryImage = new Image();
    retryImage.src = retrySrc;
    retryImage.onload = () => {
      console.log(`Retry successful for: ${originalSrc}`);
      imgElement.src = retrySrc;
      imgElement.style.display = 'block';
      imgElement.classList.remove('error');
    };
    
    retryImage.onerror = () => {
      console.log(`Retry failed for: ${originalSrc}`);
      // Show placeholder
      const container = imgElement.closest('.card-image-container');
      if (container) {
        container.classList.add('image-error');
      }
    };
  }

  checkAndFixMissingImages() {
    if (!this.isMobile) return;
    
    const images = document.querySelectorAll('.card-image');
    const missingImages = Array.from(images).filter(img => 
      !img.complete || img.naturalHeight === 0 || img.classList.contains('error')
    );
    
    if (missingImages.length > 0) {
      console.log(`Found ${missingImages.length} missing/broken images, attempting repair...`);
      
      missingImages.forEach((img, index) => {
        setTimeout(() => {
          if (img.dataset.originalSrc) {
            // Force reload with fresh request
            img.src = '';
            setTimeout(() => {
              img.src = img.dataset.originalSrc + (img.dataset.originalSrc.includes('?') ? '&' : '?') + '_fix=' + Date.now();
            }, 100);
          }
        }, index * 300);
      });
    }
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

// SIMPLIFIED CSS FIXES - Focus on core mobile issues
const mobileImageStyles = `
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

/* Image Container */
.card-image-container {
  position: relative;
  height: 220px;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

/* Image Wrapper for better control */
.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Mobile Image Fixes */
.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.card-image.loaded {
  opacity: 1;
}

.card-image.error {
  opacity: 0;
}

/* iOS specific fixes */
@supports (-webkit-touch-callout: none) {
  .card-image-container {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
  
  .card-image {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
}

/* Image loading indicator */
.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 0.9rem;
  z-index: 1;
  transition: opacity 0.3s ease;
}

.card-image.loaded + .image-loading,
.image-wrapper:has(.card-image.loaded) .image-loading {
  opacity: 0;
  pointer-events: none;
}

/* No Image Placeholder */
.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #666;
}

.no-image-placeholder i {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #C6A961;
}

.no-image-placeholder span {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Image error state */
.card-image-container.image-error {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
  pointer-events: none;
  z-index: 2;
}

/* Date Badge */
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
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

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
  min-height: 4.8em;
}

/* Card Footer */
.card-footer {
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 1.5rem;
  display: flex;
  justify-content: flex-start;
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

/* ===== MOBILE OPTIMIZATIONS ===== */
@media (max-width: 768px) {
  .homepage-grid,
  .insights-page-grid {
    grid-template-columns: 1fr !important;
    gap: 1.5rem;
  }
  
  /* Mobile image container */
  .card-image-container {
    height: 220px !important;
    min-height: 220px !important;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%) !important;
  }
  
  .card-image {
    width: 100% !important;
    height: 100% !important;
    min-height: 220px !important;
    object-fit: cover !important;
  }
  
  /* Force hardware acceleration */
  .premium-insight-card {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    will-change: transform;
  }
  
  .card-title {
    font-size: 1.3rem;
  }
  
  .premium-read-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Small mobile screens */
@media (max-width: 480px) {
  .card-image-container {
    height: 200px !important;
    min-height: 200px !important;
  }
  
  .card-image {
    min-height: 200px !important;
  }
  
  .card-content {
    padding: 1.25rem;
  }
  
  .date-badge {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }
}

/* Tablets */
@media (min-width: 769px) and (max-width: 1023px) {
  .homepage-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .insights-page-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .homepage-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .insights-page-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
`;

// Initialize the loader
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing InsightsLoader with reliable mobile fixes...');
  
  // Inject mobile-specific styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = mobileImageStyles;
  document.head.appendChild(styleSheet);
  
  // Initialize and make available globally for image load callbacks
  const loader = new InsightsLoader();
  window.insightsLoader = loader; // Make available for onload/onerror callbacks
  loader.init();
  
  // Add a cleanup and retry on page visibility change (for refreshes)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && loader.isMobile) {
      console.log('Page became visible, checking images...');
      setTimeout(() => {
        loader.checkAndFixMissingImages();
      }, 500);
    }
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InsightsLoader;
}