# Guide d'installation et d'utilisation du script d'extraction PDF

## 🚀 Installation de Python

### Étape 1 : Télécharger Python

1. Allez sur [python.org/downloads](https://www.python.org/downloads/)
2. Téléchargez la dernière version de Python 3 (3.11 ou 3.12 recommandé)
3. **IMPORTANT** : Lors de l'installation, cochez "Add Python to PATH"

### Étape 2 : Vérifier l'installation

Ouvrez un nouveau terminal (PowerShell ou CMD) et tapez :
```bash
python --version
```

Si cela ne fonctionne pas, essayez :
```bash
py --version
```

Vous devriez voir quelque chose comme : `Python 3.11.x`

## 📦 Installation des dépendances

Dans le terminal, dans le dossier du projet :

```bash
# Installer les dépendances
pip install PyMuPDF==1.23.26 Pillow==10.1.0
```

Ou avec le fichier requirements :
```bash
pip install -r requirements.txt
```

## 🔧 Lancement du script d'extraction

### Prérequis
- Le fichier `public/epsf.pdf` doit être présent dans le projet

### Commande d'exécution

```bash
python extract_pdf_data.py
```

Ou si `python` ne fonctionne pas :
```bash
py extract_pdf_data.py
```

## 📋 Ce que fait le script

1. **Lecture du PDF** : Ouvre `public/epsf.pdf`
2. **Extraction par page** : Pour chaque slide du PDF :
   - Extrait le texte (question + options)
   - Extrait les images
   - Identifie la structure (question unique/multiple)
3. **Sauvegarde** :
   - Images dans `public/images/question_X_img_Y.png`
   - JSON dans `src/data/questions.json`

## 📊 Résultats attendus

### Console
```
Traitement de la page 1/346...
Traitement de la page 2/346...
...
==================================================
EXTRACTION TERMINÉE
==================================================
✅ 346 questions extraites
✅ Images sauvegardées dans public/images/
✅ Fichier JSON généré dans src/data/questions.json

⚠️  ATTENTION :
- Les réponses correctes ne sont pas automatiquement détectées
- Vous devrez les ajouter manuellement dans le fichier JSON
- Vérifiez que les associations images/options sont correctes
```

### Fichiers créés
- `src/data/questions.json` : Toutes les questions au format JSON
- `public/images/` : Toutes les images extraites du PDF

## 🛠️ Post-traitement manuel

Le script extrait automatiquement :
- ✅ Les questions
- ✅ Les options de réponse
- ✅ Le type (single/multiple)
- ✅ Les images
- ✅ Les codes de question

**Vous devrez ajouter manuellement :**
- ❌ Les réponses correctes (champ `correctAnswers`)

### Exemple de correction

Dans le fichier `src/data/questions.json` généré :

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
  "correctAnswers": [], // ← Vide, à remplir
  "code": "ABC123"
}
```

Après correction (si l'option B est correcte) :
```json
{
  "correctAnswers": ["2"] // ← Ajouté manuellement
}
```

## 🧪 Test de l'application

Après extraction et correction des réponses :

```bash
npm run dev
```

L'application devrait afficher toutes les questions EPSF avec leurs images.

## 🚨 Dépannage

### Python non trouvé
- Réinstallez Python en cochant "Add to PATH"
- Redémarrez votre terminal/ordinateur

### Erreur de module
```bash
pip install PyMuPDF Pillow
```

### PDF non trouvé
- Vérifiez que `public/epsf.pdf` existe
- Le chemin doit être exact

### Images non extraites
- Certains PDF ont des formats d'image spéciaux
- Vérifiez manuellement le dossier `public/images/`

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Python est bien installé
2. Vérifiez que le PDF est au bon endroit
3. Regardez les messages d'erreur dans le terminal
4. Les dépendances sont-elles installées ?

## 🎯 Résumé des commandes

```bash
# 1. Installer Python (depuis python.org)
# 2. Installer les dépendances
pip install PyMuPDF Pillow

# 3. Lancer l'extraction
python extract_pdf_data.py

# 4. Corriger manuellement les réponses dans le JSON

# 5. Tester l'application
npm run dev