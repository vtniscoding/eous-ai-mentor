import zxcvbn from 'zxcvbn';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const result = zxcvbn(password);
  const score = password ? result.score : -1;

  const getScoreColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  const getScoreText = (score: number) => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Enter password';
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={score >= 3 ? "text-green-500" : "text-muted-foreground"}>
          {getScoreText(score)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-colors ${
              index <= score ? getScoreColor(score) : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {result.feedback.suggestions.length > 0 && password && (
        <p className="text-xs text-muted-foreground mt-1">
          {result.feedback.suggestions[0]}
        </p>
      )}
    </div>
  );
}
