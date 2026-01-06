// api/insight-page.js
import { getInsightsData } from '../lib/github.js';

export default async function handler(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(404).send('Insight not found');
  }

  try {
    const insights = await getInsightsData();
    const insight = insights.find(i => i.slug === slug);
    
    if (!insight) {
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
            <p>The insight you're looking for doesn't exist or has been moved.</p>
            <a href="/insights.html">← Back to Insights</a>
          </div>
        </body>
        </html>
      `);
    }

    // Generate HTML page for the insight
    const html = generateInsightPage(insight);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(html);
    
  } catch (error) {
    console.error('Error generating insight page:', error);
    res.status(500).send('Server error');
  }
}

function generateInsightPage(insight) {
  const formattedDate = new Date(insight.date || insight.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Sanitize content to prevent XSS
  const sanitizedBody = insight.body ? insight.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;') : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${insight.title ? insight.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Insight'} • Byron N. & Co. Advocates</title>
    <meta name="description" content="${insight.excerpt ? insight.excerpt.replace(/"/g, '&quot;').substring(0, 160) : 'Legal insight from Byron N. & Co. Advocates'}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${insight.title ? insight.title.replace(/"/g, '&quot;') : 'Insight'}">
    <meta property="og:description" content="${insight.excerpt ? insight.excerpt.replace(/"/g, '&quot;').substring(0, 160) : ''}">
    <meta property="og:image" content="${insight.image || 'https://yourdomain.com/images/default-insight.jpg'}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://yourdomain.com/insight/${insight.slug}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://yourdomain.com/insight/${insight.slug}">
    
    <!-- Schema.org markup -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${insight.title ? insight.title.replace(/"/g, '\\\\"') : ''}",
      "description": "${insight.excerpt ? insight.excerpt.replace(/"/g, '\\\\"') : ''}",
      "image": "${insight.image || 'https://yourdomain.com/images/default-insight.jpg'}",
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
          "url": "https://yourdomain.com/images/logo.png"
        }
      }
    }
    </script>
    
    <!-- CSS -->
    <link rel="stylesheet" href="/style.css">
    <style>
        :root {
            --navy: #0a192f;
            --gold: #c9a86a;
            --ivory: #f8f5f0;
            --text: #333333;
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
            background: #fff;
        }
        .insight-article {
  max-width: 860px;
  margin: 6rem auto;
  padding: 0 1.5rem;
}

.insight-header h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  color: var(--navy);
}

.insight-body {
  font-family: 'Inter', sans-serif;
  line-height: 1.8;
}

        .insight-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }
        
        .insight-header {
            margin-bottom: 3rem;
            text-align: center;
        }
        
        .insight-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 3rem;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 1rem;
            line-height: 1.2;
        }
        
        .insight-meta {
            color: #666;
            font-size: 1rem;
            margin-bottom: 2rem;
        }
        
        .insight-hero {
            width: 100%;
            height: 400px;
            overflow: hidden;
            border-radius: 8px;
            margin: 2rem 0 3rem 0;
        }
        
        .insight-hero img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .insight-body {
            font-size: 1.125rem;
            line-height: 1.8;
            color: #333;
        }
        
        .insight-body h2 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 2rem;
            margin: 3rem 0 1rem 0;
            color: var(--navy);
        }
        
        .insight-body h3 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.5rem;
            margin: 2rem 0 1rem 0;
            color: var(--navy);
        }
        
        .insight-body p {
            margin-bottom: 1.5rem;
        }
        
        .insight-body img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 2rem 0;
        }
        
        .insight-body ul,
        .insight-body ol {
            margin-left: 2rem;
            margin-bottom: 1.5rem;
        }
        
        .insight-body li {
            margin-bottom: 0.5rem;
        }
        
        .insight-body blockquote {
            border-left: 4px solid var(--gold);
            padding-left: 1.5rem;
            margin: 2rem 0;
            font-style: italic;
            color: #555;
        }
        
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 3rem;
            padding: 0.75rem 1.5rem;
            background: var(--navy);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .back-button:hover {
            background: #1a2d4a;
            transform: translateY(-2px);
        }
        
        /* Navigation */
        .nav {
            background: var(--navy);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
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
        
        /* Responsive */
        @media (max-width: 768px) {
            .insight-container {
                padding: 2rem 1rem;
            }
            
            .insight-title {
                font-size: 2rem;
            }
            
            .insight-hero {
                height: 250px;
            }
            
            .insight-body {
                font-size: 1rem;
            }
        }
        
        @media (max-width: 480px) {
            .insight-title {
                font-size: 1.75rem;
            }
            
            .nav-inner {
                padding: 0 1rem;
            }
        }
    </style>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
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
            <nav>
                <a href="/insights.html" style="color: white; text-decoration: none; font-weight: 500;">← Back to Insights</a>
            </nav>
        </div>
    </header>
    
    <main class="insight-container">
    <article class="insight-article">
  <header class="insight-header">
    <h1>${insight.title}</h1>
    <p class="insight-meta">
      ${formattedDate}
    </p>
  </header>

  ${
    insight.image
      ? `<figure class="insight-hero">
           <img src="${insight.image}" alt="${insight.title}">
         </figure>`
      : ''
  }

  <section class="insight-body">
    ${sanitizedBody.replace(/\n/g, '<br>')}
  </section>
</article>


    </main>
    
    <!-- Footer -->
    <footer style="background: var(--navy); color: white; padding: 3rem 2rem; margin-top: 4rem;">
        <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <p>© ${new Date().getFullYear()} Byron N. & Co. Advocates. All rights reserved.</p>
            <p style="margin-top: 1rem; opacity: 0.8;">Westlands Square, Nairobi, Kenya</p>
        </div>
    </footer>
</body>
</html>
  `;
}