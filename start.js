import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Démarrage du serveur de nouvelles...');
console.log('📁 Répertoire de travail:', __dirname);

// Démarrer le serveur
const server = spawn('node', ['scraper.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

server.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
});

server.on('close', (code) => {
    console.log(`🔴 Serveur arrêté avec le code: ${code}`);
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.kill('SIGTERM');
    process.exit(0);
});

