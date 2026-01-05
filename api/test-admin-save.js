// api/test-admin-save.js
const { getInsightsData, updateInsightsData } = require("../lib/github.js");

module.exports = async (req, res) => {
  console.log("Testing admin save...");
  
  try {
    // Get current
    const insights = await getInsightsData();
    console.log("Current insights:", insights.length);
    
    // Create test
    const testInsight = {
      id: Date.now().toString(),
      title: "Test " + new Date().toISOString(),
      excerpt: "Test excerpt",
      body: "Test body",
      slug: "test-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      featured: false,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: "/insight/test-" + Date.now()
    };
    
    // Add and save
    insights.unshift(testInsight);
    await updateInsightsData(insights, "Test save");
    
    // Verify
    const updated = await getInsightsData();
    
    res.json({
      success: true,
      before: insights.length - 1,
      after: updated.length,
      testInsight: testInsight
    });
    
  } catch (error) {
    console.error("Test failed:", error.message);
    res.json({ success: false, error: error.message });
  }
};
