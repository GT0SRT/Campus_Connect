/**
 * Weighted graph-based matchmaker (ported from ai-engine/graph_matchmaker.py).
 * Weights: skill 3.0, interest 2.0, 2-hop mutual squadmate signal 2.5 (capped), same branch/campus 1.5 each.
 */
const W_SKILL = 3.0;
const W_INTEREST = 2.0;
const W_TWO_HOP_SQUADMATE = 2.5;
const W_SAME_CONTEXT = 1.5;

function normList(values) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const v of values) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function jaccard(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 && sb.size === 0) return 0;
  const union = new Set([...sa, ...sb]);
  if (union.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / union.size;
}

function sharedItems(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  return [...sa].filter((x) => sb.has(x)).sort();
}

function computeWeightedMatch(currentUser = {}, candidates = []) {
  const meSkills = normList(currentUser.skills);
  const meInterests = normList(currentUser.interests);
  const meBranch = String(currentUser.branch || '').trim().toLowerCase();
  const meCampus = String(currentUser.campus || '').trim().toLowerCase();
  const meSquads = new Set(normList(currentUser.squadIds));

  const results = [];
  for (const cand of candidates || []) {
    const cSkills = normList(cand.skills);
    const cInterests = normList(cand.interests);
    const cBranch = String(cand.branch || '').trim().toLowerCase();
    const cCampus = String(cand.campus || '').trim().toLowerCase();
    const cSquads = new Set(normList(cand.squadIds));

    const reasons = [];
    const skillJ = jaccard(meSkills, cSkills);
    const interestJ = jaccard(meInterests, cInterests);

    const sharedSkills = sharedItems(meSkills, cSkills);
    const sharedInterests = sharedItems(meInterests, cInterests);

    if (sharedSkills.length) reasons.push(`Shared skills: ${sharedSkills.slice(0, 5).join(', ')}`);
    if (sharedInterests.length) reasons.push(`Shared interests: ${sharedInterests.slice(0, 5).join(', ')}`);

    const sameBranch = Boolean(meBranch && cBranch && meBranch === cBranch);
    const sameCampus = Boolean(meCampus && cCampus && meCampus === cCampus);
    let contextHits = 0;
    if (sameBranch) {
      contextHits += 1;
      reasons.push('Same branch');
    }
    if (sameCampus) {
      contextHits += 1;
      reasons.push('Same campus');
    }

    let mutualSquadCount = 0;
    if (meSquads.size && cSquads.size) {
      for (const s of cSquads) if (meSquads.has(s)) mutualSquadCount++;
    }
    if (mutualSquadCount > 0) {
      reasons.push(`Mutual squad connection${mutualSquadCount === 1 ? '' : 's'} (${mutualSquadCount})`);
    }

    const raw =
      skillJ * W_SKILL +
      interestJ * W_INTEREST +
      Math.min(mutualSquadCount, 3) * (W_TWO_HOP_SQUADMATE / 3.0) +
      contextHits * W_SAME_CONTEXT;

    const maxRaw = W_SKILL + W_INTEREST + W_TWO_HOP_SQUADMATE + 2 * W_SAME_CONTEXT;
    let score = maxRaw <= 0 ? 0 : (raw / maxRaw) * 100;
    score = Math.max(0, Math.min(100, Math.round(score)));

    results.push({
      ...cand,
      matchScore: score,
      matchReasons: reasons.length ? reasons.slice(0, 8) : ['Suggested based on profile similarity'],
    });
  }

  results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  return results;
}

module.exports = { computeWeightedMatch, normList };
