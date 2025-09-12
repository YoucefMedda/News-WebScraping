# 📰 Agrégateur de Nouvelles - News Master

Un agrégateur de nouvelles moderne qui collecte et affiche des actualités de différentes sources RSS, organisées par catégories.

## ✨ Fonctionnalités

- **🌍 Sources multiples** : BBC, New York Times, Le Monde, RFI, Wall Street Journal
- **📱 Interface responsive** : Design moderne et adaptatif
- **🏷️ Catégorisation automatique** : Lifestyle, Travel, Fashion, Sports, Technology
- **🖼️ Images automatiques** : Extraction d'images depuis les articles
- **📅 Actualités en temps réel** : Mise à jour automatique des flux RSS
- **🔍 Recherche** : Fonction de recherche intégrée
- **📱 Navigation par onglets** : Interface intuitive avec onglets

<img width="1919" height="877" alt="Capture d'écran 2025-09-03 090324" src="https://github.com/user-attachments/assets/05fed7fa-daa8-4414-adf8-4272a11a8ded" />


## 🚀 Installation

### Prérequis

- **Node.js** (version 16 ou supérieure)
- **npm** ou **yarn**

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd news-master
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer le serveur**
   ```bash
   npm start
   # ou
   node scraper.js
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 📁 Structure du projet

```
news-master/
├── scraper.js          # Serveur principal et logique de scraping
├── index3.html         # Page principale avec onglets
├── assets/             # CSS, JS et images
├── package.json        # Dépendances et scripts
└── README.md          # Ce fichier
```

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express.js
- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Scraping** : RSS Parser, Cheerio, Axios
- **Interface** : Bootstrap, CSS personnalisé

## 📊 Catégories de nouvelles

### 🏠 Lifestyle
- Santé et bien-être
- Cuisine et recettes
- Maison et décoration
- Famille et relations
- Psychologie et développement personnel

### ✈️ Travel
- Destinations touristiques
- Conseils de voyage
- Hôtels et restaurants
- Culture et traditions
- Événements et festivals

### 👗 Fashion
- Tendances mode
- Collections et défilés
- Accessoires et bijoux
- Maquillage et coiffure
- Style et streetwear

### ⚽ Sports
- Football, basketball, tennis
- Compétitions et championnats
- Athlètes et équipes
- Performance et records
- Actualités sportives

### 💻 Technology
- Informatique et smartphones
- Innovation et startups
- Intelligence artificielle
- Cryptomonnaies et blockchain
- Espace et sciences

## 🔧 Configuration

### Modifier les sources RSS

Éditez le fichier `scraper.js` et modifiez la constante `RSS_FEEDS` :

```javascript
const RSS_FEEDS = [
  "http://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  // Ajoutez vos sources ici
];
```

### Personnaliser les catégories

Modifiez la fonction `categorizeArticle()` pour ajuster les mots-clés de catégorisation.

## 🚀 Scripts disponibles

```bash
# Démarrer le serveur
npm start

# Démarrer en mode développement
npm run dev

# Tester le serveur
npm test
```

## 📱 Utilisation

1. **Accueil** : Vue d'ensemble des dernières nouvelles
2. **Onglets** : Cliquez sur les catégories pour voir les nouvelles spécifiques
3. **Recherche** : Utilisez la barre de recherche pour trouver des articles
4. **Navigation** : Parcourez les différentes sections du site

## 🔍 API Endpoints

- `GET /news` - Toutes les nouvelles
- `GET /news/:category` - Nouvelles par catégorie
- `GET /` - Page principale

## 🐛 Dépannage

### Problème : "node n'est pas reconnu"
**Solution** : Installez Node.js depuis [nodejs.org](https://nodejs.org/)

### Problème : Erreur de port
**Solution** : Modifiez le port dans `scraper.js` (ligne 25)

### Problème : Images non chargées
**Solution** : Vérifiez votre connexion internet et les permissions CORS

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement

---

**Développé avec ❤️ pour les passionnés d'actualités**

