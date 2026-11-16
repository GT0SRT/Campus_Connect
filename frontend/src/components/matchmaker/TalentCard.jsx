import { useUserStore } from "../../store/useUserStore";
import { UserCircle2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TalentCard({ u, onSkip, onConnect, showActions = true }) {
  const theme = useUserStore((state) => state.theme);
  const isDark = theme === "dark";
  const [showImageFallback, setShowImageFallback] = useState(false);
  const navigate = useNavigate();

  const profileUsername = String(u?.username || u?.name || "campususer")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._]/g, "") || "campususer";

  const scorePct = Number.isFinite(Number(u?.matchScore))
    ? Math.max(0, Math.min(100, Math.round(Number(u.matchScore))))
    : Number(u?.compatibilityPercent ?? u?.score ?? 0);

  const matchReasons = Array.isArray(u?.matchReasons) && u.matchReasons.length > 0
    ? u.matchReasons
    : [];

  const skills = Array.isArray(u?.commonSkills) && u.commonSkills.length > 0
    ? u.commonSkills
    : Array.isArray(u?.skills) ? u.skills : [];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${
        isDark
          ? "bg-slate-900/90 border-slate-700/60 shadow-[0_4px_20px_rgba(2,6,23,0.3)]"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      {/* Top Banner Accent */}
      <div className="h-12 bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-indigo-500/20 relative px-3 flex items-center justify-end">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isDark
                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                : "bg-cyan-50 text-cyan-700 border border-cyan-200"
            }`}
          >
            {scorePct}% Match
          </span>
          {u.openToConnect && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full">
              Open
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pb-4 pt-0 -mt-6 flex flex-col flex-1">
        {/* Avatar */}
        <div className="mb-2">
          {u.profile_pic && !showImageFallback ? (
            <img
              src={u.profile_pic}
              alt={u.name}
              className={`w-12 h-12 rounded-full object-cover border-2 shadow-sm ${
                isDark ? "border-slate-900" : "border-white"
              }`}
              onError={() => setShowImageFallback(true)}
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm ${
                isDark
                  ? "border-slate-900 bg-slate-800 text-slate-300"
                  : "border-white bg-slate-100 text-slate-500"
              }`}
            >
              <UserCircle2 className="h-7 w-7" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0">
          <h3
            className={`text-sm font-bold truncate ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {u.name}
          </h3>
          <button
            type="button"
            onClick={() => navigate(`/profile/${profileUsername}`)}
            className={`text-xs hover:underline truncate block text-left font-medium ${
              isDark ? "text-cyan-400" : "text-cyan-600"
            }`}
          >
            @{profileUsername}
          </button>
          {(u.branch || u.campus) && (
            <p
              className={`text-xs truncate mt-0.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {[u.branch, u.campus].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Bio */}
        {u.bio && (
          <p
            className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {u.bio}
          </p>
        )}

        {/* Why Matched Badge */}
        {matchReasons.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {matchReasons.slice(0, 2).map((r, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isDark
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                ✓ {r}
              </span>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {skills.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                  isDark
                    ? "bg-slate-800 text-slate-300 border border-slate-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {s}
              </span>
            ))}
            {skills.length > 3 && (
              <span
                className={`text-[10px] px-1 py-0.5 rounded-md ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        {showActions && (
          <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {onSkip ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onSkip}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    isDark
                      ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={onConnect}
                  className="py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Connect</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm shadow-cyan-600/20 active:scale-[0.98]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Connect</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
