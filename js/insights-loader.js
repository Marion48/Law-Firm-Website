// js/insights-loader.js — FINAL CLEAN VERSION (Recommended)

class InsightsLoader {
  constructor() {
    this.insights = [];
    this.cacheKey = 'byron_insights_cache';
    this.cacheTimestampKey = 'byron_insights_timestamp';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes

    const path = window.location.pathname;
    this.isHomepage =
      path === '/' ||
      path === '/index.html' ||
      path === '';

    this.isInsightsPage = path.includes('insights.html');
  }

  async init() {
    try {
      await this.loadInsights();
      this.render();
    } catch (error) {
      console.error('InsightsLoader init failed:', error);
      this.showError();
    }
  }

  async loadInsights() {
    try {
      const res = await fetch('/api/get-insights');

      if (res.ok) {
        const data = await res.json();
        this.insights = Array.isArray(data) ? data : [];
        this.cache();
        return;
      }

      throw new Error('API failed');
    } catch {
      const cached = this.getCache();
      this.insights = cached || [];
    }
  }

  cache() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.insights));
      localStorage.setItem(this.cacheTimestampKey, Date.now());
    } catch {}
  }

  getCache() {
    try {
      const ts = localStorage.getItem(this.cacheTimestampKey);
      const data = localStorage.getItem(this.cacheKey);
      if (!ts || !data) return null;

      if (Date.now() - Number(ts) > this.cacheDuration) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  render() {
    const published = this.insights.filter(i => i.status === 'published');

    if (this.isHomepage) {
      this.renderHomepage(published.slice(0, 3));
    }

    if (this.isInsightsPage) {
      this.renderInsightsPage(published);
    }
  }

  renderHomepage(items) {
    const el = document.getElementById('insights-container');
    if (!el) return;

    if (!items.length) {
      el.innerHTML = this.empty('No insights published yet.');
      return;
    }

    el.innerHTML = items.map(i => this.card(i)).join('');
  }

  renderInsightsPage(items) {
    const el = document.getElementById('all-insights');
    if (!el) return;

    if (!items.length) {
      el.innerHTML = this.empty('No insights published yet.');
      return;
    }

    el.innerHTML = items.map(i => this.card(i)).join('');
  }

  card(insight) {
    const img = insight.image || '/images/default-insight.jpg';
    const date = this.formatDate(insight.date || insight.createdAt);
    const url = `/insight/${insight.slug}`;
    const excerpt = insight.excerpt
      ? insight.excerpt.slice(0, 120) + '…'
      : 'Read more about this legal insight.';

    return `
      <article class="post-card">
        <a href="${url}" style="text-decoration:none;color:inherit">
          <img src="${img}" alt="${insight.title}" loading="lazy">
          <p class="post-date">${date}</p>
          <h3>${insight.title}</h3>
          <p>${excerpt}</p>
          <span class="read-more">Read Insight →</span>
        </a>
      </article>
    `;
  }

  empty(msg) {
    return `<p style="text-align:center;padding:2rem">${msg}</p>`;
  }

  formatDate(d) {
    try {
      return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }

  showError() {
    const ids = ['insights-container', 'all-insights'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = this.empty('Unable to load insights.');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new InsightsLoader().init();
});
