// api/insight-page.js - COMPLETE WITH PREMIUM STYLING
const { getInsightsData } = require('../lib/github.js');

module.exports = async (req, res) => {
  const { slug } = req.query;
  console.log(`[INSIGHT-PAGE] Request for slug: ${slug}`);
  
  if (!slug) {
    console.log('[INSIGHT-PAGE] No slug provided');
    return res.status(404).send('Insight not found');
  }

  try {
    const insights = await getInsightsData();
    console.log(`[INSIGHT-PAGE] Total insights loaded: ${insights.length}`);
    
    // CRITICAL: Filter for published insights only!
    const insight = insights.find(i => i.slug === slug && i.status === 'published');
    
    if (!insight) {
      console.log(`[INSIGHT-PAGE] Insight not found or not published: ${slug}`);
      const publishedSlugs = insights.filter(i => i.status === 'published').map(i => i.slug);
      console.log(`[INSIGHT-PAGE] Available published slugs: ${publishedSlugs.join(', ')}`);
      
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Insight Not Found - Byron N. & Co. Advocates</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 2rem; }
            a { color: #3b82f6; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Insight Not Found</h1>
            <p>The insight "${slug}" doesn't exist or isn't published yet.</p>
            <p><small>Check the admin panel to ensure it's published.</small></p>
            <a href="/insights.html">← Back to Insights</a>
          </div>
        </body>
        </html>
      `);
    }

    console.log(`[INSIGHT-PAGE] Found insight: ${insight.title}`);
    
    // Generate HTML page for the insight
    const html = generateInsightPage(insight);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
    
  } catch (error) {
    console.error('[INSIGHT-PAGE] Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error - Byron N. & Co. Advocates</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8f5f0; }
          .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-bottom: 1rem; }
          p { color: #666; margin-bottom: 2rem; }
          a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Server Error</h1>
          <p>We're experiencing technical difficulties. Please try again later.</p>
          <p><small>Error: ${error.message}</small></p>
          <a href="/">← Go to Homepage</a>
        </div>
      </body>
      </html>
    `);
  }
};

function generateInsightPage(insight) {
  const formattedDate = new Date(insight.date || insight.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // DON'T SANITIZE - Keep HTML structure from Quill
  const bodyContent = insight.body || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${insight.title || 'Insight'} • Byron N. & Co. Advocates</title>
    <meta name="description" content="${insight.excerpt ? insight.excerpt.substring(0, 160) : 'Legal insight from Byron N. & Co. Advocates'}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${insight.title || 'Insight'}">
    <meta property="og:description" content="${insight.excerpt ? insight.excerpt.substring(0, 160) : ''}">
    <meta property="og:image" content="${insight.image || '/images/default-insight.jpg'}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://yourdomain.com/insight/${insight.slug}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://yourdomain.com/insight/${insight.slug}">
    
    <!-- Schema.org markup -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${insight.title || ''}",
      "description": "${insight.excerpt || ''}",
      "image": "${insight.image || '/images/default-insight.jpg'}",
      "datePublished": "${insight.date || insight.createdAt}",
      "dateModified": "${insight.updatedAt || insight.createdAt}",
      "author": {
        "@type": "Person",
        "name": "Byron N. & Co. Advocates"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Byron N. & Co. Advocates",
        "logo": {
          "@type": "ImageObject",
          "url": "/images/logo.png"
        }
      }
    }
    </script>
    
    <!-- CSS -->
    <link rel="stylesheet" href="/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* PREMIUM INSIGHT STYLES */
        :root {
            --navy: #0a192f;
            --gold: #c9a86a;
            --ivory: #f8f5f0;
            --text: #333333;
            --gray-light: #f5f7fa;
            --gray-medium: #6b7280;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: #ffffff;
        }
        
        /* Navigation */
        .nav {
            background: var(--navy);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .nav-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .brand-combo {
            display: flex;
            align-items: center;
            gap: 1rem;
            text-decoration: none;
            color: white;
            font-weight: 600;
            font-size: 1.25rem;
        }
        
        .logo {
            height: 40px;
            width: auto;
        }
        
        /* Main Content */
        .insight-container {
            max-width: 760px;
            margin: 0 auto;
            padding: 6rem 1.5rem 4rem;
        }
        
        /* Header */
        .insight-header {
            margin-bottom: 3rem;
        }
        
        .insight-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 3.25rem;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 1.5rem;
            line-height: 1.1;
            letter-spacing: -0.5px;
        }
        
        .insight-meta {
            color: var(--gray-medium);
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .insight-divider {
            width: 60px;
            height: 3px;
            background: var(--gold);
            margin: 2rem 0;
        }
        
        /* Hero Image */
        .insight-hero {
            width: 100%;
            height: 500px;
            overflow: hidden;
            border-radius: 12px;
            margin: 2rem 0 3rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .insight-hero img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        /* BODY CONTENT STYLING - CRITICAL */
        .insight-body {
            font-size: 1.2rem;
            line-height: 1.9;
            color: #374151;
        }
        
        /* Style paragraphs from Quill */
        .insight-body p {
            margin-bottom: 1.8rem;
            font-size: 1.2rem;
            line-height: 1.9;
        }
        
        /* Style headings from Quill */
        .insight-body h1,
        .insight-body h2,
        .insight-body h3,
        .insight-body h4 {
            font-family: 'Cormorant Garamond', serif;
            color: var(--navy);
            margin: 3rem 0 1.5rem;
            font-weight: 600;
            line-height: 1.2;
        }
        
        .insight-body h1 { font-size: 2.5rem; }
        .insight-body h2 { 
            font-size: 2.25rem; 
            border-bottom: 2px solid var(--gold); 
            padding-bottom: 0.5rem;
            margin-top: 4rem;
        }
        .insight-body h3 { font-size: 1.75rem; }
        .insight-body h4 { font-size: 1.5rem; }
        
        /* Style links from Quill */
        .insight-body a {
            color: var(--navy);
            text-decoration: none;
            border-bottom: 2px solid var(--gold);
            padding-bottom: 2px;
            transition: all 0.3s ease;
        }
        
        .insight-body a:hover {
            color: var(--gold);
            border-bottom-color: var(--navy);
        }
        
        /* Style lists from Quill */
        .insight-body ul,
        .insight-body ol {
            margin: 2rem 0 2rem 2rem;
        }
        
        .insight-body li {
            margin-bottom: 0.75rem;
            padding-left: 0.5rem;
        }
        
        /* Style blockquotes from Quill */
        .insight-body blockquote {
            border-left: 4px solid var(--gold);
            padding: 2rem 3rem;
            margin: 3rem 0;
            font-style: italic;
            color: #555;
            background: var(--gray-light);
            border-radius: 0 12px 12px 0;
            font-size: 1.3rem;
            font-family: 'Cormorant Garamond', serif;
        }
        
        .insight-body blockquote p {
            margin-bottom: 0;
        }
        
        /* Style italic/emphasis from Quill */
        .insight-body em {
            font-style: italic;
            color: #555;
        }
        
        .insight-body strong {
            font-weight: 600;
            color: var(--navy);
        }
        
        /* Back Button */
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            margin-top: 4rem;
            padding: 1rem 2rem;
            background: var(--navy);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(10, 25, 47, 0.2);
        }
        
        .back-button:hover {
            background: #1a2d4a;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(10, 25, 47, 0.3);
        }
        
        /* Author Section */
        .author-section {
            background: linear-gradient(135deg, var(--navy) 0%, #1a2d4a 100%);
            padding: 3rem;
            border-radius: 12px;
            margin: 4rem 0;
            color: white;
            display: flex;
            align-items: center;
            gap: 2rem;
        }
        
        .author-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid var(--gold);
            flex-shrink: 0;
        }
        
        .author-info h3 {
            color: var(--gold);
            margin-bottom: 0.5rem;
            font-size: 1.5rem;
        }
        
        .author-info p {
            color: rgba(255,255,255,0.9);
            margin-bottom: 0;
        }
        
        /* FOOTER - Matching index.html */
        .main-footer {
            background: var(--navy);
            color: white;
            padding: 4rem 2rem 2rem;
            margin-top: 4rem;
        }
        
        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 3rem;
            margin-bottom: 3rem;
        }
        
        .footer-links {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .footer-links h4 {
            color: var(--gold);
            margin-bottom: 1rem;
            font-size: 1.2rem;
            font-family: 'Cormorant Garamond', serif;
        }
        
        .footer-links a {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
            color: var(--gold);
        }
        
        .footer-links p {
            color: rgba(255,255,255,0.8);
            margin: 0;
            line-height: 1.6;
        }
        
        .footer-bottom {
            max-width: 1200px;
            margin: 0 auto;
            padding-top: 2rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            text-align: center;
            color: rgba(255,255,255,0.6);
            font-size: 0.9rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .insight-container {
                padding: 4rem 1rem 3rem;
            }
            
            .insight-title {
                font-size: 2.5rem;
            }
            
            .insight-hero {
                height: 300px;
            }
            
            .insight-body {
                font-size: 1.1rem;
            }
            
            .insight-body p {
                font-size: 1.1rem;
            }
            
            .insight-body h1 { font-size: 2rem; }
            .insight-body h2 { font-size: 1.75rem; }
            .insight-body h3 { font-size: 1.5rem; }
            
            .insight-body blockquote {
                padding: 1.5rem 2rem;
                font-size: 1.1rem;
            }
            
            .author-section {
                flex-direction: column;
                text-align: center;
                padding: 2rem;
            }
            
            .nav-inner {
                padding: 0 1rem;
            }
            
            .footer-content {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
        }
        
        @media (max-width: 480px) {
            .insight-title {
                font-size: 2rem;
            }
            
            .insight-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }
    </style>
    
    <!-- Favicon -->
    <link rel="icon" href="/images/logo.png">
</head>
<body>
    <!-- Navigation -->
    <header class="nav" role="banner">
        <div class="nav-inner">
            <a class="brand brand-combo" href="/">
                <img src="/images/logo.png" alt="Firm Logo" class="logo">
                <span>Byron N. & Co. Advocates</span>
            </a>
            <a href="/insights.html" style="display: flex; align-items: center; gap: 0.5rem; color: white; text-decoration: none; font-weight: 500;">
                <i class="fas fa-arrow-left"></i> Back to Insights
            </a>
        </div>
    </header>
    
    <main class="insight-container">
        <article>
            <header class="insight-header">
                <h1 class="insight-title">${insight.title || 'Legal Insight'}</h1>
                <div class="insight-meta">
                    <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                    <span>•</span>
                    <span><i class="far fa-clock"></i> ${Math.ceil((insight.body || '').split(' ').length / 200)} min read</span>
                    ${insight.featured ? '<span style="background: var(--gold); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem;">Featured</span>' : ''}
                </div>
                <div class="insight-divider"></div>
            </header>
            
            ${insight.image ? `
            <figure class="insight-hero">
                <img src="${insight.image}" alt="${insight.title || 'Insight'}" loading="eager">
            </figure>
            ` : ''}
            
            <!-- RAW HTML FROM QUILL - PROPERLY STYLED -->
            <section class="insight-body">
                ${bodyContent}
            </section>
            
            <!-- Author Section -->
            <div class="author-section">
                <img src="/images/ByronNyasimi.png" alt="Byron Nyasimi" class="author-avatar">
                <div class="author-info">
                    <h3>Byron Nyasimi</h3>
                    <p>Principal Advocate at Byron N. & Co. Advocates with over 15 years of experience in corporate law, intellectual property, and constitutional matters.</p>
                </div>
            </div>
            
            <!-- Back Button -->
            <div style="text-align: center; margin-top: 3rem;">
                <a href="/insights.html" class="back-button">
                    <i class="fas fa-arrow-left"></i>
                    Back to All Insights
                </a>
            </div>
        </article>
    </main>
    
    <!-- Footer - Matching index.html -->
    <footer class="main-footer">
        <div class="footer-content">
            <div class="footer-links">
                <h4>Services</h4>
                <a href="/litigation-dispute-resolution.html">Litigation & Dispute Resolution</a>
                <a href="/intellectual-property.html">Intellectual Property</a>
                <a href="/Commercial and corporate law.html">Commercial & Corporate Law</a>
                <a href="/Constitutional and Human Rights Law.html">Constitutional & Human Rights Law</a>
                <a href="/conveyancing.html">Conveyancing</a>
                <a href="/Criminal Litigation.html">Criminal Litigation</a>
                <a href="/Entertainment.html">Entertainment</a>
                <a href="/Compensation & Liability Matters.html">Compensation & Liability Matters</a>
            </div>
            
            <div class="footer-links">
                <h4>Connect</h4>
                <a href="mailto:marioncherono55@gmail.com">marioncherono55@gmail.com</a>
                <a href="tel:+254707146880">+254 707 146 880</a>
                <p>Westlands Square, Nairobi, Kenya</p>
            </div>
            
            <div class="footer-links">
                <h4>Quick Links</h4>
                <a href="/">Home</a>
                <a href="/#about">About Us</a>
                <a href="/#services">Practice Areas</a>
                <a href="/insights.html">Legal Insights</a>
                <a href="/#contact">Contact</a>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>© ${new Date().getFullYear()} Byron N. & Co. Advocates. All rights reserved.</p>
            <p style="margin-top: 0.5rem;">Providing exceptional legal counsel since 2010</p>
        </div>
    </footer>
    
    <!-- Font Awesome -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
    
    <script>
        // Update footer year
        document.addEventListener('DOMContentLoaded', function() {
            const yearElement = document.querySelector('#current-year');
            if (yearElement) {
                yearElement.textContent = new Date().getFullYear();
            }
            
            // Smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        });
    </script>
</body>
</html>
  `;
}