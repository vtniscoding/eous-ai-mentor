import { useState, useEffect } from 'react';
import { Sparkles, Trophy, BookOpen, Clock, ArrowRight, Check, AlertTriangle, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { generateQuiz } from '@/lib/gemini';

function isNearlySame(userAnswer: string, expectedAnswer: string): boolean {
  const cleanUser = userAnswer.trim().toLowerCase();
  const cleanExpected = expectedAnswer.trim().toLowerCase();
  
  if (cleanUser === cleanExpected) return true;
  
  // If expected is a number, check if user answer contains that number
  if (!isNaN(Number(cleanExpected))) {
    const userNumbers = cleanUser.match(/\d+/g);
    if (userNumbers && userNumbers.includes(cleanExpected)) {
      return true;
    }
  }
  
  // Word overlap for sentences
  const wordsUser = cleanUser.split(/\s+/).filter(w => w.length > 1);
  const wordsExpected = cleanExpected.split(/\s+/).filter(w => w.length > 1);
  
  if (wordsExpected.length === 0) return false;
  
  const intersection = wordsUser.filter(word => wordsExpected.includes(word));
  const overlapRatio = intersection.length / wordsExpected.length;
  
  return overlapRatio > 0.6; // 60% of expected words are present
}

interface QuizQuestion {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  userAnswer?: string;
}

export function QuizHub() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(3);
  const [quizLevel, setQuizLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  
  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Delete State
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchRecentQuizzes();
    }
  }, [user]);

  const fetchRecentQuizzes = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load recent quizzes');
    } else if (data) {
      setRecentQuizzes(data);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    try {
      const questions = await generateQuiz(topic, questionCount, quizLevel);
      setActiveQuiz(questions);
      setIsPracticeMode(false);
    } catch (error) {
      toast.error('Failed to generate quiz. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!activeQuiz) return;
    const currentQuestion = activeQuiz[currentQuestionIdx];
    
    let correct = false;
    if (currentQuestion.type === 'mcq') {
      correct = userAnswer === currentQuestion.answer;
    } else {
      correct = isNearlySame(userAnswer, currentQuestion.answer);
    }

    // Save user's answer in the quiz object
    const updatedQuiz = [...activeQuiz];
    updatedQuiz[currentQuestionIdx] = {
      ...currentQuestion,
      userAnswer: userAnswer
    };
    setActiveQuiz(updatedQuiz);

    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    setSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    
    const isLastQuestion = currentQuestionIdx === activeQuiz.length - 1;
    const finalScore = score;
    
    if (!isLastQuestion) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setUserAnswer('');
      setSubmitted(false);
    } else {
      setQuizCompleted(true);
      saveQuizResult(finalScore, activeQuiz.length);
    }
  };

  const saveQuizResult = async (finalScore: number, total: number) => {
    if (!user?.id || !activeQuiz) return;
    
    if (isPracticeMode) {
      toast.success('Practice complete! Score not saved.');
      return;
    }
    
    if (activeQuizId) {
      // Update existing quiz score
      const { data, error } = await supabase
        .from('quizzes')
        .update({
          score: finalScore,
        })
        .eq('id', activeQuizId)
        .select();

      if (error) {
        console.error('Error updating quiz:', error);
        toast.error('Failed to update quiz result');
      } else if (data) {
        // Update state immediately!
        setRecentQuizzes(recentQuizzes.map(q => q.id === activeQuizId ? data[0] : q));
      }
    } else {
      // Insert new quiz
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          topic: topic,
          questions: activeQuiz,
          score: finalScore,
          total_questions: total,
        })
        .select();

      if (error) {
        console.error('Error saving quiz:', error);
        toast.error('Failed to save quiz result');
      } else if (data) {
        // Add to state immediately!
        setRecentQuizzes([data[0], ...recentQuizzes]);
      }
    }
  };

  const handlePracticeMistakes = () => {
    if (!activeQuiz) return;
    
    const wrongQuestions = activeQuiz.filter(q => {
      if (q.type === 'mcq') {
        return q.userAnswer !== q.answer;
      } else {
        return !isNearlySame(q.userAnswer || '', q.answer);
      }
    });

    if (wrongQuestions.length === 0) {
      toast.success('You got everything right! No mistakes to practice.');
      return;
    }

    setActiveQuiz(wrongQuestions);
    setCurrentQuestionIdx(0);
    setScore(0);
    setSubmitted(false);
    setIsCorrect(false);
    setUserAnswer('');
    setQuizCompleted(false);
    setActiveQuizId(null); 
    setIsPracticeMode(true);
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizToDelete);

    if (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } else {
      toast.success('Quiz deleted');
      fetchRecentQuizzes(); // Refresh list
    }
    
    setShowDeleteConfirm(false);
    setQuizToDelete(null);
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setActiveQuizId(null);
    setTopic('');
    setCurrentQuestionIdx(0);
    setUserAnswer('');
    setSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
    setIsPracticeMode(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background to-card/20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Quizzes & Practice 🧠
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate custom exercises or review your past attempts.
          </p>
        </div>
      </div>

      {!activeQuiz ? (
        <>
          {/* Generate New Quiz Section */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-6 shadow-xl shadow-purple-500/5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" /> Generate New Quiz
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Type a topic below and Eous will create a custom quiz for you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis"
                  className="w-full h-11 bg-background/50 border border-border/40 rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Questions</label>
                <div className="relative">
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-11 bg-background/50 border border-border/40 rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Level</label>
                <div className="relative">
                  <select
                    value={quizLevel}
                    onChange={(e) => setQuizLevel(e.target.value)}
                    className="w-full h-11 bg-background/50 border border-border/40 rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateQuiz}
                disabled={loading || !topic.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl"
              >
                {loading ? 'Generating...' : 'Generate Quiz'}
              </Button>
            </div>
          </div>

          {/* Recent Quizzes Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" /> Recent Quizzes
            </h2>
            
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                No quizzes taken yet. Generate one above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-card/50 border border-border/40 rounded-2xl p-5 hover:border-purple-500/40 transition-all cursor-pointer group relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors">
                          {quiz.topic}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 font-bold text-sm">
                          {quiz.score}/{quiz.total_questions}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering card click
                            setQuizToDelete(quiz.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-500/5 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopic(quiz.topic);
                          setActiveQuiz(quiz.questions);
                          setActiveQuizId(quiz.id);
                        }}
                      >
                        Retake <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Active Quiz Interface */
        <div className="bg-card/50 border border-border/40 rounded-2xl p-6 shadow-xl backdrop-blur-md max-w-2xl mx-auto w-full mt-8">
          {!quizCompleted ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-bold uppercase text-purple-600">
                    Topic: {topic}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIdx + 1} of {activeQuiz.length}
                </span>
              </div>

              <h2 className="text-xl font-bold mb-6 text-foreground">
                {activeQuiz[currentQuestionIdx].question}
              </h2>

              {/* MCQ Options */}
              {activeQuiz[currentQuestionIdx].type === 'mcq' && (
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {activeQuiz[currentQuestionIdx].options?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !submitted && setUserAnswer(option)}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        userAnswer === option
                          ? 'border-purple-500 bg-purple-500/10 text-foreground'
                          : 'border-border/40 bg-background/50 hover:bg-muted text-muted-foreground'
                      } ${
                        submitted && option === activeQuiz[currentQuestionIdx].answer
                          ? 'border-green-500 bg-green-500/10 text-green-600'
                          : ''
                      } ${
                        submitted && userAnswer === option && option !== activeQuiz[currentQuestionIdx].answer
                          ? 'border-red-500 bg-red-500/10 text-red-600'
                          : ''
                      }`}
                      disabled={submitted}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Fill in the Blank / Short Answer Input */}
              {(activeQuiz[currentQuestionIdx].type === 'fill_in_the_blank' || activeQuiz[currentQuestionIdx].type === 'short_answer') && (
                <div className="mb-6">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-11 bg-background/50 border border-border/40 rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    disabled={submitted}
                  />
                </div>
              )}

              {/* Feedback Area */}
              {submitted && (
                <div className={`p-4 rounded-xl mb-6 flex gap-3 ${
                  isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {isCorrect ? (
                    <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {isCorrect ? 'Correct!' : 'Not quite right.'}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {activeQuiz[currentQuestionIdx].explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                {!submitted ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim()}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl"
                  >
                    {currentQuestionIdx < activeQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* Quiz Results */
            <div className="text-center py-6">
              <div className="h-16 w-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
              <p className="text-muted-foreground mb-6">
                You scored {score} out of {activeQuiz.length} on the topic: <strong>{topic}</strong>
              </p>
              
              <div className="flex justify-center gap-3">
                <Button
                  onClick={resetQuiz}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl"
                >
                  Back to Hub
                </Button>
                <Button
                  onClick={handlePracticeMistakes}
                  variant="outline"
                  className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10 rounded-xl"
                >
                  Practice Mistakes
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
            <h2 className="text-xl font-bold mb-2 text-foreground">Delete Quiz?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this quiz attempt? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setQuizToDelete(null);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteQuiz}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
