import { useState } from 'react';
import { EducationLevelStep } from './EducationLevelStep';
import { SubjectsStep } from './SubjectsStep';
import { ExplanationStyleStep } from './ExplanationStyleStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    educationLevel: '',
    subjects: [] as string[],
    explanationStyle: '',
  });
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const updateData = (newData: Partial<typeof data>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          education_level: data.educationLevel,
          subjects: data.subjects,
          explanation_style: data.explanationStyle,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Onboarding completed!');
        await refreshProfile();
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      
      <Card className="w-full max-w-2xl mx-auto border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-purple-500/5 flex flex-col max-h-[85vh]">
        <CardHeader className="space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Personalize Your Experience</CardTitle>
            <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              Step {step} of 3
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-2 h-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="py-6 overflow-y-auto flex-1">
          {step === 1 && (
            <EducationLevelStep
              value={data.educationLevel}
              onChange={(val) => updateData({ educationLevel: val })}
            />
          )}
          {step === 2 && (
            <SubjectsStep
              value={data.subjects}
              onChange={(val) => updateData({ subjects: val })}
            />
          )}
          {step === 3 && (
            <ExplanationStyleStep
              value={data.explanationStyle}
              onChange={(val) => updateData({ explanationStyle: val })}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/40 pt-6 flex-shrink-0">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="transition-all"
          >
            Back
          </Button>
          {step < 3 ? (
            <Button 
              onClick={nextStep} 
              disabled={!isStepValid(step, data)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={completeOnboarding} 
              disabled={!isStepValid(step, data)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
            >
              Finish
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function isStepValid(step: number, data: any) {
  if (step === 1) return !!data.educationLevel;
  if (step === 2) return data.subjects.length > 0;
  if (step === 3) return !!data.explanationStyle;
  return false;
}
