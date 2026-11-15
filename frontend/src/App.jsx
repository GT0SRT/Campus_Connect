import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import PrivateRoute from "./components/PrivateRoute";
import MainLayout from "./layout/MainLayout";

// Lazy Pages
const Home = lazy(() => import("./pages/Home"));
const Threads = lazy(() => import("./pages/Threads"));
const Profile = lazy(() => import("./pages/Profile"));
const Matchmaker = lazy(() => import("./pages/Matchmaker"));
const ThreadView = lazy(() => import("./pages/ThreadView"));
const Settings = lazy(() => import("./pages/Settings"));
const Squad = lazy(() => import("./pages/squad"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Main Authenticated Layout */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/home" element={<Suspense fallback={null}><Home /></Suspense>} />
        <Route path="/threads" element={<Suspense fallback={null}><Threads /></Suspense>} />
        <Route path="/threads/:thread_id" element={<Suspense fallback={<PageLoader />}><ThreadView /></Suspense>} />
        <Route path="/matchmaker" element={<Suspense fallback={<PageLoader />}><Matchmaker /></Suspense>} />
        <Route path="/squad" element={<Suspense fallback={<PageLoader />}><Squad /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/profile/:username" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default App;