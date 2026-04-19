import { ThemeProvider } from 'next-themes';
import { Header } from './components/layout/header';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './router';
import { ChatbotWidget } from './components/chatbot/chatbot-widget';
import { useLocation } from 'react-router-dom';

function AppShell() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === '/' ||
    location.pathname.startsWith('/login') ||
    location.pathname === '/select' ||
    location.pathname.startsWith('/staff');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isAuthPage && <Header />}
      <Router />
      {!isAuthPage && <ChatbotWidget />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  );
}