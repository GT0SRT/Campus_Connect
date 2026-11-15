"""
Weighted graph-based matchmaker for CampusConnect.

Model (conceptual graph):
- Nodes: Students (User), Skills, Interests, Branches/Campuses, Squads.
- Edges: weighted relationships used for scoring.

Weights (per spec):
- Skill match: 3.0
- Interest match: 2.0
- 2-hop mutual squadmate: 2.5
- Same branch/campus: 1.5

Scoring:
- Computes a normalized compatibility score (0-100%) using weighted Jaccard similarity
  on the overlap of skill/interest sets plus additive bonuses for shared context
  (branch/campus) and for 2-hop mutual squad connections, then normalized to [0,100].
- Returns matchScore (int 0-100) and matchReasons (list of human-readable strings).
"""
from __future__ import annotations

from typing import Any, Dict, List


W_SKILL = 3.0
W_INTEREST = 2.0
W_TWO_HOP_SQUADMATE = 2.5
W_SAME_CONTEXT = 1.5


def _norm_list(values: Any) -> List[str]:
    if not isinstance(values, list):
        return []
    out: List[str] = []
    for v in values:
        s = str(v or "").strip().lower()
        if s:
            out.append(s)
    seen = set()
    deduped: List[str] = []
    for s in out:
        if s not in seen:
            seen.add(s)
            deduped.append(s)
    return deduped


def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 0.0
    union = sa | sb
    if not union:
        return 0.0
    return len(sa & sb) / len(union)


def _shared_items(a: List[str], b: List[str]) -> List[str]:
    sa, sb = set(a), set(b)
    return sorted(list(sa & sb))


def compute_weighted_match(
    current_user: Dict[str, Any],
    candidates: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Compute weighted graph-inspired compatibility for each candidate."""
    me_skills = _norm_list(current_user.get("skills"))
    me_interests = _norm_list(current_user.get("interests"))
    me_branch = str(current_user.get("branch") or "").strip().lower()
    me_campus = str(current_user.get("campus") or "").strip().lower()
    me_squads = set(_norm_list(current_user.get("squadIds")))

    results: List[Dict[str, Any]] = []

    for cand in candidates or []:
        c_skills = _norm_list(cand.get("skills"))
        c_interests = _norm_list(cand.get("interests"))
        c_branch = str(cand.get("branch") or "").strip().lower()
        c_campus = str(cand.get("campus") or "").strip().lower()
        c_squads = set(_norm_list(cand.get("squadIds")))

        reasons: List[str] = []

        skill_j = _jaccard(me_skills, c_skills)
        interest_j = _jaccard(me_interests, c_interests)

        shared_skills = _shared_items(me_skills, c_skills)
        shared_interests = _shared_items(me_interests, c_interests)

        if shared_skills:
            reasons.append(f"Shared skills: {', '.join(shared_skills[:5])}")
        if shared_interests:
            reasons.append(f"Shared interests: {', '.join(shared_interests[:5])}")

        same_branch = bool(me_branch and c_branch and me_branch == c_branch)
        same_campus = bool(me_campus and c_campus and me_campus == c_campus)
        context_hits = 0
        if same_branch:
            context_hits += 1
            reasons.append("Same branch")
        if same_campus:
            context_hits += 1
            reasons.append("Same campus")

        mutual_squad_count = len(me_squads & c_squads) if (me_squads and c_squads) else 0
        if mutual_squad_count > 0:
            reasons.append(f"Mutual squad connection{'' if mutual_squad_count == 1 else 's'} ({mutual_squad_count})")

        raw = (
            (skill_j * W_SKILL)
            + (interest_j * W_INTEREST)
            + (min(mutual_squad_count, 3) * (W_TWO_HOP_SQUADMATE / 3.0))
            + (context_hits * W_SAME_CONTEXT)
        )

        max_raw = W_SKILL + W_INTEREST + W_TWO_HOP_SQUADMATE + (2 * W_SAME_CONTEXT)
        score = 0.0 if max_raw <= 0 else (raw / max_raw) * 100.0
        score = max(0.0, min(100.0, round(score, 1)))

        enriched = dict(cand)
        enriched["matchScore"] = int(round(score))
        enriched["matchReasons"] = reasons[:8] if reasons else ["Suggested based on profile similarity"]
        results.append(enriched)

    results.sort(key=lambda x: x.get("matchScore", 0), reverse=True)
    return results
