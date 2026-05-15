import { useState } from 'react';
import { X, Check, AlertTriangle, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockQuestions = [
  {
    type: 'mcq',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    answer: 'Paris',
    explanation: 'Paris is the capital and most populous city of France.'
  },
  {
    type: 'fill_in_the_blank',
    question: 'The square root of 64 is ____.',
    answer: '8',
    explanation: '8 * 8 = 64.'
  },
  {
    type: 'short_answer',
    question: 'Explain what photosynthesis is in one sentence.',
    answer: 'Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.',
    explanation: 'It involves chlorophyll and generates oxygen as a byproduct.'
  }
];

export function QuizDialog({ open, onOpenChange }: QuizDialogProps) {
  const [step, setStep] = useState<'setup' | 'quiz'>('setup');
  const [topic, setTopic] = useState('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = mockQuestions[currentQuestionIdx];

  const handleSubmit = () => {
    let correct = false;
    if (currentQuestion.type === 'mcq') {
      correct = userAnswer === currentQuestion.answer;
    } else if (currentQuestion.type === 'fill_in_the_blank') {
      correct = userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    } else if (currentQuestion.type === 'short_answer') {
      correct = true;
    }

    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentQuestionIdx < mockQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setUserAnswer('');
      setSubmitted(false);
    } else {
      setQuizCompleted(true);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
        
        <button
          onClick={() => {
            onOpenChange(false);
            setStep('setup');
            setTopic('');
            setCurrentQuestionIdx(0);
            setScore(0);
            setQuizCompleted(false);
            setUserAnswer('');
            setSubmitted(false);
          }}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!quizCompleted ? (
          <>
            {step === 'setup' ? (
              /* Step 1: Setup */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-bold uppercase text-purple-600">
                    Custom Quiz
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-2 text-foreground">
                  What do you want to practice today?
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter a subject or topic, and Eous will generate custom exercises for you.
                </p>

                <div className="mb-6">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Quantum Physics, World War II, French Grammar..."
                    className="w-full h-11 bg-background/50 border border-border/40 rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep('quiz')}
                    disabled={!topic.trim()}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    Generate Quiz
                  </Button>
                </div>
              </>
            ) : (
              /* Step 2: Quiz */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-bold uppercase text-purple-600">
                    Topic: {topic} ({currentQuestionIdx + 1} of {mockQuestions.length})
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-6 text-foreground">
                  {currentQuestion.question}
                </h2>

                {/* MCQ Options */}
                {currentQuestion.type === 'mcq' && (
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {currentQuestion.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !submitted && setUserAnswer(option)}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          userAnswer === option
                            ? 'border-purple-500 bg-purple-500/10 text-foreground'
                            : 'border-border/40 bg-background/50 hover:bg-muted text-muted-foreground'
                        } ${
                          submitted && option === currentQuestion.answer
                            ? 'border-green-500 bg-green-500/10 text-green-600'
                            : ''
                        } ${
                          submitted && userAnswer === option && option !== currentQuestion.answer
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
                {(currentQuestion.type === 'fill_in_the_blank' || currentQuestion.type === 'short_answer') && (
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
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  {!submitted ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!userAnswer.trim()}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      {currentQuestionIdx < mockQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          /* Quiz Results */
          <div className="text-center py-6">
            <div className="h-16 w-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-6">
              You scored {score} out of {mockQuestions.length} on the topic: <strong>{topic}</strong>
            </p>
            
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setQuizCompleted(false);
                  setCurrentQuestionIdx(0);
                  setScore(0);
                  setUserAnswer('');
                  setSubmitted(false);
                  setStep('setup');
                  setTopic('');
                }}
                variant="outline"
                className="rounded-xl"
              >
                New Quiz
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setStep('setup');
                  setTopic('');
                  setCurrentQuestionIdx(0);
                  setScore(0);
                  setQuizCompleted(false);
                  setUserAnswer('');
                  setSubmitted(false);
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
