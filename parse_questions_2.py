import json
import re

def parse_raw_data2():
    """Parse le fichier raw_data2.txt et extrait toutes les questions"""
    
    with open('src/data/raw_data2.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Diviser le contenu par les séparateurs ////////
    questions_raw = content.split('////////')
    
    questions = []
    question_id = 1  # Commencer à 1 pour le nouveau fichier
    
    for question_block in questions_raw:
        lines = [line.strip() for line in question_block.strip().split('\n') if line.strip()]
        
        if len(lines) < 3:  # Au minimum: question, une option, code
            continue
            
        # La première ligne est la question
        question_text = lines[0]
        
        # Trouver les options (lignes commençant par [])
        options = []
        correct_answers = []
        code = ""
        
        option_id = 1
        for line in lines[1:]:
            if line.startswith('[]'):
                # Extraire le texte de l'option
                option_text = line[2:].strip()
                
                # Vérifier si c'est une bonne réponse (se termine par XXX)
                is_correct = option_text.endswith(' XXX')
                if is_correct:
                    option_text = option_text[:-4].strip()  # Enlever ' XXX'
                    correct_answers.append(str(option_id))
                
                options.append({
                    "id": str(option_id),
                    "text": option_text
                })
                option_id += 1
            elif not line.startswith('[]') and len(line) > 0 and not line.startswith('//'):
                # C'est probablement le code de la question
                code = line
                break
        
        # Déterminer le type de question
        question_type = "multiple" if len(correct_answers) > 1 else "single"
        
        if question_text and options and correct_answers and code:
            question_obj = {
                "id": question_id,
                "question": question_text,
                "type": question_type,
                "options": options,
                "correctAnswers": correct_answers,
                "code": code
            }
            questions.append(question_obj)
            question_id += 1
    
    return questions

def create_questions_2_json():
    """Crée le fichier questions_2.json avec les nouvelles questions"""
    
    # Parser les nouvelles questions
    new_questions = parse_raw_data2()
    
    # Créer la structure JSON
    data = {
        "quiz": {
            "title": "Quiz de Révision EPSF - Série 2",
            "description": f"Testez vos connaissances avec ce quiz interactif pour la licence EPSF - {len(new_questions)} questions",
            "questions": new_questions
        }
    }
    
    # Sauvegarder le fichier
    with open('src/data/questions_2.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Créé le fichier questions_2.json avec {len(new_questions)} questions")
    print(f"Total de questions: {len(new_questions)}")
    
    return len(new_questions)

if __name__ == "__main__":
    count = create_questions_2_json()
    print(f"Traitement terminé: {count} questions ajoutées dans questions_2.json")