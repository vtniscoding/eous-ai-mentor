import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

function App() {
  // Remove global back button listener to allow component-specific handling
  useEffect(() => {
    // No-op here, handled in components
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <OnboardingFlow />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireOnboarding={true}>
                  <ChatContainer />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
