// api/get-insights.js - COMPLETE VERSION
const { getInsightsData } = require("../lib/github.js");

module.exports = async (req, res) => {
  try {
    console.log("GET /api/get-insights - Fetching all insights");
    
    // Get all insights from GitHub
    const allInsights = await getInsightsData();
    console.log(`Total insights in storage: ${allInsights.length}`);
    
    // Filter for published insights only
    const publishedInsights = allInsights.filter(i => i.status === 'published');
    console.log(`Published insights: ${publishedInsights.length}`);
    
    // Log each insight for debugging
    publishedInsights.forEach((insight, index) => {
      console.log(`[${index}] ${insight.title} | Status: ${insight.status} | Slug: ${insight.slug || 'MISSING'}`);
    });
    
    // Sort by date (newest first)
    const sortedInsights = [...publishedInsights].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });
    
    // Validate and ensure required fields
    const validatedInsights = sortedInsights.map(insight => {
      // Generate slug if missing
      const slug = insight.slug || generateSlug(insight.title || 'untitled');
      
      return {
        id: insight.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: insight.title || 'Untitled Insight',
        excerpt: insight.excerpt || '',
        body: insight.body || '',
        image: insight.image || '/images/default-insight.jpg',
        slug: slug,
        date: insight.date || insight.createdAt || new Date().toISOString(),
        featured: insight.featured || false,
        status: insight.status || 'draft',
        createdAt: insight.createdAt || new Date().toISOString(),
        updatedAt: insight.updatedAt || new Date().toISOString(),
        url: `/insight/${slug}`
      };
    });
    
    console.log(`Returning ${validatedInsights.length} validated insights`);
    
    // Set headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Return the insights
    res.status(200).json(validatedInsights);
    
  } catch (error) {
    console.error("GET insights error:", error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};

function generateSlug(text) {
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