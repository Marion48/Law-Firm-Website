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

  const readingTime = Math.ceil((insight.body || '').split(' ').length / 200);
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
    <meta property="og:url" content="https://law-firm-website-kappa.vercel.app/api/insight-page?slug=${insight.slug}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://law-firm-website-kappa.vercel.app/api/insight-page?slug=${insight.slug}">
    
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
    
    <!-- PREMIUM FONTS -->
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Serif+Pro:wght@300;400;600&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* PREMIUM INSIGHT STYLES */
        :root {
            --navy: #0a192f;
            --gold: #c9a86a;
            --maroon: #800000;
            --ivory: #f8f5f0;
            --text: #2c3e50;
            --gray-light: #f8f9fa;
            --gray-medium: #6c757d;
            --accent: #8b7355;
            --twitter-blue: #1DA1F2;
            --linkedin-blue: #0077B5;
            --facebook-blue: #4267B2;
            --instagram-pink: #E1306C;
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
        
        /* ===== NAVIGATION - EXACT SAME AS INDEX2.HTML ===== */
        .nav {
            background: var(--navy);
            padding: 0.8rem 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(10, 25, 47, 0.15);
            border-bottom: 2px solid var(--gold);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .nav-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
        }
        
        .brand-combo {
            display: flex;
            align-items: center;
            gap: 1.2rem;
            text-decoration: none;
            color: white;
            font-weight: 600;
            font-size: 1.25rem;
            font-family: 'Cormorant Garamond', serif;
            transition: opacity 0.3s ease;
        }
        
        .brand-combo:hover {
            opacity: 0.9;
        }
        
        .logo {
            height: 56px;
            width: auto;
            transition: transform 0.3s ease;
        }
        
        .brand-combo:hover .logo {
            transform: scale(1.05);
        }
        
        /* Hamburger Menu */
        .hamburger {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.8rem;
            cursor: pointer;
            padding: 0.5rem;
            transition: color 0.3s ease;
        }
        
        .hamburger:hover {
            color: var(--gold);
        }
        
        /* Navigation Menu */
        #main-nav ul {
            display: flex;
            list-style: none;
            gap: 2rem;
            margin: 0;
            padding: 0;
        }
        
        #main-nav a {
            color: white;
            text-decoration: none;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            font-size: 1rem;
            padding: 0.5rem 0;
            position: relative;
            transition: color 0.3s ease;
        }
        
        #main-nav a:hover,
        #main-nav a.active {
            color: var(--gold);
        }
        
        #main-nav a.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--gold);
        }
        
        #main-nav a::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--gold);
            transition: width 0.3s ease;
        }
        
        #main-nav a:hover::after {
            width: 100%;
        }
        
        /* Responsive Navigation */
        @media (max-width: 768px) {
            .hamburger {
                display: block;
            }
            
            #main-nav {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--navy);
                padding: 1rem;
                box-shadow: 0 4px 20px rgba(10, 25, 47, 0.3);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 1000;
            }
            
            #main-nav ul {
                flex-direction: column;
                gap: 0;
            }
            
            #main-nav li {
                width: 100%;
            }
            
            #main-nav a {
                display: block;
                padding: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            #main-nav a:last-child {
                border-bottom: none;
            }
            
            #main-nav a.active::after {
                display: none;
            }
            
            #main-nav a.active {
                background: rgba(201, 168, 106, 0.1);
                border-left: 3px solid var(--gold);
            }
        }
        
        /* ===== MAIN CONTENT ===== */
        .insight-container {
            max-width: 720px;
            margin: 0 auto;
            padding: 4rem 2rem 3rem;
        }
        
        /* ===== ELEGANT HEADER ===== */
        .insight-header {
            margin-bottom: 3.5rem;
            padding-bottom: 2.5rem;
            border-bottom: 2px solid var(--ivory);
            position: relative;
        }
        
        .insight-header::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 120px;
            height: 2px;
            background: var(--gold);
        }
        
        .insight-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 3.2rem;
            font-weight: 700;
            color: var(--navy);
            margin-bottom: 1.2rem;
            line-height: 1.1;
            letter-spacing: -0.5px;
        }
        
        .insight-meta {
            color: var(--gray-medium);
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 1.2rem;
            margin-bottom: 0.5rem;
            font-family: 'Inter', sans-serif;
            flex-wrap: wrap;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        
        .meta-item i {
            color: var(--gold);
            width: 16px;
        }
        
        /* ===== PREMIUM BODY CONTENT ===== */
        .insight-body {
            font-size: 1.15rem;
            line-height: 1.85;
            color: #2d3748;
            font-weight: 400;
        }
        
        .insight-body p {
            margin-bottom: 1.8rem;
            font-size: 1.15rem;
            line-height: 1.85;
            text-align: left;
            font-family: 'Source Serif Pro', Georgia, serif;
        }
        
        /* Elegant drop cap for first paragraph */
        .insight-body p:first-of-type::first-letter {
            font-family: 'Playfair Display', serif;
            float: left;
            font-size: 5rem;
            line-height: 0.8;
            padding-top: 0.9rem;
            padding-right: 0.6rem;
            padding-left: 0.1rem;
            color: var(--gold);
            font-weight: 700;
        }
        
        /* Premium heading styling */
        .insight-body h1,
        .insight-body h2,
        .insight-body h3,
        .insight-body h4 {
            font-family: 'Playfair Display', serif;
            color: var(--navy);
            margin: 3.5rem 0 1.5rem;
            font-weight: 600;
            line-height: 1.2;
            text-align: left;
        }
        
        .insight-body h1 { 
            font-size: 2.5rem; 
            margin-top: 4rem;
            padding-bottom: 0.8rem;
            border-bottom: 2px solid var(--gold);
        }
        .insight-body h2 { 
            font-size: 2.1rem; 
            margin-top: 3.5rem;
            color: #1a365d;
        }
        .insight-body h3 { 
            font-size: 1.7rem; 
            margin-top: 3rem;
            color: #2d3748;
        }
        
        /* ===== PREMIUM AUTHOR SECTION ===== */
        .author-section {
            background: linear-gradient(135deg, var(--ivory) 0%, #ffffff 100%);
            padding: 2.5rem;
            border-radius: 12px;
            margin: 4.5rem 0 3rem;
            border-left: 4px solid var(--gold);
            box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
        }
        
        .author-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .author-avatar {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid var(--gold);
            box-shadow: 0 4px 15px rgba(201, 168, 106, 0.2);
        }
        
        .author-info h3 {
            color: var(--navy);
            margin-bottom: 0.4rem;
            font-size: 1.4rem;
            font-family: 'Playfair Display', serif;
        }
        
        .author-info p {
            color: var(--gray-medium);
            margin-bottom: 0;
            font-size: 1rem;
            line-height: 1.5;
            font-family: 'Inter', sans-serif;
        }
        
        .author-bio {
            color: var(--text);
            font-size: 1.05rem;
            line-height: 1.7;
            margin-top: 1.2rem;
            padding-top: 1.2rem;
            border-top: 1px solid rgba(201, 168, 106, 0.3);
            font-style: italic;
        }
        
        /* ===== PREMIUM SOCIAL SHARE SECTION ===== */
        .share-section {
            background: linear-gradient(135deg, var(--navy) 0%, #1a365d 100%);
            padding: 2.5rem;
            border-radius: 12px;
            margin: 3rem 0;
            text-align: center;
            box-shadow: 0 8px 30px rgba(10, 25, 47, 0.15);
        }
        
        .share-title {
            color: white;
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            position: relative;
            display: inline-block;
        }
        
        .share-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: var(--gold);
        }
        
        .share-subtitle {
            color: rgba(255, 255, 255, 0.85);
            font-size: 1rem;
            margin-bottom: 2rem;
            font-family: 'Inter', sans-serif;
        }
        
        .share-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .share-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            color: white;
            text-decoration: none;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .share-btn:hover {
            transform: translateY(-3px) scale(1.1);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        
        .share-btn.twitter { background: var(--twitter-blue); }
        .share-btn.linkedin { background: var(--linkedin-blue); }
        .share-btn.facebook { background: var(--facebook-blue); }
        .share-btn.instagram { 
            background: linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45, #FFDC80);
        }
        .share-btn.email { background: var(--maroon); }
        
        .share-btn-label {
            margin-top: 1rem;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.85rem;
            font-family: 'Inter', sans-serif;
        }
        
        /* ===== PREMIUM BACK BUTTON ===== */
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            margin-top: 3rem;
            padding: 0.8rem 1.8rem;
            background: transparent;
            color: var(--navy);
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            border: 2px solid var(--navy);
            font-family: 'Inter', sans-serif;
        }
        
        .back-button:hover {
            background: var(--navy);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(10, 25, 47, 0.15);
        }
        
        /* ===== FOOTER ===== */
        .main-footer {
            background: var(--navy);
            color: white;
            padding: 3.5rem 2rem 2rem;
            margin-top: 5rem;
            font-family: 'Cormorant Garamond', serif;
            border-top: 2px solid var(--gold);
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
            gap: 0.8rem;
        }
        
        .footer-links h4 {
            color: var(--gold);
            margin-bottom: 1.2rem;
            font-size: 1.2rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .footer-links a {
            color: rgba(255, 255, 255, 0.85);
            text-decoration: none;
            transition: all 0.3s ease;
            font-size: 0.95rem;
            font-family: 'Inter', sans-serif;
        }
        
        .footer-links a:hover {
            color: var(--gold);
            padding-left: 5px;
        }
        
        .footer-links p {
            color: rgba(255, 255, 255, 0.85);
            margin: 0;
            line-height: 1.6;
            font-size: 0.95rem;
            font-family: 'Inter', sans-serif;
        }
        
        .footer-bottom {
            max-width: 1200px;
            margin: 0 auto;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
            font-family: Cormorant Garamond;
        }
        
        /* ===== RESPONSIVE DESIGN ===== */
        @media (max-width: 768px) {
            .container {
                padding: 0 1.5rem;
            }
            
            .logo {
                height: 48px;
            }
            
            .brand-combo span {
                font-size: 1.1rem;
            }
            
            .insight-container {
                padding: 3.5rem 1.5rem 2.5rem;
            }
            
            .insight-title {
                font-size: 2.6rem;
                line-height: 1.2;
            }
            
            .insight-meta {
                gap: 1rem;
                font-size: 0.9rem;
            }
            
            .insight-body {
                font-size: 1.1rem;
                line-height: 1.8;
            }
            
            .insight-body p {
                font-size: 1.1rem;
                line-height: 1.8;
            }
            
            .insight-body p:first-of-type::first-letter {
                font-size: 4rem;
                padding-top: 0.8rem;
            }
            
            .insight-body h1 { 
                font-size: 2.1rem; 
            }
            .insight-body h2 { 
                font-size: 1.8rem; 
            }
            .insight-body h3 { 
                font-size: 1.5rem; 
            }
            
            .author-section {
                padding: 2rem;
            }
            
            .author-header {
                flex-direction: column;
                text-align: center;
                gap: 1rem;
            }
            
            .share-section {
                padding: 2rem;
            }
            
            .share-buttons {
                gap: 0.8rem;
            }
            
            .share-btn {
                width: 45px;
                height: 45px;
                font-size: 1.1rem;
            }
            
            .footer-content {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
        }
        
        @media (max-width: 480px) {
            .nav-inner {
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
            }
            
            .brand-combo {
                justify-content: center;
                width: 100%;
            }
            
            .insight-title {
                font-size: 2.2rem;
            }
            
            .insight-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
            
            .share-buttons {
                gap: 0.5rem;
            }
            
            .share-btn {
                width: 40px;
                height: 40px;
                font-size: 1rem;
            }
        }
    </style>
    
    <!-- Favicon -->
    <link rel="icon" href="/images/logo.png">
</head>
<body>
    <!-- ===== NAVIGATION - EXACT SAME AS INDEX2.HTML ===== -->
    <header class="nav" role="banner">
        <div class="container nav-inner">
            <a class="brand brand-combo" href="/index.html">
                <img src="/images/logo.png" alt="Firm Logo" class="logo">
                <span>Byron N. & Co. Advocates</span>
            </a>
            <button id="mobile-toggle" class="hamburger" aria-label="Open navigation" aria-expanded="false">☰</button>
            <nav id="main-nav" role="navigation" aria-label="Main Navigation">
                <ul>
                    <li><a href="/index.html#home" class="active">Home</a></li>
                    <li><a href="/index.html#about">About</a></li>
                    <li><a href="/index.html#services">Practice Areas</a></li>
                    <li><a href="/index.html#team">Team</a></li>
                    <li><a href="/insights.html">Insights</a></li>
                    <li><a href="/index.html#contact">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>
    
    <!-- ===== MAIN CONTENT ===== -->
    <main class="insight-container">
        <article>
            <!-- HEADER -->
            <header class="insight-header">
                <h1 class="insight-title">${insight.title || 'Legal Insight'}</h1>
                <div class="insight-meta">
                    <div class="meta-item">
                        <i class="far fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="meta-item">
                        <i class="far fa-clock"></i>
                        <span>${readingTime} min read</span>
                    </div>
                    ${insight.featured ? 
                    '<div class="meta-item"><i class="fas fa-star"></i><span>Featured Insight</span></div>' 
                    : ''}
                </div>
            </header>
            
            <!-- BODY CONTENT -->
            <section class="insight-body">
                ${bodyContent}
            </section>
            
            <!-- ===== AUTHOR SECTION ===== -->
            <div class="author-section">
                <div class="author-header">
                    <img src="/images/ByronNyasimi.png" alt="Byron Nyasimi" class="author-avatar">
                    <div class="author-info">
                        <h3>Byron Nyasimi</h3>
                        <p>Author</p>
                    </div>
                </div>
                <div class="author-bio">
                    
            </div>
        


            <!-- ===== SOCIAL SHARE SECTION ===== -->
            <div class="share-section">
                <h3 class="share-title">Share This Insight</h3>
                <p class="share-subtitle">Help others discover this valuable legal perspective</p>
                <div class="share-buttons">
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(insight.title)}&url=${encodeURIComponent('https://law-firm-website-kappa.vercel.app/api/insight-page?slug=' + insight.slug)}" 
                       target="_blank" 
                       class="share-btn twitter"
                       onclick="window.open(this.href, 'twitter-share', 'width=550,height=235');return false;">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://law-firm-website-kappa.vercel.app/api/insight-page?slug=' + insight.slug)}" 
                       target="_blank" 
                       class="share-btn linkedin"
                       onclick="window.open(this.href, 'linkedin-share', 'width=550,height=600');return false;">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://law-firm-website-kappa.vercel.app/api/insight-page?slug=' + insight.slug)}" 
                       target="_blank" 
                       class="share-btn facebook"
                       onclick="window.open(this.href, 'facebook-share', 'width=580,height=296');return false;">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://www.instagram.com/" 
                       target="_blank" 
                       class="share-btn instagram"
                       onclick="alert('Share this link on Instagram: ' + window.location.href);">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="mailto:?subject=${encodeURIComponent('Check out this legal insight: ' + insight.title)}&body=${encodeURIComponent('I thought you might find this interesting:\n\n' + insight.title + '\n\n' + 'Read it here: ' + 'https://law-firm-website-kappa.vercel.app/api/insight-page?slug=' + insight.slug)}" 
                       class="share-btn email">
                        <i class="far fa-envelope"></i>
                    </a>
                </div>
            </div>
            
            <!-- BACK BUTTON -->
            <div style="text-align: center; margin-top: 3rem;">
                <a href="/insights.html" class="back-button">
                    <i class="fas fa-arrow-left"></i>
                    Back to All Insights
                </a>
            </div>
        </article>
    </main>
    
    <!-- ===== FOOTER ===== -->
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
    
    <!-- Mobile Menu Toggle Script -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const mobileToggle = document.getElementById('mobile-toggle');
            const mainNav = document.getElementById('main-nav');
            
            if (mobileToggle && mainNav) {
                mobileToggle.addEventListener('click', function() {
                    const isExpanded = this.getAttribute('aria-expanded') === 'true';
                    this.setAttribute('aria-expanded', !isExpanded);
                    mainNav.style.display = isExpanded ? 'none' : 'block';
                    this.textContent = isExpanded ? '☰' : '✕';
                });
                
                // Close menu when clicking outside on mobile
                document.addEventListener('click', function(event) {
                    if (window.innerWidth <= 768) {
                        if (!mobileToggle.contains(event.target) && !mainNav.contains(event.target)) {
                            mobileToggle.setAttribute('aria-expanded', 'false');
                            mainNav.style.display = 'none';
                            mobileToggle.textContent = '☰';
                        }
                    }
                });
            }
        });
    </script>
    
    <!-- Font Awesome -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
    
    <script>
        // Social share functions
        function shareTwitter() {
            const url = window.location.href;
            const text = "${insight.title.replace(/"/g, '&quot;')}";
            window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), 'twitter-share', 'width=550,height=235');
            return false;
        }
        
        function shareLinkedIn() {
            const url = window.location.href;
            window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), 'linkedin-share', 'width=550,height=600');
            return false;
        }
        
        function shareFacebook() {
            const url = window.location.href;
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), 'facebook-share', 'width=580,height=296');
            return false;
        }
        
        function shareEmail() {
            const subject = "Check out this legal insight: ${insight.title.replace(/"/g, '&quot;')}";
            const body = "I thought you might find this interesting:\\n\\n${insight.title.replace(/"/g, '&quot;')}\\n\\nRead it here: " + window.location.href;
            window.location.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            return false;
        }
        
        // Copy link function
        function copyLink() {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard!');
            });
            return false;
        }
    </script>
    

</body>
</html>
  `;
}