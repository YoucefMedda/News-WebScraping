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

      // Classification ultra-rapide
      try {
        const textToClassify = `${article.title} ${article.summary}`;
        const classification = fastClassifier.classify(textToClassify);
        
        article.category = classification.category;
        article.confidence = classification.confidence;
        article.aiReasoning = classification.reasoning;
        
        console.log(`⚡ Classification rapide: "${article.title.substring(0, 50)}..." → ${article.category} (confiance: ${classification.confidence.toFixed(2)})`);
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

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log('📱 Endpoints disponibles:');
  console.log('  - GET /news (nouvelles RSS avec classification rapide)');
  console.log('  - GET /news/:category (par catégorie)');
  console.log('  - GET /ai/stats (statistiques du classificateur)');
  console.log('  - POST /ai/test (test direct du classificateur)');
  console.log('⚡ Classificateur ultra-rapide activé et prêt !');
  console.log('📊 Version 40 articles: 8 flux RSS × 5 articles chacun');
});
