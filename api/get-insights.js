// api/get-insights.js
const { getInsightsData } = require("../lib/github.js");

module.exports = async (req, res) => {
  try {
    console.log("GET /api/get-insights");
    
    
const insight = insights.find(
  i => i.slug === slug && i.status === 'published'
);

if (!insight) {
  return res.status(404).send('Insight not found');
}


    // Filter for published insights only
    res.status(200).json(publishedInsights);

    
    // Sort by date (newest first)
    const sortedInsights = [...publishedInsights].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });
    
    // Add required fields if missing
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
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(validatedInsights);
    
  } catch (error) {
    console.error("GET insights error:", error);
    res.status(500).json({ error: error.message });
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
