import type { EvalItem } from "../types";
import { secondaryAlex } from "./profiles";

export const conciergeItems: EvalItem[] = [
  {
    id: "concierge-what-is-mets",
    suiteId: "concierge",
    kind: "concierge",
    title: "What is METS?",
    prompt: "What is METS?",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Explain the desk and offer learn or quiz. Do not teach a lesson.",
      goldReply:
        "METS is a Singapore tutor desk that routes you to Math, Physics, Chemistry, or Testing. Would you like to learn a concept, or sit a short quiz?",
      mustInclude: ["math", "physics", "chemistry"],
      mustNotInclude: ["createMcqSet", "here are five questions"],
    },
  },
  {
    id: "concierge-science-unclear",
    suiteId: "concierge",
    kind: "concierge",
    title: "Clarify science subject",
    prompt: "Help me with science.",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Ask Physics or Chemistry. Do not start a lesson.",
      goldReply:
        "Happy to help. Do you mean Physics or Chemistry (or Math, if that is what you meant)? Tell me the topic and whether you want a worked example or a short quiz.",
      mustInclude: ["physics", "chemistry"],
      mustNotInclude: ["F = ma", "oxidation number"],
    },
  },
  {
    id: "concierge-thanks",
    suiteId: "concierge",
    kind: "concierge",
    title: "Thanks only",
    prompt: "Thanks, that was helpful.",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Acknowledge and offer a next step. No new teaching.",
      goldReply:
        "You are welcome, Alex. If you want to go further, we can practise one more example or sit a short quiz on the same topic.",
      mustInclude: ["quiz"],
      mustNotInclude: ["step 1", "therefore the answer is"],
    },
  },
  {
    id: "concierge-who",
    suiteId: "concierge",
    kind: "concierge",
    title: "Who are you?",
    prompt: "Who are you?",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Identify as the METS desk, not a specialist teacher.",
      goldReply:
        "I am the METS desk. I route Singapore Primary, O-Level, and A-Level questions to Math, Physics, Chemistry, or Testing.",
      mustInclude: ["mets"],
      mustNotInclude: ["I am ChatGPT", "I am GPT"],
    },
  },
  {
    id: "concierge-english",
    suiteId: "concierge",
    kind: "concierge",
    title: "Refuse out-of-scope English",
    prompt: "Can you mark my English comprehension?",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Stay on Math / Physics / Chemistry / Testing. Do not mark English.",
      goldReply:
        "METS covers Mathematics, Physics, Chemistry, and short quizzes in those subjects. I cannot mark English papers. Would you like help with Math, Physics, or Chemistry instead?",
      mustInclude: ["math"],
      mustNotInclude: ["PEEL", "here is your marked script"],
    },
  },
  {
    id: "concierge-homework",
    suiteId: "concierge",
    kind: "concierge",
    title: "Homework needs a subject",
    prompt: "Help me with my homework.",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Ask which subject and whether they want teaching or a quiz.",
      goldReply:
        "I can help. Which subject is the homework — Math, Physics, or Chemistry — and do you want a worked example or practice questions?",
      mustInclude: ["math"],
      mustNotInclude: ["let me solve the whole paper"],
    },
  },
  {
    id: "concierge-morning",
    suiteId: "concierge",
    kind: "concierge",
    title: "Good morning",
    prompt: "Good morning.",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Greet and offer the two next steps.",
      goldReply:
        "Good morning, Alex. Would you like to learn a concept, or sit a short quiz in Math, Physics, or Chemistry?",
      mustInclude: ["alex"],
      mustNotInclude: ["derivative"],
    },
  },
  {
    id: "concierge-subjects",
    suiteId: "concierge",
    kind: "concierge",
    title: "What subjects?",
    prompt: "What subjects can you teach?",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "List the three teaching subjects plus Testing. No lesson.",
      goldReply:
        "Mathematics, Physics, and Chemistry, at Primary, O-Level, or A-Level. I can also generate original quizzes and flashcards.",
      mustInclude: ["mathematics", "physics", "chemistry"],
      mustNotInclude: ["literature", "history"],
    },
  },
  {
    id: "concierge-stuck",
    suiteId: "concierge",
    kind: "concierge",
    title: "I'm stuck",
    prompt: "I'm stuck.",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Ask one diagnostic question. Do not dump a solution.",
      goldReply:
        "We can unstick this. Which subject are you on, and what was the last step you tried?",
      mustInclude: ["subject"],
      mustNotInclude: ["the answer is"],
    },
  },
  {
    id: "concierge-bored",
    suiteId: "concierge",
    kind: "concierge",
    title: "Bored / no topic",
    prompt: "I'm bored. Give me something.",
    profile: secondaryAlex,
    targetAgent: "orchestration",
    scaffold: {
      contract: "Offer a choice of topic and mode. Do not invent a full lesson.",
      goldReply:
        "We can start with a short O-Level kinematics quiz, a bonding recap, or a fractions warm-up. Which would you like?",
      mustInclude: ["quiz"],
      mustNotInclude: ["here is a 20-minute lecture"],
    },
  },
];
