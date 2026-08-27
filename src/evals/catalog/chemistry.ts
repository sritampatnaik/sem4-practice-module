import type { EvalItem } from "../types";
import { jcAlex, primaryAlex, secondaryAlex } from "./profiles";

export const chemistryItems: EvalItem[] = [
  {
    id: "chem-balance",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Balance Fe + O2",
    prompt: "Balance Fe + O2 -> Fe2O3.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Use reactionBalancer. 4Fe + 3O2 → 2Fe2O3.",
      goldReply: "Using the balancer: 4Fe + 3O2 → 2Fe2O3.",
      mustInclude: ["4", "3", "2"],
      requiredTools: ["reactionBalancer"],
    },
  },
  {
    id: "chem-carbon",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Proton number of carbon",
    prompt: "Proton number of carbon?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Look up periodicTable. Proton number 6.",
      goldReply: "Carbon has proton number 6.",
      mustInclude: ["6"],
      requiredTools: ["periodicTable"],
    },
  },
  {
    id: "chem-bf3",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Shape of BF3 at A-Level",
    prompt: "Shape of BF3 at A-Level?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Trigonal planar. Stay A-Level, not university group theory.",
      goldReply:
        "BF3 has three bonding pairs and no lone pairs on boron, so the shape is trigonal planar.",
      mustInclude: ["trigonal planar"],
      mustNotInclude: ["point group D3h"],
    },
  },
  {
    id: "chem-aluminium",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Singapore spelling aluminium",
    prompt: "What is the symbol and proton number of aluminium?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Use aluminium (not aluminum). Al, proton number 13.",
      goldReply: "Aluminium has symbol Al and proton number 13.",
      mustInclude: ["al", "13", "aluminium"],
      requiredTools: ["periodicTable"],
    },
  },
  {
    id: "chem-moles",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Mole calculation",
    prompt: "How many moles in 36 g of water? M_r(H2O) = 18.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "n = m/M_r = 2 mol.",
      goldReply: "n = m / M_r = 36 / 18 = 2 mol.",
      mustInclude: ["2"],
    },
  },
  {
    id: "chem-acid-metal",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Acid + metal",
    prompt: "What gas forms when zinc reacts with dilute hydrochloric acid?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Hydrogen. Mention the general acid + metal pattern.",
      goldReply:
        "Zinc and dilute hydrochloric acid give zinc chloride and hydrogen gas. The test is a lighted splint that pops.",
      mustInclude: ["hydrogen"],
    },
  },
  {
    id: "chem-bonding",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Ionic vs covalent",
    prompt: "Contrast ionic and covalent bonding for O-Level.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Electron transfer vs sharing. Stay O-Level.",
      goldReply:
        "Ionic bonding is electron transfer between metal and non-metal. Covalent bonding is sharing of electrons between non-metals.",
      mustInclude: ["ionic", "covalent"],
    },
  },
  {
    id: "chem-mixtures",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Primary mixtures",
    prompt: "How is a mixture different from a new substance at Primary?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Physical mix vs chemical change. No mole talk.",
      goldReply:
        "A mixture keeps the properties of its parts and can often be separated. A new substance from a chemical change has different properties.",
      mustInclude: ["mixture"],
      mustNotInclude: ["mole"],
    },
  },
  {
    id: "chem-mechanism",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Name the JC mechanism",
    prompt: "Ethene reacts with bromine. Name the mechanism at H2.",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Electrophilic addition. Name it before steps.",
      goldReply:
        "This is electrophilic addition. Bromine adds across the C=C to give 1,2-dibromoethane.",
      mustInclude: ["electrophilic addition"],
    },
  },
  {
    id: "chem-safety",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Practical safety",
    prompt: "I want to heat ethanol over a bunsen in the lab. Any safety points?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Flag flammability. Do not give a reckless procedure.",
      goldReply:
        "Ethanol is highly flammable. Do not heat it over a naked Bunsen flame. Use a water bath or electric heater, eye protection, and a teacher’s method.",
      mustInclude: ["flammable"],
      mustNotInclude: ["just light it"],
    },
  },
];
