#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour fusionner tous les fichiers de questions JSON dans src/data/
"""

import json
import os
from pathlib import Path

def load_json_file(filepath):
    """Charge un fichier JSON et retourne son contenu"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lors du chargement de {filepath}: {e}")
        return None

def merge_questions():
    """Fusionne toutes les questions des fichiers JSON dans src/data/"""
    
    # Répertoire des données
    data_dir = Path("src/data")
    
    # Fichiers JSON à fusionner
    json_files = [
        "questions_merged.json",
        "questions_supp.json", 
        "questions_supp_2.json"
    ]
    
    # Structure de base pour le fichier fusionné
    merged_data = {
        "quiz": {
            "title": "Quiz de Révision EPSF - Collection Complète",
            "description": "Testez vos connaissances avec ce quiz interactif pour la licence EPSF - Collection complète fusionnée",
            "questions": []
        }
    }
    
    current_id = 1
    total_questions = 0
    
    print("Début de la fusion des questions...")
    
    # Parcourir chaque fichier JSON
    for json_file in json_files:
        filepath = data_dir / json_file
        
        if not filepath.exists():
            print(f"Fichier non trouvé: {filepath}")
            continue
            
        print(f"Traitement de {json_file}...")
        
        # Charger le fichier JSON
        data = load_json_file(filepath)
        if not data or 'quiz' not in data or 'questions' not in data['quiz']:
            print(f"Structure invalide dans {json_file}")
            continue
        
        # Ajouter les questions avec des IDs uniques
        questions = data['quiz']['questions']
        for question in questions:
            # Créer une copie de la question avec un nouvel ID
            new_question = question.copy()
            new_question['id'] = current_id
            
            # Ajouter la question à la collection fusionnée
            merged_data['quiz']['questions'].append(new_question)
            current_id += 1
            total_questions += 1
        
        print(f"  -> {len(questions)} questions ajoutées")
    
    # Mettre à jour la description avec le nombre total
    merged_data['quiz']['description'] = f"Testez vos connaissances avec ce quiz interactif pour la licence EPSF - {total_questions} questions"
    
    # Sauvegarder le fichier fusionné
    output_file = data_dir / "questions_complete.json"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Fusion terminée avec succès!")
        print(f"📁 Fichier de sortie: {output_file}")
        print(f"📊 Total des questions: {total_questions}")
        
        # Vérification des codes uniques
        codes = [q.get('code', '') for q in merged_data['quiz']['questions']]
        unique_codes = set(codes)
        
        if len(codes) != len(unique_codes):
            print(f"⚠️  Attention: {len(codes) - len(unique_codes)} codes dupliqués détectés")
        else:
            print(f"✅ Tous les codes sont uniques")
            
    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde: {e}")

def show_summary():
    """Affiche un résumé des fichiers dans src/data/"""
    data_dir = Path("src/data")
    
    print("\n📋 Résumé des fichiers dans src/data/:")
    print("-" * 50)
    
    for file in data_dir.glob("*.json"):
        try:
            data = load_json_file(file)
            if data and 'quiz' in data and 'questions' in data['quiz']:
                count = len(data['quiz']['questions'])
                print(f"📄 {file.name}: {count} questions")
            else:
                print(f"📄 {file.name}: structure invalide")
        except:
            print(f"📄 {file.name}: erreur de lecture")

if __name__ == "__main__":
    print("🔄 Script de fusion des questions EPSF")
    print("=" * 50)
    
    # Afficher le résumé des fichiers
    show_summary()
    
    # Effectuer la fusion
    merge_questions()
    
    print("\n🎯 Script terminé!")