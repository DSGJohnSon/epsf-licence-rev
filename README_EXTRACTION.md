# Extraction des données PDF EPSF

Ce document explique comment utiliser le script Python pour extraire les questions, réponses et images du PDF EPSF et générer le fichier JSON pour l'application de quiz.

## Prérequis

1. **Python 3.7+** installé sur votre système
2. **Le fichier PDF EPSF** placé dans `public/epsf.pdf`

## Installation des dépendances

```bash
# Installer les dépendances Python
pip install -r requirements.txt
```

Ou individuellement :
```bash
pip install PyMuPDF==1.23.26 Pillow==10.1.0
```

## Utilisation du script

### Extraction automatique

```bash
python extract_pdf_data.py
```

Le script va :
1. ✅ Lire le PDF `public/epsf.pdf`
2. ✅ Extraire le texte de chaque page (question + options)
3. ✅ Extraire les images et les sauvegarder dans `public/images/`
4. ✅ Générer le fichier JSON dans `src/data/questions.json`

### Structure du PDF attendue

Le script s'attend à cette structure sur chaque slide :

```
[QUESTION TEXT - Premier texte en haut]

1. [Option 1]
2. [Option 2] 
3. [Option 3]
4. [Option 4]

[Optionnel: "Plusieurs réponses attendues."]

[Images d'illustration à droite]
[Images des options avec cercles numérotés et étoiles vertes]

[CODE + Numéro - En bas à droite]
```

## Résultats de l'extraction

### Fichiers générés

- **`src/data/questions.json`** : Fichier JSON avec toutes les questions
- **`public/images/`** : Dossier contenant toutes les images extraites
  - `question_X_img_Y.png` : Images extraites (X = numéro de page, Y = index d'image)

### Structure JSON générée

```json
{
  "quiz": {
    "title": "Quiz de Révision EPSF",
    "description": "Testez vos connaissances...",
    "questions": [
      {
        "id": 1,
        "question": "Texte de la question",
        "type": "single", // ou "multiple"
        "options": [
          {
            "id": "1",
            "text": "Texte de l'option",
            "image": "/images/question_1_img_2.png", // optionnel
            "imageAlt": "Description de l'image" // optionnel
          }
        ],
        "correctAnswers": [], // À remplir manuellement
        "code": "CODE123",
        "image": "/images/question_1_img_1.png", // optionnel
        "imageAlt": "Illustration de la question" // optionnel
      }
    ]
  }
}
```

## Post-traitement manuel requis

⚠️ **IMPORTANT** : Le script ne peut pas détecter automatiquement les réponses correctes depuis le PDF. Vous devrez :

1. **Identifier les réponses correctes** en analysant les étoiles vertes dans le PDF
2. **Remplir le champ `correctAnswers`** pour chaque question
3. **Vérifier les associations images/options** et les corriger si nécessaire
4. **Ajuster les textes** si l'extraction n'est pas parfaite

### Exemple de correction manuelle

```json
{
  "id": 1,
  "question": "Quelle est la bonne réponse ?",
  "type": "single",
  "options": [
    {"id": "1", "text": "Option A"},
    {"id": "2", "text": "Option B"},
    {"id": "3", "text": "Option C"},
    {"id": "4", "text": "Option D"}
  ],
  "correctAnswers": ["2"], // ← À ajouter manuellement
  "code": "ABC123"
}
```

## Dépannage

### Erreurs communes

1. **`FileNotFoundError: public/epsf.pdf`**
   - Vérifiez que le fichier PDF est bien placé dans `public/epsf.pdf`

2. **`ModuleNotFoundError: No module named 'fitz'`**
   - Installez PyMuPDF : `pip install PyMuPDF`

3. **Images non extraites**
   - Certains PDF ont des images intégrées différemment
   - Vérifiez manuellement le dossier `public/images/`

4. **Texte mal extrait**
   - L'extraction de texte peut varier selon la qualité du PDF
   - Vérifiez et corrigez manuellement le JSON généré

### Amélioration du script

Le script peut être amélioré pour :
- Détecter automatiquement les réponses correctes (analyse des couleurs vertes)
- Mieux associer les images aux options
- Gérer des formats PDF spécifiques

## Test de l'application

Après l'extraction et les corrections manuelles :

```bash
# Lancer l'application Next.js
npm run dev
```

L'application devrait maintenant afficher toutes les questions EPSF avec leurs images.