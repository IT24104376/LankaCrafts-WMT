import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/review-summary', async (req, res) => {
    try {
        const { artisanName, reviews = [] } = req.body;

        if (!reviews.length) {
            return res.json({
                artisanName: artisanName || 'This Artisan',
                summary: 'No reviews yet. Be the first to share your experience!',
                highlights: [],
                cautions: [],
                ratingBreakdown: null,
            });
        }

        const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
        const reviewText = reviews
            .slice(0, 20)
            .map((r, i) => `Review ${i + 1} (${r.rating}/5): ${r.text}`)
            .join('\n');

        const prompt = `You are summarizing tourist reviews for a Sri Lankan craft artisan named "${artisanName || 'this artisan'}". Average rating: ${avgRating}/5 from ${reviews.length} reviews.

Reviews:
${reviewText}

Respond with JSON only (no markdown) in this exact format:
{
  "summary": "2-3 sentence overall summary",
  "highlights": ["up to 3 positive points"],
  "cautions": ["up to 2 constructive suggestions or minor concerns, empty array if none"]
}`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 400,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || '{}';
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            // Extract JSON from response if wrapped in markdown
            const match = raw.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : {};
        }

        const distribution = [5, 4, 3, 2, 1].map(stars => ({
            stars,
            count: reviews.filter(r => r.rating === stars).length,
        }));

        res.json({
            artisanName: artisanName || 'This Artisan',
            summary: parsed.summary || 'Great experiences reported by visitors.',
            highlights: parsed.highlights || [],
            cautions: parsed.cautions || [],
            ratingBreakdown: {
                avgRating: Number(avgRating),
                total: reviews.length,
                distribution,
            },
        });
    } catch (err) {
        console.error('AI summary error:', err.message);
        res.status(500).json({ message: 'Failed to generate summary', error: err.message });
    }
});

export default router;

