// api/insight-page.js - PREMIUM VERSION
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
    
    <!-- PREMIUM FONTS - Used by top websites -->
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Serif+Pro:wght@300;400;600&family=Lora:wght@400;500;600&family=Merriweather:wght@300;400;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* PREMIUM INSIGHT STYLES - PROFESSIONAL TYPOGRAPHY */
        :root {
            --navy: #0a192f;
            --gold: #c9a86a;
            --ivory: #f8f5f0;
            --text: #2c3e50;
            --gray-light: #f8f9fa;
            --gray-medium: #6c757d;
            --accent: #8b7355;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Source Serif Pro', Georgia, serif;
            line-height: 1.7;
            color: var(--text);
            background: #ffffff;
            font-weight: 400;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* Premium Navigation */
        .nav {
            background: var(--navy);
            padding: 1.2rem 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(10, 25, 47, 0.1);
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
            font-weight: 500;
            font-size: 1.3rem;
            font-family: 'Cormorant Garamond', serif;
        }
        
        .logo {
            height: 42px;
            width: auto;
        }
        
        .nav-back {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--gold);
            text-decoration: none;
            font-weight: 500;
            padding: 0.6rem 1.2rem;
            border: 1px solid var(--gold);
            border-radius: 4px;
            transition: all 0.3s ease;
            font-size: 0.95rem;
        }
        
        .nav-back:hover {
            background: var(--gold);
            color: var(--navy);
        }
        
        /* Main Content - Elegant spacing */
        .insight-container {
            max-width: 720px;
            margin: 0 auto;
            padding: 5rem 2rem 3rem;
        }
        
        /* Elegant Header */
        .insight-header {
            margin-bottom: 3.5rem;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 2.5rem;
        }
        
        .insight-title {
            font-family: 'Playfair Display', serif;
            font-size: 3.1rem;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 1.2rem;
            line-height: 1.15;
            letter-spacing: -0.3px;
        }
        
        .insight-meta {
            color: var(--gray-medium);
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* PREMIUM BODY CONTENT - PROFESSIONAL TYPOGRAPHY */
        .insight-body {
            font-size: 1.15rem;
            line-height: 1.8;
            color: #2d3748;
            font-weight: 400;
        }
        
        /* Premium paragraph styling */
        .insight-body p {
            margin-bottom: 1.6rem;
            font-size: 1.15rem;
            line-height: 1.8;
            text-align: left;
            font-family: 'Source Serif Pro', Georgia, serif;
            hyphens: auto;
            -webkit-hyphens: auto;
            -ms-hyphens: auto;
        }
        
        /* Elegant drop cap for first paragraph */
        .insight-body p:first-of-type::first-letter {
            font-family: 'Playfair Display', serif;
            float: left;
            font-size: 4.5rem;
            line-height: 1;
            padding-top: 0.75rem;
            padding-right: 0.5rem;
            padding-left: 0.1rem;
            color: var(--gold);
            font-weight: 600;
        }
        
        /* Premium heading styling */
        .insight-body h1,
        .insight-body h2,
        .insight-body h3,
        .insight-body h4 {
            font-family: 'Playfair Display', serif;
            color: var(--navy);
            margin: 3rem 0 1.2rem;
            font-weight: 600;
            line-height: 1.2;
            text-align: left;
            letter-spacing: -0.2px;
        }
        
        .insight-body h1 { 
            font-size: 2.4rem; 
            margin-top: 3.5rem;
            border-bottom: 2px solid var(--gold);
            padding-bottom: 0.5rem;
        }
        .insight-body h2 { 
            font-size: 2rem; 
            margin-top: 3rem;
            color: #1a365d;
        }
        .insight-body h3 { 
            font-size: 1.6rem; 
            margin-top: 2.5rem;
            color: #2d3748;
        }
        .insight-body h4 { 
            font-size: 1.3rem; 
            font-weight: 500;
        }
        
        /* Premium link styling */
        .insight-body a {
            color: var(--navy);
            text-decoration: none;
            border-bottom: 1px solid var(--gold);
            padding-bottom: 1px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .insight-body a:hover {
            color: var(--gold);
            border-bottom-width: 2px;
        }
        
        /* Premium list styling */
        .insight-body ul,
        .insight-body ol {
            margin: 1.8rem 0 1.8rem 2rem;
            font-size: 1.1rem;
        }
        
        .insight-body li {
            margin-bottom: 0.6rem;
            line-height: 1.7;
        }
        
        .insight-body ul li {
            list-style-type: none;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .insight-body ul li::before {
            content: "•";
            color: var(--gold);
            font-weight: bold;
            position: absolute;
            left: 0;
            font-size: 1.2rem;
        }
        
        /* Premium blockquote styling */
        .insight-body blockquote {
            border-left: 3px solid var(--gold);
            padding: 1.8rem 2.5rem;
            margin: 2.5rem 0;
            font-style: italic;
            color: #4a5568;
            background: var(--gray-light);
            border-radius: 0 8px 8px 0;
            font-size: 1.25rem;
            font-family: 'Merriweather', serif;
            line-height: 1.6;
        }
        
        .insight-body blockquote p {
            margin-bottom: 0;
            font-style: italic;
        }
        
        .insight-body blockquote::before {
            content: "\\201C";
            font-size: 4rem;
            color: var(--gold);
            opacity: 0.3;
            position: absolute;
            left: 1rem;
            top: -1rem;
            font-family: Georgia, serif;
        }
        
        /* Premium emphasis styling */
        .insight-body em {
            font-style: italic;
            color: #4a5568;
        }
        
        .insight-body strong {
            font-weight: 600;
            color: var(--navy);
        }
        
        /* Author Section - Professional */
        .author-section {
            background: linear-gradient(to right, #f8f9fa, #ffffff);
            padding: 2.5rem;
            border-radius: 8px;
            margin: 4rem 0;
            border-left: 4px solid var(--gold);
        }
        
        .author-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--gold);
            margin-right: 1.5rem;
            float: left;
        }
        
        .author-info h3 {
            color: var(--navy);
            margin-bottom: 0.3rem;
            font-size: 1.3rem;
            font-family: 'Playfair Display', serif;
        }
        
        .author-info p {
            color: var(--gray-medium);
            margin-bottom: 0;
            font-size: 0.95rem;
            line-height: 1.5;
        }
        
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        
        /* Professional Back Button */
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            margin-top: 3.5rem;
            padding: 0.9rem 2rem;
            background: transparent;
            color: var(--navy);
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: 1px solid var(--navy);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .back-button:hover {
            background: var(--navy);
            color: white;
            transform: translateY(-1px);
        }
        
        /* FOOTER - Professional */
        .main-footer {
            background: var(--navy);
            color: white;
            padding: 3.5rem 2rem 2rem;
            margin-top: 5rem;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2.5rem;
            margin-bottom: 2.5rem;
        }
        
        .footer-links {
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
        }
        
        .footer-links h4 {
            color: var(--gold);
            margin-bottom: 1rem;
            font-size: 1.1rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .footer-links a {
            color: rgba(255,255,255,0.85);
            text-decoration: none;
            transition: color 0.3s ease;
            font-size: 0.95rem;
        }
        
        .footer-links a:hover {
            color: var(--gold);
        }
        
        .footer-links p {
            color: rgba(255,255,255,0.85);
            margin: 0;
            line-height: 1.6;
            font-size: 0.95rem;
        }
        
        .footer-bottom {
            max-width: 1200px;
            margin: 0 auto;
            padding-top: 2rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            text-align: center;
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .insight-container {
                padding: 4rem 1.5rem 2.5rem;
            }
            
            .insight-title {
                font-size: 2.4rem;
                line-height: 1.2;
            }
            
            .insight-body {
                font-size: 1.1rem;
                line-height: 1.75;
            }
            
            .insight-body p {
                font-size: 1.1rem;
                line-height: 1.75;
            }
            
            .insight-body h1 { 
                font-size: 2rem; 
            }
            .insight-body h2 { 
                font-size: 1.7rem; 
            }
            .insight-body h3 { 
                font-size: 1.4rem; 
            }
            
            .insight-body blockquote {
                padding: 1.5rem 2rem;
                font-size: 1.1rem;
                margin: 2rem 0;
            }
            
            .author-section {
                padding: 2rem;
            }
            
            .nav-inner {
                padding: 0 1.5rem;
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
            
            .author-avatar {
                float: none;
                margin: 0 auto 1rem;
                display: block;
            }
            
            .author-info {
                text-align: center;
            }
        }
    </style>
    
    <!-- Favicon -->
    <link rel="icon" href="/images/logo.png">
</head>
<body>
    <!-- Premium Navigation -->
    <header class="nav" role="banner">
        <div class="nav-inner">
            <a class="brand brand-combo" href="/">
                <img src="/images/logo.png" alt="Firm Logo" class="logo">
                <span>Byron N. & Co. Advocates</span>
            </a>
            <a href="/insights.html" class="nav-back">
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
                    ${insight.featured ? '<span style="background: var(--gold); color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.85rem; margin-left: 1rem;">Featured</span>' : ''}
                </div>
            </header>
            
            <!-- PREMIUM BODY CONTENT -->
            <section class="insight-body">
                ${bodyContent}
            </section>
            
            <!-- Professional Author Section -->
            <div class="author-section clearfix">
                <img src="/images/ByronNyasimi.png" alt="Byron Nyasimi" class="author-avatar">
                <div class="author-info">
                    <h3>Byron Nyasimi</h3>
                    <p>Author</p>
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
    
    <!-- Professional Footer -->
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
        </div>
    </footer>
    
    <!-- Font Awesome -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</body>
</html>
  `;
}