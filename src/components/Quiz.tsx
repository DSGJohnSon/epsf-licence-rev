'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { QuizData, QuizQuestion, UserAnswer, QuizResult } from '@/types/quiz';

interface QuizProps {
  quizData: QuizData;
}

export default function Quiz({ quizData }: QuizProps) {
  // Fonction pour mélanger un tableau (algorithme Fisher-Yates)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // État pour les questions mélangées
  const [shuffledQuestions] = useState(() => shuffleArray(quizData.quiz.questions));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [currentWrongAnswerIndex, setCurrentWrongAnswerIndex] = useState(0);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [isCurrentAnswerCorrect, setIsCurrentAnswerCorrect] = useState(false);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

  // Reset selected answers when question changes
  useEffect(() => {
    const existingAnswer = userAnswers.find(
      (answer) => answer.questionId === currentQuestion.id
    );
    setSelectedAnswers(existingAnswer?.selectedAnswers || []);
    setShowAnswerFeedback(false);
    setIsCurrentAnswerCorrect(false);
  }, [currentQuestionIndex, userAnswers, currentQuestion.id]);

  // Fonction pour vérifier si la réponse est correcte
  const checkAnswer = (answers: string[]) => {
    const isCorrect =
      answers.length === currentQuestion.correctAnswers.length &&
      answers.every((answer) => currentQuestion.correctAnswers.includes(answer));
    
    setIsCurrentAnswerCorrect(isCorrect);
    setShowAnswerFeedback(true);
    return isCorrect;
  };

  // Fonction pour déterminer la couleur d'une option selon son statut
  const getOptionStyle = (optionId: string) => {
    if (!showAnswerFeedback) {
      return "border hover:bg-muted/50 transition-colors cursor-pointer";
    }

    const isSelected = selectedAnswers.includes(optionId);
    const isCorrect = currentQuestion.correctAnswers.includes(optionId);

    if (isSelected && isCorrect) {
      // Réponse sélectionnée et juste (vert)
      return "border-2 border-green-500 bg-green-50 cursor-pointer";
    } else if (isSelected && !isCorrect) {
      // Réponse sélectionnée mais fausse (rouge)
      return "border-2 border-red-500 bg-red-50 cursor-pointer";
    } else if (!isSelected && isCorrect) {
      // Réponse non sélectionnée mais qui était correcte (rouge avec bordure pointillée)
      return "border-2 border-dashed border-red-500 bg-red-50 cursor-pointer";
    } else {
      // Réponse non sélectionnée et pas correcte (neutre)
      return "border bg-gray-50 cursor-pointer";
    }
  };

  const handleAnswerChange = (optionId: string, checked: boolean) => {
    if (currentQuestion.type === 'single') {
      setSelectedAnswers([optionId]);
    } else {
      setSelectedAnswers((prev) =>
        checked
          ? [...prev, optionId]
          : prev.filter((id) => id !== optionId)
      );
    }
    // Ne plus afficher le feedback immédiatement
    setShowAnswerFeedback(false);
  };

  const saveCurrentAnswer = () => {
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswers: [...selectedAnswers],
    };

    setUserAnswers((prev) => {
      const filtered = prev.filter((answer) => answer.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    // Afficher la correction avant de passer à la question suivante
    if (!showAnswerFeedback) {
      checkAnswer(selectedAnswers);
      return; // Ne pas passer à la question suivante, juste afficher la correction
    }
    
    // Si la correction est déjà affichée, passer à la question suivante
    saveCurrentAnswer();
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    saveCurrentAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = (): QuizResult => {
    let correctCount = 0;
    const finalAnswers = [...userAnswers];
    
    // Add current answer if not already saved
    const currentAnswerExists = finalAnswers.some(
      (answer) => answer.questionId === currentQuestion.id
    );
    if (!currentAnswerExists && selectedAnswers.length > 0) {
      finalAnswers.push({
        questionId: currentQuestion.id,
        selectedAnswers: [...selectedAnswers],
      });
    }

    shuffledQuestions.forEach((question) => {
      const userAnswer = finalAnswers.find((answer) => answer.questionId === question.id);
      if (userAnswer) {
        const isCorrect =
          userAnswer.selectedAnswers.length === question.correctAnswers.length &&
          userAnswer.selectedAnswers.every((answer) =>
            question.correctAnswers.includes(answer)
          );
        if (isCorrect) correctCount++;
      }
    });

    return {
      score: correctCount,
      totalQuestions: shuffledQuestions.length,
      percentage: Math.round((correctCount / shuffledQuestions.length) * 100),
      answers: finalAnswers,
    };
  };

  const handleFinish = () => {
    // Afficher la correction avant de terminer le quiz si elle n'est pas encore affichée
    if (!showAnswerFeedback) {
      checkAnswer(selectedAnswers);
      return; // Ne pas terminer le quiz, juste afficher la correction
    }
    
    // Si la correction est déjà affichée, terminer le quiz
    saveCurrentAnswer();
    const result = calculateResults();
    setQuizResult(result);
    setShowResults(true);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizResult(null);
    setCurrentWrongAnswerIndex(0);
  };

  const getWrongAnswers = () => {
    if (!quizResult) return [];
    
    return shuffledQuestions.filter((question) => {
      const userAnswer = quizResult.answers.find(
        (answer) => answer.questionId === question.id
      );
      if (!userAnswer) return true; // No answer is considered wrong
      
      const isCorrect =
        userAnswer.selectedAnswers.length === question.correctAnswers.length &&
        userAnswer.selectedAnswers.every((answer) =>
          question.correctAnswers.includes(answer)
        );
      return !isCorrect;
    });
  };

  const scrollToNextWrongAnswer = () => {
    const wrongAnswers = getWrongAnswers();
    if (wrongAnswers.length === 0) return;

    if (currentWrongAnswerIndex < wrongAnswers.length - 1) {
      const nextIndex = currentWrongAnswerIndex + 1;
      setCurrentWrongAnswerIndex(nextIndex);
      
      // Scroll to the next wrong answer
      const nextWrongQuestion = wrongAnswers[nextIndex];
      const element = document.getElementById(`question-${nextWrongQuestion.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Reached the last wrong answer, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentWrongAnswerIndex(0);
    }
  };

  if (showResults && quizResult) {
    return (
      <div className="max-w-2xl mx-auto p-6 pb-20 sm:pb-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Résultats du Quiz</CardTitle>
            <CardDescription>Voici vos résultats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {quizResult.percentage}%
              </div>
              <p className="text-lg">
                {quizResult.score} sur {quizResult.totalQuestions} questions correctes
              </p>
            </div>

            <Progress value={quizResult.percentage} className="w-full" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Détail des réponses :</h3>
              {shuffledQuestions.map((question) => {
                const userAnswer = quizResult.answers.find(
                  (answer) => answer.questionId === question.id
                );
                const isCorrect =
                  userAnswer &&
                  userAnswer.selectedAnswers.length === question.correctAnswers.length &&
                  userAnswer.selectedAnswers.every((answer) =>
                    question.correctAnswers.includes(answer)
                  );

                return (
                  <div
                    key={question.id}
                    id={`question-${question.id}`}
                    className={`p-4 rounded-lg border ${
                      isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <p className="font-medium mb-2">
                      Question {question.id}: {question.question}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Votre réponse: </span>
                      {userAnswer
                        ? question.options
                            .filter((opt) => userAnswer.selectedAnswers.includes(opt.id))
                            .map((opt) => opt.text)
                            .join(', ')
                        : 'Aucune réponse'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Réponse correcte: </span>
                      {question.options
                        .filter((opt) => question.correctAnswers.includes(opt.id))
                        .map((opt) => opt.text)
                        .join(', ')}
                    </p>
                  </div>
                );
              })}
            </div>

            <Button onClick={handleRestart} className="w-full cursor-pointer">
              Recommencer le Quiz
            </Button>
          </CardContent>
        </Card>
        
        {/* Bouton de navigation pour les réponses fausses */}
        {getWrongAnswers().length > 0 && (
          <>
            {/* Version mobile - bouton fixe en bas */}
            <div className="fixed bottom-4 left-4 right-4 sm:hidden z-50">
              <Button
                onClick={scrollToNextWrongAnswer}
                className="w-full shadow-lg cursor-pointer"
                variant="secondary"
              >
                {currentWrongAnswerIndex < getWrongAnswers().length - 1
                  ? `Réponse fausse suivante (${currentWrongAnswerIndex + 1}/${getWrongAnswers().length})`
                  : 'Retour en haut'}
              </Button>
            </div>
            
            {/* Version desktop - bouton normal */}
            <div className="hidden fixed bottom-6 right-8 sm:block mt-4">
              <Button
                onClick={scrollToNextWrongAnswer}
                className="w-auto shadow-lg cursor-pointer"
                variant="destructive"
              >
                {currentWrongAnswerIndex < getWrongAnswers().length - 1
                  ? `Réponse fausse suivante (${currentWrongAnswerIndex + 1}/${getWrongAnswers().length})`
                  : 'Retour en haut'}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div>
              <CardTitle>{quizData.quiz.title}</CardTitle>
              <CardDescription>{quizData.quiz.description}</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} sur {shuffledQuestions.length}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>
            
            {/* Affichage de l'image d'illustration si présente */}
            {currentQuestion.image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentQuestion.image}
                  alt={currentQuestion.imageAlt || "Illustration de la question"}
                  className="max-w-full h-auto max-h-64 rounded-lg shadow-md"
                />
              </div>
            )}
            
            {currentQuestion.type === 'single' ? (
              <RadioGroup
                value={selectedAnswers[0] || ''}
                onValueChange={(value) => handleAnswerChange(value, true)}
              >
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${getOptionStyle(option.id)}`}
                    onClick={() => !showAnswerFeedback && handleAnswerChange(option.id, true)}
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="mt-1 cursor-pointer"
                      disabled={showAnswerFeedback}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      <div className="flex flex-col space-y-2">
                        {option.image && (
                          <img
                            src={option.image}
                            alt={option.imageAlt || `Option ${option.id}`}
                            className="max-w-32 h-auto rounded border"
                          />
                        )}
                        <span>{option.text}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  (Plusieurs réponses possibles)
                </p>
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${getOptionStyle(option.id)}`}
                    onClick={() => !showAnswerFeedback && handleAnswerChange(option.id, !selectedAnswers.includes(option.id))}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedAnswers.includes(option.id)}
                      onCheckedChange={(checked) =>
                        !showAnswerFeedback && handleAnswerChange(option.id, checked as boolean)
                      }
                      className="mt-1 cursor-pointer"
                      disabled={showAnswerFeedback}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      <div className="flex flex-col space-y-2">
                        {option.image && (
                          <img
                            src={option.image}
                            alt={option.imageAlt || `Option ${option.id}`}
                            className="max-w-32 h-auto rounded border"
                          />
                        )}
                        <span>{option.text}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affichage du feedback de réponse */}
          {showAnswerFeedback && (
            <div className={`p-4 rounded-lg border-2 ${
              isCurrentAnswerCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  isCurrentAnswerCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {isCurrentAnswerCorrect ? '✓' : '✗'}
                </div>
                <span className={`font-semibold ${
                  isCurrentAnswerCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isCurrentAnswerCorrect ? 'Correct !' : 'Incorrect'}
                </span>
              </div>
              
              <div className="text-sm">
                <p className="mb-2">
                  <span className="font-medium">Votre réponse : </span>
                  <span className={isCurrentAnswerCorrect ? 'text-green-700' : 'text-red-700'}>
                    {currentQuestion.options
                      .filter((opt) => selectedAnswers.includes(opt.id))
                      .map((opt) => opt.text)
                      .join(', ')}
                  </span>
                </p>
                
                {!isCurrentAnswerCorrect && (
                  <p>
                    <span className="font-medium">Réponse correcte : </span>
                    <span className="text-green-700">
                      {currentQuestion.options
                        .filter((opt) => currentQuestion.correctAnswers.includes(opt.id))
                        .map((opt) => opt.text)
                        .join(', ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Précédent
            </Button>

            {currentQuestionIndex === shuffledQuestions.length - 1 ? (
              <Button
                onClick={handleFinish}
                disabled={selectedAnswers.length === 0}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                {showAnswerFeedback ? 'Terminer le Quiz' : 'Voir la correction'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={selectedAnswers.length === 0}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                {showAnswerFeedback ? 'Suivant' : 'Voir la correction'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}