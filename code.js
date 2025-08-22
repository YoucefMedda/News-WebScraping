import Parser from "rss-parser";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { URL as NodeURL } from "url";

// -----------------------------
// 📌 Fonctions utilitaires pour images
// -----------------------------
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

// -----------------------------
// 📌 Fonction qui extrait une image depuis un article
// -----------------------------
async function extractMainImage(articleUrl) {
  const res = await fetch(articleUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Cherche d'abord dans les metas
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

  // JSON-LD
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
              obj.image.forEach(v =>
                ldImages.push(typeof v === "string" ? v : v?.url)
              );
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

  // Première image dans l’article
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

  // Sinon, première image trouvée
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

// -----------------------------
// 📌 Fonction qui récupère les news depuis un flux RSS
// -----------------------------
const parser = new Parser();

async function fetchNewsFromRSS(rssUrl) {
  try {
    const feed = await parser.parseURL(rssUrl);
    let articles = [];

    for (const item of feed.items.slice(0, 5)) {
      let article = {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        summary: item.contentSnippet || item.content,
        image: null,
      };

      // Ici on appelle extractMainImage 👇
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

// -----------------------------
// 📌 Exemple d’utilisation
// -----------------------------
(async () => {
  const rssUrl = "http://feeds.bbci.co.uk/news/world/rss.xml";
  const news = await fetchNewsFromRSS(rssUrl);

  console.log("📰 Articles récupérés :");
  console.log(news);
})();
