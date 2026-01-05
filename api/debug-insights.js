// api/debug-insights.js
const { getInsightsData } = require("../lib/github.js");

module.exports = async (req, res) => {
  try {
    const insights = await getInsightsData();
    
    // Log everything
    console.log("=== DEBUG INSIGHTS ===");
    console.log("Total insights:", insights.length);
    console.log("Raw insights:", JSON.stringify(insights, null, 2));
    
    // Check status of each
    insights.forEach((insight, i) => {
      console.log(`Insight ${i}:`, {
        title: insight.title,
        status: insight.status,
        date: insight.date,
        slug: insight.slug
      });
    });
    
    res.json({
      total: insights.length,
      published: insights.filter(i => i.status === 'published').length,
      drafts: insights.filter(i => i.status !== 'published').length,
      insights: insights
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.json({ error: error.message });
  }
};
