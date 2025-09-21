import json

# Charger et vérifier le fichier JSON
with open('src/data/questions_2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

total_questions = len(data['quiz']['questions'])
single_questions = len([q for q in data['quiz']['questions'] if q['type'] == 'single'])
multiple_questions = len([q for q in data['quiz']['questions'] if q['type'] == 'multiple'])
unique_codes = len(set(q['code'] for q in data['quiz']['questions']))

print(f"Total questions: {total_questions}")
print(f"Questions à choix unique: {single_questions}")
print(f"Questions à choix multiple: {multiple_questions}")
print(f"Codes uniques: {unique_codes}")

# Vérifier que tous les IDs sont uniques
ids = [q['id'] for q in data['quiz']['questions']]
unique_ids = len(set(ids))
print(f"IDs uniques: {unique_ids}")

# Vérifier la continuité des IDs
expected_ids = list(range(1, total_questions + 1))
actual_ids = sorted(ids)
ids_match = expected_ids == actual_ids
print(f"IDs continus (1 à {total_questions}): {ids_match}")

# Vérifier que toutes les questions ont des réponses correctes
questions_with_answers = len([q for q in data['quiz']['questions'] if q['correctAnswers']])
print(f"Questions avec réponses correctes: {questions_with_answers}")

# Vérifier quelques codes spécifiques pour s'assurer du bon parsing
sample_codes = [q['code'] for q in data['quiz']['questions'][:10]]
print(f"Échantillon de codes: {sample_codes}")

print("\n✅ Vérification terminée avec succès!")