/** Content for the Resources page: a short THIMUN-style rules summary and a glossary of points and motions. */

export type Rule = { title: string; points: string[] };

export const RULES: Rule[] = [
  {
    title: "Conduct and language",
    points: [
      "English is the only working language of every committee.",
      "Speak in the third person: “The delegate of France believes…”, never “I think…”.",
      "Address the chair as “Honourable chair” and other delegates as “fellow delegates”.",
      "Stand when you speak, keep to the time the chair gives you, and wait to be recognised before speaking.",
      "Phones and laptops are for committee work only. Notes between delegates go through the admin staff and may be read.",
    ],
  },
  {
    title: "Roll call",
    points: [
      "At the start of every session the chair calls each delegation. Answer “present”.",
      "Delegations that arrive late send a note to the chair so they are marked present.",
    ],
  },
  {
    title: "Debating a resolution",
    points: [
      "The main submitter is invited to read out the operative clauses, then gives a speech in favour.",
      "The chair sets the debate time and may divide it into time in favour and time against. During time against, only speeches against are allowed.",
      "After a speech, the speaker may open themselves to points of information. The chair decides how many are taken.",
      "A speaker may yield the floor back to the chair or to another delegate. A delegate who has been yielded to cannot yield again.",
    ],
  },
  {
    title: "Amendments",
    points: [
      "Amendments are submitted in writing to the chairs (on this site) and only operative clauses can be amended.",
      "The chair decides whether and when an amendment is debated. It is debated in closed debate, usually with a short time for and against.",
      "Amendments to an amendment (second-degree amendments) are only allowed if the chair says so.",
      "Delegations cannot abstain on an amendment. It passes with a simple majority.",
    ],
  },
  {
    title: "Voting",
    points: [
      "When debate time ends, or a motion to move to the previous question passes, the committee votes on the resolution.",
      "On a resolution delegations vote for, against, or abstain. It passes when more delegations vote for than against.",
      "In the Security Council a resolution needs nine votes in favour and no vote against from a permanent member (China, France, Russia, the United Kingdom, the United States).",
      "While voting is in progress no one may enter or leave the room and note passing stops.",
    ],
  },
  {
    title: "The chair",
    points: [
      "The chair runs the debate and may change these procedures to keep the committee moving.",
      "The chair’s ruling on any point or motion is final. A point of order can question a decision, but the chair’s answer stands.",
    ],
  },
];

export type GlossaryEntry = { term: string; kind: "Point" | "Motion" | "Term"; interrupt?: boolean; text: string; example?: string };

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Point of Personal Privilege",
    kind: "Point",
    interrupt: true,
    text: "Raised when something stops you taking part, such as not being able to hear the speaker or the room being too hot. It may interrupt a speaker only when it is about audibility.",
    example: "“Point of personal privilege: the delegate cannot hear the speaker.”",
  },
  {
    term: "Point of Order",
    kind: "Point",
    text: "Raised when you believe the chair or a delegate has not followed the rules of procedure. It cannot interrupt a speaker and cannot be about the content of a speech.",
  },
  {
    term: "Point of Parliamentary Inquiry",
    kind: "Point",
    text: "A question to the chair about the rules of procedure, for example how many speakers remain. It cannot interrupt a speaker.",
  },
  {
    term: "Point of Information",
    kind: "Point",
    text: "A question to the speaker who has the floor, asked only once the speaker opens themselves to points of information. It must be phrased as a question. Short statements followed by “does the delegate not agree?” are allowed.",
    example: "“Is the delegate aware that clause 3 would cost more than the fund it creates?”",
  },
  {
    term: "Request to follow up",
    kind: "Point",
    text: "Asking the chair for a second question after the speaker answers your point of information. The chair may allow it or not. Follow-up questions do not earn extra points.",
  },
  {
    term: "Motion to move to the previous question",
    kind: "Motion",
    text: "Ends debate on the resolution or amendment and moves the committee to the vote (or into time against, if time is divided). It needs a second and the chair may allow objections.",
  },
  {
    term: "Motion to extend debate time",
    kind: "Motion",
    text: "Asks the chair for more time on the current resolution or amendment. The chair decides, and the motion may be voted on.",
  },
  {
    term: "Motion to divide the house",
    kind: "Motion",
    text: "Asks for a vote to be retaken with no abstentions, usually when a resolution narrowly failed or passed with many abstentions.",
  },
  {
    term: "Motion to divide the question",
    kind: "Motion",
    text: "Asks for operative clauses to be voted on separately. Clauses that fail are removed before the final vote on the whole resolution.",
  },
  {
    term: "Motion for an unmoderated caucus",
    kind: "Motion",
    text: "Asks to pause formal debate for a set time so delegates can move around and negotiate, for example to merge resolutions or draft amendments. Only where the chair allows it.",
  },
  {
    term: "Motion to adjourn the debate",
    kind: "Motion",
    text: "Asks to set the current resolution aside without a vote. It needs a two-thirds majority and is rarely granted.",
  },
  { term: "Yield", kind: "Term", text: "Giving the rest of your speaking time back to the chair, or to another delegate, at the end of your speech." },
  { term: "Floor", kind: "Term", text: "The right to speak. A delegate who “has the floor” is the only one who may speak, apart from points that can interrupt." },
  { term: "Main submitter", kind: "Term", text: "The delegation that wrote the resolution and opens debate on it." },
  { term: "Co-submitter", kind: "Term", text: "A delegation that supports a resolution and signed it before it was submitted." },
  { term: "Closed debate", kind: "Term", text: "Debate where speeches are split into time in favour and time against. Amendments are always debated this way." },
  { term: "Open debate", kind: "Term", text: "Debate where any delegate may speak for or against at any time." },
  { term: "Abstain", kind: "Term", text: "Choosing to vote neither for nor against. Not allowed on amendments, procedural votes or after a motion to divide the house." },
  { term: "Veto", kind: "Term", text: "In the Security Council, a vote against by a permanent member, which defeats a resolution whatever the other votes." },
];
