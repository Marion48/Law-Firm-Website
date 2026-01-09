// admin/admin.js - SIMPLE FIX - NO BLOB URLS
class NotionAdmin {
  constructor() {
    this.currentInsight = null;
    this.currentIndex = -1;
    this.insights = [];
    this.quill = null;
    this.baseURL = window.location.origin;
    
    // Image upload tracking
    this.uploadInProgress = false;
    this.pendingImageUpload = null;
    
    this.init();
  }

  async init() {
    console.log('Admin panel initializing...');
    
    setTimeout(() => {
      const loading = document.getElementById('loading');
      const admin = document.getElementById('notionAdmin');
      
      if (loading) loading.style.display = 'none';
      if (admin) admin.style.display = 'block';
    }, 500);

    this.initQuill();
    await this.loadInsights();
    this.setupEventListeners();
    this.newInsight();
  }

  initQuill() {
    try {
      if (typeof Quill === 'undefined') {
        console.error('Quill editor not loaded!');
        this.showNotification('Rich text editor failed to load. Please refresh.', 'error');
        return;
      }
      
      this.quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'header': [1, 2, 3, false] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image', 'blockquote'],
            ['clean']
          ]
        },
        placeholder: 'Write your insight content here...'
      });

      this.quill.on('text-change', () => {
        this.updatePreview();
      });
      
    } catch (error) {
      console.error('Failed to initialize Quill:', error);
      this.showNotification('Editor failed to initialize', 'error');
    }
  }

  async loadInsights() {
    try {
      console.log('Loading insights from API...');
      
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'get' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', response.status, errorText);
        throw new Error(`Failed to load insights: ${response.status}`);
      }

      this.insights = await response.json();
      console.log(`Loaded ${this.insights.length} insights`);
      this.renderInsightsList();
      this.updateInsightCount();
      
    } catch (error) {
      console.error('Error loading insights:', error);
      this.showNotification('Failed to load insights. Check console for details.', 'error');
      this.renderInsightsList();
    }
  }

  renderInsightsList() {
    const container = document.getElementById('insightsList');
    if (!container) {
      console.error('Insights list container not found!');
      return;
    }

    if (!this.insights || this.insights.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-lines"></i>
          <h4>No insights yet</h4>
          <p>Create your first insight to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.insights.map((insight, index) => {
      const date = this.formatDate(insight.date || insight.createdAt);
      const isActive = this.currentIndex === index;
      const statusClass = insight.status === 'published' ? 'status-published' : 'status-draft';
      
      return `
        <div class="insight-item ${isActive ? 'active' : ''}" 
             data-index="${index}">
          <div class="insight-header">
            <span class="insight-status ${statusClass}">${insight.status || 'draft'}</span>
            <span class="insight-date">${date}</span>
          </div>
          <div class="insight-title" title="${insight.title}">
            ${insight.title || 'Untitled Insight'}
            ${insight.featured ? '<span class="featured-badge">Featured</span>' : ''}
          </div>
          <div class="insight-excerpt" title="${insight.excerpt}">
            ${insight.excerpt || 'No excerpt'}
          </div>
          <div class="insight-actions">
            <button class="btn-edit" title="Edit" data-index="${index}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" title="Delete" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.setupInsightListEvents();
  }

  setupInsightListEvents() {
    const container = document.getElementById('insightsList');
    if (!container) return;

    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.loadInsight(index);
      });
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.deleteInsight(index);
      });
    });

    container.querySelectorAll('.insight-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.insight-actions')) {
          const index = parseInt(item.dataset.index);
          this.loadInsight(index);
        }
      });
    });
  }

  newInsight() {
    console.log('Creating new insight...');
    
    this.currentInsight = {
      title: '',
      excerpt: '',
      body: '',
      image: '',
      slug: '',
      date: new Date().toISOString().split('T')[0],
      featured: false,
      status: 'draft'
    };
    
    this.currentIndex = -1;
    this.loadFormData();
    this.updateInsightInfo();
    
    document.querySelectorAll('.insight-item').forEach(item => {
      item.classList.remove('active');
    });
    
    this.showNotification('New insight created. Fill in details and save.', 'info');
  }

  loadInsight(index) {
    if (index < 0 || index >= this.insights.length) {
      console.error('Invalid insight index:', index);
      return;
    }
    
    this.currentInsight = { ...this.insights[index] };
    this.currentIndex = index;
    this.loadFormData();
    this.updateInsightInfo();
    
    document.querySelectorAll('.insight-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.insight-item[data-index="${index}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    this.showNotification('Insight loaded', 'success');
  }

  loadFormData() {
    const titleInput = document.getElementById('insightTitle');
    const excerptInput = document.getElementById('insightExcerpt');
    const slugInput = document.getElementById('insightSlug');
    const dateInput = document.getElementById('insightDate');
    const imageUrlInput = document.getElementById('heroImageUrl');
    const featuredCheckbox = document.getElementById('featuredCheckbox');
    
    if (titleInput) titleInput.value = this.currentInsight.title || '';
    if (excerptInput) excerptInput.value = this.currentInsight.excerpt || '';
    if (slugInput) slugInput.value = this.currentInsight.slug || '';
    if (dateInput) dateInput.value = this.currentInsight.date || new Date().toISOString().split('T')[0];
    
    // Load image URL
    if (imageUrlInput) {
      imageUrlInput.value = this.currentInsight.image || '';
      console.log('Loaded image URL:', this.currentInsight.image ? this.currentInsight.image.substring(0, 80) + '...' : '(none)');
    }
    
    if (featuredCheckbox) featuredCheckbox.checked = this.currentInsight.featured || false;
    
    if (this.quill && this.currentInsight.body) {
      try {
        this.quill.root.innerHTML = this.currentInsight.body;
      } catch (error) {
        console.error('Error loading Quill content:', error);
        this.quill.setText(this.currentInsight.body || '');
      }
    } else if (this.quill) {
      this.quill.setText('');
    }
    
    this.updateCharCounts();
    this.updateHeroPreview();
    this.updatePreview();
  }

  // ===== SIMPLE SOLUTION: CONVERT TO DATA URL =====
  async handleImageUpload(file) {
    console.log('🔄 HANDLE IMAGE UPLOAD CALLED with file:', file.name);
    
    if (!file) {
      console.log('No file provided');
      return;
    }
    
    // Check file size (max 2MB for data URLs)
    if (file.size > 2 * 1024 * 1024) {
      this.showNotification('Image too large! Maximum size is 2MB.', 'error');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      this.showNotification('Please select an image file (JPG, PNG, etc.).', 'error');
      return;
    }
    
    console.log('✅ File validation passed');
    
    // Convert to data URL (works on ALL devices including mobile)
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const imageUrlInput = document.getElementById('heroImageUrl');
      
      if (!imageUrlInput) {
        console.error('heroImageUrl input not found!');
        return;
      }
      
      // Save as data URL (will work on mobile)
      imageUrlInput.value = dataUrl;
      this.updateHeroPreview();
      
      console.log('✅ Image saved as data URL (length):', dataUrl.length);
      this.showNotification('✅ Image saved (will work on mobile)', 'success');
    };
    
    reader.onerror = (error) => {
      console.error('❌ Error reading file:', error);
      this.showNotification('Failed to process image', 'error');
    };
    
    reader.readAsDataURL(file);
    
    // Clear input
    const heroImageInput = document.getElementById('heroImageInput');
    if (heroImageInput) {
      heroImageInput.value = '';
    }
  }

  async processImageField(imageUrl) {
    const trimmed = imageUrl.trim();
    
    console.log('Processing image URL:', trimmed ? trimmed.substring(0, 100) + '...' : '(empty)');
    
    // If it's a blob URL (temporary), return empty
    if (trimmed.startsWith('blob:')) {
      console.warn('Found temporary blob URL, ignoring...');
      return '';
    }
    
    // If it's a data URL, use it (will work on mobile!)
    if (trimmed.startsWith('data:')) {
      console.log('✅ Using data URL (mobile compatible)');
      return trimmed;
    }
    
    // If it's a Cloudinary URL, keep it
    if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
      console.log('Cloudinary URL detected, keeping');
      return trimmed;
    }
    
    // If it's any other valid URL, keep it
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      console.log('Valid HTTP URL, keeping');
      return trimmed;
    }
    
    // Return empty for anything else
    return '';
  }

  async saveInsight(publish = false) {
    try {
      console.log('=== SAVE INSIGHT ===');
      
      // Collect form data
      const insight = {
        title: (document.getElementById('insightTitle')?.value || '').trim(),
        excerpt: (document.getElementById('insightExcerpt')?.value || '').trim(),
        slug: (document.getElementById('insightSlug')?.value || '').trim(),
        date: document.getElementById('insightDate')?.value || new Date().toISOString().split('T')[0],
        image: await this.processImageField(document.getElementById('heroImageUrl')?.value || ''),
        featured: document.getElementById('featuredCheckbox')?.checked || false,
        status: publish ? 'published' : 'draft',
        body: this.quill ? this.quill.root.innerHTML : ''
      };

      console.log('Image to save:', insight.image ? '✓ Has image' : '✗ No image');
      if (insight.image) {
        console.log('Image type:', insight.image.substring(0, 30));
        console.log('Image length:', insight.image.length);
      }

      // Validation
      if (!insight.title) {
        this.showNotification('Title is required', 'error');
        document.getElementById('insightTitle')?.focus();
        return;
      }

      if (!insight.excerpt) {
        this.showNotification('Excerpt is required', 'error');
        document.getElementById('insightExcerpt')?.focus();
        return;
      }

      // Auto-generate slug if empty
      if (!insight.slug && insight.title) {
        insight.slug = this.generateSlug(insight.title);
        document.getElementById('insightSlug').value = insight.slug;
      }

      // Show saving indicator
      this.showNotification('Saving insight...', 'info');

      // Prepare API request
      let requestBody;
      
      if (this.currentIndex >= 0) {
        // EDIT existing insight
        console.log(`Editing insight at index ${this.currentIndex}`);
        requestBody = {
          action: 'edit',
          index: this.currentIndex,
          insight: insight
        };
      } else {
        // ADD new insight
        console.log('Adding new insight');
        requestBody = {
          action: 'add',
          insight: insight
        };
      }

      // Send to API
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log('API Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Failed to save: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from API');
      }

      // Update local data
      this.insights = result.insights || [];
      
      if (this.currentIndex === -1) {
        const newInsight = result.data || result.insights?.[0];
        if (newInsight) {
          this.currentInsight = { ...newInsight };
          this.currentIndex = this.insights.findIndex(i => i.id === newInsight.id || i.slug === newInsight.slug);
          if (this.currentIndex === -1) this.currentIndex = 0;
        }
      } else {
        this.currentInsight = result.data || { ...insight };
      }

      // Update UI
      this.renderInsightsList();
      this.updateInsightCount();
      this.updateInsightInfo();
      
      const message = publish ? 
        '✅ Insight published successfully!' : 
        '✅ Insight saved successfully!';
      this.showNotification(message, 'success');

    } catch (error) {
      console.error('❌ Error saving insight:', error);
      this.showNotification(`Failed to save: ${error.message}`, 'error');
    }
  }

  // ... [Keep all other methods EXACTLY AS THEY ARE] ...

  generateSlug(text) {
    if (!text) return 'untitled';
    
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  updatePreview() {
    const previewTab = document.getElementById('previewContent');
    if (!previewTab) return;

    const content = this.quill ? this.quill.root.innerHTML : '';
    
    if (!content || content === '<p><br></p>' || content === '<p></p>') {
      previewTab.innerHTML = '<p class="preview-placeholder">Start writing to see preview...</p>';
      return;
    }

    previewTab.innerHTML = content;
  }

  updateHeroPreview() {
    const urlInput = document.getElementById('heroImageUrl');
    const upload = document.getElementById('heroUpload');
    const preview = document.getElementById('heroPreview');
    const previewImage = document.getElementById('heroPreviewImage');

    if (!urlInput || !upload || !preview || !previewImage) return;

    const url = urlInput.value.trim();

    if (url) {
      previewImage.src = url;
      upload.style.display = 'none';
      preview.style.display = 'block';
    } else {
      upload.style.display = 'block';
      preview.style.display = 'none';
    }
  }

  updateCharCounts() {
    const title = document.getElementById('insightTitle')?.value || '';
    const excerpt = document.getElementById('insightExcerpt')?.value || '';
    
    const titleCount = document.getElementById('titleCharCount');
    const excerptCount = document.getElementById('excerptCharCount');
    
    if (titleCount) titleCount.textContent = title.length;
    if (excerptCount) excerptCount.textContent = excerpt.length;
    
    const slugInput = document.getElementById('insightSlug');
    if (slugInput && !slugInput.value && title) {
      slugInput.value = this.generateSlug(title);
    }
  }

  updateInsightCount() {
    const countElement = document.getElementById('insightCount');
    if (countElement) {
      const count = this.insights.length;
      countElement.textContent = `${count} insight${count !== 1 ? 's' : ''}`;
    }
  }

  updateInsightInfo() {
    const createdDate = document.getElementById('createdDate');
    const lastEdited = document.getElementById('lastEdited');
    const insightStatus = document.getElementById('insightStatus');
    
    if (createdDate) {
      createdDate.textContent = this.formatDate(this.currentInsight.createdAt) || '--';
    }
    
    if (lastEdited) {
      lastEdited.textContent = this.formatDate(this.currentInsight.updatedAt) || '--';
    }
    
    if (insightStatus) {
      const status = this.currentInsight.status || 'draft';
      insightStatus.textContent = status;
      insightStatus.className = status === 'published' ? 'status-published' : 'status-draft';
    }
  }

  formatDate(dateString) {
    if (!dateString) return '--';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
      <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(notification);

    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        tab.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        const tabContent = document.getElementById(`${tabId}Tab`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });

    // Character count updates
    const titleInput = document.getElementById('insightTitle');
    const excerptInput = document.getElementById('insightExcerpt');
    
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        this.updateCharCounts();
      });
    }
    
    if (excerptInput) {
      excerptInput.addEventListener('input', () => {
        this.updateCharCounts();
      });
    }
    
    // Hero image URL input
    const heroImageUrl = document.getElementById('heroImageUrl');
    if (heroImageUrl) {
      heroImageUrl.addEventListener('input', () => {
        this.updateHeroPreview();
      });
      
      heroImageUrl.placeholder = 'Paste image URL or upload an image';
    }

    // Hero image upload buttons - FIXED EVENT LISTENER
    const heroUpload = document.getElementById('heroUpload');
    const heroImageInput = document.getElementById('heroImageInput');
    const changeImageBtn = document.getElementById('changeImageBtn');
    
    if (heroUpload && heroImageInput) {
      heroUpload.addEventListener('click', () => {
        console.log('📷 Hero upload area clicked');
        heroImageInput.click();
      });
    }
    
    if (changeImageBtn && heroImageInput) {
      changeImageBtn.addEventListener('click', () => {
        console.log('📷 Change image button clicked');
        heroImageInput.click();
      });
    }
    
    if (heroImageInput) {
      // FIXED: Use arrow function to preserve 'this' context
      heroImageInput.addEventListener('change', (e) => {
        console.log('📷 File input changed! Files:', e.target.files.length);
        const file = e.target.files[0];
        if (file) {
          console.log('📷 File selected:', file.name, file.size, 'bytes');
          // DIRECT CALL - NO ASYNC ISSUES
          this.handleImageUpload(file);
        } else {
          console.log('📷 No file selected');
        }
        e.target.value = '';
      });
    }

    // Buttons
    const newInsightBtn = document.getElementById('newInsightBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const publishMainBtn = document.getElementById('publishMainBtn');
    const discardBtn = document.getElementById('discardBtn');
    
    if (newInsightBtn) {
      newInsightBtn.addEventListener('click', () => {
        this.newInsight();
      });
    }
    
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => {
        this.saveInsight(false);
      });
    }
    
    if (publishBtn) {
      publishBtn.addEventListener('click', () => {
        this.saveInsight(true);
      });
    }
    
    if (publishMainBtn) {
      publishMainBtn.addEventListener('click', () => {
        this.saveInsight(true);
      });
    }
    
    if (discardBtn) {
      discardBtn.addEventListener('click', () => {
        if (confirm('Discard unsaved changes?')) {
          if (this.currentIndex >= 0) {
            this.loadInsight(this.currentIndex);
          } else {
            this.newInsight();
          }
        }
      });
    }
    
    console.log('Event listeners setup complete');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting admin panel...');
  
  if (window.location.pathname.includes('/admin') || 
      window.location.pathname === '/admin' ||
      window.location.hash === '#admin') {
    
    if (!document.getElementById('insightTitle')) {
      console.error('Admin form elements not found!');
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Admin panel elements not found. Check HTML structure.</div>';
      return;
    }
    
    window.notionAdmin = new NotionAdmin();
  } else {
    console.log('Not in admin section, skipping admin initialization');
  }
});

window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
  console.error('In file:', event.filename);
  console.error('Line:', event.lineno);
});