'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { QuizData, UserAnswer, QuizResult } from '@/types/quiz';

interface QuizProps {
  quizData: QuizData;
  onBackToMenu?: () => void;
}

export default function Quiz({ quizData, onBackToMenu }: QuizProps) {
  // Fonction pour mélanger un tableau (algorithme Fisher-Yates) avec seed fixe
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    // Utiliser une seed basée sur la longueur du tableau pour éviter les différences serveur/client
    let seed = array.length;
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Générateur pseudo-aléatoire simple avec seed
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // État pour les questions mélangées - utiliser directement les questions sans mélange côté serveur
  const [shuffledQuestions, setShuffledQuestions] = useState(() => quizData.quiz.questions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [isCurrentAnswerCorrect, setIsCurrentAnswerCorrect] = useState(false);

  // Effet pour mélanger les questions côté client uniquement
  useEffect(() => {
    // Mélanger les questions seulement côté client pour éviter l'erreur d'hydratation
    setShuffledQuestions(shuffleArray(quizData.quiz.questions));
  }, [quizData.quiz.questions]);
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
    // Trier les tableaux pour une comparaison correcte
    const sortedAnswers = [...answers].sort();
    const sortedCorrectAnswers = [...currentQuestion.correctAnswers].sort();
    
    const isCorrect =
      sortedAnswers.length === sortedCorrectAnswers.length &&
      sortedAnswers.every((answer, index) => answer === sortedCorrectAnswers[index]);

    setIsCurrentAnswerCorrect(isCorrect);
    setShowAnswerFeedback(true);
    return isCorrect;
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
    if (!showAnswerFeedback) {
      checkAnswer(selectedAnswers);
      return;
    }

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
    if (!showAnswerFeedback) {
      checkAnswer(selectedAnswers);
      return;
    }

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
  };

  const getOptionStyle = (optionId: string) => {
    if (!showAnswerFeedback) {
      return "border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer rounded-lg p-4";
    }

    const isSelected = selectedAnswers.includes(optionId);
    const isCorrect = currentQuestion.correctAnswers.includes(optionId);

    if (isSelected && isCorrect) {
      return "border-2 border-green-500 bg-green-50 cursor-pointer rounded-lg p-4";
    } else if (isSelected && !isCorrect) {
      return "border-2 border-red-500 bg-red-50 cursor-pointer rounded-lg p-4";
    } else if (!isSelected && isCorrect) {
      return "border-2 border-dashed border-red-500 bg-red-50 cursor-pointer rounded-lg p-4";
    } else {
      return "border-2 border-gray-200 bg-gray-50 cursor-pointer rounded-lg p-4";
    }
  };

  if (showResults && quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-0">
        <div className="w-full h-full">
          <Card className="min-h-screen border-0 bg-white/80 backdrop-blur-sm rounded-none">
            <CardHeader className="text-center pb-6 sm:pb-8">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl sm:text-3xl">🎉</span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800">Quiz Terminé !</CardTitle>
              <CardDescription className="text-base sm:text-lg text-gray-600">
                Voici vos résultats pour le quiz EPSF
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 sm:space-y-8">
              {/* Score principal - Mobile first */}
              <div className="text-center p-6 sm:p-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white">
                <div className="text-4xl sm:text-6xl font-bold mb-2">
                  {quizResult.percentage}%
                </div>
                <p className="text-lg sm:text-xl opacity-90">
                  {quizResult.score} sur {quizResult.totalQuestions} questions correctes
                </p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progression globale</span>
                  <span>{quizResult.percentage}%</span>
                </div>
                <Progress value={quizResult.percentage} className="h-3" />
              </div>

              {/* Détail des réponses */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Détail des réponses</h3>
                <div className="grid gap-4">
                  {shuffledQuestions.map((question, index) => {
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
                      <Card key={question.id} className={`transition-all duration-200 ${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </span>
                              <span className="text-sm text-gray-500">Question {index + 1}</span>
                            </div>
                            {question.code && (
                              <span className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600">
                                {question.code}
                              </span>
                            )}
                          </div>

                          <p className="font-medium text-gray-800 mb-3">
                            {question.question}
                          </p>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Votre réponse: </span>
                              <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {userAnswer
                                  ? question.options
                                      .filter((opt) => userAnswer.selectedAnswers.includes(opt.id))
                                      .map((opt) => opt.text)
                                      .join(', ')
                                  : 'Aucune réponse'}
                              </span>
                            </div>

                            {!isCorrect && (
                              <div>
                                <span className="font-medium text-gray-700">Réponse correcte: </span>
                                <span className="text-green-700">
                                  {question.options
                                    .filter((opt) => question.correctAnswers.includes(opt.id))
                                    .map((opt) => opt.text)
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="text-center pt-4 space-y-4">
                <Button
                  onClick={handleRestart}
                  size="lg"
                  className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  🔄 Recommencer le Quiz
                </Button>
                {onBackToMenu && (
                  <div>
                    <Button
                      onClick={onBackToMenu}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 text-lg font-semibold"
                    >
                      ← Retour au menu principal
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-0">
      <div className="w-full h-full">
        <Card className="min-h-screen border-0 bg-white/90 backdrop-blur-sm rounded-none">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  {quizData.quiz.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600">
                  {quizData.quiz.description}
                </CardDescription>
              </div>

              {/* Indicateurs de progression - Mobile first */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
                  <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded text-gray-600">
                    Question {currentQuestionIndex + 1} / {shuffledQuestions.length}
                  </span>
                  {currentQuestion.code && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-800 rounded-full">
                      {currentQuestion.code}
                    </span>
                  )}
                </div>

                {/* Barre de progression */}
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                    <span>Progression</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Bouton retour au menu si disponible */}
            {onBackToMenu && (
              <div className="flex justify-start">
                <Button
                  onClick={onBackToMenu}
                  variant="outline"
                  className="mb-4"
                >
                  ← Retour au menu
                </Button>
              </div>
            )}
            
            {/* Question */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 leading-relaxed">
                  {currentQuestion.question}
                </h2>
                <span className={`px-3 py-1 text-xs sm:text-sm rounded-full font-medium whitespace-nowrap ${currentQuestion.type === 'single' ? 'bg-blue-500 text-white' : 'bg-purple-100 text-purple-800'}`}>
                  {currentQuestion.type === 'single' ? 'Choix unique' : 'Choix multiple'}
                </span>
              </div>

              {/* Image d'illustration - Optimisée mobile */}
              {currentQuestion.image && (
                <div className="flex justify-center">
                  <div className="relative w-full max-w-4xl">
                    <img
                      src={currentQuestion.image}
                      alt={currentQuestion.imageAlt || "Illustration de la question"}
                      className="w-full h-auto rounded-xl shadow-lg object-contain"
                      style={{ maxHeight: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Options de réponse */}
              <div className="space-y-4">
                {currentQuestion.type === 'single' ? (
                  <RadioGroup
                    value={selectedAnswers[0] || ''}
                    onValueChange={(value) => handleAnswerChange(value, true)}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        className={`${getOptionStyle(option.id)} transition-all duration-200`}
                        onClick={() => !showAnswerFeedback && handleAnswerChange(option.id, true)}
                      >
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem
                            value={option.id}
                            id={option.id}
                            className="cursor-pointer flex-shrink-0"
                            disabled={showAnswerFeedback}
                          />
                          <Label htmlFor={option.id} className="cursor-pointer flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-start sm:items-center space-x-3">
                                <span className="text-sm font-medium text-gray-500 w-6 flex-shrink-0">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <span className="text-sm sm:text-base text-gray-800 leading-relaxed">{option.text}</span>
                              </div>
                              {option.image && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={option.image}
                                    alt={option.imageAlt || `Option ${option.id}`}
                                    className="w-auto h-auto max-w-32 max-h-32 sm:max-w-40 sm:max-h-40 md:max-w-48 md:max-h-48 object-contain rounded-lg border-2 border-gray-200"
                                  />
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-blue-600 font-medium bg-blue-50 p-3 rounded-lg">
                      💡 Plusieurs réponses sont possibles pour cette question
                    </p>
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        className={`${getOptionStyle(option.id)} transition-all duration-200`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!showAnswerFeedback) {
                            handleAnswerChange(option.id, !selectedAnswers.includes(option.id));
                          }
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            id={option.id}
                            checked={selectedAnswers.includes(option.id)}
                            onCheckedChange={() => {
                              // Ne pas gérer ici car c'est géré par le onClick de la div
                            }}
                            className="cursor-pointer flex-shrink-0 pointer-events-none"
                            disabled={showAnswerFeedback}
                          />
                          <Label htmlFor={option.id} className="cursor-pointer flex-1 pointer-events-none">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex items-start space-x-3">
                                <span className="text-sm font-medium text-gray-500 w-6">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <span className="text-gray-800">{option.text}</span>
                              </div>
                              {option.image && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={option.image}
                                    alt={option.imageAlt || `Option ${option.id}`}
                                    className="w-auto h-auto max-w-32 max-h-32 sm:max-w-40 sm:max-h-40 md:max-w-48 md:max-h-48 object-contain rounded-lg border-2 border-gray-200"
                                  />
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Feedback de réponse */}
            {showAnswerFeedback && (
              <Card className={`border-2 ${isCurrentAnswerCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                      isCurrentAnswerCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {isCurrentAnswerCorrect ? '✓' : '✗'}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isCurrentAnswerCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isCurrentAnswerCorrect ? 'Bonne réponse !' : 'Réponse incorrecte'}
                      </h3>
                      <p className="text-gray-600">
                        {isCurrentAnswerCorrect
                          ? 'Vous avez correctement répondu à cette question.'
                          : 'La réponse correcte est indiquée ci-dessous.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Votre réponse: </span>
                      <span className={isCurrentAnswerCorrect ? 'text-green-700' : 'text-red-700'}>
                        {currentQuestion.options
                          .filter((opt) => selectedAnswers.includes(opt.id))
                          .map((opt) => opt.text)
                          .join(', ')}
                      </span>
                    </div>

                    {!isCurrentAnswerCorrect && (
                      <div>
                        <span className="font-medium text-gray-700">Réponse correcte: </span>
                        <span className="text-green-700">
                          {currentQuestion.options
                            .filter((opt) => currentQuestion.correctAnswers.includes(opt.id))
                            .map((opt) => opt.text)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation - Optimisée mobile */}
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
              {/* Bouton précédent - Mobile first */}
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed py-3 text-base font-medium"
              >
                ← Question précédente
              </Button>

              {/* Boutons d'action - Mobile first */}
              <div className="flex flex-col gap-3">
                {currentQuestionIndex === shuffledQuestions.length - 1 ? (
                  <Button
                    onClick={handleFinish}
                    disabled={selectedAnswers.length === 0}
                    className="w-full cursor-pointer disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-3 text-base font-medium"
                  >
                    {showAnswerFeedback ? 'Terminer le Quiz' : 'Voir la correction'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={selectedAnswers.length === 0}
                    className="w-full cursor-pointer disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-3 text-base font-medium"
                  >
                    {showAnswerFeedback ? 'Question suivante →' : 'Voir la correction'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}