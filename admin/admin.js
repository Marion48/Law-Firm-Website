// admin/admin.js - UPDATED WITH VERCEL BLOB UPLOADS
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
    
    // Hide loading screen
    setTimeout(() => {
      const loading = document.getElementById('loading');
      const admin = document.getElementById('notionAdmin');
      
      if (loading) loading.style.display = 'none';
      if (admin) admin.style.display = 'block';
      
      console.log('Admin panel UI shown');
    }, 500);

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
    
    // Clear any active states
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

  // ===== VERCEL BLOB UPLOAD METHODS =====
  async uploadImageToVercel(file) {
    if (this.uploadInProgress) {
      console.log('Upload already in progress, queuing...');
      this.pendingImageUpload = file;
      return null;
    }

    try {
      this.uploadInProgress = true;
      console.log('Uploading image to Vercel Blob:', file.name);
      
      this.showNotification(`Uploading ${file.name}...`, 'info');
      
      // Generate a unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `insight-${timestamp}-${sanitizedName}`;
      
      // Upload to Vercel Blob
      const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: file
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Vercel Blob upload result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      this.showNotification('Image uploaded successfully!', 'success');
      return result.url;
      
    } catch (error) {
      console.error('Vercel Blob upload error:', error);
      this.showNotification(`Upload failed: ${error.message}`, 'error');
      return null;
    } finally {
      this.uploadInProgress = false;
      
      // Process any pending upload
      if (this.pendingImageUpload) {
        const pendingFile = this.pendingImageUpload;
        this.pendingImageUpload = null;
        setTimeout(() => this.handleImageUpload(pendingFile), 500);
      }
    }
  }

  async handleImageUpload(file) {
    // Validate file
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('Image too large! Maximum size is 5MB.', 'error');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      this.showNotification('Please select an image file (JPG, PNG, etc.).', 'error');
      return;
    }
    
    // Create temporary preview
    const previewUrl = URL.createObjectURL(file);
    const imageUrlInput = document.getElementById('heroImageUrl');
    imageUrlInput.value = previewUrl;
    this.updateHeroPreview();
    
    // Upload to Vercel Blob
    const uploadedUrl = await this.uploadImageToVercel(file);
    
    if (uploadedUrl) {
      // Update with permanent URL
      imageUrlInput.value = uploadedUrl;
      this.updateHeroPreview();
      
      // Clean up temporary blob URL
      URL.revokeObjectURL(previewUrl);
    } else {
      // Keep the temporary URL for preview
      this.showNotification('Using temporary preview. Image will not be saved permanently.', 'warning');
    }
  }

  async processImageField(imageUrl) {
    const trimmed = imageUrl.trim();
    
    // If it's a blob URL from a previous upload attempt, return empty
    if (trimmed.startsWith('blob:') && !trimmed.includes('vercel')) {
      console.warn('Found temporary blob URL, ignoring...');
      return '';
    }
    
    // If it's a data URL (base64), it's too large for storage
    if (trimmed.startsWith('data:')) {
      this.showNotification('Base64 images are not supported. Please upload an image file.', 'warning');
      return '';
    }
    
    return trimmed;
  }

  // ===== UPDATED SAVE METHOD =====
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

      console.log('Insight data to save:', insight);

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

      console.log('Sending to API:', requestBody);

      // Send to API
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Get response text first for debugging
      const responseText = await response.text();
      console.log('API Response status:', response.status);
      console.log('API Response text:', responseText);

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

      // Parse the successful response
      const result = JSON.parse(responseText);
      console.log('API Success result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from API');
      }

      // Update local data
      this.insights = result.insights || [];
      
      // Update current insight and index
      if (this.currentIndex === -1) {
        // Find the newly added insight
        const newInsight = result.data || result.insights?.[0];
        if (newInsight) {
          this.currentInsight = { ...newInsight };
          this.currentIndex = this.insights.findIndex(i => i.id === newInsight.id || i.slug === newInsight.slug);
          if (this.currentIndex === -1) this.currentIndex = 0;
        }
      } else {
        // Update current insight
        this.currentInsight = result.data || { ...insight };
      }

      // Update UI
      this.renderInsightsList();
      this.updateInsightCount();
      this.updateInsightInfo();
      
      // Show success message
      const message = publish ? 
        '✅ Insight published successfully!' : 
        '✅ Insight saved successfully!';
      this.showNotification(message, 'success');

    } catch (error) {
      console.error('❌ Error saving insight:', error);
      this.showNotification(`Failed to save: ${error.message}`, 'error');
    }
  }

  async deleteInsight(index) {
    if (index < 0 || index >= this.insights.length) {
      this.showNotification('Invalid insight index', 'error');
      return;
    }

    const insightToDelete = this.insights[index];
    if (!insightToDelete) {
      this.showNotification('Insight not found', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${insightToDelete.title}"?\nThis cannot be undone.`)) {
      return;
    }

    try {
      console.log('Deleting insight at index:', index);
      
      this.showNotification('Deleting insight...', 'info');

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
        const errorText = await response.text();
        console.error('Delete API error:', response.status, errorText);
        throw new Error(`Failed to delete: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }

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
      
      this.showNotification('✅ Insight deleted successfully', 'success');
      
    } catch (error) {
      console.error('Error deleting insight:', error);
      this.showNotification(`Failed to delete: ${error.message}`, 'error');
    }
  }

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
    
    // Auto-generate slug if empty
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
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create notification
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

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
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
    
    // Hero image URL input
    const heroImageUrl = document.getElementById('heroImageUrl');
    if (heroImageUrl) {
      heroImageUrl.addEventListener('input', () => {
        this.updateHeroPreview();
      });
      
      // Add placeholder text
      heroImageUrl.placeholder = 'Paste image URL or upload an image';
    }

    // Hero image upload buttons - UPDATED
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
          this.handleImageUpload(file);
        }
        // Clear input so same file can be selected again
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting admin panel...');
  
  // Check if we're in the admin section
  if (window.location.pathname.includes('/admin') || 
      window.location.pathname === '/admin' ||
      window.location.hash === '#admin') {
    
    // Check for required elements
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

// Global error handler
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
  console.error('In file:', event.filename);
  console.error('Line:', event.lineno);
});