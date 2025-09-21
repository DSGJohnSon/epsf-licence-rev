import json
import re

def parse_raw_data():
    """Parse le fichier raw_data.txt et extrait toutes les questions"""
    
    with open('src/data/raw_data.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Diviser le contenu par les séparateurs ////////
    questions_raw = content.split('////////')
    
    questions = []
    question_id = 10  # Commencer après les questions de démonstration existantes
    
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

def update_questions_json():
    """Met à jour le fichier questions.json avec les nouvelles questions"""
    
    # Charger le fichier existant
    with open('src/data/questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Parser les nouvelles questions
    new_questions = parse_raw_data()
    
    # Ajouter les nouvelles questions aux existantes
    data['quiz']['questions'].extend(new_questions)
    
    # Mettre à jour la description
    total_questions = len(data['quiz']['questions'])
    data['quiz']['description'] = f"Testez vos connaissances avec ce quiz interactif pour la licence EPSF - {total_questions} questions"
    
    # Sauvegarder le fichier mis à jour
    with open('src/data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Ajouté {len(new_questions)} nouvelles questions au fichier questions.json")
    print(f"Total de questions: {total_questions}")
    
    return len(new_questions)

if __name__ == "__main__":
    count = update_questions_json()
    print(f"Traitement terminé: {count} questions ajoutées")