import { useEffect, useState } from "react";
import { Flame, Sparkles, Info, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import api from "../services/api";

const FALLBACK_TAGS = [
  { tag: "hackathon", count: "Active" },
  { tag: "placements", count: "Active" },
  { tag: "webdev", count: "Active" },
];

export default function RightPanel() {
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [trendingTags, setTrendingTags] = useState(FALLBACK_TAGS);
  const [suggestedPeers, setSuggestedPeers] = useState([]);

  useEffect(() => {
    let active = true;

    const loadSidebarData = async () => {
      try {
        // 1. Fetch recent posts to extract real hashtags
        const postsRes = await api.get("/posts?limit=20");
        const postsList = postsRes?.data?.data || postsRes?.data?.posts || postsRes?.data || [];

        if (Array.isArray(postsList) && postsList.length > 0) {
          const tagCounts = {};
          postsList.forEach((post) => {
            const matches = String(post?.caption || "").match(/#[a-zA-Z0-9_]+/g) || [];
            matches.forEach((rawTag) => {
              const clean = rawTag.slice(1).toLowerCase();
              tagCounts[clean] = (tagCounts[clean] || 0) + 1;
            });
          });

          const sorted = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([tag, count]) => ({
              tag,
              count: `${count} ${count === 1 ? "post" : "posts"}`,
            }));

          if (active && sorted.length > 0) {
            setTrendingTags(sorted);
          }
        }
      } catch {
        // Keep fallback tags silently if API fails
      }

      try {
        // 2. Fetch real users for quick peer discovery
        const searchRes = await api.get("/search?q=a");
        const usersList = searchRes?.data?.users || searchRes?.data?.data?.users || [];
        if (active && Array.isArray(usersList)) {
          const filtered = usersList
            .filter((u) => u.username && u.username !== user?.username)
            .slice(0, 3);
          setSuggestedPeers(filtered);
        }
      } catch {
        // Ignore if unavailable
      }
    };

    loadSidebarData();
    return () => {
      active = false;
    };
  }, [user?.username]);

  return (
    <div className="space-y-4">
      {/* Dynamic Trending Tags */}
      <div className="glass-surface rounded-2xl p-4 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Trending on Campus
          </h3>
        </div>

        <ul className="space-y-2 text-sm">
          {trendingTags.map((item) => (
            <li
              key={item.tag}
              onClick={() => navigate(`/home?q=${encodeURIComponent(item.tag)}`)}
              className={`flex justify-between items-center px-3 py-2 rounded-lg transition-all cursor-pointer ${
                isDark
                  ? "hover:bg-slate-700/50 hover:border-cyan-500/30"
                  : "hover:bg-gray-100/50"
              }`}
            >
              <span className="text-cyan-500 dark:text-cyan-400 font-medium">
                #{item.tag}
              </span>
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dynamic Suggested Collaborators */}
      <div className="glass-surface rounded-2xl p-4 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <h3 className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Suggested Peers
            </h3>
          </div>
          <button
            onClick={() => navigate("/matchmaker")}
            className="text-xs font-medium text-cyan-500 hover:underline flex items-center gap-0.5"
          >
            Matchmaker <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {suggestedPeers.length > 0 ? (
          <div className="space-y-2.5">
            {suggestedPeers.map((peer) => (
              <div
                key={peer.id || peer.username}
                onClick={() => navigate(`/profile/${encodeURIComponent(peer.username)}`)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isDark
                    ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80"
                    : "bg-white/60 border-gray-200/60 hover:bg-white"
                }`}
              >
                <p className={`text-sm font-medium truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {peer.fullName || `@${peer.username}`}
                </p>
                <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  @{peer.username} {peer.collegeName ? `· ${peer.collegeName}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => navigate("/matchmaker")}
            className={`w-full p-3 rounded-xl border text-left transition-all ${
              isDark
                ? "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20"
                : "bg-cyan-50/70 border-cyan-200/70 hover:bg-cyan-100/70"
            }`}
          >
            <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Find Hackathon Teammates
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Use AI Matchmaker to discover peers by skills and branch.
            </p>
          </button>
        )}
      </div>

      {/* Dynamic Actionable Tip */}
      <div
        onClick={() =>
          navigate(user?.username ? `/profile/${encodeURIComponent(user.username)}` : "/matchmaker")
        }
        className="glass-surface rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:border-cyan-500/40"
      >
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-green-500" />
          <h3 className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Quick Tip
          </h3>
        </div>

        <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {!(user?.skills?.length > 0) ? (
            <>
              Add your <span className="font-medium text-cyan-500">technical skills</span> on your profile so AI Matchmaker can recommend you to squads.
            </>
          ) : (
            <>
              Click any <span className="font-medium text-cyan-500">#hashtag</span> above to filter live campus discussions instantly.
            </>
          )}
        </p>
      </div>
    </div>
  );
}