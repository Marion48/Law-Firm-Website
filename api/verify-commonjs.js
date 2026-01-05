// api/verify-commonjs.js
const github = require("../lib/github.js");

module.exports = async (req, res) => {
  console.log("=== VERIFY COMMONJS ===");
  
  try {
    console.log("Testing module import...");
    console.log("Functions available:", Object.keys(github));
    
    console.log("Testing getInsightsData...");
    const insights = await github.getInsightsData();
    console.log(`Got ${insights.length} insights`);
    
    res.json({
      success: true,
      moduleType: "CommonJS",
      functions: Object.keys(github),
      insightsCount: insights.length,
      environment: {
        githubToken: process.env.GITHUB_TOKEN ? "SET" : "MISSING",
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error("Verification failed:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
