// admin/admin.js - Complete Admin Panel
class NotionAdmin {
  constructor() {
    this.currentInsight = null;
    this.currentIndex = -1;
    this.insights = [];
    this.quill = null;
    
    this.baseURL = window.location.origin;
    
    this.init();
  }

  async init() {
    console.log('Admin panel initializing...');
    
    // Hide loading screen after 1 second
    setTimeout(() => {
      const loading = document.getElementById('loading');
      const admin = document.getElementById('notionAdmin');
      
      if (loading) loading.style.display = 'none';
      if (admin) admin.style.display = 'block';
      
      console.log('Admin panel UI shown');
    }, 1000);

    // Initialize Quill editor
    this.initQuill();
    
    // Load insights
    await this.loadInsights();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Create new empty insight
    this.newInsight();
    
    console.log('Admin panel initialized successfully');
  }

  initQuill() {
    try {
      console.log('Initializing Quill editor...');
      
      // Check if Quill is available
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

      // Update preview when content changes
      this.quill.on('text-change', () => {
        this.updatePreview();
      });
      
      console.log('Quill editor initialized');
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

      if (response.ok) {
        this.insights = await response.json();
        console.log(`Loaded ${this.insights.length} insights`);
        this.renderInsightsList();
        this.updateInsightCount();
      } else {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`Failed to load insights: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      this.showNotification('Failed to load insights. Check console for details.', 'error');
      
      // Show empty state
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
      
      return `
        <div class="insight-item ${isActive ? 'active' : ''}" 
             data-index="${index}">
          <div class="insight-title" title="${insight.title}">
            ${insight.title || 'Untitled Insight'}
          </div>
          <div class="insight-date">
            ${date}
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

    // Add event listeners
    this.setupInsightListEvents();
  }

  setupInsightListEvents() {
    const container = document.getElementById('insightsList');
    if (!container) return;

    // Edit buttons
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        console.log('Editing insight at index:', index);
        this.loadInsight(index);
      });
    });

    // Delete buttons
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        console.log('Deleting insight at index:', index);
        this.deleteInsight(index);
      });
    });

    // Insight item clicks
    container.querySelectorAll('.insight-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Only trigger if not clicking on action buttons
        if (!e.target.closest('.insight-actions')) {
          const index = parseInt(item.dataset.index);
          console.log('Loading insight at index:', index);
          this.loadInsight(index);
        }
      });
    });
  }

  newInsight() {
    console.log('Creating new insight...');
    
    this.currentInsight = {
      id: Date.now().toString(),
      title: '',
      excerpt: '',
      body: '',
      image: '',
      slug: '',
      date: new Date().toISOString().split('T')[0],
      featured: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.currentIndex = -1;
    this.loadFormData();
    this.updateInsightInfo();
    
    // Clear any active states
    document.querySelectorAll('.insight-item').forEach(item => {
      item.classList.remove('active');
    });
    
    this.showNotification('New insight created', 'info');
  }

  loadInsight(index) {
    if (index < 0 || index >= this.insights.length) {
      console.error('Invalid insight index:', index);
      return;
    }
    
    console.log('Loading insight at index:', index);
    
    this.currentInsight = { ...this.insights[index] };
    this.currentIndex = index;
    this.loadFormData();
    this.updateInsightInfo();
    
    // Update active class
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
    console.log('Loading form data for current insight');
    
    // Set form values
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
    if (imageUrlInput) imageUrlInput.value = this.currentInsight.image || '';
    if (featuredCheckbox) featuredCheckbox.checked = this.currentInsight.featured || false;
    
    // Set Quill content
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
    
    // Update character counts
    this.updateCharCounts();
    
    // Update hero image preview
    this.updateHeroPreview();
    
    // Update preview
    this.updatePreview();
  }

  async saveInsight(publish = false) {
    try {
      console.log('Saving insight...', { publish });
      
      // Collect form data
      const insight = {
        title: (document.getElementById('insightTitle')?.value || '').trim(),
        excerpt: (document.getElementById('insightExcerpt')?.value || '').trim(),
        slug: (document.getElementById('insightSlug')?.value || '').trim(),
        date: document.getElementById('insightDate')?.value || new Date().toISOString().split('T')[0],
        image: (document.getElementById('heroImageUrl')?.value || '').trim(),
        featured: document.getElementById('featuredCheckbox')?.checked || false,
        body: this.quill ? this.quill.root.innerHTML : '',
        status: publish ? 'published' : 'draft'
      };

      console.log('Insight data:', insight);

      // Validation
      if (!insight.title) {
        this.showNotification('Title is required', 'error');
        return;
      }

      if (!insight.excerpt) {
        this.showNotification('Excerpt is required', 'error');
        return;
      }

      // Auto-generate slug if empty
      if (!insight.slug && insight.title) {
        insight.slug = this.generateSlug(insight.title);
        document.getElementById('insightSlug').value = insight.slug;
      }

      // Prepare API request
      const action = this.currentIndex >= 0 ? 'edit' : 'add';
      const body = {
        action: action,
        insight: insight
      };

      if (action === 'edit') {
        body.index = this.currentIndex;
      }

      console.log('Sending API request:', body);

      // Show saving indicator
      this.showNotification('Saving...', 'info');

      // Send to API
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to save insight: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      // Update local data
      this.insights = result.insights || [];
      this.currentInsight = { ...insight, id: this.currentInsight.id || result.data.id };
      
      if (action === 'add') {
        this.currentIndex = 0; // New insights are at the beginning
      }
      
      // Update UI
      this.renderInsightsList();
      this.updateInsightCount();
      this.updateInsightInfo();
      
      // Show success message
      const message = publish ? 
        'Insight published successfully!' : 
        'Insight saved as draft';
      this.showNotification(message, 'success');

    } catch (error) {
      console.error('Error saving insight:', error);
      this.showNotification(`Failed to save: ${error.message}`, 'error');
    }
  }

  async deleteInsight(index) {
    if (!confirm('Are you sure you want to delete this insight? This cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting insight at index:', index);
      
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          index: index
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete insight');
      }

      const result = await response.json();
      
      // Update local data
      this.insights = result.insights || [];
      
      // Handle current insight deletion
      if (index === this.currentIndex) {
        this.newInsight();
      } else if (index < this.currentIndex) {
        this.currentIndex--;
      }
      
      // Update UI
      this.renderInsightsList();
      this.updateInsightCount();
      this.showNotification('Insight deleted successfully', 'success');
      
    } catch (error) {
      console.error('Error deleting insight:', error);
      this.showNotification('Failed to delete insight', 'error');
    }
  }

  generateSlug(text) {
    if (!text) return 'untitled';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
    
    // Auto-generate slug if empty and title exists
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
      insightStatus.textContent = this.currentInsight.status || 'Draft';
      insightStatus.className = this.currentInsight.status === 'published' ? 
        'status-published' : 'status-draft';
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
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Show selected tab content
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
    
    // Hero image URL
    const heroImageUrl = document.getElementById('heroImageUrl');
    if (heroImageUrl) {
      heroImageUrl.addEventListener('input', () => {
        this.updateHeroPreview();
      });
    }

    // Hero image upload
    const heroUpload = document.getElementById('heroUpload');
    const heroImageInput = document.getElementById('heroImageInput');
    const changeImageBtn = document.getElementById('changeImageBtn');
    
    if (heroUpload && heroImageInput) {
      heroUpload.addEventListener('click', () => {
        heroImageInput.click();
      });
    }
    
    if (changeImageBtn && heroImageInput) {
      changeImageBtn.addEventListener('click', () => {
        heroImageInput.click();
      });
    }
    
    if (heroImageInput) {
      heroImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // Create object URL for preview
          const url = URL.createObjectURL(file);
          document.getElementById('heroImageUrl').value = url;
          this.updateHeroPreview();
          
          // Show notification about production implementation
          this.showNotification('For production, implement image upload to Cloudinary or similar service', 'info');
        }
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting admin panel...');
  
  // Check if we're in the admin section
  if (window.location.pathname.includes('/admin')) {
    window.notionAdmin = new NotionAdmin();
  }
});