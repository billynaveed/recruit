/**
 * Marketing Engineer job creation + test candidates seeding script
 * Creates the Marketing Engineer job + 4 test candidates
 * Run: npx tsx prisma/seed-marketing-engineer.ts
 */

import { PrismaClient, CandidateStage, InviteStatus, JobStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Item IDs (same as CEO candidates)
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

const STD_Q = {
  q1: "cmo3wmnwf0000zr6jewsqp3ju",
  q2: "cmo3wmnwf0001zr6jt4jqvgy2",
  q3: "cmo3wmnwf0002zr6j8g4mgh39",
  q4: "cmo3wmnwf0003zr6jzuopoesd",
  q5: "cmo3wmnwf0004zr6jl1arg64a",
  q6: "cmo3wmnwf0005zr6j8renk89o",
};

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

async function createMarketingEngineerJob(): Promise<{ jobId: string; roleQuestionIds: Record<string, string> }> {
  console.log("\nCreating Marketing Engineer job...");

  const existing = await prisma.job.findFirst({ where: { title: "Marketing Engineer" } });
  if (existing) {
    console.log(`  Job already exists: ${existing.id}`);
    const rqs = await prisma.jobRoleQuestion.findMany({ where: { jobId: existing.id }, orderBy: { sortOrder: "asc" } });
    const ids: Record<string, string> = {};
    rqs.forEach((q, i) => { ids[`q${i}`] = q.id; });
    return { jobId: existing.id, roleQuestionIds: ids };
  }

  const job = await prisma.job.create({
    data: {
      title: "Marketing Engineer",
      slug: `marketing-engineer-yfs-${Date.now()}`,
      department: "Marketing",
      location: "London (Hybrid)",
      employmentType: "Full-time",
      status: JobStatus.OPEN,
      descriptionText: `Acme Academy is looking for a Marketing Engineer who sits at the intersection of creativity and technology. This is a graduate-level role for someone who:

- Has a genuine creative streak — they make things, not just talk about making things
- Wields AI tools fluently and is already using them in their own work and life
- Has built at least some basic automations — Zapier, Make, scripts, or anything that shows they enjoy making systems that do work for them
- Has a strong learning orientation and can point to things they have taught themselves outside of school

This is not a traditional marketing role. We are not looking for someone who has run social media campaigns and knows what CPM means. We are looking for someone who is curious, technical enough to execute, creative enough to generate ideas that work, and genuinely excited about what AI is doing to the craft of marketing.

You will work directly with the leadership team on content, campaigns, and the growth of Acme's reach. You will have real ownership from day one.`,
      customQuestionPrompt: null,
      createdByEmail: "seed@yfs-test.internal",
    },
  });

  const questions = [
    { prompt: "Describe a creative project you have worked on — personal, academic, or professional — that you are genuinely proud of. What made it stand out and what did you build or create?", sortOrder: 0 },
    { prompt: "Tell us about an AI tool, automation, or script you have built or used in your own life or studies. What did it do, how did you build or set it up, and what problem did it solve?", sortOrder: 1 },
    { prompt: "How do you think AI is changing marketing over the next two to three years? How are you personally preparing for that shift, and what have you already experimented with?", sortOrder: 2 },
    { prompt: "If you had to launch a marketing campaign for Acme with a £500 budget, one week of your own time, and no team, what would you actually do? Be as specific as possible.", sortOrder: 3 },
    { prompt: "Describe something you have taught yourself outside of school or university in the last two years. Why did you pursue it, how did you go about it, and what did you produce or achieve as a result?", sortOrder: 4 },
  ];

  const createdQuestions = await Promise.all(
    questions.map((q) => prisma.jobRoleQuestion.create({ data: { jobId: job.id, ...q } }))
  );

  const roleQuestionIds: Record<string, string> = {};
  createdQuestions.forEach((q, i) => { roleQuestionIds[`q${i}`] = q.id; });

  console.log(`  ✓ Marketing Engineer job created: ${job.id}`);
  return { jobId: job.id, roleQuestionIds };
}

async function createCandidate(profile: CandidateProfile, label: string) {
  console.log(`\nCreating ${label}: ${profile.name}...`);

  const existingInvite = await prisma.invite.findUnique({ where: { token: profile.token } });
  if (existingInvite) {
    const existingCandidate = await prisma.candidate.findFirst({ where: { inviteId: existingInvite.id } });
    if (existingCandidate) {
      await prisma.submission.deleteMany({ where: { candidateId: existingCandidate.id } });
      await prisma.candidate.delete({ where: { id: existingCandidate.id } });
    }
    await prisma.invite.delete({ where: { id: existingInvite.id } });
  }

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

  const psychoScores = computePsychoScores(profile.psychoAnswers);

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
  console.log(`  ✓ FC tallies: ${JSON.stringify(psychoScores.fcTallies)}`);

  return candidate;
}

// ─── ME CANDIDATE 1: STRONG ──────────────────────────────────────────────────
function makeMeStrong(jobId: string, rq: Record<string, string>): CandidateProfile {
  return {
    name: "Priya Kumar",
    email: "priya.kumar.test@yfs-test.internal",
    token: "me-strong-priya-kumar-001",
    jobId,
    coverLetter: `I am a recent graduate who has spent the last two years quietly becoming obsessed with what AI tools can do in the hands of someone who is willing to get into them properly. I have built automations using Make and Python that save me hours each week, used generative AI to produce content that genuinely works, and spent a lot of time understanding why some marketing actually moves people and most of it does not. I am not looking for a job where I manage a social media calendar. I want to build things, learn fast, and work somewhere that takes quality seriously. Acme looks like that place.`,
    roleAnswers: {
      [rq.q0]: `During my second year at university I ran the design and communications for our student entrepreneurship society — 300 members, zero budget, and a committee that kept changing. The project I'm most proud of is a six-week content series I created called "Founders Before They Were Famous" — short-form pieces on early-stage founders who had gone through our kind of community. I wrote, designed, shot, and edited everything myself. I used Midjourney for visual treatment, Claude for drafting and sharpening copy, and CapCut for video editing. What made it stand out was that the content had real specificity — real people, real early failures, real turning points. It didn't look like generic inspiration content. Engagement on our Instagram tripled over those six weeks and we had our highest-ever event sign-ups off the back of it.`,
      [rq.q1]: `I built a client-tracking system for my freelance design work using Make, Notion, and a bit of Python. The problem was that I was losing track of where invoices were, which clients needed following up, and what the status of each project was. I set up Make to monitor my Gmail for client emails, extract key information using a custom parser, and write it into a Notion database. I then built a Python script that ran weekly and sent me a summary of anything that had been inactive for more than two weeks. I taught myself Make by going through their documentation and building things that broke. The system handles about 15 active freelance relationships and I have not missed a follow-up or invoice since I built it — around eight months ago now.`,
      [rq.q2]: `AI is turning marketing into a craft of judgement and taste rather than a craft of production. The people who will be valuable in two or three years are not the ones who can produce content quickly — AI can do that already. They are the ones who can tell the difference between content that works and content that doesn't, and who understand enough about the underlying models to get genuinely original output rather than generic output. I have spent time reading about prompt engineering, not just at the level of 'tips and tricks' but understanding why certain structures produce better results. I have also been experimenting with AI in video — using ElevenLabs for voice, Runway for visuals — and the output quality is now good enough that I think it will reshape short-form content production significantly. I am positioning myself to be someone who can combine creative direction with technical execution, because that combination is increasingly rare.`,
      [rq.q3]: `With £500 and one week: I would focus on LinkedIn because that is where Acme's most influential audience — educators, funders, experienced professionals who influence young people — actually lives. I would produce five long-form posts over the week, each one telling a specific story from a Acme graduate — what they came in not knowing, what changed, and what they built or did as a result. I would use Claude to help me draft and sharpen, Canva for any visual treatments, and I would personally reach out to five alumni asking for a 15-minute conversation I could reference. On day six, I would run a targeted LinkedIn campaign with £300 of the budget targeting professionals in London and Manchester who list education or youth development in their profiles. I would measure click-through to a specific landing page and sign-ups via that page. The remaining £200 I would hold for a small follow-up boost on the best-performing post.`,
      [rq.q4]: `Over the last two years I have taught myself Python well enough to automate things that matter to me. It started because I was spending time manually pulling data from different platforms to understand which of my design posts were actually performing. I worked through two online courses, then immediately tried to build things that were relevant to my own work. The first real thing I built was a scraper that pulled my Instagram post data into a spreadsheet and ran basic analysis on what content types were generating the most saves and shares. It was messy and slow but it worked and I learned more from building it than from any course. I have since built three other small tools — the client tracker, a price comparison tool for freelance software, and a basic Slack bot for a student group I help run. None of them are impressive by engineering standards but all of them are useful and I built them myself.`,
    },
    standardAnswers: {
      [STD_Q.q1]: `I noticed that the student society I was part of had almost no organised record of what had worked in previous years — events, campaigns, partnerships. Every new committee started from zero. I built a simple Notion wiki that captured our decisions, outcomes, and what we had learned from each initiative. I wrote it up in a way that was genuinely useful rather than bureaucratic and shared it with the incoming committee at the end of the year. It wasn't glamorous but it was a gap nobody had addressed and it took me about four weekends. The new committee chair told me at the end of their year it was the most useful resource they had.`,
      [STD_Q.q2]: `In my final year I pitched a research project that I was genuinely excited about — a qualitative study of how student founders talk about failure. I got approval, started recruiting participants, and then hit a wall: most people I approached were reluctant to be interviewed on record about things that had not worked. I had built my methodology around recorded interviews and hadn't built a fallback. I had to redesign the study mid-semester to use anonymous written submissions instead, which changed the kind of data I could work with. The output was less rich than I had hoped. What I learned was that my initial enthusiasm had led me to underplan for the parts of the project that depended on other people's willingness to participate, not just my own effort. I would now pilot-test recruitment assumptions before committing to a method.`,
      [STD_Q.q3]: `I taught myself video editing to a level where I could produce content I was proud of. I started with CapCut because it was accessible and then moved to DaVinci Resolve for more control. I spent about three months on it — watching YouTube tutorials, but more importantly just editing constantly and being harsh about what was not working. I applied it immediately to content for the society, which meant I could see whether my editing choices were affecting how people engaged with what I made. The main thing I learned was that editing is really about pacing and removing, not adding. The instinct to keep more is usually wrong.`,
      [STD_Q.q4]: `In my first year I disagreed with a module coordinator about the assessment brief for a group project. The brief was ambiguous in a way I thought would lead to groups doing very different things and being marked inconsistently. I wrote up my concern clearly and sent it to her before the project began, with specific examples of how the ambiguity could play out. She responded initially by defending the brief, but a week later she sent an updated version that clarified two of the three points I had raised. She didn't acknowledge that my email had prompted the change, which was fine. The outcome mattered more than the credit.`,
      [STD_Q.q5]: `The most ambitious thing I have attempted is building a small freelance design and content practice while at university. Not in a 'side hustle' way but as a genuine attempt to understand what it takes to acquire clients, deliver work that people actually value, and sustain something over time while managing everything else. At its peak I had eight regular clients and was earning enough to cover most of my living costs. I turned down two opportunities that would have paid well but would have required me to produce work I did not believe in. That felt like the hardest and most important decision I made.`,
      [STD_Q.q6]: `In five years I want to be leading the marketing and growth function of an organisation doing something I think matters — not necessarily as a title but as the person who actually owns how the organisation grows and communicates. I want to have built something I can point to: a community, a brand, a content strategy that demonstrably moved the organisation forward. This role connects to that because Acme is building something real, and being part of that at an early stage means the growth and learning curve will be steep and genuine.`,
    },
    psychoAnswers: {
      [ITEMS.CS1]: `In the second semester of my final year I was running a six-week content series for our student society and I had committed to publishing every Monday. In week three, the main person I had lined up to feature — a founder who had agreed to share their story — pulled out two days before publication because they had had a difficult week and didn't feel ready. I had built that week's piece around them and had already done half the work.

Rather than delay or publish something incomplete, I stayed up the night before and rebuilt the piece around a different founder I had been planning to feature in week five. I contacted that person at 10pm, explained the situation honestly, asked if they would mind being moved earlier, and they agreed. I redrafted the piece using material I already had, wrote new framing, and had it ready by 5am. It published on time. Nobody knew there had been a problem.

What I noticed afterwards was that my plan had a single point of failure — one person per week with no backup. I spent an afternoon building a content calendar that had two or three potential sources per slot, so if one fell through I had somewhere to go. The series ran without another hitch.`,
      [ITEMS.CS2]: `Last year I sent a client a proposal that included pricing based on a rate I thought I had confirmed but had actually misremembered. The rate I quoted was about 20% lower than what I should have charged. I only noticed when I was setting up the invoice and saw the discrepancy against my pricing notes.

I contacted the client the same day. I explained that I had made an error in the proposal, that the correct rate was higher, and that I wanted to be transparent about it. I gave them the choice: we could proceed at the quoted rate, which I would honour because the error was mine, or we could proceed at the correct rate if they felt that was fair. They chose to proceed at the corrected rate and actually said they appreciated that I had flagged it rather than just absorbing it quietly or invoicing the higher amount without explanation.

The thing I took from it was about how I set up my pricing documents — I now have a single reference file I check before every proposal rather than working from memory.`,
      [ITEMS.CS3]: `About a year ago I was designing a new layout for the society's monthly newsletter and I was convinced that a more visual, image-heavy approach was the right direction. I had done some research on what similar communities were doing and had a strong view. A committee member who was studying communications pushed back. She argued that our audience — mostly students who read on mobile — would bounce from image-heavy emails faster than from text-focused ones, and she had pulled some data from our previous campaigns to support her point.

My first reaction was to question her data. I went away and pulled it myself. She was right. Our text-focused editions had consistently higher read times and lower unsubscribe rates. I had been looking at what looked good rather than what worked for our specific audience. I went back to her and told her directly that she had changed my mind and that I was going to redesign with her argument as the starting point. The newsletter she had influenced outperformed the previous three editions on every metric we tracked.`,
      [ITEMS.CS4]: `Earlier this year a close friend and creative collaborator asked me to give feedback on a portfolio she was preparing for design internship applications. I could see that several of the pieces she had selected were not her strongest work — they were familiar to her but they were not impressive from the outside. I knew she would be disappointed because she had already spent time on the portfolio as it was.

I told her clearly and specifically. I picked two pieces that I thought were weak relative to her ability and explained what they were missing. I also showed her three pieces I thought were much stronger and hadn't made the cut, and told her why I thought they would land better with someone who didn't already know her. She was quiet for a while. But she rebuilt the portfolio and sent me a message two weeks later saying she had three interview requests. She credited the conversation.

I cared more about her getting the internships than about avoiding a difficult ten minutes.`,
      [ITEMS.CF1]: "A",
      [ITEMS.CF2]: "A",
      [ITEMS.CF3]: "B",
      [ITEMS.CF4]: "B",
      [ITEMS.CF5]: "A",
      [ITEMS.CF6]: "A",
      [ITEMS.CF7]: "A",
      [ITEMS.CF8]: "A",
      [ITEMS.CF9]: "A",
      [ITEMS.CF10]: "B",
      [ITEMS.CF11]: "A",
      [ITEMS.CF12]: "A",
      [ITEMS.CF13]: "A",
      [ITEMS.CT1]: ["mission", "autonomy", "scope", "stability"],
      [ITEMS.CT2]: "A",
      [ITEMS.CC1]: "2",
      [ITEMS.CC2]: "1",
      [ITEMS.CR1]: `A colleague would say I do what I say I am going to do and that I care more about whether the work is actually good than about whether people think it is. They would probably also say I can get impatient when things move slowly — I am still learning to distinguish between situations where moving fast is the right call and situations where it is not.`,
    },
    finalReflection: `I want to be somewhere that takes quality seriously and where I can learn by doing real things rather than running simulations. Acme is building something that I think genuinely matters for young people who don't always get access to this kind of environment. I want to help it grow and I want to be the kind of person who can do that by combining genuine creativity with the technical confidence to execute without always waiting for help.`,
  };
}

// ─── ME CANDIDATE 2: MEDIOCRE ────────────────────────────────────────────────
function makeMeMediacre(jobId: string, rq: Record<string, string>): CandidateProfile {
  return {
    name: "Tom Bradley",
    email: "tom.bradley.test@yfs-test.internal",
    token: "me-mediocre-tom-bradley-002",
    jobId,
    coverLetter: `I am very interested in the Marketing Engineer role at Acme. I have a background in marketing and communications and have used various digital tools in my studies and work. I enjoy creative projects and am comfortable with technology. I am keen to develop my skills further in a role that combines marketing and technology.`,
    roleAnswers: {
      [rq.q0]: `I am proud of a campaign I helped run for my university's student union social media. We created a series of posts about student wellbeing and it performed quite well. I designed the graphics using Canva and wrote most of the copy. We got some good engagement and the posts were shared more than usual. I think what made it work was that the topic was something students genuinely cared about.`,
      [rq.q1]: `I have used tools like Buffer for scheduling social media posts and I have experimented with ChatGPT for writing first drafts. I have also used Canva's AI features to generate background images. These have saved me some time in my workflow. I haven't built anything from scratch but I am comfortable adopting new tools when I need them.`,
      [rq.q2]: `AI is clearly going to be very important in marketing. I think it will help with things like content creation and personalisation. I have been reading articles about how brands are using AI and I am keeping an eye on how things develop. I plan to learn more about specific AI tools over the coming months.`,
      [rq.q3]: `With £500 and one week I would focus on social media, probably Instagram and LinkedIn. I would create a series of posts that showcase what Acme does and the impact it has had on students. I would use a mix of graphics and some video content. I might put some of the budget behind a boosted post targeting the right audience. I would track engagement to see what was working.`,
      [rq.q4]: `Over the last year I have been improving my skills in graphic design using Canva and learning more about SEO. I worked through some online modules and applied what I learned to some projects for my university. I enjoy learning new things when they are relevant to work I am doing.`,
    },
    standardAnswers: {
      [STD_Q.q1]: `I noticed that my course's group chat was getting too busy and people were missing important information. I suggested we create a separate channel for announcements and people agreed. It made things a bit clearer for everyone.`,
      [STD_Q.q2]: `I worked on a group project that didn't go as well as expected. We struggled with coordination and the final output wasn't as polished as it could have been. I learned that planning communication better at the start of a project is really important.`,
      [STD_Q.q3]: `I have been teaching myself more about email marketing through online courses and tutorials. I find it interesting and relevant to my career goals. I completed a Google certificate in digital marketing which covered a range of useful topics.`,
      [STD_Q.q4]: `There was a situation where I thought a project should go in a different direction to what my tutor suggested. I raised it in the feedback session and explained my thinking. My tutor listened but we proceeded with their recommendation. I accepted that and tried to make the approach work as well as I could.`,
      [STD_Q.q5]: `I think the most ambitious thing I have attempted is applying for competitive internships and continuing to work on my skills even when I didn't get through. I kept going and eventually got some good experience. I believe persistence is important.`,
      [STD_Q.q6]: `In five years I would like to be working in a marketing role in an organisation doing something meaningful. I want to keep developing my skills in digital and content marketing. This role at Acme would be a great starting point for that journey.`,
    },
    psychoAnswers: {
      [ITEMS.CS1]: `There was a content project I was working on for the student union that had some problems with timing. The person who was supposed to film a video for us cancelled at short notice. We ended up not being able to include that element in the campaign and had to adjust what we published. We told the committee it had been cut for timing reasons and moved on. The campaign still launched on schedule even if it wasn't quite what we had originally planned.`,
      [ITEMS.CS2]: `I once sent an email to the wrong mailing list which caused some confusion. I sent a follow-up apology email quite quickly. People were generally understanding and it wasn't a major issue. I was more careful about checking recipient lists after that.`,
      [ITEMS.CS3]: `When I was working on a design project my peer gave me feedback that my colour choices weren't working well together. I wasn't totally convinced at first but I changed them anyway and in hindsight the new version did look better. I suppose I was a bit attached to my original choices.`,
      [ITEMS.CS4]: `I had to tell a friend in my group project that their section needed more work before we submitted. It was a bit awkward because we are friends but they took it fine and improved it. I tried to be kind about how I said it.`,
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
      [ITEMS.CT1]: ["stability", "autonomy", "scope", "mission"],
      [ITEMS.CT2]: "B",
      [ITEMS.CC1]: "3",
      [ITEMS.CC2]: "3",
      [ITEMS.CR1]: `A colleague would probably say I am easy to work with and generally reliable. They might say I could push myself more sometimes.`,
    },
    finalReflection: `I am excited about this opportunity and believe I have the skills and enthusiasm to contribute to Acme. I am keen to learn and grow in a role like this.`,
  };
}

// ─── ME CANDIDATE 3: UNSUITABLE (Traditional, no tech interest) ─────────────
function makeMeUnsuitable1(jobId: string, rq: Record<string, string>): CandidateProfile {
  return {
    name: "Lucy Chen",
    email: "lucy.chen.test@yfs-test.internal",
    token: "me-unsuitable1-lucy-chen-003",
    jobId,
    coverLetter: `I have a strong background in marketing and communications and have worked on several brand campaigns during my studies. I am passionate about storytelling and have experience running social media accounts and writing copy. I enjoy working with people and am a strong communicator. I am looking for a role where I can develop my marketing career.`,
    roleAnswers: {
      [rq.q0]: `I managed the social media presence for a local charity during my placement year. I ran their Instagram, Facebook, and Twitter accounts, created a content calendar, and grew their following. I wrote all the copy and sourced images. The following grew by about 15% over the year and engagement improved. I am proud of the consistency I maintained and the relationships I built with the charity's audience.`,
      [rq.q1]: `I have used Canva to design social media graphics and Hootsuite to schedule posts. These tools have been very useful for keeping content organised and professional-looking. I think the best tools are the ones that are intuitive and don't require too much technical knowledge to use effectively.`,
      [rq.q2]: `I think AI is an interesting topic in marketing but I believe that authentic human connection will always be what makes marketing truly work. Tools can help with efficiency but the creative and strategic thinking still needs to come from people. I prefer to focus on understanding the audience and crafting genuine messages rather than relying on technology.`,
      [rq.q3]: `With £500 I would focus on a local event or partnership that brings people together. Marketing is most effective when it creates real-world connection. I would use the budget to host a small event featuring Acme students and invite journalists and local community figures. Word of mouth and genuine relationships are more powerful than digital campaigns.`,
      [rq.q4]: `I completed a CIM Foundation Certificate in Marketing last year through evening classes. It gave me a strong grounding in marketing theory and strategy. I find formal learning works well for me as it provides structure and recognised qualifications.`,
    },
    standardAnswers: {
      [STD_Q.q1]: `I noticed that the charity I was on placement with did not have consistent brand guidelines being followed across different teams. I drafted a simple brand guide document and shared it with the relevant teams. Some people found it useful.`,
      [STD_Q.q2]: `A campaign I worked on for a university project didn't perform as well as we hoped in terms of the response rate. The messaging may not have been pitched quite right for the target audience. We should have done more research upfront.`,
      [STD_Q.q3]: `I have been working through a copywriting course online. Good copywriting is something I think is fundamental to marketing and I want to continue developing my skills in this area.`,
      [STD_Q.q4]: `I disagreed with a module leader about the grading criteria for an assignment. I spoke to them after the session and explained my concern. They listened politely but didn't change the grade. I accepted this and moved on.`,
      [STD_Q.q5]: `The most ambitious thing I have attempted is pursuing a career in marketing when many people told me it was too competitive. I have persisted and am continuing to develop my skills.`,
      [STD_Q.q6]: `In five years I would like to be a marketing manager for a brand or organisation I believe in. I want to work on campaigns that make a real difference. This role is a stepping stone to building that experience.`,
    },
    psychoAnswers: {
      [ITEMS.CS1]: `There was a campaign at the charity where we had planned to run a series of posts around a specific event date but the event got postponed at short notice. We had to pull the content and it was a bit disorganised for a week or two while we figured out what to post instead. It was frustrating but these things happen and we adapted.`,
      [ITEMS.CS2]: `I once published a social media post with the wrong date in it. I noticed quickly and deleted and reposted with the correct information. It wasn't a big deal in the end.`,
      [ITEMS.CS3]: `My placement supervisor suggested I change the tone of some of the copy I had written to be more formal. I wasn't sure I agreed that a more formal tone was right for that audience but I made the changes as requested. I think it's important to follow guidance when you're in a learning environment.`,
      [ITEMS.CS4]: `I had to let a volunteer at the charity know that their photography wasn't quite at the standard we needed. I tried to be very gentle and positive and focused on how they could improve. I don't think they were too upset about it.`,
      [ITEMS.CF1]: "B",
      [ITEMS.CF2]: "B",
      [ITEMS.CF3]: "B",
      [ITEMS.CF4]: "A",
      [ITEMS.CF5]: "B",
      [ITEMS.CF6]: "B",
      [ITEMS.CF7]: "B",
      [ITEMS.CF8]: "B",
      [ITEMS.CF9]: "A",
      [ITEMS.CF10]: "B",
      [ITEMS.CF11]: "B",
      [ITEMS.CF12]: "B",
      [ITEMS.CF13]: "B",
      [ITEMS.CT1]: ["stability", "scope", "autonomy", "mission"],
      [ITEMS.CT2]: "C",
      [ITEMS.CC1]: "4",
      [ITEMS.CC2]: "3",
      [ITEMS.CR1]: `A colleague would say I am friendly, organised, and reliable. They might say I prefer working within clear guidelines to having total freedom.`,
    },
    finalReflection: `I am a dedicated marketing professional who is passionate about the power of authentic communication. I am looking for a role where I can continue to develop my skills in a meaningful organisation.`,
  };
}

// ─── ME CANDIDATE 4: UNSUITABLE (Wrong fit — pure tech, no creativity) ───────
function makeMeUnsuitable2(jobId: string, rq: Record<string, string>): CandidateProfile {
  return {
    name: "James Wong",
    email: "james.wong.test@yfs-test.internal",
    token: "me-unsuitable2-james-wong-004",
    jobId,
    coverLetter: `I am a recent computer science graduate with strong technical skills including Python, JavaScript, and experience with various APIs. I am interested in applying technology to real-world problems. I notice this role mentions AI tools and automations which is an area I have some experience in. I am looking for a role where I can use my technical skills.`,
    roleAnswers: {
      [rq.q0]: `I built a personal finance tracking application using Python and Flask. It connects to my bank API and categorises transactions automatically. It was a useful project for developing my skills in API integration and data processing. I showed it to a few friends and some of them found it interesting. Technical projects like this are where I do my best work.`,
      [rq.q1]: `I have built several automation scripts in Python. For example I have scripts that scrape data from websites, automate file management on my computer, and pull data from APIs. I find automation interesting from a technical perspective. I have also experimented with the OpenAI API in projects.`,
      [rq.q2]: `AI will enable more personalised content at scale and better targeting through machine learning models. From a technical perspective I think the most interesting developments are in LLM fine-tuning and retrieval augmented generation. I have done some reading on transformer architectures which I find interesting academically.`,
      [rq.q3]: `I would focus on technical approaches — setting up tracking infrastructure, A/B testing frameworks, and measurement systems. Getting the measurement right is the foundation of any good campaign. I would probably spend the budget on analytics tools and maybe some ad testing to generate data.`,
      [rq.q4]: `I have spent the last year deepening my knowledge of machine learning through online courses including some Coursera and fast.ai content. I have built several small ML models for classification tasks. I enjoy the mathematical underpinnings of these models. I would like to continue in this direction.`,
    },
    standardAnswers: {
      [STD_Q.q1]: `I noticed that my team at a hackathon was losing time because we didn't have a shared development environment set up correctly. I set up a Docker configuration that standardised the environment across all our machines. It was a straightforward technical fix but it saved us probably two hours.`,
      [STD_Q.q2]: `A project I worked on failed because I underestimated the complexity of a particular API integration. I had not read the documentation carefully enough and discovered limitations partway through that required significant rework. I learned to read API documentation more thoroughly before starting.`,
      [STD_Q.q3]: `I have been learning Rust over the past eight months through the official Rust book and some practice projects. I find systems programming interesting and the ownership model is conceptually challenging in a way I enjoy. I have built a small command-line tool as part of this learning.`,
      [STD_Q.q4]: `At a previous internship my manager wanted to implement a solution I thought was technically suboptimal. I documented my concerns in writing and sent them over. He acknowledged the points but said the simpler approach was fine for the scale we were at. I accepted this and implemented what was asked.`,
      [STD_Q.q5]: `I entered a competitive programming competition at national level and prepared intensively for several months. I did not perform as well as I had hoped but the preparation improved my algorithmic thinking significantly.`,
      [STD_Q.q6]: `In five years I would like to be working as a software engineer or in a technical role where I can work on interesting problems. I am open to learning more about how technology is applied in different sectors.`,
    },
    psychoAnswers: {
      [ITEMS.CS1]: `I was working on a software project with a team and the timeline slipped because another team member's component was delayed. I completed my own components and documented them while waiting. When their component was eventually ready we integrated quickly. The overall project was about three days late.`,
      [ITEMS.CS2]: `I introduced a bug into a shared codebase and it took a few hours before it was noticed in testing. I identified the source quickly, reverted the change, and wrote a proper fix. I also added a test case to catch that class of error in future. It was a standard debugging process.`,
      [ITEMS.CS3]: `A code reviewer pointed out that my approach to a particular problem was less efficient than an alternative they suggested. They were right and their solution was cleaner. I updated the code and thanked them for the review. It was a straightforward technical improvement.`,
      [ITEMS.CS4]: `I had to tell a team member that some of their code was difficult to read and needed refactoring before we could review it properly. I pointed to specific examples and suggested some improvements. They updated it without any issues.`,
      [ITEMS.CF1]: "A",
      [ITEMS.CF2]: "A",
      [ITEMS.CF3]: "A",
      [ITEMS.CF4]: "A",
      [ITEMS.CF5]: "A",
      [ITEMS.CF6]: "A",
      [ITEMS.CF7]: "B",
      [ITEMS.CF8]: "A",
      [ITEMS.CF9]: "A",
      [ITEMS.CF10]: "A",
      [ITEMS.CF11]: "B",
      [ITEMS.CF12]: "A",
      [ITEMS.CF13]: "A",
      [ITEMS.CT1]: ["autonomy", "mission", "scope", "stability"],
      [ITEMS.CT2]: "A",
      [ITEMS.CC1]: "1",
      [ITEMS.CC2]: "1",
      [ITEMS.CR1]: `Colleagues would say I am technically thorough and that I produce reliable work. They would probably also say I am quiet and tend to communicate in writing rather than conversation.`,
    },
    finalReflection: `I am interested in applying technical skills to problems in the education and social enterprise space. I am willing to learn about marketing if it means working with interesting technology.`,
  };
}

async function main() {
  console.log("=== Marketing Engineer Job + Test Candidates Seeding ===");

  const { jobId, roleQuestionIds: rq } = await createMarketingEngineerJob();

  const profiles = [
    { profile: makeMeStrong(jobId, rq), label: "STRONG ME" },
    { profile: makeMeMediacre(jobId, rq), label: "MEDIOCRE ME" },
    { profile: makeMeUnsuitable1(jobId, rq), label: "UNSUITABLE ME #1" },
    { profile: makeMeUnsuitable2(jobId, rq), label: "UNSUITABLE ME #2" },
  ];

  const results: Array<{ label: string; name: string; id: string; token: string }> = [];

  for (const { profile, label } of profiles) {
    const candidate = await createCandidate(profile, label);
    results.push({ label, name: profile.name, id: candidate.id, token: profile.token });
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Marketing Engineer Job ID: ${jobId}`);
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
