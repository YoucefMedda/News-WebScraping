import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NaiveBayesClassifier {
  constructor() {
    this.categories = {};
    this.categoryCounts = {};
    this.totalDocuments = 0;
    this.vocabulary = new Set();
    this.wordCounts = {};
    this.isTrained = false;
  }

  // Fonction pour nettoyer et tokeniser le texte
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim()
      .split(' ')
      .filter(word => word.length > 2); // Filtrer les mots trop courts
  }

  // Fonction pour lire et parser le CSV
  readCSV(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const headers = lines[0].split(',');
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          if (values.length >= 2) {
            const category = values[0].trim();
            const text = values.slice(1).join(',').trim(); // Joindre le reste comme texte
            data.push({ category, text });
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la lecture du CSV:', error);
      return [];
    }
  }

  // Fonction pour entraîner le classificateur
  train(trainingData) {
    console.log('🚀 Début de l\'entraînement du classificateur Naive Bayes...');
    
    // Initialiser les compteurs
    this.categoryCounts = {};
    this.wordCounts = {};
    this.vocabulary = new Set();
    this.totalDocuments = trainingData.length;

    // Compter les documents par catégorie et les mots
    trainingData.forEach(({ category, text }) => {
      // Compter les catégories
      this.categoryCounts[category] = (this.categoryCounts[category] || 0) + 1;
      
      // Tokeniser le texte
      const words = this.preprocessText(text);
      
      // Ajouter les mots au vocabulaire
      words.forEach(word => {
        this.vocabulary.add(word);
        
        // Initialiser les compteurs de mots par catégorie
        if (!this.wordCounts[category]) {
          this.wordCounts[category] = {};
        }
        if (!this.wordCounts[category][word]) {
          this.wordCounts[category][word] = 0;
        }
        this.wordCounts[category][word]++;
      });
    });

    // Calculer les probabilités a priori des catégories
    this.categories = {};
    Object.keys(this.categoryCounts).forEach(category => {
      this.categories[category] = this.categoryCounts[category] / this.totalDocuments;
    });

    this.isTrained = true;
    
    console.log(`✅ Entraînement terminé !`);
    console.log(`📊 Catégories trouvées: ${Object.keys(this.categories).join(', ')}`);
    console.log(`📝 Vocabulaire: ${this.vocabulary.size} mots uniques`);
    console.log(`📄 Documents d'entraînement: ${this.totalDocuments}`);
    
    // Afficher la distribution des catégories
    Object.keys(this.categoryCounts).forEach(category => {
      console.log(`  ${category}: ${this.categoryCounts[category]} articles`);
    });
  }

  // Fonction pour classifier un texte
  classify(text) {
    if (!this.isTrained) {
      throw new Error('Le classificateur doit être entraîné avant de pouvoir classifier');
    }

    const words = this.preprocessText(text);
    const scores = {};

    // Calculer le score pour chaque catégorie
    Object.keys(this.categories).forEach(category => {
      let score = Math.log(this.categories[category]); // Log de la probabilité a priori
      
      words.forEach(word => {
        const wordCount = this.wordCounts[category][word] || 0;
        const totalWordsInCategory = Object.values(this.wordCounts[category]).reduce((a, b) => a + b, 0);
        const vocabularySize = this.vocabulary.size;
        
        // Probabilité avec lissage de Laplace (add-1 smoothing)
        const probability = (wordCount + 1) / (totalWordsInCategory + vocabularySize);
        score += Math.log(probability);
      });
      
      scores[category] = score;
    });

    // Trouver la catégorie avec le score le plus élevé
    let bestCategory = Object.keys(scores)[0];
    let bestScore = scores[bestCategory];

    Object.keys(scores).forEach(category => {
      if (scores[category] > bestScore) {
        bestScore = scores[category];
        bestCategory = category;
      }
    });

    // Calculer la confiance (différence normalisée entre les scores)
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const confidence = sortedScores.length > 1 ? 
      (sortedScores[0] - sortedScores[1]) / Math.abs(sortedScores[0]) : 1;

    return {
      category: bestCategory,
      confidence: Math.min(Math.max(confidence, 0), 1), // Normaliser entre 0 et 1
      reasoning: `Classification Naive Bayes basée sur ${words.length} mots`,
      scores: scores
    };
  }

  // Fonction pour entraîner depuis le fichier CSV
  trainFromCSV(csvPath = 'bbc-text.csv') {
    const fullPath = path.join(__dirname, csvPath);
    console.log(`📖 Lecture du fichier d'entraînement: ${fullPath}`);
    
    const trainingData = this.readCSV(fullPath);
    
    if (trainingData.length === 0) {
      throw new Error('Aucune donnée d\'entraînement trouvée dans le fichier CSV');
    }
    
    console.log(`📊 Données d'entraînement chargées: ${trainingData.length} articles`);
    this.train(trainingData);
  }

  // Fonction pour obtenir les statistiques de performance
  getPerformanceStats() {
    return {
      isTrained: this.isTrained,
      totalDocuments: this.totalDocuments,
      vocabularySize: this.vocabulary.size,
      categories: Object.keys(this.categories),
      categoryDistribution: this.categoryCounts
    };
  }
}

export default NaiveBayesClassifier;
