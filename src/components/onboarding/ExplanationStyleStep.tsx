import { Card, CardContent } from '@/components/ui/card';
import { AlignLeft, ListOrdered, FileText } from 'lucide-react';

interface ExplanationStyleStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExplanationStyleStep({ value, onChange }: ExplanationStyleStepProps) {
  const styles = [
    { 
      id: 'short', 
      name: 'Short', 
      description: 'Quick, concise answers to the point. Best for quick reviews.',
      icon: AlignLeft 
    },
    { 
      id: 'detailed', 
      name: 'Detailed', 
      description: 'In-depth explanations with context, examples, and background.',
      icon: FileText 
    },
    { 
      id: 'step_by_step', 
      name: 'Step-by-Step', 
      description: 'Broken down into numbered steps with logical reasoning.',
      icon: ListOrdered 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-xl font-semibold">Preferred Explanation Style</h3>
        <p className="text-sm text-muted-foreground">How do you like the AI to explain concepts to you?</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {styles.map((style) => {
          const Icon = style.icon;
          const isSelected = value === style.id;
          return (
            <Card
              key={style.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                isSelected 
                  ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 shadow-purple-500/10' 
                  : 'border-border/40 hover:border-purple-300 dark:hover:border-purple-700 bg-background/50'
              }`}
              onClick={() => onChange(style.id)}
            >
              <CardContent className="flex items-center p-6 space-x-4">
                <div className={`p-3 rounded-xl transition-colors ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold block text-base">{style.name}</span>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border transition-all ${
                  isSelected ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground/30'
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-1" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
