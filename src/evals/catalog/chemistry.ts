import type { EvalItem } from "../types";
import { jcAlex, primaryAlex, secondaryAlex } from "./profiles";

export const chemistryItems: EvalItem[] = [
  {
    id: "chem-balance",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Balance Fe + O2 with explanation",
    prompt: "Could you go over how to balance Fe + O2 -> Fe2O3?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Use reactionBalancer. Explain balancing step by step at Secondary level, showing atom counts, coefficient changes, and a final check. Final equation: 4Fe + 3O2 → 2Fe2O3.",
      goldReply: 
        "Let's balance Fe + O₂ → Fe₂O₃ step by step!\n\n" +
        "The key rule is that both sides must have the same number of each type of atom. We can change the big numbers in front (coefficients), but not the small numbers in the formulas (subscripts).\n\n" +
        "**Step 1: Count the atoms.**\n" +
        "- Left: 1 Fe, 2 O\n" +
        "- Right: 2 Fe, 3 O\n\n" +
        "**Step 2: Balance oxygen first.**\n" +
        "The lowest common multiple of 2 and 3 is 6. Put 3 in front of O₂ and 2 in front of Fe₂O₃:\n\n" +
        "Fe + 3O₂ → 2Fe₂O₃\n\n" +
        "Now both sides have 6 oxygen atoms.\n\n" +
        "**Step 3: Balance iron.**\n" +
        "There are now 4 Fe atoms on the right (2 x 2), so put 4 in front of Fe:\n\n" +
        "**4Fe + 3O₂ → 2Fe₂O₃**\n\n" +
        "**Step 4: Check.**\n" +
        "- Left: 4 Fe, 6 O\n" +
        "- Right: 4 Fe, 6 O\n\n" +
        "Everything matches! The equation is balanced.",
      mustInclude: ["4Fe + 3O₂ → 2Fe₂O₃"],
      requiredTools: ["reactionBalancer"],
    },
  },
  {
    id: "chem-balance-misconception",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Correct balancing misconception",
    prompt: "Can I change Fe2O3 to Fe2O2 to balance the oxygen atoms?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that subscripts cannot be changed when balancing equations because doing so changes the chemical formula. Use coefficients instead. Be supportive and non-judgmental.",
      goldReply:
        "Not quite! Changing Fe₂O₃ to Fe₂O₂ would change the chemical formula, so it wouldn't represent the same substance.\n\n" +
        "When balancing equations, we keep the small numbers (subscripts) unchanged and adjust only the big numbers in front (coefficients).\n\n" +
        "For example, the correct balanced equation is:\n\n" +
        "**4Fe + 3O₂ → 2Fe₂O₃**\n\n" +
        "This gives us 4 iron atoms and 6 oxygen atoms on both sides.",
      mustInclude: ["subscripts", "coefficients"],
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
      contract: "Use periodicTable. State that carbon has proton number 6 and briefly explain its meaning at Secondary level.",
      goldReply: 
        "Carbon (C) has a **proton number of 6**. This means every carbon atom has 6 protons in its nucleus.",
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
      contract: "Explain BF3 molecular shape using VSEPR theory at JC/A-Level. Include three bonding regions, no lone pairs on boron, trigonal planar geometry, and 120° bond angles. Avoid university-level group theory.",
      goldReply:
        "**BF₃ has a trigonal planar shape**, with F-B-F bond angles of **120°**.\n\n" +
        "Using VSEPR theory:\n" +
        "1. Boron is the central atom and forms three B-F covalent bonds.\n" +
        "2. There are three bonding electron-pair regions and no lone pairs around boron.\n" +
        "3. These regions arrange themselves as far apart as possible to minimise electron-pair repulsion.\n\n" +
        "Hence, BF₃ is trigonal planar with bond angles of 120°.",
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
      contract: "Use periodicTable. State aluminium's symbol Al and proton number 13. Follow Singapore/British English spelling: aluminium, not aluminum.",
      goldReply:
        "Aluminium has the chemical symbol **Al** and proton number **13**. This means an aluminium atom has 13 protons in its nucleus.",
      mustInclude: ["Al", "13", "aluminium"],
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
      contract: "Apply n = m / M_r correctly, show substitution and units, and explain the calculation at Secondary level.",
      goldReply:
        "To find the number of moles, use:\n\n" +
        "Number of moles = mass ÷ molar mass\n\n" +
        "n = 36 ÷ 18 = 2 mol\n\n" +
        "So, 36 g of water contains **2 moles** of H₂O.",
      mustInclude: ["2", "mol"],
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
      contract: "Identify hydrogen gas, explain the general acid + metal reaction, and include the hydrogen gas test at Secondary level.",
      goldReply:
        "The gas produced is **hydrogen (H₂)**.\n\n" +
        "Remember this general reaction:\n\n" +
        "Metal + acid → salt + hydrogen\n\n" +
        "For zinc and dilute hydrochloric acid:\n\n" +
        "Zn + 2HCl → ZnCl₂ + H₂\n\n" +
        "You can test for hydrogen using a lighted splint. It produces a squeaky 'pop' sound.",
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
      contract: "Contrast electron transfer and sharing, explain the resulting bonds accurately, and use familiar O-Level examples.",
      goldReply:
        "The key difference is **transfer vs sharing of electrons**.\n\n" +
        "**Ionic bonding:** Electrons are transferred, usually from a metal atom to a non-metal atom. This forms positive and negative ions, which are held together by strong electrostatic attraction. Example: NaCl.\n\n" +
        "**Covalent bonding:** Non-metal atoms share pairs of electrons. The shared electrons are attracted to the nuclei of both atoms. Example: H₂O.\n\n" +
        "For O-Level, remember: **Ionic = transfer; Covalent = share.**",
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
      contract: "Explain physical mixing versus chemical change using simple language and familiar examples. Avoid advanced chemistry terminology.",
      goldReply:
        "A **mixture** is made when two or more things are put together without forming a new substance.\n\n" +
        "For example, when you mix sand and water, both are still there. You can separate the sand from the water using a filter.\n\n" +
        "A **new substance** forms when a chemical change happens. For example, when iron rusts, it forms rust, which has different properties from iron.\n\n" +
        "Remember: **Mixture = no new substance formed. Chemical change = new substance formed.**",
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
      contract: "Identify electrophilic addition immediately. Briefly explain the role of the electron-rich C=C pi bond and induced dipole in Br2, and identify the product. Stay at Singapore H2 Chemistry level. Do not provide a full mechanism unless requested.",
      goldReply:
        "The mechanism is **electrophilic addition**.\n\n" +
        "The electron-rich π bond in ethene's C=C double bond induces a dipole in Br₂, making one bromine atom partially positive (δ+). The π electrons attack this electrophilic end, leading to addition across the double bond to form 1,2-dibromoethane.",
      mustInclude: ["electrophilic addition"],
    },
  },
  {
    id: "chem-mechanism-depth",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Explain electrophilic addition mechanism at H2",
    prompt: "Can you explain step by step how ethene reacts with bromine through electrophilic addition at H2 level?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract: "Explain the electrophilic addition mechanism of Br2 to ethene step by step at Singapore H2 Chemistry level. Cover the electron-rich C=C pi bond, induced dipole in Br2, electrophilic attack, formation of a cyclic bromonium ion intermediate, nucleophilic attack by Br-, and formation of 1,2-dibromoethane. Explain electron movement clearly without introducing university-level orbital theory or group theory.",
      goldReply:
        "Ethene reacts with bromine through **electrophilic addition**, forming **1,2-dibromoethane**.\n\n" +
        "**Step 1: Induced dipole in bromine**\n" +
        "The C=C double bond in ethene contains an electron-rich π bond. As Br₂ approaches, these electrons repel the electrons in Br₂, inducing a dipole (Brδ+-Brδ-). The partially positive bromine atom acts as an electrophile.\n\n" +
        "**Step 2: Electrophilic attack**\n" +
        "The π electrons from the C=C bond attack the Brδ+ atom. The Br-Br bond breaks heterolytically, producing Br⁻. A cyclic bromonium ion intermediate forms, with the bromine atom bonded to both carbon atoms.\n\n" +
        "**Step 3: Nucleophilic attack**\n" +
        "The Br⁻ ion acts as a nucleophile and attacks one of the carbon atoms in the bromonium ion, opening the three-membered ring.\n\n" +
        "**Step 4: Formation of the product**\n" +
        "The final product is **1,2-dibromoethane (CH₂BrCH₂Br)**, with one bromine atom bonded to each carbon.\n\n" +
        "**Key takeaway:** The electron-rich π bond attracts an electrophile, and bromine adds across the C=C double bond.",
      mustInclude: ["electrophilic addition", "induced dipole", "bromonium ion", "nucleophile", "1,2-dibromoethane"],
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
      contract: "Identify ethanol as highly flammable and explicitly advise against heating it directly over a Bunsen burner. Explain the ignition risk from ethanol vapour. Recommend a suitable water bath under teacher supervision, with eye protection, appropriate ventilation and no ignition sources. Keep advice practical and Secondary-level. Do not provide an unsafe heating procedure.",
      goldReply:
        "**Don't heat ethanol directly over a Bunsen burner!** Ethanol is highly flammable, and its vapour can catch fire when exposed to a naked flame.\n\n" +
        "If heating is required, use a suitable water bath under your teacher's supervision instead. Wear safety goggles, keep ethanol away from ignition sources, and work in a properly ventilated area following your school's lab safety instructions.",
      mustInclude: ["flammable"],
      mustNotInclude: ["just light it"],
    },
  },
];
