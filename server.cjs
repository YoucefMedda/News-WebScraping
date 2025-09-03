const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('.'));

app.post('/blog/add', (req, res) => {
  const newBlog = req.body;
  const dbPath = path.join(__dirname, 'blog-database.json');
  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur lecture BDD');
    let db = JSON.parse(data);
    db.blog_posts.push(newBlog);
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), err => {
      if (err) return res.status(500).send('Erreur écriture BDD');
      res.json({ success: true, blog: newBlog });
    });
  });
});

app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));
