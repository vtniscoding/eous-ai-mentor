import { Sparkles, Bookmark } from "lucide-react";

interface DashboardProps {
  stats: {
    totalQueries: number;
    libraryItems: number;
    streak: number;
    studyTime: number;
    level: number;
    xp: number;
    subjectFocus: { math: number; it: number; science: number };
    quizzes: any[];
  };
}

export function Dashboard({
  stats,
}: DashboardProps) {
  const totalSubjects = stats.subjectFocus.math + stats.subjectFocus.it +
      stats.subjectFocus.science || 1;
  const mathPct = Math.round((stats.subjectFocus.math / totalSubjects) * 100);
  const itPct = Math.round((stats.subjectFocus.it / totalSubjects) * 100);
  const sciencePct = Math.round(
    (stats.subjectFocus.science / totalSubjects) * 100,
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background to-card/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Welcome Back, Student! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is your learning progress for this week.
          </p>
        </div>
        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 font-bold text-sm border border-purple-500/20 whitespace-nowrap self-start sm:self-auto">
          🚀 Keep it up!
        </div>
      </div>

      {/* Level & XP Card */}
      <div className="bg-card/50 border border-border/40 rounded-2xl p-6 shadow-xl shadow-purple-500/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs uppercase font-bold text-purple-600">
              Current Level
            </span>
            <h2 className="text-2xl font-bold text-foreground">
              Level {stats.level}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-muted-foreground">
              Total XP
            </span>
            <p className="text-2xl font-bold text-foreground">
              {stats.xp}{" "}
              <span className="text-muted-foreground text-sm">/ 100</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000 shadow-lg shadow-purple-500/30"
            style={{ width: `${stats.xp}%` }}
          />
          {/* Glow effect */}
          <div
            className="absolute top-0 left-0 h-full w-4 bg-white/30 blur-sm"
            style={{ left: `calc(${stats.xp}% - 10px)` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          🔥 {100 - stats.xp} XP to reach Level{" "}
          {stats.level + 1}! Keep asking questions to level up.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-card/50 border border-border/40 p-5 rounded-xl hover:bg-card/80 transition-all hover:scale-[1.02] cursor-pointer group">
          <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Study Streak</div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats.streak} Days
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-card/50 border border-border/40 p-5 rounded-xl hover:bg-card/80 transition-all hover:scale-[1.02] cursor-pointer group">
          <div className="h-10 w-10 flex items-center justify-center">
            <img src="/app_icon.svg" alt="Queries" className="h-6 w-6" />
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Total Queries</div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats.totalQueries}
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-card/50 border border-border/40 p-5 rounded-xl hover:bg-card/80 transition-all hover:scale-[1.02] cursor-pointer group">
          <div className="h-10 w-10 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
            <Bookmark className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Library Items</div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats.libraryItems}
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-card/50 border border-border/40 p-5 rounded-xl hover:bg-card/80 transition-all hover:scale-[1.02] cursor-pointer group">
          <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Est. Study Time</div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats.studyTime} hrs
            </div>
          </div>
        </div>
      </div>

      {/* Subject Focus & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Focus */}
        <div className="bg-card/50 border border-border/40 p-6 rounded-2xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <div className="h-2 w-2 bg-purple-600 rounded-full" /> Subject
            Focus
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Math</span>
                <span className="font-bold">{mathPct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${mathPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>IT / Programming</span>
                <span className="font-bold">{itPct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${itPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Science</span>
                <span className="font-bold">{sciencePct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-600 rounded-full"
                  style={{ width: `${sciencePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-card/50 border border-border/40 p-6 rounded-2xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <div className="h-2 w-2 bg-purple-600 rounded-full" /> Unlocked
            Badges
          </h3>
          <div className="flex flex-wrap gap-3">
            {/* Badge 1: 5 Day Streak */}
            <div
              className="relative h-12 w-12 flex items-center justify-center"
              title={`5 Day Streak (${stats.streak}/5)`}
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-muted/30"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-orange-500"
                  strokeWidth="2"
                  strokeDasharray="100.5"
                  strokeDashoffset={
                    100.5 * (1 - Math.min(stats.streak / 5, 1))
                  }
                />
              </svg>
              <div
                className={`h-10 w-10 ${
                  stats.streak >= 5
                    ? "bg-orange-100 dark:bg-orange-900/50"
                    : "bg-muted/50"
                } rounded-full flex items-center justify-center text-white`}
              >
                {stats.streak >= 5 ? "🏅" : "🔥"}
              </div>
            </div>

            {/* Badge 2: Folder Master */}
            <div
              className="relative h-12 w-12 flex items-center justify-center"
              title={`Folder Master (${stats.libraryItems}/5)`}
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-muted/30"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="2"
                  strokeDasharray="100.5"
                  strokeDashoffset={
                    100.5 * (1 - Math.min(stats.libraryItems / 5, 1))
                  }
                />
              </svg>
              <div
                className={`h-10 w-10 ${
                  stats.libraryItems >= 5
                    ? "bg-emerald-100 dark:bg-emerald-900/50"
                    : "bg-muted/50"
                } rounded-full flex items-center justify-center text-white`}
              >
                {stats.libraryItems >= 5 ? "🎖️" : "📁"}
              </div>
            </div>

            {/* Badge 3: Ask 50 Questions */}
            <div
              className="relative h-12 w-12 flex items-center justify-center"
              title={`Ask 50 Questions (${stats.totalQueries}/50)`}
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-muted/30"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-blue-600"
                  strokeWidth="2"
                  strokeDasharray="100.5"
                  strokeDashoffset={
                    100.5 * (1 - Math.min(stats.totalQueries / 50, 1))
                  }
                />
              </svg>
              <div
                className={`h-10 w-10 ${
                  stats.totalQueries >= 50
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "bg-muted/50"
                } rounded-full flex items-center justify-center text-white`}
              >
                {stats.totalQueries >= 50 ? "🥇" : "🎯"}
              </div>
            </div>

            {/* Badge 4: Quiz Master */}
            <div
              className="relative h-12 w-12 flex items-center justify-center"
              title={`Quiz Master (${stats.quizzes.length}/5)`}
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-muted/30"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-purple-600"
                  strokeWidth="2"
                  strokeDasharray="100.5"
                  strokeDashoffset={
                    100.5 * (1 - Math.min(stats.quizzes.length / 5, 1))
                  }
                />
              </svg>
              <div
                className={`h-10 w-10 ${
                  stats.quizzes.length >= 5
                    ? "bg-purple-100 dark:bg-purple-900/50"
                    : "bg-muted/50"
                } rounded-full flex items-center justify-center text-white`}
              >
                {stats.quizzes.length >= 5 ? "🏆" : "🎓"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quizzes Progress */}
      <div className="bg-card/50 border border-border/40 p-6 rounded-2xl mt-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <div className="h-2 w-2 bg-purple-600 rounded-full" /> Recent Quiz
          Performance
        </h3>
        {stats.quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No quizzes completed yet. Go to the Quiz tool to start!
          </p>
        ) : (
          <div className="space-y-4">
            {stats.quizzes.map((quiz: any) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between bg-background/30 p-4 rounded-xl border border-border/20"
              >
                <div>
                  <p className="font-medium text-foreground capitalize">
                    {quiz.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-purple-600">
                    {quiz.score}/{quiz.total_questions}
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                      style={{
                        width: `${(quiz.score / quiz.total_questions) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
