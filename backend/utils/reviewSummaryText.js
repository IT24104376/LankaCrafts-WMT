/** Review stats, LLM prompts, and composed summaries (no verbatim review copying in fallbacks). */

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const buildReviewStats = (reviews, maxReviews = 60) => {
  const safe = reviews
    .map((r) => ({
      rating: typeof r?.rating === 'number' ? clamp(r.rating, 1, 5) : null,
      text: typeof r?.text === 'string' ? r.text.trim() : ''
    }))
    .filter((r) => r.rating && r.text)
    .slice(0, maxReviews);

  if (safe.length === 0) return null;

  const ratings = safe.map((r) => r.rating);
  const avg = ratings.reduce((sum, v) => sum + v, 0) / ratings.length;
  const dist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratings.filter((r) => r === stars).length
  }));

  return { safe, avg, dist };
};

/** For BART-style extractive summaries that often echo source wording / numbering. */
const looksLikeSummarizerGarbage = (text) => {
  if (!text || text.length < 18) return true;
  const digitRatio =
    (text.match(/\d/g) || []).length / Math.max(text.length, 1);
  if (digitRatio > 0.12) return true;
  if (/reviewers?\s*:\s*[\d,\s]+$/i.test(text.trim())) return true;
  if (/^\s*reviews?\s*:\s*\d+\s*\./i.test(text)) return true;
  return false;
};

/** Looser checks for instruction-tuned chat output. */
const looksLikeChatGarbage = (text) => {
  if (!text || text.length < 24) return true;
  const digitRatio =
    (text.match(/\d/g) || []).length / Math.max(text.length, 1);
  if (digitRatio > 0.22) return true;
  if (/^\s*reviews?\s*:/i.test(text)) return true;
  return false;
};

export const isUsableChatSummary = (text) => !looksLikeChatGarbage(text);

export const isUsableBartSummary = (text) => !looksLikeSummarizerGarbage(text);

/**
 * When no working LLM snippet: short overview from ratings only (never pastes review bodies).
 */
export const buildSyntheticSummary = (artisanName, safe, avg) => {
  const name = String(artisanName || '').trim() || 'This artisan';
  const n = safe.length;
  const hi = safe.filter((r) => r.rating >= 4).length;
  const lo = safe.filter((r) => r.rating <= 2).length;
  const mid = n - hi - lo;

  let tone;
  if (n === 1) {
    tone =
      avg >= 4 ?
        'The only review so far leans positive.'
        : avg <= 2 ?
          'The only review so far is largely critical.'
          : 'The only review so far is mixed.';
  } else if (hi > lo && hi > mid) {
    tone = 'Most ratings are on the high side; guests often sound pleased.';
  } else if (lo > hi && lo > mid) {
    tone = 'Lower ratings are common enough that friction points deserve a closer look.';
  } else {
    tone = 'Ratings and tone vary from guest to guest.';
  }

  return `${name} has ${n} review${n === 1 ? '' : 's'}. Averaged together, scores sit near ${avg.toFixed(1)} out of 5. ${tone} See the list below for each person’s exact words.`;
};

export const buildChatReviewPrompt = (artisanName, safe) => {
  const name = String(artisanName || '').trim() || 'the artisan';
  const lines = safe
    .map(
      (r, i) =>
        `${i + 1}. Rating ${r.rating}/5 — ${r.text.replace(/\s+/g, ' ').trim()}`
    )
    .join('\n');

  return [
    `You are helping visitors quickly understand feedback for "${name}".`,
    '',
    'Here are guest reviews (each has a star rating and their comment):',
    lines,
    '',
    'Write 2–4 short sentences that capture the overall story: what people like, what problems show up (if any), and the general mood.',
    'Paraphrase in your own words. Do not quote or paste phrases from the reviews. Do not repeat star numbers or make bullet lists.'
  ].join('\n');
};

export const SYSTEM_PROMPT_REVIEW_SUMMARY =
  'You summarize visitor reviews in clear, neutral English for a craft marketplace. Be concise and paraphrase; never copy sentences from the reviews.';

/** Single block for classic summarization models (CNN/BART). */
export const proseForSummarizationModel = (artisanName, safe, maxChars = 3200) => {
  const body = safe.map((r) => r.text.trim()).join(' ');
  let block = `Here are customer reviews for ${artisanName}. ${body}`;
  if (block.length > maxChars) {
    block = `${block.slice(0, maxChars - 1)}…`;
  }
  return block;
};

export const buildHighlightsAndCautions = (avg, dist, safe) => {
  const highlights = [];
  const cautions = [];
  const total = safe.length;
  const highCount =
    dist.find((d) => d.stars === 5).count +
    dist.find((d) => d.stars === 4).count;
  const lowCount =
    dist.find((d) => d.stars === 1).count +
    dist.find((d) => d.stars === 2).count;

  if (total >= 2 && highCount / total >= 0.6) {
    highlights.push('Most guests gave 4★ or 5★ ratings.');
  }
  if (lowCount > 0) {
    cautions.push(
      `${lowCount} review${lowCount === 1 ? '' : 's'} rated 1–2★—read those for specifics.`
    );
  }
  if (avg < 3 && total >= 2) {
    cautions.push(
      'Average is below 3★; check reviews for recurring themes to improve.'
    );
  }

  return { highlights: highlights.slice(0, 4), cautions: cautions.slice(0, 3) };
};

const statsFootnote = (n, avg) =>
  `— ${n} review${n === 1 ? '' : 's'}, ${avg.toFixed(1)}/5 average`;

/**
 * @param {string} modelSummary — paraphrased text from chat or summarization model
 */
export const composeFinalSummary = (safe, avg, modelSummary, artisanName) => {
  const n = safe.length;
  const cleaned = String(modelSummary || '').trim();

  let narrative;
  if (cleaned && isUsableChatSummary(cleaned)) {
    narrative = cleaned.replace(/\s+/g, ' ').trim();
    if (!/[.!?]$/.test(narrative)) {
      narrative = `${narrative}.`;
    }
  } else if (cleaned && isUsableBartSummary(cleaned)) {
    narrative = cleaned.replace(/\s+/g, ' ').trim();
    if (!/[.!?]$/.test(narrative)) {
      narrative = `${narrative}.`;
    }
  } else {
    narrative = buildSyntheticSummary(artisanName, safe, avg);
  }

  const foot = statsFootnote(n, avg);
  return `${narrative}\n\n${foot}`;
};
