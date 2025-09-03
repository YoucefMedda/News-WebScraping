// Classificateur ultra-rapide basé sur des mots-clés avec catégories de l'interface
class FastClassifier {
  constructor() {
    // Mots-clés pour chaque catégorie de l'interface web
    this.keywords = {
      business: ['business', 'economy', 'finance', 'market', 'stock', 'company', 'investment', 'trade', 'economic', 'financial', 'bank', 'banking', 'money', 'profit', 'revenue', 'earnings', 'quarterly', 'annual', 'report', 'ceo', 'executive', 'board', 'shareholder', 'dividend', 'merger', 'acquisition', 'ipo', 'startup', 'venture', 'capital'],
      entertainment: ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'singer', 'show', 'concert', 'performance', 'album', 'song', 'hit', 'chart', 'award', 'oscar', 'grammy', 'emmy', 'hollywood', 'netflix', 'streaming', 'tv', 'television', 'series', 'episode', 'season', 'premiere', 'release', 'trailer', 'review'],
      politics: ['politics', 'political', 'government', 'election', 'president', 'minister', 'parliament', 'vote', 'democrat', 'republican', 'campaign', 'policy', 'law', 'bill', 'congress', 'senate', 'house', 'representative', 'senator', 'mayor', 'governor', 'cabinet', 'administration', 'foreign', 'diplomacy', 'treaty', 'agreement', 'politique', 'gouvernement', 'élection', 'président', 'ministre', 'parlement', 'vote', 'démocrate', 'républicain', 'campagne', 'politique', 'loi', 'projet', 'congrès', 'sénat', 'maire', 'gouverneur', 'cabinet', 'administration', 'étranger', 'diplomatie', 'traité', 'accord', 'parti', 'opposition', 'majorité', 'minorité', 'coalition', 'alliance', 'candidat', 'candidate', 'électeur', 'électrice', 'scrutin', 'ballot', 'referendum', 'référendum', 'constitution', 'amendement', 'budget', 'budget', 'déficit', 'dette', 'impôt', 'tax', 'débat', 'discussion', 'vote', 'abstention', 'participation', 'résultat', 'victoire', 'défaite', 'majorité', 'minorité', 'state', 'federal', 'local', 'national', 'international', 'european', 'american', 'french', 'british', 'german', 'italian', 'spanish', 'russian', 'chinese', 'japanese', 'canadian', 'australian', 'indian', 'brazilian', 'mexican', 'african', 'asian', 'middle east', 'middle east', 'nato', 'un', 'united nations', 'eu', 'european union', 'brexit', 'trump', 'biden', 'macron', 'merkel', 'johnson', 'putin', 'xi', 'modi', 'bolsonaro', 'lopez obrador'],
      sports: ['sport', 'football', 'basketball', 'tennis', 'olympics', 'championship', 'match', 'game', 'player', 'team', 'league', 'tournament', 'coach', 'athlete', 'soccer', 'baseball', 'hockey', 'golf', 'swimming', 'running', 'marathon', 'race', 'competition', 'win', 'victory', 'defeat', 'score', 'goal', 'point', 'medal', 'gold', 'silver', 'bronze'],
      technology: ['tech', 'technology', 'ai', 'artificial intelligence', 'software', 'app', 'digital', 'computer', 'internet', 'cyber', 'data', 'algorithm', 'machine learning', 'blockchain', 'crypto', 'startup', 'innovation', 'programming', 'code', 'developer', 'coding', 'software', 'hardware', 'gadget', 'device', 'smartphone', 'laptop', 'computer', 'server', 'cloud', 'database', 'api', 'web', 'mobile', 'app', 'application']
    };
  }

  // Classification ultra-rapide
  classify(text) {
    const words = text.toLowerCase().split(/\s+/);
    const scores = {};

    // Compter les mots-clés trouvés pour chaque catégorie
    for (const [category, keywords] of Object.entries(this.keywords)) {
      let score = 0;
      for (const word of words) {
        if (keywords.some(keyword => word.includes(keyword))) {
          score++;
        }
      }
      scores[category] = score;
    }

    // Trouver la catégorie avec le plus de mots-clés
    let bestCategory = 'business'; // Catégorie par défaut
    let bestScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Calculer une confiance simple
    const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.1;

    return {
      category: bestCategory,
      confidence: confidence,
      reasoning: `Classification rapide: ${bestScore} mots-clés trouvés`,
      scores: scores
    };
  }

  // Pas d'entraînement nécessaire
  train() {
    console.log('⚡ Classificateur rapide prêt - pas d\'entraînement nécessaire !');
  }

  getPerformanceStats() {
    return {
      isTrained: true,
      method: 'Fast Keyword Classification (Interface Categories)',
      categories: Object.keys(this.keywords),
      totalKeywords: Object.values(this.keywords).flat().length
    };
  }
}

export default FastClassifier;
