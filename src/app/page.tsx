'use client';

import { useState } from 'react';
import Quiz from '@/components/Quiz';
import { QuizData } from '@/types/quiz';
import quizDataRaw from '@/data/questions_complete.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  // Type assertion pour s'assurer que les données JSON correspondent au type attendu
  const quizData = quizDataRaw as QuizData;
  
  const [selectedMode, setSelectedMode] = useState<'menu' | 'all' | 'exam'>('menu');
  const [examQuestions, setExamQuestions] = useState<typeof quizData.quiz.questions>([]);

  // Fonction pour mélanger un tableau (algorithme Fisher-Yates) avec seed fixe
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    // Utiliser une seed basée sur la date actuelle pour un vrai mélange
    let seed = Date.now() % 233280;
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleAllQuestions = () => {
    setSelectedMode('all');
  };

  const handleExamMode = () => {
    // Sélectionner 40 questions aléatoires
    const shuffled = shuffleArray(quizData.quiz.questions);
    const selected40 = shuffled.slice(0, 40);
    setExamQuestions(selected40);
    setSelectedMode('exam');
  };

  const handleBackToMenu = () => {
    setSelectedMode('menu');
    setExamQuestions([]);
  };

  const handlePdfAccess = () => {
    window.open('/epsf.pdf', '_blank');
  };

  if (selectedMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🚂</span>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
                Révision Licence EPSF
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Choisissez votre mode de révision pour tester vos connaissances
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              <div className="grid gap-6">
                {/* Mode Toutes les questions */}
                <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 cursor-pointer group" onClick={handleAllQuestions}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:bg-blue-600 transition-colors">
                        📚
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Toutes les questions</h3>
                        <p className="text-gray-600">
                          Série complète de {quizData.quiz.questions.length} questions mélangées aléatoirement
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mode Examen blanc */}
                <Card className="border-2 border-green-200 hover:border-green-400 transition-all duration-200 cursor-pointer group" onClick={handleExamMode}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:bg-green-600 transition-colors">
                        🎯
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Examen blanc</h3>
                        <p className="text-gray-600">
                          Série de 40 questions sélectionnées aléatoirement pour simuler un examen
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Accès au PDF */}
                <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all duration-200 cursor-pointer group" onClick={handlePdfAccess}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:bg-purple-600 transition-colors">
                        📄
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">PDF Complet</h3>
                        <p className="text-gray-600">
                          Accéder au PDF avec les 346 questions complètes d&apos;examen EPSF
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedMode === 'all') {
    return <Quiz quizData={quizData} onBackToMenu={handleBackToMenu} />;
  }

  if (selectedMode === 'exam') {
    const examQuizData = {
      quiz: {
        ...quizData.quiz,
        title: "Examen Blanc EPSF",
        description: "Série de 40 questions sélectionnées aléatoirement",
        questions: examQuestions
      }
    };
    return <Quiz quizData={examQuizData} onBackToMenu={handleBackToMenu} />;
  }

  return null;
}
