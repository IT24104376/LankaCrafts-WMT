export type FaqItem = {
  id: string;
  category: 'General' | 'Bookings' | 'Artists' | 'Workshops' | 'Payments' | 'Support';
  question: string;
  answer: string;
  keywords: string[];
};

export type ChatbotReply = {
  id: string;
  text: string;
  suggestions: string[];
};

export const SUGGESTED_QUESTIONS = [
  'How do I book a workshop?',
  'How can I find artists?',
  'Can I chat with an artist before booking?',
  'How do payments work?',
];

const CHAT_FAQS: FaqItem[] = [
  {
    id: 'how-to-book',
    category: 'Bookings',
    question: 'How do I book a workshop on LankaCrafts?',
    answer:
      'Open an artist profile or workshop page, choose your preferred date and time, and complete the booking form. After that, you can review your booking from the Bookings section.',
    keywords: ['book', 'booking', 'workshop', 'reserve', 'schedule', 'my bookings'],
  },
  {
    id: 'find-artists',
    category: 'Artists',
    question: 'How can I find artists on LankaCrafts?',
    answer:
      'Use the home and dashboard areas to discover artisans by craft type and location. You can explore profiles, compare specialties, and open your inbox to contact an artist before booking.',
    keywords: ['artist', 'artists', 'browse', 'find artist', 'craft type', 'location', 'search'],
  },
  {
    id: 'tourist-features',
    category: 'General',
    question: 'What can tourists do on LankaCrafts?',
    answer:
      'Tourists can create an account, browse verified artists, book workshops, chat with artisans, manage bookings, and share feedback after their experience.',
    keywords: ['tourist', 'tourists', 'features', 'account', 'dashboard', 'what can i do'],
  },
  {
    id: 'artist-registration',
    category: 'Artists',
    question: 'How do artists join LankaCrafts?',
    answer:
      'Artists register through the artist sign-up flow, complete their profile with craft details and location, and wait for verification before publishing services.',
    keywords: ['artist register', 'join', 'signup', 'sign up', 'verification', 'profile'],
  },
  {
    id: 'chat-feature',
    category: 'Support',
    question: 'Can I chat with an artist before booking?',
    answer:
      'Yes. Use the Inbox tab to message artists directly about availability, pricing, workshop details, and custom requests before confirming a booking.',
    keywords: ['chat', 'message', 'contact artist', 'before booking', 'inbox'],
  },
  {
    id: 'payments',
    category: 'Payments',
    question: 'How do payments work?',
    answer:
      'Payments are part of the booking flow. If a workshop requires payment, the app guides you through the payment step before the booking is finalized.',
    keywords: ['payment', 'pay', 'price', 'pricing', 'checkout', 'payhere'],
  },
  {
    id: 'reviews',
    category: 'General',
    question: 'Can I leave a review after a workshop?',
    answer:
      'Yes. After your experience, you can leave a review and rating to help other tourists choose trusted artisans and workshops.',
    keywords: ['review', 'rating', 'feedback', 'after workshop', 'comment'],
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findFaqAnswer = (message: string) => {
  const normalizedMessage = normalize(message);

  const ranked = CHAT_FAQS.map((faq) => {
    const score =
      faq.keywords.reduce((total, keyword) => {
        const normalizedKeyword = normalize(keyword);
        return total + (normalizedMessage.includes(normalizedKeyword) ? 1 : 0);
      }, 0) + (normalizedMessage.includes(normalize(faq.question)) ? 2 : 0);

    return { faq, score };
  }).sort((a, b) => b.score - a.score);

  return ranked[0] && ranked[0].score >= 1 ? ranked[0].faq : null;
};

const getFallbackAnswer = () =>
  'I can help with LankaCrafts topics like bookings, artists, workshops, payments, reviews, and inbox support. Ask a platform-related question or tap one of the suggestions below.';

export const getChatbotReply = (message: string): ChatbotReply => {
  const faq = findFaqAnswer(message);

  if (faq) {
    return {
      id: faq.id,
      text: faq.answer,
      suggestions: SUGGESTED_QUESTIONS.filter((item) => item !== faq.question).slice(0, 3),
    };
  }

  return {
    id: 'fallback',
    text: getFallbackAnswer(),
    suggestions: SUGGESTED_QUESTIONS.slice(0, 4),
  };
};
