// api/final-clean.js
const { getInsightsData, updateInsightsData } = require("../lib/github.js");

module.exports = async (req, res) => {
  try {
    console.log("=== FINAL CLEANUP ===");
    
    let insights = await getInsightsData();
    
    insights = insights.map(insight => ({
      ...insight,
      image: insight.image && insight.image.startsWith('blob:') ? '' : insight.image,
      updatedAt: new Date().toISOString()
    }));
    
    await updateInsightsData(insights, "Clean blob URLs from insights");
    
    res.json({
      success: true,
      message: "Cleaned all insights",
      insights: insights
    });
    
  } catch (error) {
    console.error("Cleanup error:", error);
    res.json({ error: error.message });
  }
};
