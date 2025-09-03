import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { URL as NodeURL } from "url";
import FastClassifier from "./fast-classifier.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const parser = new Parser();
const PORT = 3000;

// Initialiser le classificateur ultra-rapide
const fastClassifier = new FastClassifier();
console.log('⚡ Classificateur ultra-rapide initialisé !');

// Liste de flux RSS pour avoir 40 articles au total (8 flux × 5 articles)
const RSS_FEEDS = [
  "http://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
  "https://www.lemonde.fr/rss/une.xml",
  "https://www.rfi.fr/fr/rss",
  "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
  "https://feeds.feedburner.com/TechCrunch/",
  "https://www.espn.com/espn/rss/news"
];

function absolutize(maybeUrl, base) {
  if (!maybeUrl) return null;
  try {
    if (maybeUrl.startsWith("data:")) return null;
    return new NodeURL(maybeUrl, base).href;
  } catch {
    return null;
  }
}

function pickFromSrcset(srcset, base) {
  if (!srcset) return null;
  const candidates = srcset
    .split(",")
    .map(s => s.trim())
    .map(part => {
      const [u, w] = part.split(/\s+/);
      const width = w && w.endsWith("w") ? parseInt(w) : 0;
      return { href: absolutize(u, base), width };
    })
    .filter(c => c.href);
  candidates.sort((a, b) => b.width - a.width);
  return candidates[0]?.href || null;
}

async function extractMainImage(articleUrl) {
  try {
    const res = await fetch(articleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      timeout: 5000 // Timeout de 5 secondes
    });
    
    if (!res.ok) return null;
    
    const html = await res.text();
    const $ = cheerio.load(html);

    // Chercher d'abord les images Open Graph
    const metaSelectors = [
      'meta[property="og:image:secure_url"]',
      'meta[property="og:image:url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    ];
    
    for (const sel of metaSelectors) {
      const content = $(sel).attr("content");
      const abs = absolutize(content, articleUrl);
      if (abs) return abs;
    }

    // Chercher dans le contenu JSON-LD
    const ldImages = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).contents().text());
        const collect = obj => {
          if (!obj) return;
          if (Array.isArray(obj)) return obj.forEach(collect);
          if (typeof obj === "object") {
            if (obj.image) {
              if (typeof obj.image === "string") ldImages.push(obj.image);
              else if (Array.isArray(obj.image)) {
                obj.image.forEach(v => ldImages.push(typeof v === "string" ? v : v?.url));
              } else if (obj.image.url) ldImages.push(obj.image.url);
            }
            if (obj.thumbnailUrl) ldImages.push(obj.thumbnailUrl);
            Object.values(obj).forEach(collect);
          }
        };
        collect(json);
      } catch {}
    });
    
    for (const u of ldImages) {
      const abs = absolutize(u, articleUrl);
      if (abs) return abs;
    }

    // Chercher dans les images du contenu
    const img = $("article img, .content img, .post-content img").first();
    if (img.length) {
      const candidates = [
        img.attr("data-src"),
        img.attr("data-original"),
        img.attr("data-lazy-src"),
        pickFromSrcset(img.attr("srcset"), articleUrl),
        img.attr("src"),
      ];
      
      for (const c of candidates) {
        const abs = absolutize(c, articleUrl);
        if (abs) return abs;
      }
    }

    return null;
  } catch (error) {
    console.log(`⚠️ Erreur extraction image pour ${articleUrl}:`, error.message);
    return null;
  }
}

async function fetchNewsFromRSS(rssUrl) {
  try {
    console.log(`📡 Récupération depuis: ${rssUrl}`);
    const feed = await parser.parseURL(rssUrl);
    let articles = [];

    // Récupérer 5 articles par flux pour avoir 40 articles au total
    for (const item of feed.items.slice(0, 5)) {
      let article = {
        title: item.title || 'Sans titre',
        link: item.link,
        pubDate: item.pubDate || new Date().toISOString(),
        summary: item.contentSnippet || item.content || item.title || 'Aucun résumé disponible',
        image: null,
        source: feed.title || 'Source inconnue'
      };

      // Essayer d'extraire une image (optionnel)
      try {
        if (item.enclosure && item.enclosure.url) {
          article.image = item.enclosure.url;
        } else {
          article.image = await extractMainImage(article.link);
        }
      } catch {
        // Pas d'image, ce n'est pas grave
      }

      // Classification ultra-rapide
      try {
        const textToClassify = `${article.title} ${article.summary}`;
        const classification = fastClassifier.classify(textToClassify);
        
        article.category = classification.category;
        article.confidence = classification.confidence;
        article.aiReasoning = classification.reasoning;
        
        console.log(`⚡ Classification rapide: "${article.title.substring(0, 50)}..." → ${article.category} (confiance: ${classification.confidence.toFixed(2)})`);
        if (classification.category === 'politics') {
          console.log(`🏛️ Article politique détecté: "${article.title}"`);
          console.log(`   Scores:`, classification.scores);
        }
      } catch (error) {
        console.error("❌ Erreur de classification:", error);
        article.category = 'general';
        article.confidence = 0;
        article.aiReasoning = 'Classification basique - erreur';
      }

      articles.push(article);
    }

    console.log(`✅ ${articles.length} articles récupérés et classifiés de ${rssUrl}`);
    return articles;
  } catch (err) {
    console.error(`❌ Erreur RSS pour ${rssUrl}:`, err);
    return [];
  }
}

// Fonction pour agréger toutes les nouvelles RSS
async function fetchAllNews() {
  let allArticles = [];
  console.log('🚀 Début de la récupération des nouvelles RSS...');
  
  for (const url of RSS_FEEDS) {
    try {
      const news = await fetchNewsFromRSS(url);
      allArticles = allArticles.concat(news);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de ${url}:`, error);
    }
  }
  
  // Trier par date décroissante
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  // Analyser la distribution des catégories
  const distribution = {};
  allArticles.forEach(article => {
    distribution[article.category] = (distribution[article.category] || 0) + 1;
  });
  
  console.log('📊 Distribution des catégories (Classification rapide):');
  Object.keys(distribution).forEach(cat => {
    console.log(`  ${cat}: ${distribution[cat]} articles`);
  });
  
  return allArticles;
}

// Route principale /news
app.get("/news", async (req, res) => {
  try {
    console.log('🚀 Début de la récupération des nouvelles...');
    
    const rssNews = await fetchAllNews();
    
    if (rssNews.length === 0) {
      console.log('⚠️ Aucune nouvelle RSS récupérée');
      return res.json([]);
    }
    
    console.log(`🎯 Total: ${rssNews.length} articles RSS classifiés rapidement`);
    
    res.json(rssNews);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des nouvelles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des nouvelles' });
  }
});

// Endpoint pour obtenir les nouvelles par catégorie
app.get('/news/:category', async (req, res) => {
  try {
    const category = req.params.category;
    console.log(`🔍 Demande d'articles pour la catégorie: ${category}`);
    
    const allNews = await fetchAllNews();
    const categoryNews = allNews.filter(article => article.category === category);
    
    console.log(`📰 Catégorie ${category}: ${categoryNews.length} articles trouvés`);
    
    res.json(categoryNews);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des nouvelles par catégorie:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des nouvelles par catégorie' });
  }
});

// Endpoint pour les statistiques du classificateur
app.get('/ai/stats', (req, res) => {
  try {
    const stats = fastClassifier.getPerformanceStats();
    res.json({
      ai: stats,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Endpoint pour tester le classificateur directement
app.post('/ai/test', express.json(), (req, res) => {
  try {
    const { title, summary, source } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Titre requis' });
    }
    
    const textToClassify = `${title} ${summary || ''}`;
    const result = fastClassifier.classify(textToClassify);
    
    res.json({
      article: { title, summary, source },
      classification: result
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    res.status(500).json({ error: 'Erreur lors du test du classificateur' });
  }
});

// ===== ENDPOINTS BLOG =====
import fs from 'fs';

// Fonction pour lire la base de données blog
function readBlogDatabase() {
  try {
    const data = fs.readFileSync('blog-database.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erreur lecture base de données blog:', error);
    return { blog_posts: [], categories: [], popular_posts: [] };
  }
}

// Endpoint pour obtenir tous les articles de blog
app.get('/blog/posts', (req, res) => {
  try {
    const { page = 1, limit = 6, category } = req.query;
    const db = readBlogDatabase();
    let posts = db.blog_posts;
    
    // Filtrer par catégorie si spécifiée
    if (category) {
      posts = posts.filter(post => post.category.toLowerCase() === category.toLowerCase());
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    res.json({
      posts: paginatedPosts,
      total: posts.length,
      page: parseInt(page),
      totalPages: Math.ceil(posts.length / limit),
      hasNext: endIndex < posts.length,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('❌ Erreur récupération articles blog:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
  }
});

// Endpoint pour obtenir un article spécifique
app.get('/blog/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readBlogDatabase();
    const post = db.blog_posts.find(p => p.id === parseInt(id));
    
    if (!post) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('❌ Erreur récupération article:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

// Endpoint pour obtenir les catégories
app.get('/blog/categories', (req, res) => {
  try {
    const db = readBlogDatabase();
    res.json(db.categories);
  } catch (error) {
    console.error('❌ Erreur récupération catégories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// Endpoint pour obtenir les articles populaires
app.get('/blog/popular', (req, res) => {
  try {
    const db = readBlogDatabase();
    res.json(db.popular_posts);
  } catch (error) {
    console.error('❌ Erreur récupération articles populaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des articles populaires' });
  }
});

// Endpoint pour rechercher des articles
app.get('/blog/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Terme de recherche requis' });
    }
    
    const db = readBlogDatabase();
    const searchTerm = q.toLowerCase();
    const results = db.blog_posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    res.json({
      query: q,
      results: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// Endpoint pour ajouter un article de blog
app.post('/blog/add', express.json(), (req, res) => {
  try {
    const newBlog = req.body;
    const db = readBlogDatabase();
    db.blog_posts.push(newBlog);
    fs.writeFileSync('blog-database.json', JSON.stringify(db, null, 2));
    res.json({ success: true, blog: newBlog });
  } catch (error) {
    console.error('❌ Erreur ajout article blog:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'article' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log('📱 Endpoints disponibles:');
  console.log('  - GET /news (nouvelles RSS avec classification rapide)');
  console.log('  - GET /news/:category (par catégorie)');
  console.log('  - GET /ai/stats (statistiques du classificateur)');
  console.log('  - POST /ai/test (test direct du classificateur)');
  console.log('📝 Endpoints Blog:');
  console.log('  - GET /blog/posts (articles de blog avec pagination)');
  console.log('  - GET /blog/posts/:id (article spécifique)');
  console.log('  - GET /blog/categories (catégories)');
  console.log('  - GET /blog/popular (articles populaires)');
  console.log('  - GET /blog/search?q=terme (recherche)');
  console.log('⚡ Classificateur ultra-rapide activé et prêt !');
  console.log('📊 Version 40 articles: 8 flux RSS × 5 articles chacun');
  console.log('📝 Base de données blog chargée et prête !');
});

let lastEstimate = 10;

async function measureEstimate() {
  const start = Date.now();
  try {
    await parser.parseURL(RSS_FEEDS[0]);
    const elapsed = (Date.now() - start) / 1000;
    lastEstimate = Math.ceil(elapsed * RSS_FEEDS.length * 2); 
  } catch {
    lastEstimate = 10;
  }
  return lastEstimate;
}

app.get("/estimate", async (req, res) => {
  const est = await measureEstimate();
  res.json({ estimate: est });
});
