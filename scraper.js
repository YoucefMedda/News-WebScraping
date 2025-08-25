import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { URL as NodeURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const parser = new Parser();
const PORT = 3000;

// Liste de flux RSS à agréger
const RSS_FEEDS = [
  "http://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://www.lemonde.fr/rss/une.xml",
  "https://www.rfi.fr/fr/rss",
  "https://feeds.a.dj.com/rss/RSSWorldNews.xml"
  // Ajoutez d'autres flux ici si besoin
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
  const res = await fetch(articleUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

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

  const img = $("article img").first();
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

  const any = $("img")
    .filter((_, el) => $(el).attr("src") || $(el).attr("srcset"))
    .first();
  if (any.length) {
    const candidates2 = [
      any.attr("data-src"),
      any.attr("data-original"),
      any.attr("data-lazy-src"),
      pickFromSrcset(any.attr("srcset"), articleUrl),
      any.attr("src"),
    ];
    for (const c of candidates2) {
      const abs = absolutize(c, articleUrl);
      if (abs) return abs;
    }
  }

  return null;
}

async function fetchNewsFromRSS(rssUrl) {
  try {
    const feed = await parser.parseURL(rssUrl);
    let articles = [];

    // Augmentez le nombre d'articles récupérés par flux (par exemple 15)
    for (const item of feed.items.slice(0, 15)) {
      let article = {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        summary: item.contentSnippet || item.content,
        image: null,
      };

      try {
        article.image = await extractMainImage(article.link);
      } catch {
        console.log("⚠️ Pas d'image pour :", article.link);
      }

      articles.push(article);
    }

    return articles;
  } catch (err) {
    console.error("Erreur RSS :", err);
    return [];
  }
}

// Nouvelle fonction pour agréger les news de toutes les sources
async function fetchAllNews() {
  let allArticles = [];
  for (const url of RSS_FEEDS) {
    const news = await fetchNewsFromRSS(url);
    allArticles = allArticles.concat(news);
  }
  // Trier par date décroissante
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return allArticles;
}

// Modifiez la route /news pour retourner toutes les news agrégées
app.get("/news", async (req, res) => {
  const news = await fetchAllNews();
  res.json(news);
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});

let lastEstimate = 10; // valeur par défaut

async function measureEstimate() {
  const start = Date.now();
  try {
    // On ne teste qu’un seul flux rapide pour estimer
    await parser.parseURL(RSS_FEEDS[0]);
    const elapsed = (Date.now() - start) / 1000;
    // On estime le total = temps moyen × nombre de flux
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
