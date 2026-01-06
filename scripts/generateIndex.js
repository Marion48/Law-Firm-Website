const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const insightsDir = path.join(__dirname, '../content/insights');
const jsonDataPath = path.join(__dirname, '../public/data/insights.json');
const outputPath = path.join(insightsDir, 'index.json');

console.log('🚀 Starting insights index generation...');
console.log(`📁 Markdown directory: ${insightsDir}`);
console.log(`📄 JSON data path: ${jsonDataPath}`);

let insights = [];

// 1. Read from markdown files (if they exist)
try {
  if (fs.existsSync(insightsDir)) {
    const files = fs.readdirSync(insightsDir).filter(f => f.endsWith('.md'));
    
    console.log(`📝 Found ${files.length} markdown files`);
    
    const markdownInsights = files
      .map(file => {
        try {
          const content = fs.readFileSync(path.join(insightsDir, file), 'utf-8');
          const { data, content: body } = matter(content);
          
          return {
            ...data,
            body: body || '',
            source: 'markdown',
            file: file
          };
        } catch (error) {
          console.error(`❌ Error reading ${file}:`, error.message);
          return null;
        }
      })
      .filter(insight => insight !== null);
    
    insights = insights.concat(markdownInsights);
  } else {
    console.log('📝 No markdown directory found');
  }
} catch (error) {
  console.error('❌ Error reading markdown files:', error.message);
}

// 2. Read from JSON file (your admin's data)
try {
  if (fs.existsSync(jsonDataPath)) {
    const jsonData = JSON.parse(fs.readFileSync(jsonDataPath, 'utf-8'));
    
    console.log(`📊 Found ${jsonData.length} insights in JSON`);
    
    const jsonInsights = jsonData
      .filter(insight => insight.status === 'published') // Only published
      .map(insight => ({
        title: insight.title || 'Untitled',
        slug: insight.slug || generateSlug(insight.title || 'untitled'),
        excerpt: insight.excerpt || '',
        date: insight.date || insight.createdAt || new Date().toISOString().split('T')[0],
        image: insight.image || '/images/default-insight.jpg',
        author: insight.author || 'Byron N. & Co. Advocates',
        content: insight.body || '',
        source: 'json',
        status: insight.status || 'published',
        featured: insight.featured || false
      }));
    
    insights = insights.concat(jsonInsights);
  } else {
    console.log('📊 No JSON data file found');
  }
} catch (error) {
  console.error('❌ Error reading JSON file:', error.message);
}

// Remove duplicates (prefer JSON over markdown if same slug)
const uniqueInsights = [];
const seenSlugs = new Set();

[...insights].reverse().forEach(insight => {
  const slug = insight.slug || generateSlug(insight.title);
  if (!seenSlugs.has(slug)) {
    seenSlugs.add(slug);
    uniqueInsights.unshift(insight); // Keep original order
  }
});

// Sort by date (newest first)
uniqueInsights.sort((a, b) => {
  const dateA = new Date(a.date || '2000-01-01');
  const dateB = new Date(b.date || '2000-01-01');
  return dateB - dateA;
});

console.log(`✅ Total unique insights: ${uniqueInsights.length}`);

// Format for output (remove internal fields)
const outputData = uniqueInsights.map(insight => ({
  title: insight.title,
  slug: insight.slug,
  excerpt: insight.excerpt,
  date: insight.date,
  image: insight.image,
  author: insight.author,
  content: insight.content.substring(0, 300) + '...',
  status: insight.status,
  featured: insight.featured
}));

// Write to index.json
try {
  // Ensure directory exists
  if (!fs.existsSync(insightsDir)) {
    fs.mkdirSync(insightsDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`✅ Successfully wrote ${outputData.length} insights to ${outputPath}`);
  
  // Log sample
  if (outputData.length > 0) {
    console.log('\n📋 Sample insights:');
    outputData.slice(0, 3).forEach((insight, i) => {
      console.log(`${i + 1}. ${insight.title} (${insight.date})`);
    });
  }
  
} catch (error) {
  console.error('❌ Error writing index.json:', error.message);
  process.exit(1);
}

// Helper function
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