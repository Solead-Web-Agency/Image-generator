/**
 * Script de test pour vérifier la clé API Unsplash
 * 
 * Usage: node test-unsplash.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

async function testUnsplash() {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    
    console.log('\n🧪 Test de la clé API Unsplash\n');
    console.log('═'.repeat(50));
    
    // Vérifier si la clé existe
    if (!apiKey) {
        console.log('❌ UNSPLASH_ACCESS_KEY non trouvée dans le fichier .env');
        console.log('\n📝 Ajoutez cette ligne dans votre fichier .env :');
        console.log('UNSPLASH_ACCESS_KEY=votre_cle_ici\n');
        process.exit(1);
    }
    
    console.log('✅ Clé trouvée dans .env');
    console.log(`📝 Clé : ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    console.log('═'.repeat(50));
    
    // Tester l'API
    console.log('\n🔍 Test de connexion à l\'API Unsplash...\n');
    
    try {
        const url = `https://api.unsplash.com/search/photos?query=nature&per_page=1&client_id=${apiKey}`;
        console.log(`📡 URL : ${url.replace(apiKey, apiKey.substring(0, 10) + '...')}`);
        console.log(`🔑 Client-ID : ${apiKey.substring(0, 10)}...\n`);
        
        const response = await fetch(url);
        
        console.log(`📊 Status : ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log(`\n✅ SUCCÈS ! API Unsplash fonctionne parfaitement !`);
            console.log(`📸 Images trouvées : ${data.total}`);
            console.log(`🎯 Première image : ${data.results[0]?.alt_description || 'Aucune description'}`);
            console.log('\n═'.repeat(50));
            console.log('🎉 Tout est OK ! Vous pouvez utiliser Unsplash dans l\'app\n');
            process.exit(0);
        } else if (response.status === 401) {
            console.log(`\n❌ ERREUR 401 : Clé API non valide ou non autorisée`);
            console.log('\n🔧 Solutions :');
            console.log('1. Vérifiez que vous utilisez bien l\'Access Key (pas le Secret Key)');
            console.log('2. Allez sur https://unsplash.com/oauth/applications');
            console.log('3. Vérifiez que votre application est active');
            console.log('4. Attendez 5-10 minutes si vous venez de créer l\'application');
            console.log('5. Essayez de regénérer une nouvelle Access Key\n');
            process.exit(1);
        } else if (response.status === 403) {
            console.log(`\n❌ ERREUR 403 : Limite de requêtes dépassée`);
            console.log('\n🔧 Solutions :');
            console.log('1. Attendez 1 heure (limite : 50 requêtes/heure en mode Demo)');
            console.log('2. Ou passez votre application en mode Production\n');
            process.exit(1);
        } else {
            const errorData = await response.text();
            console.log(`\n❌ ERREUR ${response.status}`);
            console.log(`📄 Réponse : ${errorData}\n`);
            process.exit(1);
        }
        
    } catch (error) {
        console.log('\n❌ ERREUR lors de la requête :');
        console.log(error.message);
        console.log('\n🔧 Vérifiez votre connexion internet\n');
        process.exit(1);
    }
}

testUnsplash();
