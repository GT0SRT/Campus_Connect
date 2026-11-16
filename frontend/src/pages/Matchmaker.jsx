import TalentCard from "../components/matchmaker/TalentCard";
import { useMatchmakerController } from "../hooks/useMatchmakerController";
import { useUserStore } from "../store/useUserStore";
import { ChevronLeft, ChevronRight, RotateCcw, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateConnectionMessage, sendConnectionRequest } from "../services/squadService";

const BRANCH_KEYWORDS = [
  "my branch",
  "same branch",
  "from my branch",
  "my department",
  "same department",
  "my stream",
  "same stream",
  "my major",
  "same major",
];

const CAMPUS_KEYWORDS = [
  "my college",
  "same college",
  "my campus",
  "same campus",
  "from my college",
  "from my campus",
  "my clg",
  "same clg",
];

const INTERESTS_KEYWORDS = [
  "same interests",
  "my interests",
  "similar interests",
  "with my interests",
];

const SKILLS_KEYWORDS = [
  "same skills",
  "my skills",
  "similar skills",
  "with my skills",
];

const FILTER_STOP_WORDS = new Set([
  "find",
  "me",
  "a",
  "an",
  "the",
  "for",
  "to",
  "from",
  "my",
  "same",
  "teammate",
  "teammate",
  "team",
  "mate",
  "with",
  "of",
  "and",
  "or",
  "in",
  "on",
  "is",
  "it",
  "branch",
  "college",
  "campus",
  "clg",
  "department",
  "major",
  "stream",
  "interests",
  "interest",
  "skills",
  "skill",
]);

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseFilterIntent = (rawText = "") => {
  const normalized = normalizeText(rawText);

  const requiresSameBranch = BRANCH_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const requiresSameCampus = CAMPUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const requiresSameInterests = INTERESTS_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const requiresSameSkills = SKILLS_KEYWORDS.some((keyword) => normalized.includes(keyword));

  const keywords = normalized
    .split(" ")
    .filter((token) => token.length > 1 && !FILTER_STOP_WORDS.has(token));

  return {
    requiresSameBranch,
    requiresSameCampus,
    requiresSameInterests,
    requiresSameSkills,
    keywords,
  };
};

const getMyBranch = (currentUser) => {
  const direct = String(currentUser?.branch || currentUser?.headline || "").trim();
  if (direct) return direct;

  const education = Array.isArray(currentUser?.education) ? currentUser.education : [];
  const latest = education.find((entry) => String(entry?.branch || "").trim().length > 0);
  return String(latest?.branch || "").trim();
};

const getMyCampus = (currentUser) => {
  const direct = String(currentUser?.campus || currentUser?.collegeName || "").trim();
  if (direct) return direct;

  const education = Array.isArray(currentUser?.education) ? currentUser.education : [];
  const latest = education.find((entry) => String(entry?.collegeName || "").trim().length > 0);
  return String(latest?.collegeName || "").trim();
};

export default function Matchmaker() {
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const isDark = theme === "dark";
  const [filterInput, setFilterInput] = useState("");
  const [manualFilters, setManualFilters] = useState({
    sameBranch: false,
    sameCampus: false,
    sameInterests: false,
    sameSkills: false,
  });
  const [intentFilters, setIntentFilters] = useState({
    sameBranch: false,
    sameCampus: false,
    sameInterests: false,
    sameSkills: false,
    keywords: [],
  });
  const [connectState, setConnectState] = useState({
    isOpen: false,
    target: null,
    message: "",
    isGenerating: false,
    isSending: false,
  });
  const [connectNotice, setConnectNotice] = useState(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const {
    matches,
    handleSwipe,
    handleSkip,
    handleConnect,
    lastAction,
  } = useMatchmakerController();

  const toUsername = (name = "") =>
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._]/g, "") || "campususer";

  const myBranch = useMemo(() => normalizeText(getMyBranch(user)), [user]);
  const myCampus = useMemo(() => normalizeText(getMyCampus(user)), [user]);

  const effectiveFilters = useMemo(() => {
    const parsedFromInput = parseFilterIntent(filterInput);

    return {
      sameBranch:
        manualFilters.sameBranch || intentFilters.sameBranch || parsedFromInput.requiresSameBranch,
      sameCampus:
        manualFilters.sameCampus || intentFilters.sameCampus || parsedFromInput.requiresSameCampus,
      sameInterests:
        manualFilters.sameInterests ||
        intentFilters.sameInterests ||
        parsedFromInput.requiresSameInterests,
      sameSkills:
        manualFilters.sameSkills || intentFilters.sameSkills || parsedFromInput.requiresSameSkills,
      keywords:
        intentFilters.keywords.length > 0 ? intentFilters.keywords : parsedFromInput.keywords,
    };
  }, [filterInput, intentFilters, manualFilters]);

  const visibleMatches = useMemo(() => {
    return matches
      .map((candidate) => {
        const candidateBranch = normalizeText(candidate?.branch || "");
        const candidateCampus = normalizeText(candidate?.campus || "");
        const commonInterestsCount = Array.isArray(candidate?.commonInterests)
          ? candidate.commonInterests.length
          : 0;
        const commonSkillsCount = Array.isArray(candidate?.commonSkills)
          ? candidate.commonSkills.length
          : 0;

        if (effectiveFilters.sameBranch && myBranch) {
          const branchMatches =
            candidateBranch.includes(myBranch) ||
            myBranch.includes(candidateBranch) ||
            (candidateBranch.includes("cse") && myBranch.includes("cse"));
          if (!branchMatches) return null;
        }

        if (effectiveFilters.sameCampus && myCampus) {
          const campusMatches =
            candidateCampus.includes(myCampus) ||
            myCampus.includes(candidateCampus) ||
            (candidateCampus.includes("rgpv") && myCampus.includes("rgpv"));
          if (!campusMatches) return null;
        }

        if (effectiveFilters.sameInterests && commonInterestsCount === 0) {
          return null;
        }

        if (effectiveFilters.sameSkills && commonSkillsCount === 0) {
          return null;
        }

        if (!effectiveFilters.keywords.length) {
          return { candidate, matchRank: 0 };
        }

        const searchText = normalizeText(
          [
            candidate.name,
            candidate.branch,
            candidate.campus,
            candidate.bio,
            ...(candidate.skills || []),
            ...(candidate.interests || []),
            ...(candidate.lookingFor || []),
          ].join(" ")
        );

        const matchedTokens = effectiveFilters.keywords.filter((token) =>
          searchText.includes(token)
        );

        if (matchedTokens.length === 0) {
          return null;
        }

        return { candidate, matchRank: matchedTokens.length };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchRank - a.matchRank)
      .map((item) => item.candidate);
  }, [effectiveFilters, matches, myBranch, myCampus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveFilters]);

  const totalPages = Math.ceil(visibleMatches.length / ITEMS_PER_PAGE) || 1;
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleMatches, currentPage]);

  const openConnectModal = async (candidate) => {
    setConnectNotice(null);
    setConnectState({
      isOpen: true,
      target: candidate,
      message: "",
      isGenerating: true,
      isSending: false,
    });

    try {
      const aiText = await generateConnectionMessage({
        myName: user?.name || user?.username,
        theirName: candidate?.name || candidate?.username,
        context: `${candidate?.branch || ""} ${candidate?.campus || ""}`.trim(),
      });

      setConnectState((prev) => {
        if (!prev.isOpen || prev?.target?.uid !== candidate?.uid) {
          return prev;
        }

        return {
          ...prev,
          message: String(aiText || "").trim(),
          isGenerating: false,
        };
      });
    } catch {
      setConnectState((prev) => {
        if (!prev.isOpen || prev?.target?.uid !== candidate?.uid) {
          return prev;
        }

        return {
          ...prev,
          message: `Hey ${candidate?.name || candidate?.username || "there"}, your profile stood out. Want to connect and explore a collaboration opportunity together?`,
          isGenerating: false,
        };
      });
    }
  };

  const closeConnectModal = () => {
    setConnectState({
      isOpen: false,
      target: null,
      message: "",
      isGenerating: false,
      isSending: false,
    });
  };

  const confirmConnect = async () => {
    const target = connectState.target;
    if (!target || connectState.isSending) return;

    const finalText = String(connectState.message || "").trim();
    if (!finalText) {
      setConnectNotice({
        type: "error",
        text: "Please enter a connection message before sending.",
      });
      return;
    }

    setConnectState((prev) => ({ ...prev, isSending: true }));

    try {
      await sendConnectionRequest({
        targetUserId: target.uid,
        text: finalText,
      });

      handleConnect(target.uid);
      closeConnectModal();
      setConnectNotice({
        type: "success",
        text: `Connection request sent to @${target.username || toUsername(target.name)}.`,
      });
    } catch (error) {
      setConnectState((prev) => ({ ...prev, isSending: false }));
      setConnectNotice({
        type: "error",
        text:
          error?.response?.data?.error ||
          error?.message ||
          "Failed to send connection request.",
      });
    }
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    if (!filterInput.trim()) return;

    // Try AI matchmaker-filters first
    setAiSearchLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/ai/matchmaker-filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: filterInput }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const sf = data.filters?.scoring_filters || data.scoring_filters || {};
        const strict = data.filters?.strict_filters || data.strict_filters || {};
        const aiKeywords = [
          ...(sf.skills_any || []),
          ...(sf.interests_any || []),
          ...(sf.keywords_any || []),
        ].map((k) => normalizeText(k)).filter(Boolean);
        setIntentFilters({
          sameBranch: !!strict.same_branch,
          sameCampus: !!strict.same_campus,
          sameInterests: false,
          sameSkills: false,
          keywords: aiKeywords.length ? aiKeywords : parseFilterIntent(filterInput).keywords,
        });
        setAiSearchLoading(false);
        return;
      }
    } catch (_) { /* fall through */ }

    // Fallback: local keyword parsing
    const parsed = parseFilterIntent(filterInput);
    setIntentFilters({
      sameBranch: parsed.requiresSameBranch,
      sameCampus: parsed.requiresSameCampus,
      sameInterests: parsed.requiresSameInterests,
      sameSkills: parsed.requiresSameSkills,
      keywords: parsed.keywords,
    });
    setAiSearchLoading(false);
  };

  return (
    <div className="space-y-4 pb-20 transition-colors bg-transparent px-2 md:px-3">

      {/* Header */}
      <div className="max-w-2xl mx-auto text-center">
        <h1 className={`text-2xl md:text-3xl font-bold mb-1 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
          Find Teammates
        </h1>
        <p className={`text-xs md:text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>
          Discover talent for projects, and then connect.
        </p>

        {lastAction ? (
          <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Last action: {lastAction}
          </p>
        ) : null}

        {connectNotice ? (
          <p
            className={`mt-2 text-xs font-medium ${connectNotice.type === "success"
              ? isDark
                ? "text-cyan-300"
                : "text-cyan-700"
              : isDark
                ? "text-red-300"
                : "text-red-700"
              }`}
          >
            {connectNotice.text}
          </p>
        ) : null}

      </div>

      <div
        className={`max-w-2xl mb-4 mx-auto rounded-2xl border backdrop-blur-xl p-3 md:p-4 ${isDark
          ? "border-slate-700/40 bg-slate-900/50"
          : "border-gray-200/50 bg-white/60"
          }`}
      >
        <form onSubmit={handleFilterSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className={`flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-gray-200 bg-white/70'}`}>
              <Sparkles className={`h-4 w-4 ${aiSearchLoading ? "animate-spin text-cyan-400" : "text-cyan-500"}`} />
              <input
                value={filterInput}
                onChange={(event) => setFilterInput(event.target.value)}
                disabled={aiSearchLoading}
                placeholder="e.g. find a React developer for a hackathon"
                className={`w-full bg-transparent outline-none text-sm ${isDark ? 'text-slate-100 placeholder:text-slate-400' : 'text-gray-800 placeholder:text-gray-500'}`}
              />
              <button
                type="submit"
                disabled={aiSearchLoading}
                aria-label="Send filter query"
                className={`inline-flex items-center rounded-xl cursor-pointer text-sm font-semibold transition ${aiSearchLoading ? "text-cyan-300 opacity-50 cursor-not-allowed" : "text-cyan-500"}`}
              >
                {aiSearchLoading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterInput("");
                setIntentFilters({
                  sameBranch: false,
                  sameCampus: false,
                  sameInterests: false,
                  sameSkills: false,
                  keywords: [],
                });
                setManualFilters({
                  sameBranch: false,
                  sameCampus: false,
                  sameInterests: false,
                  sameSkills: false,
                });
              }}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-3 text-sm font-semibold transition ${isDark
                ? "text-slate-300 border border-slate-700 hover:bg-slate-800"
                : "text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                setManualFilters((prev) => ({
                  ...prev,
                  sameBranch: !prev.sameBranch,
                }))
              }
              className={`rounded-full px-2.5 py-1 font-medium border transition ${effectiveFilters.sameBranch
                  ? isDark
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-cyan-100 text-cyan-700 border-cyan-200"
                  : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              Same Branch
            </button>
            <button
              type="button"
              onClick={() =>
                setManualFilters((prev) => ({
                  ...prev,
                  sameCampus: !prev.sameCampus,
                }))
              }
              className={`rounded-full px-2.5 py-1 font-medium border transition ${effectiveFilters.sameCampus
                  ? isDark
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-cyan-100 text-cyan-700 border-cyan-200"
                  : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              Same College
            </button>
            <button
              type="button"
              onClick={() =>
                setManualFilters((prev) => ({
                  ...prev,
                  sameInterests: !prev.sameInterests,
                }))
              }
              className={`rounded-full px-2.5 py-1 font-medium border transition ${effectiveFilters.sameInterests
                  ? isDark
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-cyan-100 text-cyan-700 border-cyan-200"
                  : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              Same Interests
            </button>
            <button
              type="button"
              onClick={() =>
                setManualFilters((prev) => ({
                  ...prev,
                  sameSkills: !prev.sameSkills,
                }))
              }
              className={`rounded-full px-2.5 py-1 font-medium border transition ${effectiveFilters.sameSkills
                  ? isDark
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-cyan-100 text-cyan-700 border-cyan-200"
                  : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
            >
              Same Skills
            </button>
            <span className={`rounded-full px-2.5 py-1 font-medium border ${isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
              Try: "React developer for hackathon"
            </span>
          </div>
        </form>
      </div>

      {/* LinkedIn-style Profile Grid */}
      <div className="max-w-6xl mx-auto pb-8">
        {aiSearchLoading ? (
          <div className={`flex flex-col items-center justify-center py-16 gap-3 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            <Sparkles className="h-6 w-6 animate-pulse text-cyan-500" />
            <p className="text-sm">AI is finding your best matches…</p>
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center ${isDark ? "border-slate-700/40 bg-slate-900/50 text-slate-400" : "border-gray-200 bg-white/60 text-gray-500"}`}>
            <p className="text-base font-medium mb-1">No matches found</p>
            <p className="text-sm">Try clearing filters or adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginatedMatches.map((candidate) => (
                <TalentCard
                  key={candidate.uid}
                  u={candidate}
                  onConnect={() => openConnectModal(candidate)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Showing <span className="font-semibold text-cyan-600 dark:text-cyan-400">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{Math.min(currentPage * ITEMS_PER_PAGE, visibleMatches.length)}</span> of{" "}
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{visibleMatches.length}</span> candidates
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      currentPage === 1
                        ? "opacity-40 cursor-not-allowed border-transparent"
                        : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                        currentPage === pg
                          ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                          : isDark
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      currentPage === totalPages
                        ? "opacity-40 cursor-not-allowed border-transparent"
                        : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {connectState.isOpen && connectState.target ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 backdrop-blur-xl ${isDark
              ? "border-slate-700 bg-slate-900/95"
              : "border-gray-200 bg-white/95"
              }`}
          >
            <h2 className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
              Connect with {connectState.target.name}
            </h2>
            <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-neutral-600"}`}>
              Add a short message to send your connection request.
            </p>

            <div className="mt-4">
              <label className={`mb-1 block text-xs font-medium ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                Message
              </label>
              <textarea
                value={connectState.message}
                onChange={(event) =>
                  setConnectState((prev) => ({ ...prev, message: event.target.value }))
                }
                rows={4}
                placeholder={connectState.isGenerating ? "Generating AI suggestion..." : "Write your connection message"}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark
                  ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400"
                  : "border-gray-300 bg-white text-neutral-900 placeholder:text-gray-400"
                  }`}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeConnectModal}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${isDark
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-gray-300 text-neutral-700 hover:bg-gray-100"
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmConnect}
                disabled={connectState.isGenerating || connectState.isSending}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDark
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  : "bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  }`}
              >
                {connectState.isSending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}