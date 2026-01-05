// api/test-token.js
export default async function handler(req, res) {
  const env = {
    token: process.env.GITHUB_TOKEN ? "SET" : "MISSING",
    owner: process.env.GITHUB_OWNER || "marion48",
    repo: process.env.GITHUB_REPO || "Law-Firm-Website"
  };
  
  try {
    const github = await import("../lib/github.js");
    const insights = await github.getInsightsData();
    
    res.json({ 
      success: true, 
      env: env,
      insights: insights.length 
    });
  } catch (error) {
    res.json({ 
      error: error.message, 
      env: env,
      stack: error.stack 
    });
  }
}
