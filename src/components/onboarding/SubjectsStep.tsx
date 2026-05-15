import { Badge } from '@/components/ui/badge';

interface SubjectsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SubjectsStep({ value, onChange }: SubjectsStepProps) {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'Computer Science', 'History', 'Geography', 'Literature', 
    'Economics', 'Art', 'Music'
  ];

  const toggleSubject = (subject: string) => {
    if (value.includes(subject)) {
      onChange(value.filter((s) => s !== subject));
    } else {
      onChange([...value, subject]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-xl font-semibold">What subjects are you interested in?</h3>
        <p className="text-sm text-muted-foreground">Select at least one subject. You can change this later.</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
        {subjects.map((subject) => {
          const isSelected = value.includes(subject);
          return (
            <Badge
              key={subject}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer text-sm py-2 px-4 rounded-full transition-all duration-200 ${
                isSelected 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/10 scale-[1.05]' 
                  : 'border-border/60 bg-background/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-500/5 hover:scale-[1.02]'
              }`}
              onClick={() => toggleSubject(subject)}
            >
              {subject}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
