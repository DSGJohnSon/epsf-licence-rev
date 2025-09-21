#!/usr/bin/env node
/**
 * Script pour fusionner tous les fichiers de questions JSON dans src/data/
 */

const fs = require('fs');
const path = require('path');

function loadJsonFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors du chargement de ${filepath}:`, error.message);
    return null;
  }
}

function mergeQuestions() {
  // Répertoire des données
  const dataDir = path.join('src', 'data');
  
  // Fichiers JSON à fusionner
  const jsonFiles = [
    'questions_merged.json',
    'questions_supp.json',
    'questions_supp_2.json'
  ];
  
  // Structure de base pour le fichier fusionné
  const mergedData = {
    quiz: {
      title: "Quiz de Révision EPSF - Collection Complète",
      description: "Testez vos connaissances avec ce quiz interactif pour la licence EPSF - Collection complète fusionnée",
      questions: []
    }
  };
  
  let currentId = 1;
  let totalQuestions = 0;
  
  console.log("Début de la fusion des questions...");
  
  // Parcourir chaque fichier JSON
  for (const jsonFile of jsonFiles) {
    const filepath = path.join(dataDir, jsonFile);
    
    if (!fs.existsSync(filepath)) {
      console.log(`Fichier non trouvé: ${filepath}`);
      continue;
    }
    
    console.log(`Traitement de ${jsonFile}...`);
    
    // Charger le fichier JSON
    const data = loadJsonFile(filepath);
    if (!data || !data.quiz || !data.quiz.questions) {
      console.log(`Structure invalide dans ${jsonFile}`);
      continue;
    }
    
    // Ajouter les questions avec des IDs uniques
    const questions = data.quiz.questions;
    for (const question of questions) {
      // Créer une copie de la question avec un nouvel ID
      const newQuestion = { ...question, id: currentId };
      
      // Ajouter la question à la collection fusionnée
      mergedData.quiz.questions.push(newQuestion);
      currentId++;
      totalQuestions++;
    }
    
    console.log(`  -> ${questions.length} questions ajoutées`);
  }
  
  // Mettre à jour la description avec le nombre total
  mergedData.quiz.description = `Testez vos connaissances avec ce quiz interactif pour la licence EPSF - ${totalQuestions} questions`;
  
  // Sauvegarder le fichier fusionné
  const outputFile = path.join(dataDir, 'questions_complete.json');
  
  try {
    fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 2), 'utf-8');
    
    console.log(`\n✅ Fusion terminée avec succès!`);
    console.log(`📁 Fichier de sortie: ${outputFile}`);
    console.log(`📊 Total des questions: ${totalQuestions}`);
    
    // Vérification des codes uniques
    const codes = mergedData.quiz.questions.map(q => q.code || '');
    const uniqueCodes = new Set(codes);
    
    if (codes.length !== uniqueCodes.size) {
      console.log(`⚠️  Attention: ${codes.length - uniqueCodes.size} codes dupliqués détectés`);
    } else {
      console.log(`✅ Tous les codes sont uniques`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde:`, error.message);
  }
}

function showSummary() {
  console.log("\n📋 Résumé des fichiers dans src/data/:");
  console.log("-".repeat(50));
  
  const dataDir = path.join('src', 'data');
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    try {
      const data = loadJsonFile(path.join(dataDir, file));
      if (data && data.quiz && data.quiz.questions) {
        const count = data.quiz.questions.length;
        console.log(`📄 ${file}: ${count} questions`);
      } else {
        console.log(`📄 ${file}: structure invalide`);
      }
    } catch {
      console.log(`📄 ${file}: erreur de lecture`);
    }
  }
}

// Exécution du script
console.log("🔄 Script de fusion des questions EPSF");
console.log("=".repeat(50));

// Afficher le résumé des fichiers
showSummary();

// Effectuer la fusion
mergeQuestions();

console.log("\n🎯 Script terminé!");