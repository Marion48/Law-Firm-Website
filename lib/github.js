// lib/github.js
import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_OWNER || 'marion48';
const REPO_NAME = process.env.GITHUB_REPO || 'Law-Firm-Website';
const FILE_PATH = 'public/data/insights.json';  // Updated path

export async function getInsightsData() {
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

    if (response.status === 404) {
      console.log('Insights file not found, returning empty array');
      return [];
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    try {
      return JSON.parse(content || '[]');
    } catch (parseError) {
      console.error('Error parsing insights JSON:', parseError);
      return [];
    }

  } catch (error) {
    console.error('Error fetching insights:', error.message);
    return [];
  }
}

export async function updateInsightsData(insights, commitMessage) {
  try {
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
      console.error('GitHub update failed:', error);
      throw new Error(`GitHub update failed: ${error.message}`);
    }

    console.log('Insights updated successfully');
    return true;

  } catch (error) {
    console.error('Error updating insights:', error.message);
    throw error;
  }
}