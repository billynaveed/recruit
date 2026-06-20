import React, { useState, useEffect, useRef } from 'react';

// ==============================================================================
// ITEM CONTENT
// All items from the core block + Marketing Engineer role-family bundle
// ==============================================================================

const ITEMS = [
  { id: 'consent', type: 'consent' },
  { id: 'pilot_id', type: 'pilot_id' },
  { id: 'intro', type: 'intro' },

  // ----- CORE: STAR 1 (warm-up, Conscientiousness primary) -----
  {
    id: 'C-S1',
    type: 'star',
    sectionLabel: 'Part 1 — A recent piece of work',
    prompt: 'Think about a piece of work in the last 12 months that you were personally responsible for finishing. Something went off-track partway through — a timeline slipped, a plan broke, a dependency fell through, or something else changed. Walk me through what happened, what you did about it, and how it ended up.',
    hint: 'Write as much as you need to make the situation clear. Specifics help more than summaries.',
    minLength: 150,
  },

  // ----- CORE: Forced-choice block A (pairs 1-4) -----
  {
    id: 'FC-A1',
    type: 'forced_choice_group',
    sectionLabel: 'Part 2 — Which is more like you?',
    instruction: 'Pick whichever is closer to how you actually are, even if the choice feels imperfect. Neither option is better.',
    pairs: [
      {
        id: 'C-F1',
        optionA: 'I stick with what I commit to, even when it stops being the most interesting thing on my plate.',
        optionB: 'I stay alert to better approaches, even if it means rethinking what I committed to.',
      },
      {
        id: 'C-F2',
        optionA: 'I tell people the truth even when it makes the conversation harder.',
        optionB: 'I pay close attention to how I\'m making people feel in a conversation.',
      },
      {
        id: 'C-F3',
        optionA: 'When things go sideways, I stay level and work the problem.',
        optionB: 'When things go sideways, I step back and ask what the situation is teaching me.',
      },
      {
        id: 'C-F4',
        optionA: 'I do my best work when I have clear structure and clear expectations.',
        optionB: 'I do my best work when I have space to figure out my own approach.',
      },
    ],
  },

  // ----- CORE: Forced-choice block A (pairs 5-7) -----
  {
    id: 'FC-A2',
    type: 'forced_choice_group',
    sectionLabel: 'Part 2 — Which is more like you? (continued)',
    instruction: 'Same as before — whichever is closer.',
    pairs: [
      {
        id: 'C-F5',
        optionA: 'I\'d rather miss a deadline than ship work I\'m not confident in.',
        optionB: 'I\'d rather ship on time and fix what\'s imperfect afterward.',
      },
      {
        id: 'C-F6',
        optionA: 'I seek out people who will tell me when I\'m wrong.',
        optionB: 'I seek out people who will help me do my best work.',
      },
      {
        id: 'C-F7',
        optionA: 'Work that matters to the world.',
        optionB: 'Work where I can take on substantial responsibility.',
        customHeader: 'What draws you more to a role?',
      },
    ],
  },

  // ----- CORE: STAR 2 (Honesty-Humility) -----
  {
    id: 'C-S2',
    type: 'star',
    sectionLabel: 'Part 3 — A mistake',
    prompt: 'Describe a time in the last year or two when you realized you had made a significant mistake at work — one that affected other people. How did you recognize it, what did you do next, and what did you learn?',
    hint: 'The more specific you can be, the more useful your answer will be.',
    minLength: 150,
  },

  // ----- CORE: STAR 3 (Learning) -----
  {
    id: 'C-S3',
    type: 'star',
    sectionLabel: 'Part 4 — Changing your mind',
    prompt: 'Describe a specific time when someone you worked with pushed back on something you believed was right, and you ended up genuinely changing your mind. What did they say, and what actually shifted for you?',
    hint: '',
    minLength: 120,
  },

  // ----- CORE: Forced-choice block B (pairs 8-10) -----
  {
    id: 'FC-B1',
    type: 'forced_choice_group',
    sectionLabel: 'Part 5 — Which is more like you?',
    instruction: 'Same format as before.',
    pairs: [
      {
        id: 'C-F8',
        optionA: 'I\'ll push back on a plan I think is flawed, even when the room seems aligned.',
        optionB: 'I work to find the version of a plan everyone can get behind.',
      },
      {
        id: 'C-F9',
        optionA: 'I prefer to let my work speak for itself.',
        optionB: 'I believe in advocating clearly for the work I\'ve done.',
      },
      {
        id: 'C-F10',
        optionA: 'I can hold multiple priorities in the air without it getting to me.',
        optionB: 'I do my best work when each priority gets my full attention, one at a time.',
      },
    ],
  },

  // ----- CORE: Forced-choice block B (pairs 11-13) -----
  {
    id: 'FC-B2',
    type: 'forced_choice_group',
    sectionLabel: 'Part 5 — Which is more like you? (continued)',
    instruction: '',
    pairs: [
      {
        id: 'C-F11',
        optionA: 'I\'d rather try something new and get it 80% right.',
        optionB: 'I\'d rather do something familiar and get it fully right.',
      },
      {
        id: 'C-F12',
        optionA: 'I\'ll acknowledge uncertainty in my view, even in a room of people with strong opinions.',
        optionB: 'I\'ll state my view with conviction, even in a room of people with strong opinions.',
      },
      {
        id: 'C-F13',
        optionA: 'Real autonomy over how I operate.',
        optionB: 'Stability and predictability I can count on.',
        customHeader: 'What\'s more important to you in your next role?',
      },
    ],
  },

  // ----- CORE: Tradeoff 1 (Motivation ranking) -----
  {
    id: 'C-T1',
    type: 'ranking',
    sectionLabel: 'Part 6 — What you\'d pick',
    prompt: 'Imagine you had to choose between four roles. Compensation and title are identical. Rank these in the order you\'d actually pick them — most preferred first.',
    items: [
      { id: 'autonomy', label: 'Autonomy', description: 'High control over how you operate day to day.' },
      { id: 'mission', label: 'Mission', description: 'Work that directly connects to something you care about.' },
      { id: 'scope', label: 'Scope', description: 'Substantial responsibility and influence.' },
      { id: 'stability', label: 'Stability', description: 'A predictable, low-volatility environment.' },
    ],
  },

  // ----- CORE: Tradeoff 2 (Scenario) -----
  {
    id: 'C-T2',
    type: 'scenario_radio',
    sectionLabel: 'Part 7 — A situation',
    prompt: 'You\'ve been working on a piece of analysis for three weeks. The night before you\'re supposed to share it with your team, you realize there\'s a significant flaw in the reasoning — one that probably won\'t be caught by anyone else in the meeting. Fixing it properly would take another week.\n\nWhat would you most likely do?',
    options: [
      { id: 'A', text: 'Share it tomorrow as planned, flag the flaw clearly in the meeting, and ask for time to fix it.' },
      { id: 'B', text: 'Delay the meeting, take the week to fix it, and share the corrected version.' },
      { id: 'C', text: 'Share it tomorrow as planned, fix the flaw quietly afterward, and move on.' },
      { id: 'D', text: 'Share it tomorrow as planned and mention the flaw only if someone asks.' },
    ],
  },

  // ----- CORE: STAR 4 (Interpersonal — feedback) -----
  {
    id: 'C-S4',
    type: 'star',
    sectionLabel: 'Part 8 — Hard feedback',
    prompt: 'Tell me about a time you had to deliver feedback to someone — a peer, a report, or a manager — that you knew they wouldn\'t want to hear. Walk me through how you approached it, what you actually said, and what happened afterward.',
    hint: '',
    minLength: 150,
  },

  // ----- CORE: Consistency checks (both on one screen) -----
  {
    id: 'CC-both',
    type: 'likert_group',
    sectionLabel: 'Part 9 — A few quick reactions',
    instruction: 'How much do you agree with each of these statements?',
    items: [
      {
        id: 'C-CC1',
        statement: 'I sometimes leave tasks unfinished when I lose interest in them.',
      },
      {
        id: 'C-CC2',
        statement: 'I sometimes present my work as more complete or polished than it actually is, to get buy-in from others.',
      },
    ],
    scale: [
      'Strongly disagree',
      'Disagree',
      'Neither',
      'Agree',
      'Strongly agree',
    ],
  },

  // ----- CORE: Closing reflection -----
  {
    id: 'C-R1',
    type: 'star',
    sectionLabel: 'Part 10 — A reflection',
    prompt: 'If a close colleague from a previous role were describing how you work, what are two things they\'d likely mention — one that you\'re proud of, and one that you\'re still actively working on?',
    hint: '',
    minLength: 80,
  },

  // ==============================================================================
  // ROLE-FAMILY BLOCK: Marketing Engineer bundle
  // ==============================================================================

  // ----- RF-S1: Engineer mindset under constraint (best/worst SJT) -----
  {
    id: 'RF-S1',
    type: 'sjt_best_worst',
    sectionLabel: 'Part 11 — A recurring task',
    prompt: 'You\'ve been asked to deliver a specific output for the company — say, a weekly report, a pipeline of content, a regular analysis, or a recurring process. It needs to happen every week for the foreseeable future.\n\nYou have four weeks to get it running.',
    question: 'Which approach is most like how you\'d handle this, and which is least?',
    options: [
      {
        id: 'A',
        text: 'Do it manually for the first few weeks. Once I understand the work, look for parts to systematize or automate.',
        tooltips: {
          'systematize or automate': 'Build a tool, script, template, or workflow so the task runs with less manual effort next time.',
        },
      },
      {
        id: 'B',
        text: 'Design and build a small system or tool upfront that does most of the work. Launch once it\'s ready.',
        tooltips: {
          'small system or tool': 'Could be a spreadsheet with formulas, a script, an automation workflow, or a simple piece of software — not necessarily a large engineering build.',
        },
      },
      {
        id: 'C',
        text: 'Hire a contractor or use an external service to handle the recurring work, and focus my time elsewhere.',
        tooltips: {
          'external service': 'Outsourcing the ongoing work to someone else, rather than doing or building it yourself.',
        },
      },
      {
        id: 'D',
        text: 'Build a basic version in week one, use it, then improve it each week based on what I learn.',
        tooltips: {},
      },
    ],
  },

  // ----- RF-S2: AI fluency (best/worst SJT) -----
  {
    id: 'RF-S2',
    type: 'sjt_best_worst',
    sectionLabel: 'Part 12 — Working with AI',
    prompt: 'You\'re using an AI assistant to help with a task. It gives you a confident, well-written answer that would save you several hours of work if you used it directly.',
    question: 'Which approach is most like what you\'d do, and which is least?',
    options: [
      {
        id: 'A',
        text: 'Use it as-is. The AI is usually right, and the time saved is the point.',
        tooltips: {},
      },
      {
        id: 'B',
        text: 'Read it carefully, check the parts where being wrong would matter most, and verify those before using.',
        tooltips: {
          'where being wrong would matter most': 'Parts of the answer where a mistake would have real consequences — a wrong fact in a customer email, a miscalculated number in a report, a broken line of code.',
        },
      },
      {
        id: 'C',
        text: 'Verify every claim from scratch before using any of it.',
        tooltips: {},
      },
      {
        id: 'D',
        text: 'Use it as a draft, rewrite the parts I have opinions on, and cross-check anything that involves specific facts or numbers.',
        tooltips: {
          'cross-check': 'Look up the facts or numbers in a source you trust, separately from the AI.',
        },
      },
    ],
  },

  // ----- RF-S3: AI tool STAR -----
  {
    id: 'RF-S3',
    type: 'star',
    sectionLabel: 'Part 13 — AI in your actual work',
    prompt: 'Describe something specific you\'ve done in the last 6 months where you used AI tools to do meaningful work — not just to ask a quick question, but to actually produce something or solve a real problem.\n\nWalk me through what you were trying to do, what tools you used, what your actual workflow looked like, and where the AI was helpful vs. where it wasn\'t.',
    hint: 'Specifics matter here. Named tools, concrete outputs, described workflows.',
    minLength: 200,
  },

  // ----- RF-S4: Engineer vs. domain tradeoff -----
  {
    id: 'RF-S4',
    type: 'likert_single',
    sectionLabel: 'Part 14 — Two kinds of role',
    prompt: 'Imagine two roles. Both pay the same. Both are at companies you respect.\n\n**Role 1:** You\'re a domain specialist — in marketing, operations, sales, or community. Your job is to be excellent at the domain. You use AI and tools, but the core of your value is your domain expertise.\n\n**Role 2:** You\'re an engineer-builder who happens to work on marketing / operations / sales / community. Your job is to build systems, automate, and leverage AI to do the work of several specialists. You\'ll learn the domain in depth over time.',
    question: 'Which is more appealing to you?',
    scale: [
      'Strongly prefer Role 1',
      'Lean toward Role 1',
      'Genuinely split',
      'Lean toward Role 2',
      'Strongly prefer Role 2',
    ],
  },

  // ----- RF-ME1: Marketing engineer scenario -----
  {
    id: 'RF-ME1',
    type: 'sjt_with_short_response',
    sectionLabel: 'Part 15 — A real first project',
    prompt: 'You\'ve just joined the company. Your first project: the company needs to do outreach to a list of about 2,000 potential customers. Each one needs a message that references something specific about them (their company, their role, or recent activity). A person doing this manually would take about 40 hours. You have one week.',
    question: 'Which of these is closest to how you\'d approach the problem in your first 2 days?',
    options: [
      {
        id: 'A',
        text: 'Start sending manually, get a feel for what works, then decide if automation is worth it.',
        tooltips: {},
      },
      {
        id: 'B',
        text: 'Draft a clear spec for a small system — a data source for the 2,000 contacts, AI-generated personalization per contact with a verification step, and a send workflow. Build a prototype on day 2.',
        tooltips: {
          'personalization': 'Each message references something specific about the recipient rather than being a generic template.',
          'verification step': 'A check that the AI-generated personalization is actually accurate and not hallucinated or generic.',
        },
      },
      {
        id: 'C',
        text: 'Find a tool or service that does personalized outreach, evaluate 2–3 options, and pick one.',
        tooltips: {},
      },
      {
        id: 'D',
        text: 'Break the list into segments, draft a template per segment, and send batched messages manually with some per-contact edits.',
        tooltips: {
          'batched messages': 'Sending the same message (or close variant) to a group at once, rather than one-at-a-time.',
        },
      },
    ],
    followupPrompt: 'Briefly: what would you want to check about your approach after the first 200 messages go out?',
    followupMinLength: 60,
  },

  { id: 'summary', type: 'summary' },
];

// ==============================================================================
// STORAGE KEY
// ==============================================================================
const STORAGE_KEY = 'assessment_state_v1';

// ==============================================================================
// DESIGN TOKENS
// ==============================================================================
const COLORS = {
  bg: '#F7F3EC',          // warm off-white (paper)
  bgCard: '#FBF8F2',      // slightly lighter card
  ink: '#1A1612',         // near-black text
  inkSoft: '#5A5148',     // secondary text
  inkFaint: '#9A8F82',    // tertiary/hint
  accent: '#1E3A5F',      // ink blue
  accentSoft: '#E8EAF0',  // accent tint
  rule: '#D4CCBE',        // divider warm gray
  error: '#9C3A2A',       // muted red
  success: '#3A5E3A',     // muted green
};

// ==============================================================================
// INLINE STYLE INJECTOR (Google Fonts)
// ==============================================================================
function useFonts() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Work+Sans:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
}

// ==============================================================================
// TOOLTIP COMPONENT (inline term explainer)
// ==============================================================================
function Tooltipped({ text, tooltips }) {
  const [openKey, setOpenKey] = useState(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setOpenKey(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!tooltips || Object.keys(tooltips).length === 0) {
    return <span>{text}</span>;
  }

  // Build pattern that matches any tooltip term
  const terms = Object.keys(tooltips).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'i');

  const parts = text.split(pattern);

  return (
    <span ref={tooltipRef}>
      {parts.map((part, i) => {
        const matchedTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchedTerm) {
          const isOpen = openKey === `${i}-${matchedTerm}`;
          return (
            <span key={i} style={{ position: 'relative', display: 'inline' }}>
              <span
                style={{
                  borderBottom: `1px dotted ${COLORS.accent}`,
                  cursor: 'help',
                  color: COLORS.accent,
                }}
                onMouseEnter={() => setOpenKey(`${i}-${matchedTerm}`)}
                onMouseLeave={() => setOpenKey(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenKey(isOpen ? null : `${i}-${matchedTerm}`);
                }}
              >
                {part}
              </span>
              {isOpen && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    width: '280px',
                    maxWidth: '80vw',
                    padding: '12px 14px',
                    background: COLORS.ink,
                    color: COLORS.bg,
                    fontSize: '13px',
                    fontFamily: 'Work Sans, sans-serif',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    borderRadius: '2px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    zIndex: 10,
                    whiteSpace: 'normal',
                    textAlign: 'left',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {tooltips[matchedTerm]}
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ==============================================================================
// PROGRESS BAR
// ==============================================================================
function ProgressBar({ current, total }) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  return (
    <div style={{ width: '100%', marginBottom: '48px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: 'Work Sans, sans-serif',
        color: COLORS.inkFaint,
        marginBottom: '8px',
      }}>
        <span>Candidate Assessment</span>
        <span>{current} / {total}</span>
      </div>
      <div style={{ width: '100%', height: '2px', background: COLORS.rule, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pct}%`,
          background: COLORS.accent,
          transition: 'width 400ms ease',
        }} />
      </div>
    </div>
  );
}

// ==============================================================================
// LAYOUT WRAPPER
// ==============================================================================
function Page({ children, progress, hideProgress }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      padding: '40px 20px 120px',
      fontFamily: 'Work Sans, sans-serif',
      color: COLORS.ink,
    }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {!hideProgress && progress && <ProgressBar current={progress.current} total={progress.total} />}
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <div style={{
      fontSize: '11px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: COLORS.accent,
      fontFamily: 'Work Sans, sans-serif',
      fontWeight: 500,
      marginBottom: '16px',
    }}>
      {text}
    </div>
  );
}

function Prompt({ text, size = 'large' }) {
  const style = {
    fontFamily: 'Fraunces, Georgia, serif',
    fontWeight: 400,
    lineHeight: 1.35,
    color: COLORS.ink,
    marginBottom: '28px',
    whiteSpace: 'pre-wrap',
    fontSize: size === 'large' ? '27px' : '22px',
    letterSpacing: '-0.01em',
  };

  const formatted = text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });

  return <div style={style}>{formatted}</div>;
}

function Hint({ text }) {
  if (!text) return null;
  return (
    <div style={{
      fontSize: '14px',
      color: COLORS.inkSoft,
      fontStyle: 'italic',
      marginBottom: '24px',
      lineHeight: 1.6,
    }}>
      {text}
    </div>
  );
}

// ==============================================================================
// NAV FOOTER
// ==============================================================================
function NavFooter({ onBack, onContinue, canContinue, continueLabel = 'Continue', hideBack, extraNote }) {
  return (
    <div style={{
      marginTop: '48px',
      paddingTop: '24px',
      borderTop: `1px solid ${COLORS.rule}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <div>
        {!hideBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.inkSoft,
              fontSize: '14px',
              fontFamily: 'Work Sans, sans-serif',
              padding: '10px 0',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: COLORS.rule,
              textUnderlineOffset: '4px',
            }}
          >
            ← Back
          </button>
        )}
        {extraNote && (
          <div style={{ fontSize: '12px', color: COLORS.inkFaint, marginTop: '4px' }}>{extraNote}</div>
        )}
      </div>
      <button
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          background: canContinue ? COLORS.accent : COLORS.rule,
          color: canContinue ? COLORS.bg : COLORS.inkFaint,
          border: 'none',
          padding: '14px 32px',
          fontSize: '14px',
          fontFamily: 'Work Sans, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          textTransform: 'uppercase',
          transition: 'all 200ms',
        }}
      >
        {continueLabel}
      </button>
    </div>
  );
}

// ==============================================================================
// SCREEN COMPONENTS
// ==============================================================================

function ConsentScreen({ onContinue }) {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.accent,
        fontFamily: 'Work Sans, sans-serif',
        fontWeight: 500,
        marginBottom: '32px',
      }}>
        Candidate Assessment — Pilot
      </div>

      <h1 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '42px',
        fontWeight: 400,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        marginBottom: '32px',
        color: COLORS.ink,
      }}>
        Before we begin
      </h1>

      <div style={{ fontSize: '16px', lineHeight: 1.7, color: COLORS.ink, marginBottom: '24px' }}>
        <p style={{ marginBottom: '20px' }}>
          This is a thoughtful questionnaire, not a test. There are no right answers, and we won't be scoring you on how well you perform in a conventional sense.
        </p>
        <p style={{ marginBottom: '20px' }}>
          The goal is to help whoever reads this understand how you actually work — your thinking style, your judgment, what you pay attention to, what motivates you. The more honest and specific you are, the more useful it is.
        </p>
        <p style={{ marginBottom: '20px' }}>
          It should take about <strong>25 to 30 minutes</strong>. You can pause and come back; your answers save automatically in your browser.
        </p>
        <p style={{ marginBottom: '20px' }}>
          At the end, you'll see a summary of all your responses that you can copy or save.
        </p>
      </div>

      <div style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.rule}`,
        padding: '20px 24px',
        marginBottom: '32px',
        fontSize: '14px',
        lineHeight: 1.6,
        color: COLORS.inkSoft,
      }}>
        <strong style={{ color: COLORS.ink, display: 'block', marginBottom: '8px' }}>About your responses:</strong>
        Your responses will be reviewed by people at the hiring company. They are one input alongside conversations and interviews — not a decision on their own. You can request that your responses be deleted at any time.
      </div>

      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        cursor: 'pointer',
        marginBottom: '8px',
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{
            marginTop: '4px',
            width: '18px',
            height: '18px',
            accentColor: COLORS.accent,
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: '15px', color: COLORS.ink, lineHeight: 1.6 }}>
          I understand and I'm ready to begin.
        </span>
      </label>

      <NavFooter
        onContinue={onContinue}
        canContinue={checked}
        hideBack
        continueLabel="Begin"
      />
    </div>
  );
}

function PilotIdScreen({ value, onChange, onBack, onContinue }) {
  return (
    <div>
      <SectionLabel text="Pilot context" />
      <Prompt text="Who's taking this? (Your initials or a label are fine — this is just so responses can be distinguished in the pilot.)" size="small" />

      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. BYH, or Billy"
        style={{
          width: '100%',
          padding: '16px 18px',
          fontSize: '18px',
          fontFamily: 'Fraunces, serif',
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.rule}`,
          color: COLORS.ink,
          outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = COLORS.accent}
        onBlur={(e) => e.target.style.borderColor = COLORS.rule}
      />

      <NavFooter
        onBack={onBack}
        onContinue={onContinue}
        canContinue={(value || '').trim().length > 0}
      />
    </div>
  );
}

function IntroScreen({ onBack, onContinue }) {
  return (
    <div>
      <SectionLabel text="A quick note on format" />
      <Prompt text="What to expect over the next 25 minutes." />

      <div style={{ fontSize: '16px', lineHeight: 1.7, color: COLORS.ink, marginBottom: '20px' }}>
        <p style={{ marginBottom: '18px' }}>
          You'll see a mix of question types:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '20px' }}>
          <li style={{ marginBottom: '10px' }}>A handful of <strong>open-ended questions</strong> asking about specific situations in your work. Specific examples help a lot more than general statements.</li>
          <li style={{ marginBottom: '10px' }}>Several <strong>quick pairs</strong> where you pick whichever is closer to how you are. Both options will usually sound fine. Just pick whichever is closer.</li>
          <li style={{ marginBottom: '10px' }}>A few <strong>scenarios</strong> asking how you'd handle a situation.</li>
        </ul>
        <p style={{ marginBottom: '18px' }}>
          Some items have <span style={{ borderBottom: `1px dotted ${COLORS.accent}`, color: COLORS.accent }}>underlined terms</span> — hover or tap them to see a short explanation.
        </p>
        <p>
          You can go back to any previous question. Your answers save as you go.
        </p>
      </div>

      <NavFooter onBack={onBack} onContinue={onContinue} canContinue={true} continueLabel="Start the assessment" />
    </div>
  );
}

// ---------- STAR item screen ----------
function StarScreen({ item, value, onChange, onBack, onContinue }) {
  const currentLength = (value || '').trim().length;
  const meetsMin = currentLength >= (item.minLength || 0);
  const shortfall = Math.max(0, (item.minLength || 0) - currentLength);

  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text={item.prompt} />
      <Hint text={item.hint} />

      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer here..."
        rows={10}
        style={{
          width: '100%',
          padding: '18px 20px',
          fontSize: '16px',
          fontFamily: 'Work Sans, sans-serif',
          lineHeight: 1.6,
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.rule}`,
          color: COLORS.ink,
          outline: 'none',
          resize: 'vertical',
          minHeight: '200px',
        }}
        onFocus={(e) => e.target.style.borderColor = COLORS.accent}
        onBlur={(e) => e.target.style.borderColor = COLORS.rule}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: meetsMin ? COLORS.success : COLORS.inkFaint,
        marginTop: '8px',
        fontFamily: 'Work Sans, sans-serif',
      }}>
        <span>
          {currentLength} characters
          {item.minLength ? ` · ${meetsMin ? 'enough to continue' : `${shortfall} more to continue`}` : ''}
        </span>
      </div>

      <NavFooter
        onBack={onBack}
        onContinue={onContinue}
        canContinue={meetsMin}
      />
    </div>
  );
}

// ---------- Forced-choice group ----------
function ForcedChoiceGroup({ item, values, onChange, onBack, onContinue }) {
  const allAnswered = item.pairs.every(p => values && values[p.id]);

  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text="Which is more like you?" />
      {item.instruction && <Hint text={item.instruction} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', marginBottom: '16px' }}>
        {item.pairs.map((pair, idx) => (
          <div key={pair.id}>
            {pair.customHeader && (
              <div style={{
                fontSize: '15px',
                fontWeight: 500,
                color: COLORS.inkSoft,
                marginBottom: '14px',
                fontFamily: 'Work Sans, sans-serif',
              }}>
                {pair.customHeader}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['A', 'B'].map(optKey => {
                const text = optKey === 'A' ? pair.optionA : pair.optionB;
                const selected = values && values[pair.id] === optKey;
                return (
                  <label
                    key={optKey}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px 18px',
                      background: selected ? COLORS.accentSoft : COLORS.bgCard,
                      border: `1px solid ${selected ? COLORS.accent : COLORS.rule}`,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    <input
                      type="radio"
                      name={pair.id}
                      checked={selected || false}
                      onChange={() => onChange(pair.id, optKey)}
                      style={{
                        marginTop: '4px',
                        accentColor: COLORS.accent,
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '15px', lineHeight: 1.6, color: COLORS.ink }}>{text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <NavFooter onBack={onBack} onContinue={onContinue} canContinue={allAnswered} />
    </div>
  );
}

// ---------- Ranking (Motivation) ----------
function RankingScreen({ item, value, onChange, onBack, onContinue }) {
  // value is an array of item ids in rank order
  const ranks = value || [];
  const allRanked = ranks.length === item.items.length;

  function setRank(itemId, position) {
    // position is 1-indexed
    const newRanks = [...ranks.filter(id => id !== itemId)];
    const filtered = newRanks.filter(id => id !== itemId);
    filtered.splice(position - 1, 0, itemId);
    // Dedupe and ensure all valid ids preserved
    const result = filtered.slice(0, item.items.length);
    onChange(result);
  }

  function getPosition(itemId) {
    const idx = ranks.indexOf(itemId);
    return idx >= 0 ? idx + 1 : '';
  }

  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text={item.prompt} size="small" />
      <Hint text="Set each one's position (1 = most preferred, 4 = least)." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
        {item.items.map(opt => (
          <div
            key={opt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.rule}`,
            }}
          >
            <select
              value={getPosition(opt.id) || ''}
              onChange={(e) => {
                const pos = parseInt(e.target.value);
                if (pos) setRank(opt.id, pos);
              }}
              style={{
                padding: '8px 10px',
                fontFamily: 'Fraunces, serif',
                fontSize: '18px',
                background: COLORS.bg,
                border: `1px solid ${COLORS.rule}`,
                color: COLORS.ink,
                minWidth: '56px',
                cursor: 'pointer',
              }}
            >
              <option value="">—</option>
              {item.items.map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <div>
              <div style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '20px',
                color: COLORS.ink,
                marginBottom: '4px',
              }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '14px', color: COLORS.inkSoft, lineHeight: 1.5 }}>
                {opt.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {allRanked && (
        <div style={{
          fontSize: '13px',
          color: COLORS.success,
          marginTop: '4px',
          fontFamily: 'Work Sans, sans-serif',
        }}>
          All four ranked.
        </div>
      )}

      <NavFooter
        onBack={onBack}
        onContinue={onContinue}
        canContinue={allRanked}
        extraNote={!allRanked ? `${ranks.length} of ${item.items.length} ranked` : null}
      />
    </div>
  );
}

// ---------- Scenario with single radio ----------
function ScenarioRadioScreen({ item, value, onChange, onBack, onContinue }) {
  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text={item.prompt} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {item.options.map(opt => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '18px 20px',
                background: selected ? COLORS.accentSoft : COLORS.bgCard,
                border: `1px solid ${selected ? COLORS.accent : COLORS.rule}`,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <input
                type="radio"
                name={item.id}
                checked={selected}
                onChange={() => onChange(opt.id)}
                style={{
                  marginTop: '4px',
                  accentColor: COLORS.accent,
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '15px', lineHeight: 1.6, color: COLORS.ink }}>
                <strong style={{ marginRight: '8px', color: COLORS.accent }}>{opt.id}.</strong>
                {opt.text}
              </span>
            </label>
          );
        })}
      </div>

      <NavFooter onBack={onBack} onContinue={onContinue} canContinue={!!value} />
    </div>
  );
}

// ---------- Likert (single statement) ----------
function LikertSingle({ item, value, onChange, onBack, onContinue }) {
  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text={item.prompt} />
      {item.question && (
        <div style={{
          fontFamily: 'Work Sans, sans-serif',
          fontSize: '16px',
          fontWeight: 500,
          color: COLORS.ink,
          marginBottom: '20px',
        }}>
          {item.question}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {item.scale.map((label, idx) => {
          const optId = String(idx);
          const selected = value === optId;
          return (
            <label
              key={optId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: selected ? COLORS.accentSoft : COLORS.bgCard,
                border: `1px solid ${selected ? COLORS.accent : COLORS.rule}`,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name={item.id}
                checked={selected}
                onChange={() => onChange(optId)}
                style={{ accentColor: COLORS.accent, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '15px', color: COLORS.ink }}>{label}</span>
            </label>
          );
        })}
      </div>

      <NavFooter onBack={onBack} onContinue={onContinue} canContinue={value !== undefined && value !== null} />
    </div>
  );
}

// ---------- Likert group (multiple statements) ----------
function LikertGroup({ item, values, onChange, onBack, onContinue }) {
  const allAnswered = item.items.every(s => values && values[s.id] !== undefined && values[s.id] !== null);

  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text="A few quick reactions." size="small" />
      <Hint text={item.instruction} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {item.items.map(s => (
          <div key={s.id}>
            <div style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '18px',
              lineHeight: 1.5,
              color: COLORS.ink,
              marginBottom: '14px',
              fontStyle: 'italic',
            }}>
              "{s.statement}"
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {item.scale.map((label, idx) => {
                const optId = String(idx);
                const selected = values && values[s.id] === optId;
                return (
                  <label
                    key={optId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: selected ? COLORS.accentSoft : COLORS.bgCard,
                      border: `1px solid ${selected ? COLORS.accent : COLORS.rule}`,
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <input
                      type="radio"
                      name={s.id}
                      checked={selected || false}
                      onChange={() => onChange(s.id, optId)}
                      style={{ accentColor: COLORS.accent, cursor: 'pointer' }}
                    />
                    <span style={{ color: COLORS.ink }}>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <NavFooter onBack={onBack} onContinue={onContinue} canContinue={allAnswered} />
    </div>
  );
}

// ---------- SJT Best/Worst ----------
function SjtBestWorst({ item, value, onChange, onBack, onContinue }) {
  const best = (value || {}).best;
  const worst = (value || {}).worst;
  const valid = best && worst && best !== worst;

  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text={item.prompt} />
      <div style={{
        fontFamily: 'Work Sans, sans-serif',
        fontSize: '16px',
        fontWeight: 500,
        color: COLORS.ink,
        marginBottom: '28px',
      }}>
        {item.question}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {item.options.map(opt => {
          const isBest = best === opt.id;
          const isWorst = worst === opt.id;
          return (
            <div
              key={opt.id}
              style={{
                padding: '18px 20px',
                background: COLORS.bgCard,
                border: `1px solid ${isBest ? COLORS.accent : isWorst ? COLORS.error : COLORS.rule}`,
                transition: 'border-color 150ms',
              }}
            >
              <div style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: COLORS.ink,
                marginBottom: '12px',
              }}>
                <strong style={{ marginRight: '8px', color: COLORS.accent }}>{opt.id}.</strong>
                <Tooltipped text={opt.text} tooltips={opt.tooltips} />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onChange({ ...value, best: isBest ? null : opt.id, worst: isBest ? worst : (worst === opt.id ? null : worst) })}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'Work Sans, sans-serif',
                    fontWeight: 500,
                    background: isBest ? COLORS.accent : 'transparent',
                    color: isBest ? COLORS.bg : COLORS.accent,
                    border: `1px solid ${COLORS.accent}`,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {isBest ? '✓ Most like me' : 'Most like me'}
                </button>
                <button
                  onClick={() => onChange({ ...value, worst: isWorst ? null : opt.id, best: isWorst ? best : (best === opt.id ? null : best) })}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'Work Sans, sans-serif',
                    fontWeight: 500,
                    background: isWorst ? COLORS.error : 'transparent',
                    color: isWorst ? COLORS.bg : COLORS.error,
                    border: `1px solid ${COLORS.error}`,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {isWorst ? '✓ Least like me' : 'Least like me'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <NavFooter
        onBack={onBack}
        onContinue={onContinue}
        canContinue={valid}
        extraNote={!valid ? 'Pick one "most" and one "least" — they must be different.' : null}
      />
    </div>
  );
}

// ---------- SJT with short response (role-specific) ----------
function SjtWithShortResponse({ item, value, onChange, onBack, onContinue }) {
  const choice = (value || {}).choice;
  const followup = (value || {}).followup || '';
  const followupLen = followup.trim().length;
  const followupOk = followupLen >= (item.followupMinLength || 0);
  const valid = choice && followupOk;

  return (
    <div>
      {item.sectionLabel && <SectionLabel text={item.sectionLabel} />}
      <Prompt text={item.prompt} />
      <div style={{
        fontFamily: 'Work Sans, sans-serif',
        fontSize: '16px',
        fontWeight: 500,
        color: COLORS.ink,
        marginBottom: '20px',
      }}>
        {item.question}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
        {item.options.map(opt => {
          const selected = choice === opt.id;
          return (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '18px 20px',
                background: selected ? COLORS.accentSoft : COLORS.bgCard,
                border: `1px solid ${selected ? COLORS.accent : COLORS.rule}`,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name={item.id}
                checked={selected}
                onChange={() => onChange({ ...value, choice: opt.id })}
                style={{ marginTop: '4px', accentColor: COLORS.accent, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '15px', lineHeight: 1.6, color: COLORS.ink }}>
                <strong style={{ marginRight: '8px', color: COLORS.accent }}>{opt.id}.</strong>
                <Tooltipped text={opt.text} tooltips={opt.tooltips} />
              </span>
            </label>
          );
        })}
      </div>

      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '18px',
        color: COLORS.ink,
        marginBottom: '12px',
        lineHeight: 1.4,
      }}>
        {item.followupPrompt}
      </div>

      <textarea
        value={followup}
        onChange={(e) => onChange({ ...value, followup: e.target.value })}
        rows={4}
        placeholder="A couple of sentences..."
        style={{
          width: '100%',
          padding: '16px 18px',
          fontSize: '15px',
          fontFamily: 'Work Sans, sans-serif',
          lineHeight: 1.6,
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.rule}`,
          color: COLORS.ink,
          outline: 'none',
          resize: 'vertical',
          minHeight: '100px',
        }}
        onFocus={(e) => e.target.style.borderColor = COLORS.accent}
        onBlur={(e) => e.target.style.borderColor = COLORS.rule}
      />

      <div style={{
        fontSize: '12px',
        color: followupOk ? COLORS.success : COLORS.inkFaint,
        marginTop: '6px',
        fontFamily: 'Work Sans, sans-serif',
      }}>
        {followupLen} characters
        {item.followupMinLength ? ` · ${followupOk ? 'enough to continue' : `${item.followupMinLength - followupLen} more to continue`}` : ''}
      </div>

      <NavFooter onBack={onBack} onContinue={onContinue} canContinue={valid} />
    </div>
  );
}

// ---------- Summary ----------
function SummaryScreen({ responses, pilotId, onReset }) {
  const [copied, setCopied] = useState(false);
  const textRef = useRef(null);

  const formatted = formatResponsesForExport(responses, pilotId);

  function copyAll() {
    if (textRef.current) {
      textRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function downloadAsJson() {
    const blob = new Blob([JSON.stringify({ pilotId, responses, completedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment_${pilotId || 'response'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.success,
        fontFamily: 'Work Sans, sans-serif',
        fontWeight: 500,
        marginBottom: '24px',
      }}>
        Complete
      </div>

      <h1 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '38px',
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        marginBottom: '24px',
        color: COLORS.ink,
      }}>
        Thank you.
      </h1>

      <p style={{ fontSize: '16px', lineHeight: 1.7, color: COLORS.ink, marginBottom: '28px' }}>
        Your responses are below. You can copy them all, download them as a file, or just leave this page open.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button
          onClick={copyAll}
          style={{
            padding: '12px 24px',
            background: COLORS.accent,
            color: COLORS.bg,
            border: 'none',
            fontSize: '13px',
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied' : 'Copy all responses'}
        </button>
        <button
          onClick={downloadAsJson}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: COLORS.accent,
            border: `1px solid ${COLORS.accent}`,
            fontSize: '13px',
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Download as JSON
        </button>
        <button
          onClick={() => {
            if (confirm('This will erase all your responses and start over. Continue?')) {
              onReset();
            }
          }}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: COLORS.inkSoft,
            border: `1px solid ${COLORS.rule}`,
            fontSize: '13px',
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 400,
            cursor: 'pointer',
          }}
        >
          Reset & start over
        </button>
      </div>

      <textarea
        ref={textRef}
        readOnly
        value={formatted}
        style={{
          width: '100%',
          padding: '20px',
          fontSize: '13px',
          fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
          lineHeight: 1.6,
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.rule}`,
          color: COLORS.ink,
          minHeight: '500px',
          resize: 'vertical',
        }}
      />
    </div>
  );
}

// ==============================================================================
// FORMAT RESPONSES FOR EXPORT (human-readable text)
// ==============================================================================
function formatResponsesForExport(responses, pilotId) {
  const out = [];
  out.push(`CANDIDATE ASSESSMENT — RESPONSES`);
  out.push(`Respondent: ${pilotId || '(unlabeled)'}`);
  out.push(`Completed: ${new Date().toLocaleString()}`);
  out.push('='.repeat(60));
  out.push('');

  ITEMS.forEach(item => {
    if (['consent', 'intro', 'pilot_id', 'summary'].includes(item.type)) return;
    const resp = responses[item.id];
    if (resp === undefined || resp === null) return;

    out.push(`--- ${item.id} ---`);
    if (item.sectionLabel) out.push(`[${item.sectionLabel}]`);

    if (item.type === 'star') {
      out.push(`Prompt: ${item.prompt}`);
      out.push('');
      out.push(`Response:`);
      out.push(resp);
    } else if (item.type === 'forced_choice_group') {
      item.pairs.forEach(p => {
        const pick = resp[p.id];
        if (!pick) return;
        out.push(`Pair ${p.id}:`);
        out.push(`  A: ${p.optionA}`);
        out.push(`  B: ${p.optionB}`);
        out.push(`  Picked: ${pick}`);
        out.push('');
      });
    } else if (item.type === 'ranking') {
      out.push(`Prompt: ${item.prompt}`);
      out.push('Ranking (1 = most preferred):');
      resp.forEach((id, idx) => {
        const opt = item.items.find(i => i.id === id);
        out.push(`  ${idx + 1}. ${opt ? opt.label : id}`);
      });
    } else if (item.type === 'scenario_radio') {
      const opt = item.options.find(o => o.id === resp);
      out.push(`Prompt: ${item.prompt}`);
      out.push(`Picked: ${resp}. ${opt ? opt.text : ''}`);
    } else if (item.type === 'likert_single') {
      out.push(`Prompt: ${item.prompt}`);
      out.push(`Response: ${item.scale[parseInt(resp)]}`);
    } else if (item.type === 'likert_group') {
      item.items.forEach(s => {
        const v = resp[s.id];
        out.push(`"${s.statement}"`);
        out.push(`  Response: ${v !== undefined ? item.scale[parseInt(v)] : '(no response)'}`);
        out.push('');
      });
    } else if (item.type === 'sjt_best_worst') {
      out.push(`Prompt: ${item.prompt}`);
      item.options.forEach(o => out.push(`  ${o.id}: ${o.text}`));
      out.push(`Most like me: ${resp.best}`);
      out.push(`Least like me: ${resp.worst}`);
    } else if (item.type === 'sjt_with_short_response') {
      out.push(`Prompt: ${item.prompt}`);
      const opt = item.options.find(o => o.id === resp.choice);
      out.push(`Picked: ${resp.choice}. ${opt ? opt.text : ''}`);
      out.push('');
      out.push(`Followup: ${item.followupPrompt}`);
      out.push(`Response: ${resp.followup || ''}`);
    }

    out.push('');
    out.push('');
  });

  return out.join('\n');
}

// ==============================================================================
// MAIN APP
// ==============================================================================
export default function App() {
  useFonts();

  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [pilotId, setPilotId] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    async function load() {
      try {
        const saved = await window.storage.get(STORAGE_KEY);
        if (saved && saved.value) {
          const data = JSON.parse(saved.value);
          setResponses(data.responses || {});
          setIndex(data.index || 0);
          setPilotId(data.pilotId || '');
        }
      } catch (e) {
        // No saved state, that's fine
      }
      setHasLoaded(true);
    }
    load();
  }, []);

  // Save on every change
  useEffect(() => {
    if (!hasLoaded) return;
    async function save() {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ index, responses, pilotId }));
      } catch (e) {
        console.error('Save failed:', e);
      }
    }
    save();
  }, [index, responses, pilotId, hasLoaded]);

  // Scroll to top on index change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index]);

  async function resetAll() {
    try {
      await window.storage.delete(STORAGE_KEY);
    } catch (e) {}
    setResponses({});
    setIndex(0);
    setPilotId('');
  }

  const currentItem = ITEMS[index];
  const onBack = () => setIndex(Math.max(0, index - 1));
  const onContinue = () => setIndex(Math.min(ITEMS.length - 1, index + 1));

  // Progress: exclude consent / intro / pilot_id / summary from count shown
  const contentItems = ITEMS.filter(i => !['consent', 'intro', 'pilot_id', 'summary'].includes(i.type));
  const contentIndex = Math.max(0, ITEMS.slice(0, index + 1).filter(i => !['consent', 'intro', 'pilot_id', 'summary'].includes(i.type)).length);
  const progress = { current: contentIndex, total: contentItems.length };
  const hideProgress = ['consent', 'pilot_id', 'intro', 'summary'].includes(currentItem?.type);

  if (!hasLoaded) {
    return (
      <Page hideProgress>
        <div style={{ color: COLORS.inkSoft, fontSize: '14px' }}>Loading...</div>
      </Page>
    );
  }

  if (!currentItem) {
    return (
      <Page hideProgress>
        <div style={{ color: COLORS.error, fontSize: '14px' }}>Unknown screen. <button onClick={resetAll}>Reset</button></div>
      </Page>
    );
  }

  // ROUTE TO SCREEN
  let screen;
  if (currentItem.type === 'consent') {
    screen = <ConsentScreen onContinue={onContinue} />;
  } else if (currentItem.type === 'pilot_id') {
    screen = <PilotIdScreen value={pilotId} onChange={setPilotId} onBack={onBack} onContinue={onContinue} />;
  } else if (currentItem.type === 'intro') {
    screen = <IntroScreen onBack={onBack} onContinue={onContinue} />;
  } else if (currentItem.type === 'star') {
    screen = (
      <StarScreen
        item={currentItem}
        value={responses[currentItem.id]}
        onChange={(v) => setResponses({ ...responses, [currentItem.id]: v })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'forced_choice_group') {
    screen = (
      <ForcedChoiceGroup
        item={currentItem}
        values={responses[currentItem.id] || {}}
        onChange={(pairId, optKey) => setResponses({
          ...responses,
          [currentItem.id]: { ...(responses[currentItem.id] || {}), [pairId]: optKey },
        })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'ranking') {
    screen = (
      <RankingScreen
        item={currentItem}
        value={responses[currentItem.id]}
        onChange={(v) => setResponses({ ...responses, [currentItem.id]: v })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'scenario_radio') {
    screen = (
      <ScenarioRadioScreen
        item={currentItem}
        value={responses[currentItem.id]}
        onChange={(v) => setResponses({ ...responses, [currentItem.id]: v })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'likert_single') {
    screen = (
      <LikertSingle
        item={currentItem}
        value={responses[currentItem.id]}
        onChange={(v) => setResponses({ ...responses, [currentItem.id]: v })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'likert_group') {
    screen = (
      <LikertGroup
        item={currentItem}
        values={responses[currentItem.id] || {}}
        onChange={(sId, v) => setResponses({
          ...responses,
          [currentItem.id]: { ...(responses[currentItem.id] || {}), [sId]: v },
        })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'sjt_best_worst') {
    screen = (
      <SjtBestWorst
        item={currentItem}
        value={responses[currentItem.id]}
        onChange={(v) => setResponses({ ...responses, [currentItem.id]: v })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'sjt_with_short_response') {
    screen = (
      <SjtWithShortResponse
        item={currentItem}
        value={responses[currentItem.id]}
        onChange={(v) => setResponses({ ...responses, [currentItem.id]: v })}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  } else if (currentItem.type === 'summary') {
    screen = <SummaryScreen responses={responses} pilotId={pilotId} onReset={resetAll} />;
  }

  return (
    <Page progress={progress} hideProgress={hideProgress}>
      {screen}
    </Page>
  );
}
