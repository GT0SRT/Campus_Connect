import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  UserMinus,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Users,
  MoreVertical,
  MessagesSquare,
  X,
} from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getConnectionRequests,
  getSquadState,
  respondConnectionRequest,
  saveSquadState,
  sendDirectMessage,
  getSquadMessages,
  postSquadMessageRest,
} from "../services/squadService";
import { getSquadSocket } from "../services/squadSocket";
import { Avatar } from "../components/squad/SquadShared";
import { cn, DEFAULT_SQUAD_ID, DEFAULT_SQUAD_NAME, LEGACY_DEFAULT_SQUAD_ID, toUsername } from "../utils/squadUtils";

export default function Squad() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const isDark = theme === "dark";

  const [squadsData, setSquadsData] = useState([]);
  const [expandedSquads, setExpandedSquads] = useState([]);
  const [isCreateSquadModalOpen, setIsCreateSquadModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState("");

  const [chatTarget, setChatTarget] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatByMemberId, setChatByMemberId] = useState({});
  const [readMessageCountByMemberId, setReadMessageCountByMemberId] = useState({});

  const [connectionRequests, setConnectionRequests] = useState([]);
  const [sentRequestsCount, setSentRequestsCount] = useState(0);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);

  const [moveState, setMoveState] = useState({ isOpen: false, fromSquadId: "", memberId: "", memberName: "", targetSquadId: "" });

  const [groupChatSquadId, setGroupChatSquadId] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const groupEndRef = useRef(null);

  const storageUserKey = user?.uid || user?.id || "demo-user";
  const squadStorageKey = useMemo(() => `campusconnect:squads:${storageUserKey}`, [storageUserKey]);
  const squadChatStorageKey = useMemo(() => `campusconnect:squad-chats:${storageUserKey}`, [storageUserKey]);
  const squadReadStorageKey = useMemo(() => `campusconnect:squad-read:${storageUserKey}`, [storageUserKey]);

  const normalizeSquads = (rawSquads) => {
    if (!Array.isArray(rawSquads)) return [];
    return rawSquads.map((squad) => {
      const rawId = String(squad?.id || `squad-${Date.now()}`);
      const id = rawId === LEGACY_DEFAULT_SQUAD_ID ? DEFAULT_SQUAD_ID : rawId;
      const name = id === DEFAULT_SQUAD_ID ? DEFAULT_SQUAD_NAME : String(squad?.name || "New Squad");
      return {
        id,
        name,
        color: squad?.color || "text-primary",
        bgColor: squad?.bgColor || "bg-cyan-500",
        members: Array.isArray(squad?.members)
          ? squad.members.map((member) => {
              const memberName = String(member?.name || "Campus User");
              const initials = memberName.split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase();
              return {
                id: String(member?.id || member?.uid || `member-${Date.now()}`),
                username: String(member?.username || "").trim(),
                name: memberName,
                avatar: member?.avatar || member?.profile_pic || "",
                initials: member?.initials || initials,
                role: member?.role || member?.branch || "Student",
                college: member?.college || member?.campus || "Campus",
                connectedVia: member?.connectedVia || "Matchmaker Connect",
                status: member?.status || "online",
              };
            })
          : [],
      };
    });
  };

  const normalizeChats = (rawChats) => {
    if (!rawChats || typeof rawChats !== "object" || Array.isArray(rawChats)) return {};
    const output = {};
    for (const [memberId, messages] of Object.entries(rawChats)) {
      if (!Array.isArray(messages)) continue;
      output[String(memberId)] = messages
        .map((msg) => {
          if (!msg || typeof msg !== "object") return null;
          const cleaned = String(msg.text || "").trim();
          if (!cleaned) return null;
          const senderId = String(msg.senderId || "").trim();
          const rawSender = String(msg.sender || "").trim().toLowerCase();
          const sender = rawSender === "me" || rawSender === "them" ? rawSender : senderId && senderId === storageUserKey ? "me" : "them";
          return {
            id: String(msg.id || `${memberId}-${Date.now()}`),
            text: cleaned,
            sender,
            senderId,
            receiverId: String(msg.receiverId || "").trim(),
            createdAt: String(msg.createdAt || ""),
            time: String(msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
          };
        })
        .filter(Boolean);
    }
    return output;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      let localSquads = [];
      let localChats = {};
      let localReadCounts = {};
      try { localSquads = normalizeSquads(JSON.parse(localStorage.getItem(squadStorageKey) || "[]")); } catch { localSquads = []; }
      try { localChats = normalizeChats(JSON.parse(localStorage.getItem(squadChatStorageKey) || "{}")); } catch { localChats = {}; }
      try {
        localReadCounts = JSON.parse(localStorage.getItem(squadReadStorageKey) || "{}");
        if (typeof localReadCounts !== "object" || Array.isArray(localReadCounts)) localReadCounts = {};
      } catch { localReadCounts = {}; }
      if (!active) return;
      setSquadsData(localSquads);
      setChatByMemberId(localChats);
      setReadMessageCountByMemberId(() => {
        const initial = {};
        for (const [memberId, messages] of Object.entries(localChats)) {
          const saved = Number(localReadCounts?.[memberId]);
          initial[memberId] = Number.isFinite(saved) && saved >= 0 ? saved : messages.length;
        }
        return initial;
      });
      if (localSquads.length > 0) setExpandedSquads((prev) => (prev.length ? prev : [localSquads[0].id]));
      try {
        const remote = await getSquadState();
        if (!active) return;
        const remoteSquads = normalizeSquads(remote?.squads || []);
        const remoteChats = normalizeChats(remote?.chatsByMemberId || {});
        if (remoteSquads.length > 0 || Object.keys(remoteChats).length > 0) {
          setSquadsData(remoteSquads);
          setChatByMemberId(remoteChats);
          setReadMessageCountByMemberId((prev) => {
            const next = {};
            for (const [memberId, messages] of Object.entries(remoteChats)) {
              const ex = Number(prev?.[memberId]);
              next[memberId] = Number.isFinite(ex) && ex >= 0 ? ex : messages.length;
            }
            return next;
          });
          if (remoteSquads.length > 0) setExpandedSquads((prev) => (prev.length ? prev : [remoteSquads[0].id]));
        } else if (localSquads.length > 0 || Object.keys(localChats).length > 0) {
          await saveSquadState({ squads: localSquads, chatsByMemberId: localChats });
        }
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squadStorageKey, squadChatStorageKey, squadReadStorageKey]);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsRequestsLoading(true);
      try {
        const payload = await getConnectionRequests();
        if (!active) return;
        setConnectionRequests(Array.isArray(payload?.received) ? payload.received : []);
        setSentRequestsCount(Array.isArray(payload?.sent) ? payload.sent.length : 0);
      } catch {
        if (active) { setConnectionRequests([]); setSentRequestsCount(0); }
      } finally {
        if (active) setIsRequestsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const stateTarget = location?.state?.openChatTarget;
    if (!stateTarget || typeof stateTarget !== "object") return;
    const chatMember = {
      id: String(stateTarget.id || stateTarget.uid || "").trim(),
      username: String(stateTarget.username || "").trim(),
      name: String(stateTarget.name || stateTarget.fullName || "Campus User").trim(),
      avatar: String(stateTarget.avatar || stateTarget.profileImageUrl || "").trim(),
      initials: String(stateTarget.initials || String(stateTarget.name || "CU").split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase()),
      role: String(stateTarget.role || "Student"),
      college: String(stateTarget.college || "Campus"),
      connectedVia: String(stateTarget.connectedVia || "Direct Message"),
      status: String(stateTarget.status || "online"),
    };
    if (!chatMember.id) return;
    setSquadsData((prev) => {
      const has = prev.some((s) => s.members.some((m) => m.id === chatMember.id));
      if (has) return prev;
      if (prev.length === 0) return [{ id: DEFAULT_SQUAD_ID, name: DEFAULT_SQUAD_NAME, color: "text-primary", bgColor: "bg-cyan-500", members: [chatMember] }];
      return prev.map((s, i) => (i === 0 ? { ...s, members: [...s.members, chatMember] } : s));
    });
    setChatTarget(chatMember);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => { try { localStorage.setItem(squadStorageKey, JSON.stringify(squadsData)); } catch {} }, [squadStorageKey, squadsData]);
  useEffect(() => { try { localStorage.setItem(squadChatStorageKey, JSON.stringify(chatByMemberId)); } catch {} }, [squadChatStorageKey, chatByMemberId]);
  useEffect(() => { try { localStorage.setItem(squadReadStorageKey, JSON.stringify(readMessageCountByMemberId)); } catch {} }, [squadReadStorageKey, readMessageCountByMemberId]);
  useEffect(() => {
    const t = setTimeout(() => { saveSquadState({ squads: squadsData, chatsByMemberId: chatByMemberId }).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [squadsData, chatByMemberId]);

  useEffect(() => {
    if (!chatTarget?.id) return;
    setReadMessageCountByMemberId((prev) => {
      const latest = Array.isArray(chatByMemberId?.[chatTarget.id]) ? chatByMemberId[chatTarget.id].length : 0;
      const cur = Number(prev?.[chatTarget.id]);
      if (Number.isFinite(cur) && cur === latest) return prev;
      return { ...prev, [chatTarget.id]: latest };
    });
  }, [chatTarget?.id, chatByMemberId]);

  // Group chat: load history from DB
  useEffect(() => {
    if (!groupChatSquadId) return;
    let cancelled = false;
    setGroupLoading(true);
    getSquadMessages(groupChatSquadId)
      .then((msgs) => { if (!cancelled) setGroupMessages(Array.isArray(msgs) ? msgs : []); })
      .catch(() => { if (!cancelled) setGroupMessages([]); })
      .finally(() => { if (!cancelled) setGroupLoading(false); });
    return () => { cancelled = true; };
  }, [groupChatSquadId]);

  // Group chat: Socket.io realtime
  useEffect(() => {
    if (!groupChatSquadId) return;
    const socket = getSquadSocket();
    socket.emit("join_squad", { squadId: groupChatSquadId }, () => {});
    const onReceive = (msg) => {
      if (msg?.squadId !== groupChatSquadId) return;
      setGroupMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket.on("receive_squad_message", onReceive);
    return () => { socket.off("receive_squad_message", onReceive); };
  }, [groupChatSquadId]);

  useEffect(() => { groupEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages]);

  const sendGroupMessage = () => {
    if (!groupChatSquadId) return;
    const text = String(groupInput || "").trim();
    if (!text) return;
    setGroupInput("");
    const socket = getSquadSocket();
    socket.emit("send_squad_message", { squadId: groupChatSquadId, content: text }, async (ack) => {
      if (ack?.ok && ack.message) {
        setGroupMessages((prev) => (prev.some((m) => m.id === ack.message.id) ? prev : [...prev, ack.message]));
        return;
      }
      try {
        const msg = await postSquadMessageRest(groupChatSquadId, text);
        if (msg) setGroupMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      } catch {
        window.alert("Failed to send group message.");
      }
    });
  };

  const unreadByMemberId = useMemo(() => {
    const output = {};
    for (const [memberId, messages] of Object.entries(chatByMemberId)) {
      const safeMessages = Array.isArray(messages) ? messages : [];
      const readCount = Number(readMessageCountByMemberId?.[memberId]);
      const safeRead = Number.isFinite(readCount) && readCount >= 0 ? readCount : safeMessages.length;
      output[memberId] = safeMessages.slice(safeRead).some((m) => String(m?.sender || "").toLowerCase() === "them" || (m.senderId && String(m.senderId) !== storageUserKey));
    }
    return output;
  }, [chatByMemberId, readMessageCountByMemberId, storageUserKey]);

  const toggleSquad = (id) => setExpandedSquads((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const createSquad = () => {
    const name = String(newSquadName || "").trim();
    if (!name) return;
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "squad"}-${Date.now()}`;
    setSquadsData((prev) => [{ id, name, color: "text-primary", bgColor: "bg-cyan-500", members: [] }, ...prev]);
    setExpandedSquads((prev) => [...prev, id]);
    setNewSquadName("");
    setIsCreateSquadModalOpen(false);
  };

  const openChat = (member) => {
    setGroupChatSquadId(null);
    setChatTarget(member);
    setIsChatMenuOpen(false);
    setReadMessageCountByMemberId((prev) => ({ ...prev, [member.id]: Array.isArray(chatByMemberId?.[member.id]) ? chatByMemberId[member.id].length : 0 }));
  };

  const openMemberProfile = (member) => {
    const target = String(member?.username || "").trim().toLowerCase() || toUsername(member?.name || "");
    if (target) navigate(`/profile/${target}`);
  };

  const closeChat = () => { setChatTarget(null); setChatInput(""); setIsChatMenuOpen(false); };

  const handleChatMenuAction = (action) => {
    if (chatTarget) window.alert(`${action} ${chatTarget.name}`);
    setIsChatMenuOpen(false);
  };

  const sendChatMessage = async () => {
    if (!chatTarget) return;
    const message = String(chatInput || "").trim();
    if (!message) return;
    const optimistic = { id: `${chatTarget.id}-${Date.now()}`, text: message, sender: "me", senderId: storageUserKey, receiverId: chatTarget.id, createdAt: new Date().toISOString(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatByMemberId((prev) => ({ ...prev, [chatTarget.id]: [...(prev[chatTarget.id] || []), optimistic] }));
    setChatInput("");
    try {
      const sent = await sendDirectMessage(chatTarget.id, message);
      const saved = sent?.chat;
      if (saved) setChatByMemberId((prev) => ({ ...prev, [chatTarget.id]: [...(prev[chatTarget.id] || []).filter((m) => m.id !== optimistic.id), saved] }));
    } catch {
      setChatByMemberId((prev) => ({ ...prev, [chatTarget.id]: (prev[chatTarget.id] || []).filter((m) => m.id !== optimistic.id) }));
      window.alert("Failed to send message. Try again.");
    }
  };

  const removeMember = (squadId, memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} and delete chat history?`)) return;
    setSquadsData((prev) => prev.map((s) => (s.id === squadId ? { ...s, members: s.members.filter((m) => m.id !== memberId) } : s)));
    setChatByMemberId((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
    if (chatTarget?.id === memberId) closeChat();
  };

  const openMoveModal = (fromSquadId, memberId, memberName) => {
    const targets = squadsData.filter((s) => s.id !== fromSquadId);
    setMoveState({ isOpen: true, fromSquadId, memberId, memberName, targetSquadId: targets[0]?.id || "" });
  };
  const closeMoveModal = () => setMoveState({ isOpen: false, fromSquadId: "", memberId: "", memberName: "", targetSquadId: "" });
  const confirmMoveMember = () => {
    const { fromSquadId, memberId, targetSquadId } = moveState;
    if (!fromSquadId || !memberId || !targetSquadId || fromSquadId === targetSquadId) { closeMoveModal(); return; }
    let moved = null;
    setSquadsData((prev) => prev.map((s) => {
      if (s.id === fromSquadId) {
        moved = s.members.find((m) => m.id === memberId) || null;
        return { ...s, members: s.members.filter((m) => m.id !== memberId) };
      }
      if (s.id === targetSquadId && moved) return { ...s, members: [...s.members, moved] };
      return s;
    }));
    closeMoveModal();
  };

  const respondRequest = async (requestId, action) => {
    try {
      await respondConnectionRequest(requestId, action);
      setConnectionRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: action === "accept" ? "accepted" : "declined", respondedAt: new Date().toISOString() } : r)));
    } catch (e) {
      window.alert(e?.response?.data?.error || e.message || "Failed to respond");
    }
  };

  const pendingRequests = connectionRequests.filter((r) => String(r?.status || "pending").toLowerCase() === "pending");
  const activeGroupSquad = squadsData.find((s) => s.id === groupChatSquadId);

  return (
    <div className={cn("min-h-screen pb-24", isDark ? "text-slate-100" : "text-neutral-900")}>
      <div className="mx-auto max-w-5xl space-y-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-100 text-cyan-700")}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Squads</h1>
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>Manage folders, direct messages, and real-time group chats</p>
            </div>
          </div>
          <button onClick={() => setIsCreateSquadModalOpen(true)} className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition", isDark ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30" : "bg-cyan-600 text-white hover:bg-cyan-700")}>
            <Plus className="h-4 w-4" /> New Folder
          </button>
        </div>

        {/* Connection Requests */}
        <div className={cn("rounded-2xl border p-4", isDark ? "border-slate-700/60 bg-slate-900/50" : "border-gray-200 bg-white/70")}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Connection Requests</h2>
            <span className={cn("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>
              {isRequestsLoading ? "Loading…" : `${pendingRequests.length} pending · ${sentRequestsCount} sent`}
            </span>
          </div>
          {pendingRequests.length === 0 ? (
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>No pending requests.</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className={cn("flex items-center justify-between gap-3 rounded-xl border p-3", isDark ? "border-slate-700/60 bg-slate-800/40" : "border-gray-200 bg-gray-50")}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{req.fromName || req.fromUsername || "Campus User"}</p>
                    <p className={cn("text-xs truncate", isDark ? "text-slate-400" : "text-neutral-500")}>{req.text}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => respondRequest(req.id, "accept")} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700">Accept</button>
                    <button onClick={() => respondRequest(req.id, "decline")} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", isDark ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Squad Folders */}
        <div className="space-y-3">
          {squadsData.length === 0 ? (
            <div className={cn("rounded-2xl border p-8 text-center", isDark ? "border-slate-700/60 bg-slate-900/40" : "border-gray-200 bg-white/60")}>
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>No squads yet. Create a folder or connect with peers from Matchmaker/Profile.</p>
            </div>
          ) : squadsData.map((squad) => {
            const isExpanded = expandedSquads.includes(squad.id);
            return (
              <div key={squad.id} className={cn("rounded-2xl border overflow-hidden", isDark ? "border-slate-700/60 bg-slate-900/50" : "border-gray-200 bg-white/70")}>
                <div className={cn("flex items-center justify-between px-4 py-3", isDark ? "bg-slate-800/30" : "bg-gray-50/80")}>
                  <button onClick={() => toggleSquad(squad.id)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <FolderOpen className={cn("h-4 w-4 shrink-0", "text-cyan-500")} />
                    <span className="font-semibold truncate">{squad.name}</span>
                    <span className={cn("text-xs shrink-0", isDark ? "text-slate-400" : "text-neutral-500")}>({squad.members.length})</span>
                  </button>
                  <button onClick={() => { setGroupChatSquadId(squad.id); setChatTarget(null); }} className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0", isDark ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25" : "bg-cyan-100 text-cyan-800 hover:bg-cyan-200")} title="Open real-time group chat">
                    <MessagesSquare className="h-3.5 w-3.5" /> Group Chat
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {squad.members.length === 0 ? (
                      <p className={cn("text-sm px-2 py-2", isDark ? "text-slate-400" : "text-neutral-500")}>No members in this folder yet.</p>
                    ) : squad.members.map((person) => (
                      <div key={person.id} className={cn("flex items-center justify-between gap-3 rounded-xl border p-3", isDark ? "border-slate-700/50 bg-slate-800/30" : "border-gray-200 bg-white")}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={person.avatar} alt={person.name} initials={person.initials} className="h-10 w-10" />
                          <div className="min-w-0">
                            <button type="button" onClick={() => openMemberProfile(person)} className={cn("text-sm font-semibold truncate block text-left hover:underline underline-offset-2", isDark ? "text-slate-100" : "text-neutral-900")}>{person.name}</button>
                            <p className={cn("text-xs truncate", isDark ? "text-slate-400" : "text-neutral-500")}>@{person.username || toUsername(person.name)} · {person.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openChat(person)} className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md transition", isDark ? "text-cyan-300 hover:bg-slate-700" : "text-cyan-700 hover:bg-cyan-50")} title="Direct message"><MessageCircle className="h-4 w-4" /></button>
                          <button onClick={() => openMoveModal(squad.id, person.id, person.name)} className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md transition text-xs font-semibold", isDark ? "text-slate-300 hover:bg-slate-700" : "text-neutral-600 hover:bg-gray-100")} title="Move member">↔</button>
                          <button onClick={() => removeMember(squad.id, person.id, person.name)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50" title="Remove"><UserMinus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Squad Modal */}
      {isCreateSquadModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className={cn("w-full max-w-md rounded-2xl border p-5", isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white")}>
            <h2 className="text-lg font-bold">Create Squad Folder</h2>
            <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>Organize members into a folder.</p>
            <input value={newSquadName} onChange={(e) => setNewSquadName(e.target.value)} placeholder="e.g. Hackathon Team" className={cn("mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none", isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-300 bg-white")} />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setIsCreateSquadModalOpen(false); setNewSquadName(""); }} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", isDark ? "border-slate-700 text-slate-200" : "border-gray-300")}>Cancel</button>
              <button onClick={createSquad} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Chat Modal */}
      {chatTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className={cn("w-full max-w-lg rounded-2xl border overflow-hidden", isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white")}>
            <div className={cn("flex items-center justify-between border-b px-4 py-3", isDark ? "border-slate-700" : "border-gray-200")}>
              <div className="flex items-center gap-3">
                <Avatar src={chatTarget.avatar} alt={chatTarget.name} initials={chatTarget.initials} className="h-10 w-10" />
                <div>
                  <button type="button" onClick={() => openMemberProfile(chatTarget)} className="text-sm font-semibold hover:underline">{chatTarget.name}</button>
                  <p className={cn("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>@{chatTarget.username || toUsername(chatTarget.name)}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-1">
                <button onClick={() => setIsChatMenuOpen((p) => !p)} className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md", isDark ? "hover:bg-slate-800" : "hover:bg-gray-100")}><MoreVertical className="h-4 w-4" /></button>
                {isChatMenuOpen && (
                  <div className={cn("absolute right-10 top-0 z-10 w-28 rounded-xl border text-sm shadow-lg", isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white")}>
                    <button onClick={() => handleChatMenuAction("Block")} className={cn("block w-full px-3 py-2 text-left", isDark ? "hover:bg-slate-800" : "hover:bg-gray-50")}>Block</button>
                    <button onClick={() => handleChatMenuAction("Report")} className={cn("block w-full px-3 py-2 text-left text-red-600", isDark ? "hover:bg-slate-800" : "hover:bg-gray-50")}>Report</button>
                  </div>
                )}
                <button onClick={closeChat} className={cn("rounded-md px-2 py-1 text-xs font-medium", isDark ? "hover:bg-slate-800" : "hover:bg-gray-100")}>Close</button>
              </div>
            </div>
            <div className="min-h-72 max-h-80 space-y-2 overflow-y-auto p-4">
              {(chatByMemberId[chatTarget.id] || []).length === 0 ? (
                <p className={cn("text-sm text-center py-10", isDark ? "text-slate-400" : "text-neutral-500")}>No chats yet. Start the conversation.</p>
              ) : (chatByMemberId[chatTarget.id] || []).map((msg) => {
                const mine = String(msg.sender || "").toLowerCase() === "me" || (msg.senderId && String(msg.senderId) === storageUserKey);
                return (
                  <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm", mine ? (isDark ? "bg-cyan-500/20 text-cyan-100" : "bg-cyan-100 text-cyan-900") : (isDark ? "bg-slate-800" : "bg-gray-100"))}>
                      <p>{msg.text}</p>
                      <p className={cn("mt-1 text-[10px]", isDark ? "text-slate-400" : "text-neutral-500")}>{msg.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={cn("flex items-center gap-2 border-t p-3", isDark ? "border-slate-700" : "border-gray-200")}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendChatMessage(); } }} placeholder="Type your message..." className={cn("w-full rounded-xl border px-3 py-2 text-sm outline-none", isDark ? "border-slate-700 bg-slate-800" : "border-gray-300")} />
              <button onClick={sendChatMessage} className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Modal (Socket.io + DB) */}
      {groupChatSquadId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className={cn("w-full max-w-xl rounded-2xl border overflow-hidden flex flex-col", isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white")} style={{ maxHeight: "85vh" }}>
            <div className={cn("flex items-center justify-between border-b px-4 py-3 shrink-0", isDark ? "border-slate-700" : "border-gray-200")}>
              <div>
                <h3 className="font-semibold">{activeGroupSquad?.name || "Squad"} · Group Chat</h3>
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>Real-time · persisted in PostgreSQL</p>
              </div>
              <button onClick={() => setGroupChatSquadId(null)} className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md", isDark ? "hover:bg-slate-800" : "hover:bg-gray-100")}><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-64">
              {groupLoading ? (
                <p className={cn("text-sm text-center py-8", isDark ? "text-slate-400" : "text-neutral-500")}>Loading messages…</p>
              ) : groupMessages.length === 0 ? (
                <p className={cn("text-sm text-center py-8", isDark ? "text-slate-400" : "text-neutral-500")}>No messages yet. Start the group conversation.</p>
              ) : groupMessages.map((msg) => {
                const mine = String(msg?.sender?.id || "") === String(user?.id || user?.uid || "");
                return (
                  <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", mine ? (isDark ? "bg-cyan-500/20 text-cyan-100" : "bg-cyan-100 text-cyan-900") : (isDark ? "bg-slate-800" : "bg-gray-100"))}>
                      {!mine && <p className={cn("text-xs font-semibold mb-0.5", isDark ? "text-cyan-300" : "text-cyan-800")}>{msg?.sender?.name || msg?.sender?.username || "Member"}</p>}
                      <p>{msg.content}</p>
                      <p className={cn("mt-1 text-[10px]", isDark ? "text-slate-400" : "text-neutral-500")}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={groupEndRef} />
            </div>
            <div className={cn("flex items-center gap-2 border-t p-3 shrink-0", isDark ? "border-slate-700" : "border-gray-200")}>
              <input value={groupInput} onChange={(e) => setGroupInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendGroupMessage(); } }} placeholder="Message the squad…" className={cn("w-full rounded-xl border px-3 py-2 text-sm outline-none", isDark ? "border-slate-700 bg-slate-800" : "border-gray-300")} />
              <button onClick={sendGroupMessage} className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Member Modal */}
      {moveState.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className={cn("w-full max-w-md rounded-2xl border p-5", isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white")}>
            <h2 className="text-lg font-bold">Move Member</h2>
            <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>Move <strong>{moveState.memberName}</strong> to another folder.</p>
            <select value={moveState.targetSquadId} onChange={(e) => setMoveState((p) => ({ ...p, targetSquadId: e.target.value }))} className={cn("mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none", isDark ? "border-slate-700 bg-slate-800" : "border-gray-300")}>
              {squadsData.filter((s) => s.id !== moveState.fromSquadId).map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeMoveModal} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", isDark ? "border-slate-700" : "border-gray-300")}>Cancel</button>
              <button onClick={confirmMoveMember} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
