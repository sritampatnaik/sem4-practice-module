import type { ChatMemoryItem, Subject } from "../../_shared/types";
import type { TestingFixtureProfileId } from "./profiles";

export type TestingFixtureScenario = {
  id: string;
  profileId: TestingFixtureProfileId;
  prompt: string;
  subject?: Subject;
  recentChats?: ChatMemoryItem[];
};

export const TESTING_FIXTURE_SCENARIOS: TestingFixtureScenario[] = [
  {
    id: "secondary-kinematics-mcq",
    profileId: "secondaryOLevel",
    prompt: "Give me five O-Level kinematics MCQs.",
    subject: "physics",
  },
  {
    id: "secondary-bonding-flashcards",
    profileId: "secondaryOLevel",
    prompt: "Flashcards on chemical bonding.",
    subject: "chemistry",
  },
  {
    id: "jc-differentiation-quiz",
    profileId: "jcH2",
    prompt: "Quiz me on differentiation, H2.",
    subject: "math",
  },
  {
    id: "primary-fractions-mcq",
    profileId: "primaryStarter",
    prompt: "Give me three Primary school MCQs on fractions.",
    subject: "math",
  },
  {
    id: "secondary-bonding-visual",
    profileId: "secondaryOLevel",
    prompt: "Give me flashcards on chemical bonding with a simple diagram.",
    subject: "chemistry",
  },
  {
    id: "secondary-kinematics-followup",
    profileId: "secondaryOLevel",
    prompt: "Give me a harder quiz on my weak kinematics area.",
    subject: "physics",
    recentChats: [
      {
        role: "assistant",
        agent: "testing",
        text: "You struggled more with interpreting velocity-time graphs than with equations of motion.",
        at: "2026-08-20T18:00:00.000Z",
      },
    ],
  },
];

export function findTestingFixtureScenario(id: string) {
  return TESTING_FIXTURE_SCENARIOS.find((scenario) => scenario.id === id);
}
