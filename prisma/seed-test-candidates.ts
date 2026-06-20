/**
 * Test candidate seeding script
 * Creates 4 CEO candidates + 4 Marketing Engineer candidates for scoring validation
 * Run: npx tsx prisma/seed-test-candidates.ts
 */

import { PrismaClient, CandidateStage, InviteStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CEO_JOB_ID = "cmo2x24uj0000mj6j4gnq63wx";

// PsychometricItem IDs (from DB, in sortOrder)
const ITEMS = {
  CS1: "cmo3xr3sz0000t26jo9mzcqeg",
  CF1: "cmo3xr3sz0001t26jixyxnw8k",
  CF2: "cmo3xr3sz0002t26jg5dc8b66",
  CF3: "cmo3xr3sz0003t26jp8lg3koq",
  CF4: "cmo3xr3sz0004t26j5tylnslm",
  CF5: "cmo3xr3sz0005t26jrzgurah9",
  CF6: "cmo3xr3sz0006t26j3b8wrtzq",
  CF7: "cmo3xr3sz0007t26jw973euks",
  CS2: "cmo3xr3sz0008t26j749dhc3l",
  CS3: "cmo3xr3sz0009t26jefwzeehc",
  CF8: "cmo3xr3sz000at26jutp4ig7v",
  CF9: "cmo3xr3sz000bt26jin67lebb",
  CF10: "cmo3xr3sz000ct26jkta5iqpr",
  CF11: "cmo3xr3sz000dt26j8ah54ogs",
  CF12: "cmo3xr3sz000et26jpqo7tp2t",
  CF13: "cmo3xr3sz000ft26jyu1xwg7d",
  CT1: "cmo3xr3sz000gt26jsy23mi1p",
  CT2: "cmo3xr3sz000ht26jflusjqxl",
  CS4: "cmo3xr3sz000it26j9cju4eoa",
  CC1: "cmo3xr3sz000jt26jbbir7qpo",
  CC2: "cmo3xr3sz000kt26j3jp2iq6x",
  CR1: "cmo3xr3sz000lt26jmd0l0ujk",
};

// CEO role question IDs
const CEO_RQ = {
  q0: "cmo3hi5xk0001nc6j5hz1pvi6",
  q1: "cmo3hi5xk0002nc6j2giq6mb8",
  q2: "cmo3hi5xk0003nc6jjaq31lqp",
  q3: "cmo3hi5xk0004nc6jc68j30q2",
  q4: "cmo3hi5xk0005nc6jm5w9ipu2",
  q5: "cmo3hi5xk0006nc6jdtqyteug",
  q6: "cmo3hi5xk0007nc6jr2ts3uv0",
  q7: "cmo3hi5xk0008nc6j4ho6jztg",
  q8: "cmo3hi5xk0009nc6jqws0vn80",
  q9: "cmo3hi5xk000anc6jb063kx4i",
};

// Standard question IDs
const STD_Q = {
  q1: "cmo3wmnwf0000zr6jewsqp3ju",
  q2: "cmo3wmnwf0001zr6jt4jqvgy2",
  q3: "cmo3wmnwf0002zr6j8g4mgh39",
  q4: "cmo3wmnwf0003zr6jzuopoesd",
  q5: "cmo3wmnwf0004zr6jl1arg64a",
  q6: "cmo3wmnwf0005zr6j8renk89o",
};

// FC dimension mapping (itemId -> {A: dim, B: dim})
const FC_DIMS: Record<string, { A: string; B: string }> = {
  [ITEMS.CF1]: { A: "conscientiousness", B: "learning" },
  [ITEMS.CF2]: { A: "honesty_humility", B: "interpersonal" },
  [ITEMS.CF3]: { A: "composure", B: "learning" },
  [ITEMS.CF4]: { A: "conscientiousness", B: "motivation_autonomy" },
  [ITEMS.CF5]: { A: "honesty_humility", B: "conscientiousness" },
  [ITEMS.CF6]: { A: "learning", B: "interpersonal" },
  [ITEMS.CF7]: { A: "motivation_mission", B: "motivation_scope" },
  [ITEMS.CF8]: { A: "conscientiousness", B: "interpersonal" },
  [ITEMS.CF9]: { A: "honesty_humility", B: "motivation_recognition" },
  [ITEMS.CF10]: { A: "composure", B: "conscientiousness" },
  [ITEMS.CF11]: { A: "learning", B: "conscientiousness" },
  [ITEMS.CF12]: { A: "honesty_humility", B: "interpersonal" },
  [ITEMS.CF13]: { A: "motivation_autonomy", B: "motivation_stability" },
};

const T2_SCORES: Record<string, Record<string, number>> = {
  A: { honesty_humility: 2, conscientiousness: 1 },
  B: { honesty_humility: 1, conscientiousness: -1 },
  C: { honesty_humility: -1 },
  D: { honesty_humility: -2 },
};

function computePsychoScores(answers: Record<string, string | string[]>) {
  const fcTallies: Record<string, number> = {};
  let t2Scores: Record<string, number> = {};
  let t1Ranking: string[] = [];
  const ccValues: Record<string, number> = {};

  for (const [itemDbId, answer] of Object.entries(answers)) {
    if (FC_DIMS[itemDbId] && typeof answer === "string") {
      const dim = FC_DIMS[itemDbId][answer as "A" | "B"];
      if (dim) fcTallies[dim] = (fcTallies[dim] ?? 0) + 1;
    } else if (itemDbId === ITEMS.CT2 && typeof answer === "string") {
      t2Scores = T2_SCORES[answer] ?? {};
    } else if (itemDbId === ITEMS.CT1 && Array.isArray(answer)) {
      t1Ranking = answer;
    } else if ((itemDbId === ITEMS.CC1 || itemDbId === ITEMS.CC2) && typeof answer === "string") {
      const key = itemDbId === ITEMS.CC1 ? "C-CC1" : "C-CC2";
      ccValues[key] = parseInt(answer, 10);
    }
  }

  return { fcTallies, t2Scores, t1Ranking, ccValues };
}

type CandidateProfile = {
  name: string;
  email: string;
  token: string;
  jobId: string;
  roleAnswers: Record<string, string>;
  standardAnswers: Record<string, string>;
  psychoAnswers: Record<string, string | string[]>;
  finalReflection: string;
  coverLetter: string;
};

// ─── CEO CANDIDATE 1: STRONG ────────────────────────────────────────────────
const CEO_STRONG: CandidateProfile = {
  name: "Marcus Webb",
  email: "marcus.webb.test@yfs-test.internal",
  token: "ceo-strong-marcus-webb-001",
  jobId: CEO_JOB_ID,
  coverLetter: `I have spent the past eight years building and scaling organisations in the education and social enterprise space. As COO of Elevate Learning, I took us from 12 staff and £1.2m revenue to 47 staff and £5.8m over four years, while maintaining our Ofsted 'Outstanding' rating throughout. I understand what it means to hold quality and growth in tension, and I have done it repeatedly. Acme sits at exactly the intersection I find most compelling: rigorous pedagogy, entrepreneurial culture, and real impact on young people who don't always get access to this kind of environment. I want to build something that lasts.`,
  roleAnswers: {
    [CEO_RQ.q0]: `In the first 30 days, I listen before I lead. I would conduct structured interviews with every direct report, key funders, and at least 10 current or recent students. I would map the three or four decisions that are genuinely stuck and understand why. By day 60, I would have a clear picture of where we are strong, where we are fragile, and what the next 12 months need to look like. By day 90, I would have produced a single-page strategic frame agreed with the board, proposed a rhythm for how we communicate internally, and made at least one meaningful structural change that signals the pace and quality of decision-making I intend to set. Excellence in the first 90 days looks like credibility earned rather than authority asserted.`,
    [CEO_RQ.q1]: `When I joined Elevate Learning, student retention was at 61% and nobody could tell me exactly why students were dropping out. The data was fragmented across three systems and nobody owned the synthesis. I spent six weeks rebuilding the data picture from scratch — not by commissioning a report but by sitting in on sessions, calling former students, and pulling raw exports from the CRM myself. What I found was counterintuitive: the highest dropout rate was in our most popular programme, because students felt it was too easy and they were wasting their time. We redesigned the challenge curve of that programme, added a peer mentorship component, and within two cohorts retention climbed to 84%. The learning was that ambiguous problems almost always have a concrete cause buried underneath. You just have to be willing to go find it yourself rather than wait for someone to bring it to you.`,
    [CEO_RQ.q2]: `The strongest proof of work I would point to is the restructuring of Elevate's delivery model in 2022. We had grown by adding headcount every time demand increased, which meant our margin was eroding even as revenue grew. I proposed and executed a transition to a hub-and-facilitator model, where we trained external facilitators to deliver certain programmes under our quality framework, while keeping our core staff focused on curriculum design and QA. This was operationally complex — it required rebuilding our training system, our quality monitoring, and our contracts infrastructure from scratch. It was also unpopular internally because it felt like a threat to existing roles. I took the time to explain the reasoning, restructured two roles rather than eliminating them, and tied the model change to a pay review for core staff. Twelve months later, margin was up 11 points and we had expanded into three new regions without hiring a single additional full-time delivery person. That is the kind of structural thinking I would bring to Acme.`,
    [CEO_RQ.q3]: `Stop: I would stop any recurring meetings that do not have a clear owner, decision, or output. In my experience, organisations of Acme's size often have an accumulation of inherited rhythms that nobody questions. Start: I would start a monthly student advisory session — direct, unfiltered input from current participants about what is and is not working. Improve: I would improve how progress is communicated to funders and partners. Not by producing more reports, but by identifying the two or three metrics that actually matter to each stakeholder and making those visible in real time wherever possible.`,
    [CEO_RQ.q4]: `At Elevate, we were building a new programme with three co-funders who each had different theories of change. The DfE wanted measurable attainment outcomes. The local authority cared about community integration. Our charitable trust funder cared about young people's sense of agency and self-belief. These were not incompatible, but they required careful translation. I set up a joint steering group that met quarterly, but more importantly I set up individual relationships with each funder's lead contact where I could have honest conversations about what we were learning and what was hard. By the end of the programme, all three renewed. The key was that I never tried to make the same case to all three — I understood what each of them actually cared about and showed them evidence in that language.`,
    [CEO_RQ.q5]: `In a role like this, the most common collision is between moving fast enough to maintain momentum and maintaining the quality that makes Acme worth attending. My approach is to protect quality at the level of what students actually experience, and to be willing to compromise on everything upstream of that — internal processes, reporting formats, even how we present to partners. If the student experience is strong, everything else can be rebuilt. If we sacrifice quality at the delivery level to hit a growth number, we erode the thing that makes us worth growing.`,
    [CEO_RQ.q6]: `At Elevate, our admissions process was broken in a way nobody wanted to say out loud: we were accepting students who were not ready for our programmes because we needed the revenue, and it was undermining outcomes for everyone. I named the problem explicitly in a team meeting, which was uncomfortable. Then I worked with the head of admissions to design a clearer readiness rubric and a parallel 'preparation pathway' for students who were close but not quite ready. We piloted it for one term. Dropout in the affected cohorts fell from 34% to 11%. The process improvement was technical, but the breakthrough was having the courage to name what was actually happening first.`,
    [CEO_RQ.q7]: `My strengths in this role are strategic clarity, stakeholder navigation, and building internal cultures that are honest about what is working and what is not. I have done this in education contexts before and I know the terrain. Where I would need to learn quickly is the specifics of Acme's programmes — the pedagogy, the partnerships, the community — and I would prioritise that in my first 60 days. I would also want to understand the funding landscape more deeply, particularly any constraints or opportunities that are specific to Acme's positioning.`,
    [CEO_RQ.q8]: `In early 2021, our CRM vendor announced they were being acquired and our contract would not be renewed with six months' notice. Nobody had flagged this as a risk because our account manager had given us informal reassurances that turned out to be wrong. I found out at 9pm on a Tuesday when I saw the press release. By the following morning I had mapped our three most viable migration options, drafted a risk brief for the board, and had a preliminary call with two alternative vendors. I did not wait to be asked. I knew that if I let this sit it would become a crisis rather than a managed transition. We completed the migration on time and under budget.`,
    [CEO_RQ.q9]: `The most important challenge in running a small organisation like Acme is making sure that growth does not erode the thing that makes it special. The risk is that as you add structure, hire more people, and respond to funders' reporting requirements, you slowly build a machine that produces outputs rather than an environment that produces genuine transformation. My approach would be to stay close to students throughout — not as a symbolic gesture but as a genuine source of signal. And to be honest with the board and with myself when I see drift happening, even when the metrics still look good.`,
  },
  standardAnswers: {
    [STD_Q.q1]: `When I joined Elevate, I noticed that our longest-serving facilitators were consistently delivering better outcomes than newer hires, but nobody had documented what they were doing differently. I proposed a peer observation programme where senior facilitators shadowed newer ones and captured their practice in structured notes. What emerged was a set of facilitation patterns — about how to handle conflict, how to re-engage disengaged students, how to pace a session — that had never been written down. I turned these into a facilitation handbook that became part of our onboarding. New facilitator retention improved by 40% in the first year, partly because people felt more supported and less lost.`,
    [STD_Q.q2]: `In 2020 I led the launch of a digital programme that I was convinced would be transformative. I had designed it carefully, consulted with students, and the team was excited. It launched to 60 participants and within three weeks the completion rate was under 20%. I had fundamentally misread how this cohort wanted to learn. They needed human contact and accountability, and a self-paced digital format was wrong for them regardless of the content quality. I paused the programme, spoke directly to participants, and rebuilt it as a blended model with live sessions. I also wrote an honest post-mortem that I shared with the whole team. The rebuild worked — completion climbed to 78% — but the original failure was mine, and I had to own it clearly before we could move forward.`,
    [STD_Q.q3]: `Over the past two years I have taught myself financial modelling well enough to build our own three-year forecast model rather than outsourcing it to our finance consultant. I realised that every time I relied on someone else to model scenarios, I was one step removed from understanding the decisions. I learned by doing — building models, breaking them, asking the consultant to review them and explain what I had got wrong. I am not a finance expert, but I now understand our numbers well enough to stress-test assumptions myself and to have honest conversations with the board about risk without needing an interpreter.`,
    [STD_Q.q4]: `Our board chair was convinced we should apply for a particular government grant that would have required us to significantly alter our delivery model. I thought the terms were wrong for us — the reporting burden was heavy, the geographic constraints would limit our best partnerships, and the reputational fit was awkward. I said so, clearly and directly, in a board meeting. I had prepared a one-page brief showing the cost-benefit analysis and the risks I was concerned about. The chair pushed back initially, but I held my position because I had the evidence. After further discussion, the board agreed not to apply. We subsequently found a better-fit funder who gave us more flexibility and a stronger relationship. Disagreement done well is one of the most valuable things a leadership team can do.`,
    [STD_Q.q5]: `The most ambitious thing I have attempted was proposing and then delivering a complete restructure of Elevate's delivery model while maintaining operations throughout. We moved from a headcount-based model to a hub-and-facilitator model in 18 months without a single programme cancellation. I was not certain it would work. There were moments when key staff considered leaving, when the technology did not behave as expected, and when funder confidence wobbled. What drove me to try it was the conviction that if we did not change the model, the organisation would slowly become less and less able to do the work it existed to do. The financial pressure would eventually force quality compromises. I would rather attempt a difficult change with honest intent than manage a slow decline with comfortable explanations.`,
    [STD_Q.q6]: `In five years I want to be leading an organisation that has demonstrated that high-quality entrepreneurship education can be both financially sustainable and genuinely transformative at scale. I am not attached to a particular title. What I care about is building something that proves the model works — that you can run a rigorous, values-driven programme, maintain financial discipline, and produce young people who go on to do things that matter. This role connects directly to that because Acme has the brand, the community, and the methodology to be that proof of concept. I want to be the person who takes it there.`,
  },
  psychoAnswers: {
    // STAR responses
    [ITEMS.CS1]: `In Q3 of last year I was leading the implementation of a new CRM system for our 85-person organisation. Six weeks into an eight-week rollout, the primary data migration vendor informed us they were going into administration and could not complete the work. We had already migrated 40% of our historical client data and the team was partially live on the new system, creating a painful dual-system situation where nobody had full visibility of their client history.

I called an emergency meeting with my project team within two hours of receiving the news. Rather than defaulting to panic, I mapped three concrete options: find an emergency replacement vendor; build the bridge internally using our existing engineering resource; or revert to legacy and restart. Within 24 hours I had spoken to four alternative vendors, got preliminary quotes, and realised that option two was 40% faster if I could free up two engineers for three weeks. I negotiated a temporary reallocation with the CTO by showing the exact cost of delay in lost team productivity — about £18,000 per additional week.

We completed the migration eleven days late rather than the six weeks that would have resulted from bringing in a new vendor. I wrote a post-mortem documenting what failed in our vendor vetting process — specifically that we had not checked financial stability as part of procurement. The CEO referenced it in the next quarterly board meeting as an example of how to manage operational crises. The post-mortem also resulted in a new supplier due diligence checklist that we have used for every major procurement since.`,
    [ITEMS.CS2]: `In early 2022 I presented revenue projections to our board that I had based on a contract renewal I had believed was very close to confirmed. Three days after the board meeting, the contract fell through — the funder had decided to change priorities. The projections I had presented were now materially wrong by about £340,000.

I called an emergency board call the following week. I did not try to soften the message or frame it as something that had happened to us. I said clearly: I presented numbers that turned out to be wrong, and here is what I knew and did not know at the time I presented them. I outlined the impact on our financial position and presented three scenarios for how we could respond — cost reduction, emergency fundraising, or a combination.

The board was initially frustrated, which was fair. What helped us move forward was that I had already taken two concrete steps: I had spoken to the funder to understand exactly what had changed, and I had had a preliminary conversation with two other potential funders about accelerated timelines. We ended up securing replacement funding within eight weeks, at slightly better terms. The harder lesson I took from this was about how I communicate uncertainty — I should have flagged the contract as probabilistic rather than near-certain in the original presentation, and I changed how I report pipeline assumptions to the board after that.`,
    [ITEMS.CS3]: `About 18 months ago I was convinced we needed to expand our provision into a new region — I had done market analysis, spoken to local schools, and believed the demand was clear. A junior member of my team, who had been in post for about six months, came to me with a counterargument. She had noticed that our NPS scores in our existing regions were improving rapidly and argued that we were at a point where expanding too quickly would risk the quality that was driving those scores. She had data showing that our two previous regional expansions had both been followed by temporary drops in satisfaction ratings in existing regions.

My initial instinct was to acknowledge her concern and proceed anyway. But I sat with it for two days and looked more carefully at the satisfaction data she had flagged. She was right. The pattern was real and I had not weighed it seriously enough. I went back to her and told her she had changed my thinking — not as a diplomatic gesture but because she had. We delayed the expansion by six months, invested instead in consolidating quality in our existing regions, and when we did expand it went significantly better than the two previous attempts. I also restructured her role to give her more formal responsibility for quality monitoring, because the episode showed me she had a different and valuable perspective.`,
    [ITEMS.CS4]: `About two years ago I had to deliver feedback to our head of programmes, who was one of our most experienced and well-liked staff members. The feedback was that her communication style in cross-team meetings was having a silencing effect on junior staff — people were holding back contributions because her manner could be dismissive, even when that was not her intent. I knew she would find this difficult to hear because she cared deeply about her work and her relationships with the team.

I asked to meet one-to-one with a clear agenda: I wanted to talk about something that had come up in several conversations and that I thought was important. I was specific — I gave her two concrete examples of moments I had observed where someone had visibly withdrawn after her response. I was also honest that this was coming from multiple sources, not just my own observation. I was not trying to soften the message, but I did try to be precise rather than general.

She was initially defensive, which I had expected. I did not back down or overqualify, but I also did not push harder — I let the specifics speak. Within about 20 minutes she had shifted. She said she had sensed some distance in the team and had not understood why. She asked for a follow-up conversation the following week after she had had time to think. Over the next six weeks she made visible changes — she started asking more questions in meetings and checking in with junior staff after sessions. Two team members commented unsolicited that something had shifted. She thanked me three months later for being direct.`,
    // FC answers
    [ITEMS.CF1]: "A",
    [ITEMS.CF2]: "A",
    [ITEMS.CF3]: "A",
    [ITEMS.CF4]: "A",
    [ITEMS.CF5]: "A",
    [ITEMS.CF6]: "A",
    [ITEMS.CF7]: "A",
    [ITEMS.CF8]: "A",
    [ITEMS.CF9]: "A",
    [ITEMS.CF10]: "A",
    [ITEMS.CF11]: "B",
    [ITEMS.CF12]: "A",
    [ITEMS.CF13]: "A",
    [ITEMS.CT1]: ["mission", "scope", "autonomy", "stability"],
    [ITEMS.CT2]: "A",
    [ITEMS.CC1]: "1",
    [ITEMS.CC2]: "1",
    [ITEMS.CR1]: `Colleagues would say I follow through on what I say I will do, even when circumstances change and it would be easier not to. They would also say I am still working on slowing down when I am excited about a plan — I can move faster than the team is ready for, and I have learned to be more deliberate about checking for genuine alignment rather than surface agreement.`,
  },
  finalReflection: `I am applying because I believe Acme is doing something genuinely rare — building an environment where young people encounter real entrepreneurial thinking, not just inspiration. The combination of rigour, community, and practical focus is exactly what I would want to help scale. I bring eight years of building in this space, a track record of structural change that holds quality intact, and a clear head about what organisations like this need from a CEO at this stage of their growth. I want to build something that proves the model.`,
};

// ─── CEO CANDIDATE 2: MEDIOCRE ───────────────────────────────────────────────
const CEO_MEDIOCRE: CandidateProfile = {
  name: "Patricia Wu",
  email: "patricia.wu.test@yfs-test.internal",
  token: "ceo-mediocre-patricia-wu-002",
  jobId: CEO_JOB_ID,
  coverLetter: `I am excited to apply for the CEO position at Acme Academy. I have a background in programme management and have worked in the education sector for several years. I am passionate about young people and believe in the power of entrepreneurship education. I am a strong communicator and have led teams through various challenges. I look forward to bringing my skills and experience to Acme.`,
  roleAnswers: {
    [CEO_RQ.q0]: `In the first 90 days I would focus on getting to know the team and understanding the organisation's priorities. I would meet with key stakeholders and get a sense of what is working well and what could be improved. I would also look at the financials and the strategic plan to understand where Acme is heading. By the end of 90 days I would have a clearer picture and be ready to share my initial thoughts with the board.`,
    [CEO_RQ.q1]: `A few years ago I was managing a programme that had some challenges with delivery. The scope wasn't entirely clear and different stakeholders had different expectations. I brought the team together and we had a series of workshops to align on priorities. It took a while but eventually we got to a place where everyone was on the same page. The programme completed successfully, though a bit behind schedule.`,
    [CEO_RQ.q2]: `I think my strongest proof of work is my track record of building positive team cultures and delivering programmes on time. I have consistently received good feedback from stakeholders and my teams have been high-performing. I have also developed a number of processes and frameworks that have improved how my organisations work.`,
    [CEO_RQ.q3]: `I would want to understand the organisation first before making changes. That said, I would look to improve communication and make sure everyone knows what is expected of them. I might start some regular check-ins with the team. I would be cautious about stopping things without fully understanding why they exist.`,
    [CEO_RQ.q4]: `I have worked on several multi-stakeholder projects. The key is communication and making sure everyone feels heard. In one project I set up a regular stakeholder call and made sure to share updates frequently. It took effort to manage different priorities but by the end all stakeholders were satisfied with the outcome.`,
    [CEO_RQ.q5]: `These trade-offs are always difficult. I tend to take a balanced approach, trying to be realistic about what is achievable. Sometimes you have to accept that you can't do everything perfectly and prioritise accordingly. I would involve the team in these decisions so that everyone has input and feels ownership.`,
    [CEO_RQ.q6]: `In a previous role our reporting process was quite manual and took a lot of staff time. I worked with the team to introduce some templates and a shared tracker. It wasn't a perfect solution but it reduced the time spent on reporting by about a quarter. We measured success by tracking how long the process took each month.`,
    [CEO_RQ.q7]: `I think I bring strong interpersonal skills and experience managing teams. I am good at building consensus and keeping people motivated. Where I would need to learn quickly is the specific context of Acme — the programmes, the partnerships, and the funding landscape. I am a fast learner and would make this a priority.`,
    [CEO_RQ.q8]: `There was a situation at my previous organisation where I noticed that two teams were duplicating work because they weren't communicating. I raised it with my manager and suggested we set up a coordination meeting. My manager agreed and I facilitated the first few sessions until it became self-sustaining.`,
    [CEO_RQ.q9]: `The most important challenge is probably sustainable growth — making sure Acme can reach more young people without losing what makes it special. I would approach this by being strategic about partnerships and funding, and by making sure the team is resourced and supported.`,
  },
  standardAnswers: {
    [STD_Q.q1]: `In a previous role I noticed that handovers between teams were causing delays because there was no standard process. I brought it up in a team meeting and we agreed to create a simple handover template. It wasn't a major initiative but it made the process smoother and people appreciated having more clarity.`,
    [STD_Q.q2]: `I once led a project that didn't go as planned because we underestimated the time required. We fell behind schedule and had to request an extension from the funder. It was a difficult conversation but the funder was understanding. I learned the importance of building more buffer into project plans and being more proactive with stakeholders when things are at risk.`,
    [STD_Q.q3]: `I have been developing my skills in data analysis using Excel and some basic dashboard tools. I taught myself through online tutorials and by experimenting. I pursued it because I felt I needed to be more confident with data to support decision-making. It is an area I am still developing.`,
    [STD_Q.q4]: `I once disagreed with a senior colleague about the priority of a particular workstream. I shared my view respectfully in a team meeting but ultimately the decision went the other way. I accepted the decision and focused on making the chosen approach work as well as possible.`,
    [STD_Q.q5]: `I think the most ambitious thing I have attempted is moving into a programme leadership role when I felt I wasn't fully ready. I pushed myself to take on the responsibility and worked hard to develop quickly. It was challenging at times but I grew significantly.`,
    [STD_Q.q6]: `In five years I would like to be leading an organisation where I can make a real difference to young people's opportunities. This role connects to that because Acme is doing impactful work and I want to contribute to its growth.`,
  },
  psychoAnswers: {
    [ITEMS.CS1]: `There was a project at my previous organisation that ran into some difficulties partway through. We had set up a new delivery model but the timeline slipped because of some challenges with team capacity and some external factors that were outside our control. I worked with the team to reprioritise and we had some conversations about what was realistic. We ended up adjusting the scope slightly and delivering a version of the project that met the core requirements. It wasn't exactly what we had planned but the stakeholders were broadly satisfied and we learned a lot from the process.`,
    [ITEMS.CS2]: `I made a mistake once where I gave a stakeholder some information that turned out to be inaccurate. It wasn't intentional — I had been working from data that I later discovered was out of date. When I realised the error I let the stakeholder know and we worked through it together. It was an uncomfortable situation but the stakeholder was understanding. I took from it the importance of double-checking data sources before sharing information externally.`,
    [ITEMS.CS3]: `I had a situation where a colleague raised concerns about an approach I was taking on a project. They had some valid points that I hadn't fully considered. After reflecting on what they said I agreed that some adjustments were needed and we made them. It was a good example of how collaboration improves outcomes.`,
    [ITEMS.CS4]: `I had to have a difficult conversation with a team member about some performance issues. I prepared carefully and tried to be constructive in my feedback. The conversation was difficult but I think they took it reasonably well. We agreed on some steps forward and I followed up regularly afterwards.`,
    [ITEMS.CF1]: "B",
    [ITEMS.CF2]: "B",
    [ITEMS.CF3]: "B",
    [ITEMS.CF4]: "B",
    [ITEMS.CF5]: "B",
    [ITEMS.CF6]: "B",
    [ITEMS.CF7]: "B",
    [ITEMS.CF8]: "B",
    [ITEMS.CF9]: "A",
    [ITEMS.CF10]: "B",
    [ITEMS.CF11]: "B",
    [ITEMS.CF12]: "B",
    [ITEMS.CF13]: "B",
    [ITEMS.CT1]: ["autonomy", "stability", "scope", "mission"],
    [ITEMS.CT2]: "B",
    [ITEMS.CC1]: "3",
    [ITEMS.CC2]: "3",
    [ITEMS.CR1]: `Colleagues would probably say I am reliable and easy to work with. I think they might also say I could be more decisive at times.`,
  },
  finalReflection: `I am excited about the opportunity to lead Acme and believe I can make a positive contribution. I bring a genuine passion for the mission and a track record of working well with teams and stakeholders. I look forward to the possibility of discussing this further.`,
};

// ─── CEO CANDIDATE 3: UNSUITABLE (Blame-shifter) ────────────────────────────
const CEO_UNSUITABLE_1: CandidateProfile = {
  name: "Robert Kane",
  email: "robert.kane.test@yfs-test.internal",
  token: "ceo-unsuitable1-robert-kane-003",
  jobId: CEO_JOB_ID,
  coverLetter: `I am a senior professional with extensive experience across multiple sectors and I believe I bring exactly what Acme needs at this stage of its journey. I have a strong track record of high-profile roles and I am known for my strategic vision and ability to inspire teams. I am very interested in the CEO position and am confident I can take Acme to the next level.`,
  roleAnswers: {
    [CEO_RQ.q0]: `Excellent performance in the first 90 days means establishing my presence and making sure the team understands my vision. I would hold all-hands sessions, meet external stakeholders, and present my strategic vision to the board. By day 90 I would have a clear roadmap that I've communicated widely. People need to know who's in charge and where we're going.`,
    [CEO_RQ.q1]: `I was leading a complex transformation programme at a large organisation and the challenge was that my predecessor had left things in a very difficult state. The culture was poor, the processes were broken, and the team morale was low. I came in and took charge, restructured the team, and began implementing a proper management framework. It took about 18 months but we turned it around significantly. The key was strong leadership and clear direction.`,
    [CEO_RQ.q2]: `My strongest proof of work is my reputation. I have been headhunted multiple times and have consistently delivered results in challenging environments. I have a wide network across the education and charity sectors and I am known as someone who gets things done. I have also spoken at several conferences and have been recognised for my thought leadership.`,
    [CEO_RQ.q3]: `I would immediately stop any initiatives that are not delivering results. I would start a proper strategic planning process with clear KPIs and accountability. I would improve the communication structures so that everyone is aligned with my vision. Organisations often drift without strong leadership and I would correct that quickly.`,
    [CEO_RQ.q4]: `Stakeholder management is really about confidence and presence. When stakeholders see that you know what you're doing and that you're in control, trust comes naturally. I have always found that being confident and articulate in meetings is the most important thing. I tend to take charge of rooms and people respond to that.`,
    [CEO_RQ.q5]: `When speed, quality, and resources collide, the answer is strong leadership. Someone has to make the call and be accountable for it. I am comfortable making tough decisions quickly. In my experience, organisations that struggle with these trade-offs lack decisive leadership. I provide that.`,
    [CEO_RQ.q6]: `I have improved many broken processes over my career. In one organisation the issue was really about accountability — nobody owned anything. I introduced a clear RACI matrix and held people to it. The process improved but honestly the bigger issue was that the previous leadership hadn't held people accountable. Once I fixed the culture, the processes fixed themselves.`,
    [CEO_RQ.q7]: `My strengths are vision, leadership presence, and the ability to operate at a high level with boards and senior stakeholders. I am very strong at strategy and at building external profile for an organisation. The area where I would rely on others is operational detail — I see my role as setting direction and letting talented people execute.`,
    [CEO_RQ.q8]: `I have numerous examples of going above and beyond. I am naturally someone who sees what needs to be done and does it without being asked. In fact, I find it frustrating when people wait to be told what to do. I believe in taking initiative and I have built that culture in every team I have led.`,
    [CEO_RQ.q9]: `The most important challenge is external visibility and fundraising. Acme needs a CEO who can open doors and bring in significant funding. I have those relationships and that credibility. I would focus heavily on growing the organisation's profile and income.`,
  },
  standardAnswers: {
    [STD_Q.q1]: `I have spotted many problems that others missed throughout my career. It's part of being a strategic thinker. In one role I identified that the board was receiving information that was too filtered and sanitised. I restructured the reporting process so that the board got more direct information. Some people in the organisation were uncomfortable with this but it was the right thing to do.`,
    [STD_Q.q2]: `Most projects that go wrong do so because of other people failing to deliver. In one case I was leading a programme that fell behind because a key contractor let us down. I escalated immediately and managed the situation. We recovered but it cost us time and resource. The learning was really about the importance of choosing the right partners.`,
    [STD_Q.q3]: `I am constantly developing myself. I read widely, attend conferences, and maintain a large network. I think learning is about exposure to ideas and to other high-performing leaders. I recently completed an executive education programme at a business school which reinforced many of my existing approaches.`,
    [STD_Q.q4]: `I rarely disagree with seniors because I am usually the most senior person in the room. When I was earlier in my career there were times I thought leaders were making mistakes. I generally found it most effective to work around poor decisions rather than challenge them directly, and to position myself to be promoted to a level where I could make better decisions.`,
    [STD_Q.q5]: `The most ambitious thing I have attempted is taking on a CEO role in a very challenging context and turning the organisation around. It was difficult and there were moments of doubt, but I had the resilience and the self-belief to see it through. I think ambition and self-confidence are the foundations of achievement.`,
    [STD_Q.q6]: `In five years I see myself at the helm of a significantly larger and more influential organisation. I want to build Acme into a nationally recognised brand and a destination for top talent. I would want to expand revenue significantly and establish the organisation as a leader in the field.`,
  },
  psychoAnswers: {
    [ITEMS.CS1]: `We were running a large programme and the timeline slipped significantly. To be honest, the main issue was that my team didn't deliver what they were supposed to. I had given clear direction and the expectations were well communicated, but the execution was poor. I had to step in personally to salvage the situation and we eventually got it back on track. It was frustrating because it could have been avoided if people had just done what they were asked. I put stronger accountability measures in place afterwards.`,
    [ITEMS.CS2]: `There was a situation where some information I had shared turned out to be less accurate than expected. This happened because I was relying on data that had been provided to me by the finance team, which contained errors I wasn't aware of. When the issue came to light I addressed it quickly and made clear where the error had originated. We corrected the situation and I ensured better quality control around data in future. It was frustrating to be caught out by other people's mistakes.`,
    [ITEMS.CS3]: `I can think of a time when a stakeholder raised concerns about my approach. I listened carefully and acknowledged their perspective. I made some small adjustments to how I communicated the plan, which seemed to satisfy them. I'm generally quite good at reading people and finding ways to bring them on board without fundamentally changing direction.`,
    [ITEMS.CS4]: `I had to manage a situation where a team member was not performing. I gave them very clear feedback about what was not working and what the consequences would be if things didn't improve. They were quite defensive at first but I held firm. Eventually they either improved or moved on. I don't recall exactly. These conversations are difficult but necessary and I don't avoid them.`,
    [ITEMS.CF1]: "B",
    [ITEMS.CF2]: "B",
    [ITEMS.CF3]: "B",
    [ITEMS.CF4]: "B",
    [ITEMS.CF5]: "B",
    [ITEMS.CF6]: "B",
    [ITEMS.CF7]: "B",
    [ITEMS.CF8]: "B",
    [ITEMS.CF9]: "B",
    [ITEMS.CF10]: "B",
    [ITEMS.CF11]: "A",
    [ITEMS.CF12]: "B",
    [ITEMS.CF13]: "B",
    [ITEMS.CT1]: ["scope", "autonomy", "stability", "mission"],
    [ITEMS.CT2]: "D",
    [ITEMS.CC1]: "4",
    [ITEMS.CC2]: "4",
    [ITEMS.CR1]: `Colleagues would say I am strategic and decisive. Some might say I move too fast, but I think that's usually because they're not used to high standards.`,
  },
  finalReflection: `I believe I am exactly what Acme needs at this stage. I have the profile, the relationships, and the ambition to take this organisation to a new level. I look forward to exploring this opportunity.`,
};

// ─── CEO CANDIDATE 4: UNSUITABLE (Self-serving, low honesty) ────────────────
const CEO_UNSUITABLE_2: CandidateProfile = {
  name: "Amanda Fox",
  email: "amanda.fox.test@yfs-test.internal",
  token: "ceo-unsuitable2-amanda-fox-004",
  jobId: CEO_JOB_ID,
  coverLetter: `I have a passionate interest in education and have always been drawn to organisations that are doing something different. I am a creative thinker with a positive attitude and a strong desire to make an impact. I am very organised, great with people, and am always looking for the next challenge. I believe my energy and enthusiasm would be a great fit for Acme.`,
  roleAnswers: {
    [CEO_RQ.q0]: `Excellent performance in the first 90 days means making a strong impression and showing the team, board, and stakeholders that Acme has found the right person. I would host listening sessions, create a lot of energy and enthusiasm, and quickly build a strong personal brand within the organisation. I would be very visible and communicative. By day 90, everyone should feel excited about the direction we're heading.`,
    [CEO_RQ.q1]: `I was once faced with an ambiguous brief for a new programme. Nobody really knew what success looked like and there were conflicting opinions. I jumped in with a lot of energy and started pulling people together. I organised workshops, created lots of content, and generated a lot of excitement. The programme launched and got really good feedback initially. There were some challenges later but the initial momentum I created was really valuable.`,
    [CEO_RQ.q2]: `My strongest proof of work is the culture I have built everywhere I have worked. People love working with me and I always leave teams happier and more energised than when I found them. I have dozens of testimonials from colleagues and people I have managed. The human side of leadership is my superpower.`,
    [CEO_RQ.q3]: `I would start bringing a lot of positive energy and new ideas. I would stop any negativity or resistance to change — there's no room for that in a high-growth organisation. I would improve how we celebrate wins and recognise the team. Culture is everything and I would make it a priority from day one.`,
    [CEO_RQ.q4]: `I find stakeholder relationships easy. I am naturally warm, energetic, and people are drawn to me. I make a strong impression in meetings and I follow up well. In my experience the biggest factor in stakeholder management is likeability and being memorable. I am both.`,
    [CEO_RQ.q5]: `I believe strongly in the power of optimism. When everything feels like it's in tension, I bring energy and positivity to unlock it. I rally the team, help people see opportunities rather than constraints, and usually we find a way to do more than we thought was possible. I thrive in complex situations.`,
    [CEO_RQ.q6]: `I once inherited a team that had very low morale and broken processes. I came in and immediately started rebuilding the culture — lots of team events, recognition, and making people feel valued. Once the culture improved, the processes sort of fixed themselves because people were more motivated. The metrics that mattered were NPS and team happiness scores.`,
    [CEO_RQ.q7]: `My absolute greatest strength is inspiring people and creating momentum. I am also strong at external communications and building profile. Where I might need support is in very detailed financial analysis — I am a big picture person. But I believe strongly in hiring people who are better than you at specific things.`,
    [CEO_RQ.q8]: `I am constantly taking initiative without being asked. I am wired that way. I have started projects, built communities, and created new initiatives at every organisation I have worked at. I don't wait for permission. I am known for making things happen.`,
    [CEO_RQ.q9]: `The most important challenge is making Acme an irresistible brand — the place where the most ambitious young founders want to go. I would invest heavily in profile, media, and events. If the brand is right, everything else follows.`,
  },
  standardAnswers: {
    [STD_Q.q1]: `I noticed once that a team I joined was struggling to articulate its impact clearly. Nobody had done a good job of telling the story. I took it upon myself to create a deck that showcased our work in a compelling way. It was really well received and the CEO asked me to present it to funders. I'm good at spotting those kinds of communication opportunities.`,
    [STD_Q.q2]: `A project I led once ran into some unexpected challenges and didn't quite deliver on all its original goals. But I think it's important to focus on the learnings and the positives. We built great relationships, raised the profile of the organisation, and the team learned a lot. Not everything goes perfectly and I think resilience and keeping spirits high is the most important thing in those moments.`,
    [STD_Q.q3]: `I am always learning. I consume a huge amount of content — podcasts, books, events. I recently started learning about AI and its applications in education which I think is a very exciting space. I am naturally curious and I think that's one of my best qualities.`,
    [STD_Q.q4]: `I don't often disagree with people more senior than me because I tend to see their perspective and can usually find merit in their view. If I have concerns I tend to express them in a way that is positive and constructive rather than as a disagreement. I think relationships are too important to damage with conflict.`,
    [STD_Q.q5]: `The most ambitious thing I have attempted is leaving a very secure and well-paying corporate role to go into the social enterprise space. It was a big leap and people thought I was crazy. But I believed in what I was doing and it has worked out. I think that kind of courage and belief in yourself is what ambition really looks like.`,
    [STD_Q.q6]: `In five years I want to be known as someone who has built something meaningful and made a real difference. I want Acme to be a nationally celebrated institution and I want to have played a significant role in that. I am excited about the visibility and recognition that comes with a high-profile role like this.`,
  },
  psychoAnswers: {
    [ITEMS.CS1]: `I was running a project that hit some difficulties because of things outside my control — a supplier issue and some internal capacity constraints. I kept the energy high in the team throughout, which I think was really important. I held regular check-ins, celebrated small wins, and made sure nobody lost confidence. We ended up delivering something we were proud of even if it wasn't exactly what we originally planned. The feedback was really positive.`,
    [ITEMS.CS2]: `There was a moment where I had overcommitted on a deliverable and it became clear we weren't going to hit the original date. I framed it positively with the stakeholder — I told them that rather than rushing something that wasn't ready, I was choosing to deliver something excellent slightly later. They actually appreciated that framing and gave us the extra time. I think how you communicate setbacks is everything.`,
    [ITEMS.CS3]: `I am very open to other people's views and I actively seek out different perspectives. When someone has pushed back on me I always take it seriously and look for the kernel of truth in what they're saying. I then usually incorporate some elements of their thinking, which means they feel heard even if the overall direction stays similar. I'm good at finding synthesis.`,
    [ITEMS.CS4]: `I don't avoid difficult conversations but I believe in delivering feedback in a way that keeps the relationship intact. I once had to give feedback to a colleague about something sensitive. I focused on the positive aspects of their work first, then raised the issue in a way that felt more like an observation than a criticism. They thanked me for being thoughtful about it. I think emotional intelligence is everything in these moments.`,
    [ITEMS.CF1]: "A",
    [ITEMS.CF2]: "B",
    [ITEMS.CF3]: "A",
    [ITEMS.CF4]: "A",
    [ITEMS.CF5]: "B",
    [ITEMS.CF6]: "B",
    [ITEMS.CF7]: "B",
    [ITEMS.CF8]: "B",
    [ITEMS.CF9]: "B",
    [ITEMS.CF10]: "A",
    [ITEMS.CF11]: "B",
    [ITEMS.CF12]: "B",
    [ITEMS.CF13]: "A",
    [ITEMS.CT1]: ["scope", "autonomy", "stability", "mission"],
    [ITEMS.CT2]: "C",
    [ITEMS.CC1]: "5",
    [ITEMS.CC2]: "5",
    [ITEMS.CR1]: `Colleagues would say I bring energy and positivity to everything I do. They might also say I sometimes get ahead of myself, but I think that's part of being a natural leader.`,
  },
  finalReflection: `I am genuinely excited about Acme and believe I could be transformative in this role. I bring passion, energy, and a powerful network. I am ready for the challenge and I know I can make a real impact.`,
};

async function createCandidate(profile: CandidateProfile, label: string) {
  console.log(`\nCreating ${label}: ${profile.name}...`);

  // Verify job exists
  const job = await prisma.job.findUnique({ where: { id: profile.jobId } });
  if (!job) throw new Error(`Job not found: ${profile.jobId}`);

  // Delete existing if re-running
  const existingInvite = await prisma.invite.findUnique({ where: { token: profile.token } });
  if (existingInvite) {
    const existingCandidate = await prisma.candidate.findFirst({ where: { inviteId: existingInvite.id } });
    if (existingCandidate) {
      await prisma.submission.deleteMany({ where: { candidateId: existingCandidate.id } });
      await prisma.candidate.delete({ where: { id: existingCandidate.id } });
    }
    await prisma.invite.delete({ where: { id: existingInvite.id } });
  }

  // Create invite
  const invite = await prisma.invite.create({
    data: {
      jobId: profile.jobId,
      candidateName: profile.name,
      candidateEmail: profile.email,
      token: profile.token,
      status: InviteStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdByEmail: "seed@yfs-test.internal",
    },
  });

  // Create candidate
  const candidate = await prisma.candidate.create({
    data: {
      jobId: profile.jobId,
      inviteId: invite.id,
      name: profile.name,
      email: profile.email,
      stage: CandidateStage.COMPLETED,
      currentStage: 6,
      completionPercent: 100,
    },
  });

  // Compute psycho scores
  const psychoScores = computePsychoScores(profile.psychoAnswers);

  // Create submission
  await prisma.submission.create({
    data: {
      candidateId: candidate.id,
      consentGiven: true,
      consentAt: new Date(),
      coverLetter: profile.coverLetter,
      projects: [],
      roleAnswers: profile.roleAnswers,
      standardAnswers: profile.standardAnswers,
      psychoAnswers: profile.psychoAnswers,
      psychoScores,
      finalReflection: profile.finalReflection,
      submittedAt: new Date(),
    },
  });

  console.log(`  ✓ Created: ${profile.name} (candidateId: ${candidate.id})`);
  console.log(`  ✓ Token: ${profile.token}`);
  console.log(`  ✓ FC tallies: ${JSON.stringify(psychoScores.fcTallies)}`);
  console.log(`  ✓ T1 ranking: ${JSON.stringify(psychoScores.t1Ranking)}`);
  console.log(`  ✓ T2 scores: ${JSON.stringify(psychoScores.t2Scores)}`);
  console.log(`  ✓ CC values: ${JSON.stringify(psychoScores.ccValues)}`);

  return candidate;
}

async function main() {
  console.log("=== CEO Test Candidates Seeding ===");

  const results: Array<{ label: string; name: string; id: string; token: string }> = [];

  const strongCandidate = await createCandidate(CEO_STRONG, "STRONG CEO");
  results.push({ label: "STRONG", name: CEO_STRONG.name, id: strongCandidate.id, token: CEO_STRONG.token });

  const mediocreCandidate = await createCandidate(CEO_MEDIOCRE, "MEDIOCRE CEO");
  results.push({ label: "MEDIOCRE", name: CEO_MEDIOCRE.name, id: mediocreCandidate.id, token: CEO_MEDIOCRE.token });

  const unsuitable1 = await createCandidate(CEO_UNSUITABLE_1, "UNSUITABLE CEO #1");
  results.push({ label: "UNSUITABLE_1", name: CEO_UNSUITABLE_1.name, id: unsuitable1.id, token: CEO_UNSUITABLE_1.token });

  const unsuitable2 = await createCandidate(CEO_UNSUITABLE_2, "UNSUITABLE CEO #2");
  results.push({ label: "UNSUITABLE_2", name: CEO_UNSUITABLE_2.name, id: unsuitable2.id, token: CEO_UNSUITABLE_2.token });

  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`${r.label}: ${r.name}`);
    console.log(`  Admin URL: /admin/candidates/${r.id}`);
    console.log(`  Token: ${r.token}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
