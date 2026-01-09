// api/insights.js - COMPLETE FIXED VERSION
const { getInsightsData, updateInsightsData } = require('../lib/github.js');

module.exports = async (req, res) => {
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
    console.log(`[INSIGHTS API] Action: ${action}, Index: ${index}`);

    // Get current insights
    let insights = await getInsightsData();
    
    // Ensure insights is an array
    if (!Array.isArray(insights)) {
      console.log('[INSIGHTS API] Insights is not an array, initializing empty array');
      insights = [];
    }

    console.log(`[INSIGHTS API] Found ${insights.length} insights in storage`);

    let result;
    let commitMessage = '';

    switch (action) {
      case 'add':
        console.log('[INSIGHTS API] Adding new insight:', insight?.title);
        
        if (!insight || !insight.title) {
          return res.status(400).json({ error: 'Title is required' });
        }

        const newInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: insight.title.trim(),
          excerpt: insight.excerpt ? insight.excerpt.trim() : '',
          body: insight.body || '',
          image: insight.image || '', // CRITICAL: Save the image URL
          slug: generateSlug(insight.slug || insight.title),
          date: insight.date || new Date().toISOString().split('T')[0],
          featured: insight.featured || false,
          status: insight.status || 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: `/api/insight-page?slug=${generateSlug(insight.slug || insight.title)}`
        };
        
        console.log('[INSIGHTS API] New insight created:', newInsight);
        console.log('[INSIGHTS API] Image URL saved:', newInsight.image);
        
        // Add to beginning (newest first)
        insights.unshift(newInsight);
        commitMessage = `Add insight: ${newInsight.title}`;
        result = newInsight;
        break;

      case 'edit':
        console.log(`[INSIGHTS API] Editing insight at index: ${index}`);
        
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
          image: insight.image || insights[index].image, // CRITICAL: Preserve or update image
          slug: insight.slug ? generateSlug(insight.slug) : insights[index].slug,
          updatedAt: new Date().toISOString()
        };
        
        console.log('[INSIGHTS API] Updated image URL:', updatedInsight.image);
        
        // Update URL if slug changed
        if (insight.slug && insight.slug !== insights[index].slug) {
          updatedInsight.url = `/api/insight-page?slug=${generateSlug(insight.slug)}`;
        }
        
        insights[index] = updatedInsight;
        commitMessage = `Update insight: ${updatedInsight.title}`;
        result = updatedInsight;
        console.log('[INSIGHTS API] Insight updated:', updatedInsight);
        break;

      case 'delete':
        console.log(`[INSIGHTS API] Deleting insight at index: ${index}`);
        
        if (index === undefined || index < 0 || index >= insights.length) {
          return res.status(400).json({ error: 'Invalid index for delete' });
        }
        
        const deleted = insights.splice(index, 1)[0];
        commitMessage = `Delete insight: ${deleted.title}`;
        result = deleted;
        console.log('[INSIGHTS API] Insight deleted:', deleted.title);
        break;

      case 'get':
        console.log('[INSIGHTS API] Getting all insights');
        
        // Return all insights sorted by date (newest first)
        const sortedInsights = [...insights].sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt);
          const dateB = new Date(b.date || b.createdAt);
          return dateB - dateA;
        });
        
        // Ensure each insight has required fields
        const validatedInsights = sortedInsights.map(insight => ({
          id: insight.id || `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: insight.title || 'Untitled',
          excerpt: insight.excerpt || '',
          body: insight.body || '',
          image: insight.image || '', // CRITICAL: Include image field
          slug: insight.slug || generateSlug(insight.title || 'untitled'),
          date: insight.date || insight.createdAt,
          featured: insight.featured || false,
          status: insight.status || 'draft',
          createdAt: insight.createdAt || new Date().toISOString(),
          updatedAt: insight.updatedAt || new Date().toISOString(),
          url: insight.url || `/api/insight-page?slug=${insight.slug || generateSlug(insight.title || 'untitled')}`
        }));
        
        console.log(`[INSIGHTS API] Returning ${validatedInsights.length} insights`);
        
        // Log image status for debugging
        validatedInsights.forEach((insight, i) => {
          console.log(`[INSIGHTS API] Insight ${i} image:`, {
            title: insight.title,
            hasImage: !!insight.image,
            imageUrl: insight.image
          });
        });
        
        return res.status(200).json(validatedInsights);

      default:
        console.log(`[INSIGHTS API] Unknown action: ${action}`);
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Save updated insights back to GitHub
    console.log(`[INSIGHTS API] Saving to GitHub: ${commitMessage}`);
    await updateInsightsData(insights, commitMessage);

    // Return updated list sorted by date
    const sortedInsights = [...insights].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB - dateA;
    });

    console.log(`[INSIGHTS API] Success! Returning ${sortedInsights.length} insights`);
    
    // Log image status in response
    sortedInsights.forEach((insight, i) => {
      console.log(`[INSIGHTS API Response] Insight ${i}: "${insight.title}" - Image: ${insight.image || '(none)'}`);
    });
    
    res.status(200).json({
      success: true,
      data: result,
      insights: sortedInsights,
      count: sortedInsights.length,
      message: `${action} completed successfully`
    });

  } catch (error) {
    console.error('[INSIGHTS API] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

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