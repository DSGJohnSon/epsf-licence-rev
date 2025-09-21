#!/usr/bin/env python3
"""
Script pour extraire les questions, réponses et images du PDF EPSF
et générer un fichier JSON compatible avec l'application de quiz.
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import fitz  # PyMuPDF
from PIL import Image
import io

class EPSFPDFExtractor:
    def __init__(self, pdf_path: str, output_dir: str = "public"):
        self.pdf_path = pdf_path
        self.output_dir = Path(output_dir)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
        # Ouvrir le PDF
        self.doc = fitz.open(pdf_path)
        
    def extract_text_from_page(self, page_num: int) -> str:
        """Extraire le texte d'une page."""
        page = self.doc[page_num]
        return page.get_text()
    
    def extract_images_from_page(self, page_num: int) -> List[Dict[str, Any]]:
        """Extraire les images d'une page."""
        page = self.doc[page_num]
        images = []
        
        # Obtenir la liste des images sur la page
        image_list = page.get_images()
        
        for img_index, img in enumerate(image_list):
            # Extraire l'image
            xref = img[0]
            pix = fitz.Pixmap(self.doc, xref)
            
            # Convertir en PIL Image si nécessaire
            if pix.n - pix.alpha < 4:  # GRAY ou RGB
                img_data = pix.tobytes("png")
                img_filename = f"question_{page_num + 1}_img_{img_index + 1}.png"
                img_path = self.images_dir / img_filename
                
                # Sauvegarder l'image
                with open(img_path, "wb") as f:
                    f.write(img_data)
                
                # Obtenir les coordonnées de l'image sur la page
                img_rect = page.get_image_rects(img)[0] if page.get_image_rects(img) else None
                
                images.append({
                    "filename": img_filename,
                    "path": f"/images/{img_filename}",
                    "rect": img_rect,
                    "index": img_index
                })
            
            pix = None  # Libérer la mémoire
            
        return images
    
    def parse_question_text(self, text: str, page_num: int) -> Optional[Dict[str, Any]]:
        """Parser le texte d'une page pour extraire la question et les réponses."""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        if not lines:
            return None
        
        # La première ligne non-vide est généralement la question
        question_text = lines[0]
        
        # Chercher le code de la question (en bas à droite)
        code_pattern = r'([A-Z]+)\s*(\d+)'
        code_match = None
        for line in reversed(lines):
            match = re.search(code_pattern, line)
            if match:
                code_match = match
                break
        
        # Déterminer si c'est une question à choix multiple
        is_multiple = any("plusieurs réponses" in line.lower() for line in lines)
        
        # Extraire les options de réponse (numérotées 1., 2., 3., etc.)
        options = []
        option_pattern = r'^(\d+)\.\s*(.+)$'
        
        for line in lines[1:]:  # Ignorer la première ligne (question)
            match = re.match(option_pattern, line)
            if match:
                option_id = match.group(1)
                option_text = match.group(2).strip()
                options.append({
                    "id": option_id,
                    "text": option_text
                })
        
        # Pour l'instant, on ne peut pas détecter automatiquement les bonnes réponses
        # depuis le texte seul (il faudrait analyser les couleurs)
        # On va créer une structure de base
        
        question_data = {
            "id": page_num + 1,
            "question": question_text,
            "type": "multiple" if is_multiple else "single",
            "options": options,
            "correctAnswers": [],  # À remplir manuellement ou avec analyse des couleurs
            "code": f"{code_match.group(1)}{code_match.group(2)}" if code_match else f"Q{page_num + 1}"
        }
        
        return question_data
    
    def analyze_page_colors(self, page_num: int) -> Dict[str, Any]:
        """Analyser les couleurs d'une page pour détecter les réponses correctes (en vert)."""
        page = self.doc[page_num]
        
        # Cette fonction nécessiterait une analyse plus complexe des couleurs
        # Pour l'instant, on retourne une structure vide
        return {"green_elements": []}
    
    def extract_all_questions(self) -> List[Dict[str, Any]]:
        """Extraire toutes les questions du PDF."""
        questions = []
        
        for page_num in range(len(self.doc)):
            print(f"Traitement de la page {page_num + 1}/{len(self.doc)}...")
            
            # Extraire le texte
            text = self.extract_text_from_page(page_num)
            
            # Extraire les images
            images = self.extract_images_from_page(page_num)
            
            # Parser la question
            question_data = self.parse_question_text(text, page_num)
            
            if question_data:
                # Ajouter les images si présentes
                if images:
                    # Déterminer quelle image est l'illustration principale
                    # (généralement la plus grande ou celle à droite)
                    main_image = None
                    option_images = []
                    
                    for img in images:
                        # Logique simple : si il y a plusieurs images, 
                        # la première est souvent l'illustration principale
                        if not main_image:
                            main_image = img
                        else:
                            option_images.append(img)
                    
                    if main_image:
                        question_data["image"] = main_image["path"]
                        question_data["imageAlt"] = f"Illustration pour la question {question_data['id']}"
                    
                    # Associer les images aux options (logique à affiner)
                    for i, img in enumerate(option_images):
                        if i < len(question_data["options"]):
                            question_data["options"][i]["image"] = img["path"]
                            question_data["options"][i]["imageAlt"] = f"Option {question_data['options'][i]['id']}"
                
                questions.append(question_data)
        
        return questions
    
    def generate_json(self, questions: List[Dict[str, Any]], output_path: str = "src/data/questions.json"):
        """Générer le fichier JSON final."""
        quiz_data = {
            "quiz": {
                "title": "Quiz de Révision EPSF",
                "description": f"Testez vos connaissances avec ce quiz interactif pour la licence EPSF - {len(questions)} questions",
                "questions": questions
            }
        }
        
        # Créer le répertoire de sortie si nécessaire
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Écrire le fichier JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(quiz_data, f, ensure_ascii=False, indent=2)
        
        print(f"Fichier JSON généré : {output_path}")
        print(f"Nombre de questions extraites : {len(questions)}")
    
    def close(self):
        """Fermer le document PDF."""
        if hasattr(self, 'doc'):
            self.doc.close()

def main():
    """Fonction principale."""
    pdf_path = "public/epsf.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Erreur : Le fichier {pdf_path} n'existe pas.")
        return
    
    print("Extraction des données du PDF EPSF...")
    
    try:
        extractor = EPSFPDFExtractor(pdf_path)
        questions = extractor.extract_all_questions()
        extractor.generate_json(questions)
        extractor.close()
        
        print("\n" + "="*50)
        print("EXTRACTION TERMINÉE")
        print("="*50)
        print(f"✅ {len(questions)} questions extraites")
        print("✅ Images sauvegardées dans public/images/")
        print("✅ Fichier JSON généré dans src/data/questions.json")
        print("\n⚠️  ATTENTION :")
        print("- Les réponses correctes ne sont pas automatiquement détectées")
        print("- Vous devrez les ajouter manuellement dans le fichier JSON")
        print("- Vérifiez que les associations images/options sont correctes")
        
    except Exception as e:
        print(f"Erreur lors de l'extraction : {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()