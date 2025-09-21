import Quiz from '@/components/Quiz';
import { QuizData } from '@/types/quiz';
import quizDataRaw from '@/data/questions_supp_2.json';

export default function Home() {
  // Type assertion pour s'assurer que les données JSON correspondent au type attendu
  const quizData = quizDataRaw as QuizData;
  
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Révision Licence EPSF
          </h1>
          <p className="text-muted-foreground">
            Répondez aux questions et testez vos connaissances. Ce quizz contient {quizData.quiz.questions.length} questions d'examen EPSF. Le PDF complet avec les 346 questions est disponible <a href="/epsf.pdf" title='Voir le PDF de révision' target='_blank' rel='noopener noreferrer' className='underline hover:text-primary'>ici</a>
          </p>
        </div>
        <Quiz quizData={quizData} />
      </div>
    </div>
  );
}
