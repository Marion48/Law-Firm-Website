// api/test-insights.js
const { getInsightsData } = require("../lib/github.js");

module.exports = async (req, res) => {
  try {
    const insights = await getInsightsData();
    
    // Count published vs draft
    const published = insights.filter(i => i.status === 'published');
    const drafts = insights.filter(i => i.status !== 'published');
    
    res.json({
      total: insights.length,
      published: published.length,
      drafts: drafts.length,
      allInsights: insights.map(i => ({
        title: i.title,
        status: i.status,
        date: i.date,
        slug: i.slug,
        url: i.url
      }))
    });
  } catch (error) {
    res.json({ error: error.message });
  }
};
