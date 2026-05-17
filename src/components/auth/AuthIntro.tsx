import { useState, useEffect } from "react";
import { Sparkles, MessageSquare, BookOpen, Brain } from "lucide-react";

interface AuthIntroProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function AuthIntro({ onLogin, onRegister }: AuthIntroProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Your Personal AI Mentor",
      description: "Works 24/7 with customized, step-by-step explanations tailored just for you.",
      icon: <MessageSquare className="h-5 w-5 text-purple-400" />,
      themeColor: "from-purple-500 to-indigo-500",
    },
    {
      title: "Tailored to Your Level",
      description: "Whether you are in Middle School, High School, or University, Eous adapts to you.",
      icon: <BookOpen className="h-5 w-5 text-blue-400" />,
      themeColor: "from-blue-500 to-indigo-500",
    },
    {
      title: "Active Recall Quizzes",
      description: "Test your skills with interactive flashcards and gamified subject tracking.",
      icon: <Brain className="h-5 w-5 text-pink-400" />,
      themeColor: "from-pink-500 to-rose-500",
    },
  ];

  // Auto-play the slider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full bg-black text-white flex flex-col justify-between p-6 overflow-hidden select-none">
      {/* Background radial gradient glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] bg-purple-900/15 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[50%] bg-indigo-900/15 rounded-full blur-[100px] -z-10" />

      {/* 1. Phone Frame Showcase */}
      <div className="flex-1 flex items-center justify-center min-h-0 py-4">
        {/* Device Wrapper */}
        <div className="relative w-[200px] h-[370px] rounded-[36px] border-[5px] border-[#2c2d30] bg-[#0c0d0e] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden rotate-[-4deg] transition-transform duration-500 hover:rotate-[0deg] hover:scale-[1.03]">
          {/* Dynamic Speaker Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[76px] h-[15px] bg-[#2c2d30] rounded-b-[12px] z-30 flex items-center justify-center">
            <div className="w-[24px] h-[2.5px] bg-black/40 rounded-full mb-1" />
          </div>

          {/* Phone Screen Canvas */}
          <div className="flex-1 relative flex flex-col pt-6 z-10 min-h-0">
            {/* Slide 1: AI Chat Vector Screen */}
            <div
              className={`absolute inset-0 pt-8 px-3 flex flex-col justify-between transition-all duration-700 ease-in-out ${
                activeSlide === 0
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 translate-y-8 scale-95 pointer-events-none"
              }`}
            >
              {/* Fake App Bar */}
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <img src="/app_icon.svg" className="h-6 w-6" alt="Eous" />
                <span className="text-[11px] font-bold text-white/90">Eous AI Mentor</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-semibold border border-purple-500/10">ACTIVE</span>
              </div>

              {/* Chat Interface Flow */}
              <div className="flex-1 flex flex-col gap-3 py-3 overflow-y-auto">
                <div className="self-end bg-purple-600 text-white rounded-[16px] rounded-tr-[4px] px-3 py-2 text-[10px] max-w-[85%] shadow-sm leading-relaxed animate-pulse">
                  Explain photosynthesis simply 🌿
                </div>
                <div className="self-start bg-[#1c1d20] border border-white/5 text-white/90 rounded-[16px] rounded-tl-[4px] px-3 py-2.5 text-[9px] max-w-[90%] shadow-sm leading-relaxed space-y-1.5">
                  <p className="font-semibold text-purple-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Eous AI Mentor:
                  </p>
                  <p>It's how plants eat light! ☀️</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-white/70">
                    <li>Drink water 💧</li>
                    <li>Catch sunlight ☀️</li>
                    <li>Make sugar for energy! ⚡</li>
                  </ol>
                </div>
              </div>

              {/* Fake Input Panel */}
              <div className="border-t border-white/5 py-2.5">
                <div className="h-7 w-full bg-[#18191b] rounded-full border border-white/10 px-3 flex items-center justify-between">
                  <span className="text-[8px] text-white/40">Ask your mentor anything...</span>
                  <div className="h-4 w-4 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">➔</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2: Dashboard/Level Vector Screen */}
            <div
              className={`absolute inset-0 pt-8 px-3 flex flex-col justify-between transition-all duration-700 ease-in-out ${
                activeSlide === 1
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 translate-y-8 scale-95 pointer-events-none"
              }`}
            >
              {/* Fake App Bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <img src="/app_icon.svg" className="h-6 w-6" alt="Eous" />
                  <span className="text-[11px] font-bold text-white/90">My Dashboard</span>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 flex flex-col justify-center gap-3.5 py-4">
                {/* Level Card */}
                <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/20 rounded-2xl p-3 text-center space-y-1">
                  <span className="text-[8px] text-blue-300 font-semibold tracking-wider uppercase">Active Study Level</span>
                  <h3 className="text-xs font-black text-white">University Student</h3>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-blue-500 rounded-full" />
                  </div>
                </div>

                {/* Grid of Subjects */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1c1d20] border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[52px]">
                    <span className="text-[18px]">📐</span>
                    <span className="text-[9px] font-bold">Calculus</span>
                  </div>
                  <div className="bg-[#1c1d20] border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[52px]">
                    <span className="text-[18px]">🧬</span>
                    <span className="text-[9px] font-bold">Biology</span>
                  </div>
                  <div className="bg-[#1c1d20] border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[52px]">
                    <span className="text-[18px]">⚛️</span>
                    <span className="text-[9px] font-bold">Physics</span>
                  </div>
                  <div className="bg-[#1c1d20] border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[52px]">
                    <span className="text-[18px]">🧠</span>
                    <span className="text-[9px] font-bold">Philosophy</span>
                  </div>
                </div>
              </div>

              <div className="h-6" />
            </div>

            {/* Slide 3: Active Recall Vector Screen */}
            <div
              className={`absolute inset-0 pt-8 px-3 flex flex-col justify-between transition-all duration-700 ease-in-out ${
                activeSlide === 2
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 translate-y-8 scale-95 pointer-events-none"
              }`}
            >
              {/* Fake App Bar */}
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <img src="/app_icon.svg" className="h-6 w-6" alt="Eous" />
                <span className="text-[11px] font-bold text-white/90">Flashcard Quiz</span>
              </div>

              {/* Flashcard / Quiz Content */}
              <div className="flex-1 flex flex-col justify-center gap-4 py-2">
                {/* Active Card Question */}
                <div className="bg-[#1c1d20] border-2 border-pink-500/30 rounded-2xl p-3.5 text-center shadow-lg min-h-[90px] flex flex-col justify-center">
                  <span className="text-[7px] text-pink-400 font-bold uppercase tracking-widest mb-1.5">Chemistry Quiz</span>
                  <h4 className="text-[10px] font-bold text-white">What is the chemical formula for water?</h4>
                </div>

                {/* Multiple Choices */}
                <div className="space-y-1.5">
                  <div className="h-7 bg-white/5 border border-white/5 rounded-lg px-2.5 flex items-center justify-between text-[8px] font-medium text-white/60">
                    <span>CO2 (Carbon Dioxide)</span>
                    <div className="h-3 w-3 rounded-full border border-white/20" />
                  </div>
                  <div className="h-7 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 flex items-center justify-between text-[8px] font-bold text-green-400">
                    <span>H2O (Dihydrogen Monoxide)</span>
                    <div className="h-3.5 w-3.5 bg-green-500 text-black rounded-full flex items-center justify-center text-[7px]">✓</div>
                  </div>
                  <div className="h-7 bg-white/5 border border-white/5 rounded-lg px-2.5 flex items-center justify-between text-[8px] font-medium text-white/60">
                    <span>NaCl (Sodium Chloride)</span>
                    <div className="h-3 w-3 rounded-full border border-white/20" />
                  </div>
                </div>
              </div>

              <div className="h-6" />
            </div>
          </div>

          {/* Anti-clip overlay edges */}
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#0c0d0e] to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#0c0d0e] to-transparent z-20 pointer-events-none" />
        </div>
      </div>

      {/* 2. Slide Dots Indicator */}
      <div className="flex justify-center gap-1.5 mb-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === index ? "w-5 bg-purple-500" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* 3. Branding & Interactive Copy */}
      <div className="text-center px-4 flex flex-col items-center mt-3 mb-6">
        {/* Brand Header */}
        <div className="flex items-center gap-1 mb-2">
          <h1 className="text-3xl font-black tracking-tight text-white">Eous</h1>
          <img src="/app_icon.svg" className="h-11 w-11" alt="Eous Logo" />
        </div>

        {/* Dynamic Caption with Fade Effect */}
        <div className="h-[60px] flex flex-col justify-center max-w-sm">
          <h2 className="text-base font-bold text-white mb-1 transition-all duration-500">
            {slides[activeSlide].title}
          </h2>
          <p className="text-xs text-white/60 leading-relaxed transition-all duration-500">
            {slides[activeSlide].description}
          </p>
        </div>
      </div>

      {/* 4. Action Buttons Footer */}
      <div className="flex flex-col gap-3.5 w-full items-center mx-auto mb-4">
        {/* Create Account Capsule Button */}
        <button
          onClick={onRegister}
          className="h-11 px-7 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-[15px] shadow-[0_4px_16px_rgba(104,86,230,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Create an Account
        </button>

        {/* Log In Secondary Text Button */}
        <button
          onClick={onLogin}
          className="text-sm font-bold text-white/80 hover:text-white transition-colors duration-200 py-1"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
