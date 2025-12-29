const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const insightsDir = path.join(__dirname,'../content/insights');
const files = fs.readdirSync(insightsDir);

const insights = files
  .filter(f => f.endsWith('.md'))
  .map(file => {
    const content = fs.readFileSync(path.join(insightsDir,file),'utf-8');
    const {data, content: body} = matter(content);
    return {...data, body};
  });

fs.writeFileSync(path.join(insightsDir,'index.json'), JSON.stringify(insights, null, 2));
console.log('index.json generated successfully.');
