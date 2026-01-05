// lib/github.js - COMMONJS VERSION (Preserves All Features)
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_OWNER || 'marion48';
const REPO_NAME = process.env.GITHUB_REPO || 'Law-Firm-Website';
const FILE_PATH = 'public/data/insights.json';

async function getInsightsData() {
  console.log('🔍 getInsightsData called');
  
  // CRITICAL: Check if token exists
  if (!GITHUB_TOKEN || GITHUB_TOKEN === 'undefined') {
    console.error('❌ GITHUB_TOKEN is not set! Check Vercel environment variables.');
    console.error('Current env:', { 
      hasToken: !!GITHUB_TOKEN,
      owner: REPO_OWNER,
      repo: REPO_NAME 
    });
    return [];
  }
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    console.log(`📊 GitHub API response: ${response.status}`);
    
    if (response.status === 404) {
      console.log('📄 Insights file not found, returning empty array');
      return [];
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GitHub API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    try {
      const insights = JSON.parse(content || '[]');
      console.log(`✅ Loaded ${insights.length} insights`);
      return insights;
    } catch (parseError) {
      console.error('❌ Error parsing insights JSON:', parseError);
      return [];
    }

  } catch (error) {
    console.error('💥 Error fetching insights:', error.message);
    console.error('Stack:', error.stack);
    return [];
  }
}

async function updateInsightsData(insights, commitMessage) {
  console.log('💾 updateInsightsData called');
  
  // CRITICAL: Check token before proceeding
  if (!GITHUB_TOKEN || GITHUB_TOKEN === 'undefined') {
    const error = new Error('GITHUB_TOKEN is not set in environment variables');
    console.error('❌', error.message);
    throw error;
  }
  
  try {
    console.log(`📝 Commit message: ${commitMessage}`);
    console.log(`📊 Saving ${insights.length} insights`);
    
    // First get the current file to get the SHA
    const currentFile = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    let sha = null;
    if (currentFile.ok) {
      const data = await currentFile.json();
      sha = data.sha;
      console.log(`🔑 Got file SHA: ${sha ? sha.substring(0, 10) + '...' : 'none'}`);
    } else {
      console.log('📄 No existing file - will create new');
    }

    // Update the file
    const content = Buffer.from(JSON.stringify(insights, null, 2)).toString('base64');
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: commitMessage || 'Update insights',
          content: content,
          sha: sha,
          branch: 'main'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ GitHub update failed:', error);
      throw new Error(`GitHub update failed: ${error.message}`);
    }

    console.log('✅ Insights updated successfully');
    return true;

  } catch (error) {
    console.error('💥 Error updating insights:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Export as CommonJS module
module.exports = {
  getInsightsData,
  updateInsightsData
};