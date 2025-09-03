// Configuration du serveur de nouvelles
export const CONFIG = {
    // Configuration du serveur
    SERVER: {
        PORT: 3000,
        HOST: 'localhost',
        CORS_ENABLED: true
    },
    
    // Configuration des flux RSS
    RSS_FEEDS: [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://www.lemonde.fr/rss/une.xml",
        "https://www.rfi.fr/fr/rss",
        "https://feeds.a.dj.com/rss/RSSWorldNews.xml"
    ],
    
    // Configuration des catégories
    CATEGORIES: {
        lifestyle: {
            name: 'Lifestyle',
            keywords: ['lifestyle', 'vie', 'santé', 'bien-être', 'cuisine', 'recette', 'maison', 'décoration', 'famille', 'parent', 'enfant', 'mariage', 'divorce', 'relation', 'amour', 'psychologie', 'bonheur', 'stress', 'méditation', 'yoga', 'fitness', 'nutrition', 'régime', 'beauté', 'mode de vie'],
            color: '#28a745'
        },
        travel: {
            name: 'Travel',
            keywords: ['travel', 'voyage', 'tourisme', 'destination', 'hôtel', 'restaurant', 'avion', 'train', 'bus', 'croisière', 'plage', 'montagne', 'ville', 'pays', 'culture', 'tradition', 'festival', 'événement', 'vacances', 'weekend', 'escapade', 'aventure', 'exploration', 'découverte'],
            color: '#17a2b8'
        },
        fashion: {
            name: 'Fashion',
            keywords: ['fashion', 'mode', 'style', 'vêtement', 'robe', 'pantalon', 'chaussure', 'accessoire', 'bijou', 'sac', 'maquillage', 'coiffure', 'tendance', 'collection', 'défilé', 'mannequin', 'designer', 'marque', 'luxe', 'couture', 'prêt-à-porter', 'streetwear', 'vintage'],
            color: '#e83e8c'
        },
        sports: {
            name: 'Sports',
            keywords: ['sports', 'sport', 'football', 'basketball', 'tennis', 'golf', 'course', 'marathon', 'olympique', 'championnat', 'match', 'équipe', 'joueur', 'athlète', 'entraînement', 'compétition', 'victoire', 'défaite', 'score', 'but', 'point', 'record', 'performance'],
            color: '#ffc107'
        },
        technology: {
            name: 'Technology',
            keywords: ['technology', 'tech', 'technologie', 'informatique', 'ordinateur', 'smartphone', 'téléphone', 'internet', 'web', 'application', 'logiciel', 'programme', 'développement', 'innovation', 'startup', 'entreprise', 'business', 'économie', 'finance', 'bourse', 'crypto', 'bitcoin', 'blockchain', 'intelligence artificielle', 'ia', 'robot', 'automation', 'voiture électrique', 'énergie renouvelable', 'espace', 'nasa', 'satellite'],
            color: '#6f42c1'
        }
    },
    
    // Configuration du scraping
    SCRAPING: {
        MAX_ARTICLES_PER_FEED: 10,
        IMAGE_EXTRACTION_TIMEOUT: 5000,
        USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123 Safari/537.36'
    },
    
    // Configuration de l'interface
    UI: {
        ARTICLES_PER_PAGE: 10,
        MAX_TITLE_LENGTH: 50,
        IMAGE_PLACEHOLDER: 'assets/img/gallery/whats_news_details1.png'
    }
};

// Fonction utilitaire pour obtenir la configuration
export function getConfig() {
    return CONFIG;
}

// Fonction pour obtenir les mots-clés d'une catégorie
export function getCategoryKeywords(category) {
    return CONFIG.CATEGORIES[category]?.keywords || [];
}

// Fonction pour obtenir le nom d'une catégorie
export function getCategoryName(category) {
    return CONFIG.CATEGORIES[category]?.name || category;
}

// Fonction pour obtenir la couleur d'une catégorie
export function getCategoryColor(category) {
    return CONFIG.CATEGORIES[category]?.color || '#6c757d';
}

