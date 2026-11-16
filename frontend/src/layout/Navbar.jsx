import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { Plus, Handshake, Menu, Sun, Moon } from "lucide-react";
import Sidebar from "./Sidebar";
import { searchGlobal } from "../services/searchService";

// Lazy load modal to reduce initial bundle size
const CreateModal = lazy(() => import("../components/modals/CreateModal"));

export default function Navbar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], threads: [] });
  const searchContainerRef = useRef(null);
  const theme = useUserStore((state) => state.theme);
  const toggleTheme = useUserStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  useEffect(() => {
    const query = String(searchQuery || "").trim();

    if (!query) {
      setSearchResults({ users: [], posts: [], threads: [] });
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await searchGlobal(query);
        if (!cancelled) {
          setSearchResults({
            users: response.users || [],
            posts: response.posts || [],
            threads: response.threads || [],
          });
        }
      } catch (_) {
        if (!cancelled) {
          setSearchResults({ users: [], posts: [], threads: [] });
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const closeSearchDropdown = () => {
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = String(searchQuery || "").trim();
    if (!query) return;

    if (query.startsWith("@")) {
      const rawUsername = query.slice(1).trim();
      if (rawUsername) {
        const normalized = rawUsername.toLowerCase();
        const users = searchResults.users || [];
        const exact = users.find((item) => String(item.username || "").toLowerCase() === normalized);
        const prefix = users.find((item) => String(item.username || "").toLowerCase().startsWith(normalized));
        const targetUsername = exact?.username || prefix?.username || rawUsername;

        navigate(`/profile/${encodeURIComponent(targetUsername)}`);
        closeSearchDropdown();
      }
      return;
    }

    navigate(`/home?q=${encodeURIComponent(query)}`);
    closeSearchDropdown();
  };

  const handlePickUser = (username) => {
    if (!username) return;
    navigate(`/profile/${encodeURIComponent(username)}`);
    closeSearchDropdown();
  };

  const handlePickPost = (caption) => {
    const query = String(caption || "").trim() || String(searchQuery || "").trim();
    if (!query) return;
    navigate(`/home?q=${encodeURIComponent(query)}`);
    closeSearchDropdown();
  };

  const handlePickThread = (threadId) => {
    if (!threadId) return;
    navigate(`/threads/${threadId}`);
    closeSearchDropdown();
  };

  const hasSearchQuery = Boolean(String(searchQuery || "").trim());
  const hasSearchResults =
    (searchResults.users?.length || 0) +
    (searchResults.posts?.length || 0) +
    (searchResults.threads?.length || 0) >
    0;

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${theme === "dark"
        ? "glass-surface shadow-lg shadow-cyan-500/5"
        : "glass-surface shadow-md shadow-gray-400/5"
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">

          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle navigation menu"
              className={`md:hidden p-2 rounded-lg transition ${theme === 'dark'
                ? 'text-slate-300 hover:bg-slate-800/60'
                : 'text-gray-600 hover:bg-gray-100/60'
                }`}
            >
              <Menu size={24} />
            </button>

            <div className={`flex items-center gap-2 font-semibold shrink-0 transition-all ${
              theme === "dark" ? "text-slate-50" : "text-slate-900"
            }`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 transition-transform hover:scale-110 shadow-lg shadow-cyan-500/20">
                <Handshake className="h-5 w-5 text-slate-50" />
              </div>
              <span className="hidden sm:inline whitespace-nowrap text-lg font-bold tracking-tight">Campus Connect</span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl mx-2 relative">
            <form onSubmit={handleSearchSubmit}>
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className={`
                  w-full
                  rounded-full
                  px-4 py-2 text-sm outline-none
                  transition-all
                  ${theme === "dark"
                    ? "bg-slate-800/60 text-slate-50 placeholder-slate-400 border border-slate-700/50 focus:border-cyan-500/50 focus:bg-slate-800/80"
                    : "bg-gray-100/60 text-slate-900 placeholder:text-gray-500 border border-gray-200/50 focus:border-cyan-500/50 focus:bg-gray-100/80"}
                `}
                placeholder="Search posts, threads, or @username..."
              />
            </form>

            {isSearchOpen && hasSearchQuery && (
              <div
                className={`absolute left-0 right-0 mt-2 rounded-2xl border backdrop-blur-xl max-h-96 overflow-y-auto z-50 ${theme === "dark"
                  ? "bg-slate-900/95 border-slate-700/50"
                  : "bg-white/95 border-gray-200/70"
                  }`}
              >
                {isSearching ? (
                  <p className={`px-4 py-3 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                    Searching...
                  </p>
                ) : !hasSearchResults ? (
                  <p className={`px-4 py-3 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                    No results found.
                  </p>
                ) : (
                  <div className="py-2">
                    {(searchResults.users || []).map((user) => (
                      <button
                        key={`user-${user.id}`}
                        onClick={() => handlePickUser(user.username)}
                        className={`w-full text-left px-4 py-2 text-sm transition ${theme === "dark"
                          ? "text-slate-100 hover:bg-slate-800"
                          : "text-slate-900 hover:bg-gray-100"
                          }`}
                      >
                        @{user.username} {user.fullName ? `• ${user.fullName}` : ""}
                      </button>
                    ))}

                    {(searchResults.posts || []).map((post) => (
                      <button
                        key={`post-${post.id}`}
                        onClick={() => handlePickPost(post.caption)}
                        className={`w-full text-left px-4 py-2 text-sm transition ${theme === "dark"
                          ? "text-slate-100 hover:bg-slate-800"
                          : "text-slate-900 hover:bg-gray-100"
                          }`}
                      >
                        Post: {post.caption}
                      </button>
                    ))}

                    {(searchResults.threads || []).map((thread) => (
                      <button
                        key={`thread-${thread.id}`}
                        onClick={() => handlePickThread(thread.id)}
                        className={`w-full text-left px-4 py-2 text-sm transition ${theme === "dark"
                          ? "text-slate-100 hover:bg-slate-800"
                          : "text-slate-900 hover:bg-gray-100"
                          }`}
                      >
                        Thread: {thread.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Theme Toggle & Create Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className={`h-9 w-9 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 border ${
                theme === "dark"
                  ? "bg-slate-800/80 text-amber-400 hover:bg-slate-700 hover:text-amber-300 border-slate-700/60 shadow-sm"
                  : "bg-gray-100/90 text-slate-700 hover:bg-gray-200 hover:text-slate-900 border-gray-200/80 shadow-sm"
              }`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Create Button */}
            <button
              onClick={() => setIsCreateOpen(true)}
              aria-label="Create new post or thread"
              title="Create new post or thread"
              className="h-9 w-9 rounded-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white flex items-center justify-center cursor-pointer shadow-md shadow-cyan-500/20 hover:scale-105 transition-all shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Mobile Sidebar - Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 bottom-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <Sidebar onItemClick={() => setIsSidebarOpen(false)} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <Suspense fallback={null}>
          <CreateModal
            onClose={() => setIsCreateOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
