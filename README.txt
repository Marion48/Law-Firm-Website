Byron Nyasimi Advocates — Website README
----------------------------------------

FILES PROVIDED
- index.html
- insights.html
- corporate-law.html
- commercial-law.html
- litigation-dispute-resolution.html
- conveyancing.html
- intellectual-property.html
- style.css
- main.js
- content.json
- manifest.json (optional)
- images/ (placeholders: hero.jpg, ByronNyasimi.png, attorney-2.jpg, practice-*.jpg, insight-cover.jpg, favicon.ico)

FOLDER STRUCTURE (recommended)
/website
  /images
    hero.jpg
    ByronNyasimi.png
    attorney-2.jpg
    practice-corporate.jpg
    practice-commercial.jpg
    practice-litigation.jpg
    practice-conveyancing.jpg
    practice-ip.jpg
    insight-cover.jpg
    favicon.ico
  index.html
  insights.html
  corporate-law.html
  commercial-law.html
  litigation-dispute-resolution.html
  conveyancing.html
  intellectual-property.html
  style.css
  main.js
  content.json
  manifest.json
  README.txt

HOW IT WORKS (non-technical)
- All visible, editable content (titles, practice area links, team members, insights) is in content.json.
- To add an article, edit content.json and add a new object under "insights". Use a full URL for external links (e.g., LinkedIn).
- To add a new team member, add an object to "team" with "name", "role", and "image" (image path in /images).
- To update practice area title/summary or change which file it links to, edit "practiceAreas".

HOW TO EDIT content.json (quick steps)
1. Open content.json in a text editor (Notepad, VS Code).
2. Add/update entries following the existing structure.
3. Save the file and reload the site in the browser (Ctrl+R). If using Live Server, it auto-refreshes.

CONTACT FORM: Formspree setup (simple)
1. Go to https://formspree.io and sign up for a free account.
2. Create a new form. Formspree will give you an endpoint like:
   https://formspree.io/f/abcd1234
3. Open index.html and replace the placeholder action in the contact form:
   <form id="contact-form" action="https://formspree.io/f/XXXXXXXX" method="POST">
   Replace with your form action.
4. Test by submitting the form. Check your email for submissions or the Formspree dashboard.

ALTERNATIVE: Netlify Forms (if you host on Netlify)
- If you host the site on Netlify, you can use Netlify Forms (no external service).
- Replace form with:
  <form name="contact" method="POST" data-netlify="true">
  and deploy; Netlify will capture submissions.

HOSTING & DEPLOY (Netlify recommended)
1. Sign up at https://app.netlify.com (free tier available).
2. Drag & drop the /website folder into Sites → Deploy.
3. The site will be live with a netlify.app domain.
4. To use your own domain, buy a domain and follow Netlify's domain setup.

MAKE IT EDITABLE BY NON-TECH CLIENT (two options)
A. Simple manual method (current setup)
   - Client edits content.json in a text editor and uploads files to host (or you do it).
B. Low-cost CMS method (recommended if many updates)
   - Use a headless CMS (Sanity/Strapi) or a low-code host (Webflow).
   - Or use GitHub + Netlify + Netlify CMS (simple admin interface) — requires a one-time small setup.

DEBUGGING TIPS
- If team images don't show, check image filenames and paths are correct.
- If insights or practice areas don't update, ensure content.json is valid JSON (use https://jsonlint.com).
- If Contact form fails, check DevTools → Network to see POST and response. Ensure correct Formspree endpoint.

SECURITY & PERFORMANCE
- Replace large JPGs with WebP or optimized JPEGs for faster load.
- Use HTTPS (Netlify provides this).
- Keep Formspree endpoint secret in production logs (Formspree has protections).

NEED HELP?
- If you want, I can:
  • Replace the placeholder Formspree endpoint after you create it.
  • Convert content.json editing into a simple admin UI (Netlify CMS) so the client can edit from a browser.
  • Deploy the site to Netlify for you and connect a custom domain.

Enjoy — this setup keeps things fast, secure, and non-technical for your client.
