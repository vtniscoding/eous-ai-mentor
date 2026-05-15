import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, School, BookOpen } from 'lucide-react';

interface EducationLevelStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function EducationLevelStep({ value, onChange }: EducationLevelStepProps) {
  const levels = [
    { id: 'middle_school', name: 'Middle School', icon: School, description: 'Basic concepts & fundamentals' },
    { id: 'high_school', name: 'High School', icon: BookOpen, description: 'Intermediate topics & preparation' },
    { id: 'university', name: 'University', icon: GraduationCap, description: 'Advanced research & deep dives' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-xl font-semibold">What is your education level?</h3>
        <p className="text-sm text-muted-foreground">This helps us tailor the explanations to your level.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {levels.map((level) => {
          const Icon = level.icon;
          const isSelected = value === level.id;
          return (
            <Card
              key={level.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${
                isSelected 
                  ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 shadow-purple-500/10' 
                  : 'border-border/40 hover:border-purple-300 dark:hover:border-purple-700 bg-background/50'
              }`}
              onClick={() => onChange(level.id)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-3 text-center">
                <div className={`p-3 rounded-2xl transition-colors ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold block">{level.name}</span>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
