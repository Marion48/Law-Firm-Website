// api/insights.js
import { getInsightsData, updateInsightsData } from '../lib/github.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, insight, index } = req.body;

    // Get current insights
    let insights = await getInsightsData();
    
    // Ensure insights is an array
    if (!Array.isArray(insights)) {
      insights = [];
    }

    let result;
    let commitMessage = '';

    switch (action) {
      case 'add':
        if (!insight || !insight.title) {
          return res.status(400).json({ error: 'Title is required' });
        }

        const newInsight = {
          id: Date.now().toString(),
          title: insight.title.trim(),
          excerpt: insight.excerpt ? insight.excerpt.trim() : '',
          body: insight.body || '',
          image: insight.image || '',
          slug: generateSlug(insight.slug || insight.title),
          date: insight.date || new Date().toISOString().split('T')[0],
          featured: insight.featured || false,
          status: insight.status || 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: `/insight/${generateSlug(insight.slug || insight.title)}`
        };
        
        // Add to beginning (newest first)
        insights.unshift(newInsight);
        commitMessage = `Add insight: ${newInsight.title}`;
        result = newInsight;
        break;

      case 'edit':
        if (index === undefined || index < 0 || index >= insights.length) {
          return res.status(400).json({ error: 'Invalid index for edit' });
        }
        
        if (!insight) {
          return res.status(400).json({ error: 'Insight data required' });
        }
        
        const updatedInsight = {
          ...insights[index],
          ...insight,
          title: insight.title ? insight.title.trim() : insights[index].title,
          excerpt: insight.excerpt ? insight.excerpt.trim() : insights[index].excerpt,
          slug: insight.slug ? generateSlug(insight.slug) : insights[index].slug,
          updatedAt: new Date().toISOString()
        };
        
        // Update URL if slug changed
        if (insight.slug && insight.slug !== insights[index].slug) {
          updatedInsight.url = `/insight/${generateSlug(insight.slug)}`;
        }
        
        insights[index] = updatedInsight;
        commitMessage = `Update insight: ${updatedInsight.title}`;
        result = updatedInsight;
        break;

      case 'delete':
        if (index === undefined || index < 0 || index >= insights.length) {
          return res.status(400).json({ error: 'Invalid index for delete' });
        }
        
        const deleted = insights.splice(index, 1)[0];
        commitMessage = `Delete insight: ${deleted.title}`;
        result = deleted;
        break;

      case 'get':
        // Return all insights sorted by date (newest first)
        const sortedInsights = [...insights].sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt);
          const dateB = new Date(b.date || b.createdAt);
          return dateB - dateA;
        });
        
        // Ensure each insight has required fields
        const validatedInsights = sortedInsights.map(insight => ({
          id: insight.id || Date.now().toString(),
          title: insight.title || 'Untitled',
          excerpt: insight.excerpt || '',
          body: insight.body || '',
          image: insight.image || '',
          slug: insight.slug || generateSlug(insight.title || 'untitled'),
          date: insight.date || insight.createdAt,
          featured: insight.featured || false,
          status: insight.status || 'draft',
          createdAt: insight.createdAt || new Date().toISOString(),
          updatedAt: insight.updatedAt || new Date().toISOString(),
          url: insight.url || `/insight/${insight.slug || generateSlug(insight.title || 'untitled')}`
        }));
        
        return res.status(200).json(validatedInsights);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Save updated insights back to GitHub
    await updateInsightsData(insights, commitMessage);

    // Return updated list sorted by date
    const sortedInsights = [...insights].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      data: result,
      insights: sortedInsights,
      count: sortedInsights.length
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

function generateSlug(text) {
  if (!text) return 'untitled';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}