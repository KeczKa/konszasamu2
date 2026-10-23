import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { LanguageProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import AboutHistory from "@/pages/AboutHistory";
import NewsList from "@/pages/NewsList";
import NewsDetail from "@/pages/NewsDetail";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AuthCallback from "@/pages/AuthCallback";

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // OAuth return lands here with #session_id=... — process it before any route renders.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/despre" element={<AboutHistory />} />
      <Route path="/noutati" element={<NewsList />} />
      <Route path="/noutati/:id" element={<NewsDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
      <Toaster />
    </LanguageProvider>
  );
}
