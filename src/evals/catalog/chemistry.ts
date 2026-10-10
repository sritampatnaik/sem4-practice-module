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
    {
    id: "chem-atom-particles",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Subatomic particles",
    prompt: "What are the three subatomic particles in an atom?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Name protons, neutrons and electrons, state their charges and relative locations at O-Level.",
      goldReply:
        "Atoms are made up of **protons, neutrons and electrons**.\n\n" +
        "- **Protons** have a positive (+1) charge and are found in the nucleus.\n" +
        "- **Neutrons** have no charge and are also found in the nucleus.\n" +
        "- **Electrons** have a negative (-1) charge and move around the nucleus in electron shells.",
      mustInclude: ["protons", "neutrons", "electrons"],
    },
  },
  {
    id: "chem-nucleon-number",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Nucleon number",
    prompt: "What is nucleon number?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define nucleon number as protons plus neutrons with a simple example.",
      goldReply:
        "The **nucleon number** (also called the mass number) is the **total number of protons and neutrons** in an atom's nucleus.\n\n" +
        "For example, carbon-12 has 6 protons and 6 neutrons, so its nucleon number is **12**.",
      mustInclude: ["protons", "neutrons"],
    },
  },
  {
    id: "chem-isotopes",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Define isotopes",
    prompt: "What are isotopes?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define isotopes correctly and explain that they have the same proton number but different neutron numbers.",
      goldReply:
        "**Isotopes** are atoms of the same element that have the **same number of protons** but **different numbers of neutrons**.\n\n" +
        "Because they have the same proton number, they are the same element, but their mass numbers are different.",
      mustInclude: ["same number of protons", "different numbers of neutrons"],
    },
  },
  {
    id: "chem-electron-config-17",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Electron arrangement of chlorine",
    prompt: "What is the electron arrangement of chlorine?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Use periodicTable. State the electron arrangement of chlorine as 2,8,7 and relate it to the proton number.",
      goldReply:
        "Chlorine has proton number **17**, so a neutral chlorine atom has **17 electrons**.\n\n" +
        "Its electron arrangement is **2,8,7**, meaning it has seven valence electrons in its outermost shell.",
      mustInclude: ["2,8,7"],
      requiredTools: ["periodicTable"],
    },
  },
  {
    id: "chem-valence-electrons",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Valence electrons",
    prompt: "What are valence electrons?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define valence electrons and explain why they are important in bonding.",
      goldReply:
        "**Valence electrons** are the electrons in the outermost electron shell of an atom.\n\n" +
        "They are important because they take part in chemical bonding and determine how an atom reacts with other atoms.",
      mustInclude: ["outermost"],
    },
  },
  {
    id: "chem-group-number",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Group number meaning",
    prompt: "What does the group number tell us?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that for main-group elements, the group number equals the number of valence electrons.",
      goldReply:
        "For the main-group elements, the **group number tells you how many valence electrons** each atom has.\n\n" +
        "For example, Group I elements have one valence electron, while Group VII elements have seven.",
      mustInclude: ["valence electrons"],
    },
  },
  {
    id: "chem-period-number",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Period number meaning",
    prompt: "What does the period number tell us?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that the period number equals the number of occupied electron shells.",
      goldReply:
        "The **period number** tells you the number of **occupied electron shells** in an atom.\n\n" +
        "For example, sodium is in Period 3 because its electrons occupy three shells.",
      mustInclude: ["electron shells"],
    },
  },
  {
    id: "chem-noble-gases",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why noble gases are unreactive",
    prompt: "Why are noble gases so unreactive?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that noble gases have full outer electron shells, making them stable.",
      goldReply:
        "Noble gases are **very unreactive** because they already have **full outer electron shells**.\n\n" +
        "Since their outer shells are complete, they do not tend to gain, lose or share electrons during chemical reactions.",
      mustInclude: ["full outer electron shells"],
    },
  },
  {
    id: "chem-metal-properties",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Properties of metals",
    prompt: "Name three properties of metals.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "State at least three common physical properties of metals at O-Level.",
      goldReply:
        "Some common properties of metals are:\n\n" +
        "- They are good conductors of electricity.\n" +
        "- They are good conductors of heat.\n" +
        "- They are malleable, so they can be hammered into shape.\n\n" +
        "Many metals are also shiny and ductile.",
      mustInclude: ["conductors"],
    },
  },
  {
    id: "chem-symbol-sodium",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Chemical symbol of sodium",
    prompt: "What is the chemical symbol for sodium?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Use periodicTable. State that sodium has symbol Na and explain that symbols may come from Latin names.",
      goldReply:
        "The chemical symbol for sodium is **Na**.\n\n" +
        "The symbol comes from the Latin name *natrium*, which is why it is not simply 'S'.",
      mustInclude: ["Na"],
      requiredTools: ["periodicTable"],
    },
  },
    {
    id: "chem-dot-cross-hcl",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Dot-and-cross diagram for HCl",
    prompt: "How do I draw the dot-and-cross diagram for hydrogen chloride?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that hydrogen and chlorine share one pair of electrons to form a single covalent bond. Mention chlorine has three lone pairs.",
      goldReply:
        "Hydrogen chloride (HCl) forms a **single covalent bond**.\n\n" +
        "Hydrogen contributes one electron and chlorine contributes one electron to form one shared pair. Hydrogen achieves a stable duet, while chlorine completes its octet.\n\n" +
        "In the dot-and-cross diagram, show one shared pair between H and Cl, and **three lone pairs** around the chlorine atom.",
      mustInclude: ["shared pair", "three lone pairs"],
    },
  },
  {
    id: "chem-nacl-formation",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Formation of sodium chloride",
    prompt: "Explain how sodium chloride forms.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain electron transfer from sodium to chlorine and formation of oppositely charged ions.",
      goldReply:
        "Sodium chloride forms by **electron transfer**.\n\n" +
        "A sodium atom loses one electron to become a Na⁺ ion. A chlorine atom gains that electron to become a Cl⁻ ion.\n\n" +
        "The oppositely charged ions attract each other strongly, forming an ionic bond and producing sodium chloride.",
      mustInclude: ["electron transfer", "Na⁺", "Cl⁻"],
    },
  },
  {
    id: "chem-mgo-formation",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Formation of magnesium oxide",
    prompt: "How does magnesium oxide form?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain transfer of two electrons from magnesium to oxygen.",
      goldReply:
        "Magnesium oxide forms by **ionic bonding**.\n\n" +
        "A magnesium atom loses **two electrons** to form Mg²⁺, while an oxygen atom gains those two electrons to form O²⁻.\n\n" +
        "The attraction between Mg²⁺ and O²⁻ forms magnesium oxide.",
      mustInclude: ["Mg²⁺", "O²⁻"],
    },
  },
  {
    id: "chem-water-covalent",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Bonding in water",
    prompt: "Why does oxygen form two covalent bonds in water?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain oxygen has six valence electrons and shares two more to complete its octet.",
      goldReply:
        "Oxygen has **six valence electrons**, so it needs two more to complete its outer shell.\n\n" +
        "In a water molecule, oxygen shares one electron with each hydrogen atom, forming **two covalent bonds**. This gives oxygen a full outer shell and each hydrogen a stable duet.",
      mustInclude: ["six valence electrons", "two covalent bonds"],
    },
  },
  {
    id: "chem-octet-rule",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Octet rule",
    prompt: "What is the octet rule?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define the octet rule simply and mention noble gas stability.",
      goldReply:
        "The **octet rule** states that atoms tend to gain, lose or share electrons to achieve **eight electrons in their outer shell**, giving them a stable electron arrangement similar to a noble gas.",
      mustInclude: ["eight electrons"],
    },
  },
  {
    id: "chem-metallic-bonding",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Metallic bonding",
    prompt: "What is metallic bonding?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Describe positive metal ions in a sea of delocalised electrons.",
      goldReply:
        "**Metallic bonding** is the strong electrostatic attraction between a lattice of positive metal ions and a 'sea' of **delocalised electrons**.\n\n" +
        "The delocalised electrons can move throughout the metal, which is why metals conduct electricity well.",
      mustInclude: ["delocalised electrons"],
    },
  },
  {
    id: "chem-ionic-conductivity",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why ionic compounds conduct when molten",
    prompt: "Why does molten sodium chloride conduct electricity but solid sodium chloride does not?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain ions are fixed in solids but free to move when molten.",
      goldReply:
        "Solid sodium chloride does **not** conduct electricity because its ions are held in fixed positions and cannot move.\n\n" +
        "When sodium chloride is molten, the ions are free to move and carry electrical charge, so the liquid conducts electricity.",
      mustInclude: ["free to move"],
    },
  },
  {
    id: "chem-diamond-properties",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why diamond is hard",
    prompt: "Why is diamond so hard?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain giant covalent structure and strong covalent bonds throughout the lattice.",
      goldReply:
        "Diamond has a **giant covalent structure**. Each carbon atom is covalently bonded to four other carbon atoms in a three-dimensional network.\n\n" +
        "Many strong covalent bonds must be broken to scratch or cut diamond, making it extremely hard.",
      mustInclude: ["giant covalent"],
    },
  },
  {
    id: "chem-graphite-conducts",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why graphite conducts",
    prompt: "Why can graphite conduct electricity?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain each carbon contributes one delocalised electron that can move through the layers.",
      goldReply:
        "Graphite conducts electricity because each carbon atom forms three covalent bonds, leaving **one delocalised electron**.\n\n" +
        "These delocalised electrons are free to move along the layers and carry electrical charge.",
      mustInclude: ["delocalised electron"],
    },
  },
  {
    id: "chem-simple-molecular",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Simple molecular substances",
    prompt: "Why do simple molecular substances usually have low melting and boiling points?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain weak intermolecular forces rather than strong covalent bonds being overcome.",
      goldReply:
        "Simple molecular substances have **low melting and boiling points** because only the **weak intermolecular forces** between molecules need to be overcome.\n\n" +
        "The strong covalent bonds inside each molecule are not broken during melting or boiling.",
      mustInclude: ["weak intermolecular forces"],
    },
  },
    {
    id: "chem-formula-magnesium-chloride",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Formula of magnesium chloride",
    prompt: "Why is the formula of magnesium chloride MgCl2 and not MgCl?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain balancing ionic charges using Mg2+ and Cl-.",
      goldReply:
        "Magnesium forms **Mg²⁺** ions, while chlorine forms **Cl⁻** ions.\n\n" +
        "One Mg²⁺ has a +2 charge, so it needs **two Cl⁻ ions** (each with a -1 charge) to make the compound electrically neutral.\n\n" +
        "Therefore, the correct formula is **MgCl₂**.",
      mustInclude: ["Mg²⁺", "two Cl⁻", "MgCl₂"],
    },
  },
  {
    id: "chem-formula-aluminium-oxide",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Formula of aluminium oxide",
    prompt: "How do we work out the formula of aluminium oxide?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain balancing charges between Al3+ and O2- to obtain Al2O3.",
      goldReply:
        "Aluminium forms **Al³⁺** ions and oxygen forms **O²⁻** ions.\n\n" +
        "To make the total charge zero, we need **2 aluminium ions** (+6) and **3 oxide ions** (-6).\n\n" +
        "So the formula is **Al₂O₃**.",
      mustInclude: ["Al₂O₃"],
    },
  },
  {
    id: "chem-state-symbols",
    suiteId: "chemistry",
    kind: "teaching",
    title: "State symbols",
    prompt: "What do (s), (l), (g) and (aq) mean in chemical equations?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define the four common state symbols with examples.",
      goldReply:
        "State symbols show the physical state of each substance.\n\n" +
        "- **(s)** means solid.\n" +
        "- **(l)** means liquid.\n" +
        "- **(g)** means gas.\n" +
        "- **(aq)** means aqueous, which means dissolved in water.",
      mustInclude: ["(aq)", "dissolved in water"],
    },
  },
  {
    id: "chem-conservation-mass",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Conservation of mass",
    prompt: "Why does mass stay the same during a chemical reaction?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain conservation of atoms and therefore mass in a chemical reaction.",
      goldReply:
        "Mass is conserved because **atoms are not created or destroyed** during a chemical reaction.\n\n" +
        "The atoms are simply rearranged to form new substances, so the total mass of the reactants equals the total mass of the products in a closed system.",
      mustInclude: ["atoms are not created or destroyed"],
    },
  },
  {
    id: "chem-relative-atomic-mass",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Relative atomic mass",
    prompt: "What is relative atomic mass (Ar)?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define relative atomic mass at O-Level without introducing isotopic abundance calculations.",
      goldReply:
        "**Relative atomic mass (Aᵣ)** compares the average mass of an atom of an element with one-twelfth of the mass of a carbon-12 atom.\n\n" +
        "You use Aᵣ values from the periodic table when calculating relative molecular or formula masses.",
      mustInclude: ["carbon-12"],
    },
  },
  {
    id: "chem-relative-formula-mass",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Calculate Mr of carbon dioxide",
    prompt: "What is the relative molecular mass of carbon dioxide?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Calculate Mr of CO2 by adding Ar values.",
      goldReply:
        "The relative molecular mass (**Mᵣ**) of carbon dioxide is found by adding the relative atomic masses.\n\n" +
        "Carbon: 12\n" +
        "Oxygen: 16 × 2 = 32\n\n" +
        "So, **Mᵣ(CO₂) = 12 + 32 = 44**.",
      mustInclude: ["44"],
    },
  },
    {
    id: "chem-mass-from-moles",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Calculate mass from moles",
    prompt: "What is the mass of 0.5 mol of carbon dioxide? M_r(CO2) = 44.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Use m = n × M_r, show substitution and units, and explain the calculation at Secondary level.",
      goldReply:
        "To find the mass, use:\n\n" +
        "**mass = number of moles × molar mass**\n\n" +
        "m = 0.5 × 44 = **22 g**\n\n" +
        "So, **0.5 mol of carbon dioxide has a mass of 22 g**.",
      mustInclude: ["22 g"],
    },
  },
  {
    id: "chem-moles-carbon-dioxide",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Calculate moles of carbon dioxide",
    prompt: "How many moles are there in 88 g of carbon dioxide? M_r(CO2) = 44.",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Apply n = m / M_r correctly with substitution and units.",
      goldReply:
        "Use the formula:\n\n" +
        "**number of moles = mass ÷ molar mass**\n\n" +
        "n = 88 ÷ 44 = **2 mol**\n\n" +
        "Therefore, **88 g of carbon dioxide contains 2 mol**.",
      mustInclude: ["2 mol"],
    },
  },
  {
    id: "chem-gas-volume-rtp",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Gas volume at r.t.p.",
    prompt: "What volume does 2 mol of oxygen gas occupy at room temperature and pressure?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Use the molar gas volume of 24 dm3 at r.t.p. and show the calculation.",
      goldReply:
        "At room temperature and pressure (r.t.p.), **1 mol of any gas occupies 24 dm³**.\n\n" +
        "So:\n\n" +
        "Volume = 2 × 24 = **48 dm³**\n\n" +
        "Therefore, **2 mol of oxygen occupies 48 dm³ at r.t.p.**",
      mustInclude: ["48 dm³"],
    },
  },
  {
    id: "chem-concentration-definition",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Define concentration",
    prompt: "What does the concentration of a solution mean?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define concentration simply as the amount of solute dissolved in a given volume of solution.",
      goldReply:
        "**Concentration** tells us how much solute is dissolved in a given volume of solution.\n\n" +
        "A more concentrated solution contains more solute in the same volume than a less concentrated solution.",
      mustInclude: ["solute"],
    },
  },
  {
    id: "chem-concentration-calculation",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Calculate concentration",
    prompt: "What is the concentration of a solution containing 0.50 mol of sodium chloride in 0.25 dm3 of solution?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Use concentration = moles / volume, showing substitution and units.",
      goldReply:
        "Use the formula:\n\n" +
        "**concentration = number of moles ÷ volume**\n\n" +
        "c = 0.50 ÷ 0.25 = **2.0 mol dm⁻³**\n\n" +
        "So, the concentration of the solution is **2.0 mol dm⁻³**.",
      mustInclude: ["2.0 mol dm⁻³"],
    },
  },
  {
    id: "chem-empirical-formula",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Empirical formula",
    prompt: "What is an empirical formula?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define empirical formula as the simplest whole-number ratio of atoms.",
      goldReply:
        "An **empirical formula** shows the **simplest whole-number ratio of atoms** of each element in a compound.\n\n" +
        "For example, glucose has the molecular formula C₆H₁₂O₆, but its empirical formula is **CH₂O**.",
      mustInclude: ["simplest whole-number ratio"],
    },
  },
    {
    id: "chem-molecular-formula",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Molecular vs empirical formula",
    prompt: "What is the difference between a molecular formula and an empirical formula?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Contrast molecular and empirical formulae with an example suitable for O-Level.",
      goldReply:
        "A **molecular formula** shows the actual number of each type of atom in a molecule, while an **empirical formula** shows the simplest whole-number ratio of the atoms.\n\n" +
        "For example, glucose has the molecular formula **C₆H₁₂O₆**, but its empirical formula is **CH₂O**.",
      mustInclude: ["molecular formula", "empirical formula"],
    },
  },
  {
    id: "chem-percentage-composition",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Percentage composition",
    prompt: "What percentage by mass of water is hydrogen? (H = 1, O = 16)",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Calculate percentage composition of hydrogen in water, showing the calculation.",
      goldReply:
        "First, find the relative molecular mass of water:\n\n" +
        "Mᵣ(H₂O) = (2 × 1) + 16 = 18\n\n" +
        "Hydrogen contributes a mass of 2.\n\n" +
        "Percentage of hydrogen = (2 ÷ 18) × 100 = **11.1%** (to 1 decimal place).\n\n" +
        "So, hydrogen makes up **11.1%** of the mass of water.",
      mustInclude: ["11.1%"],
    },
  },
  {
    id: "chem-balance-methane-combustion",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Balance methane combustion",
    prompt: "Can you balance CH4 + O2 -> CO2 + H2O?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Use reactionBalancer. Explain balancing carbon, hydrogen and oxygen step by step. Final equation: CH4 + 2O2 → CO2 + 2H2O.",
      goldReply:
        "Let's balance the equation step by step.\n\n" +
        "Start with carbon: there is 1 carbon atom on each side, so carbon is already balanced.\n\n" +
        "Next, balance hydrogen. There are 4 hydrogen atoms in CH₄, so place a **2** in front of H₂O to give 4 hydrogen atoms on the product side.\n\n" +
        "Now count oxygen atoms. There are 4 oxygen atoms on the right, so place a **2** in front of O₂.\n\n" +
        "The balanced equation is:\n\n" +
        "**CH₄ + 2O₂ → CO₂ + 2H₂O**",
      mustInclude: ["CH₄ + 2O₂ → CO₂ + 2H₂O"],
      requiredTools: ["reactionBalancer"],
    },
  },
  {
    id: "chem-limiting-reagent-intro",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Limiting reagent",
    prompt: "What is a limiting reagent?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define limiting reagent without requiring numerical calculations.",
      goldReply:
        "The **limiting reagent** is the reactant that is **used up first** in a chemical reaction.\n\n" +
        "Once it has all reacted, the reaction stops even if there is some of the other reactant left over.",
      mustInclude: ["used up first"],
    },
  },
  {
    id: "chem-mole-misconception",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Correct mole misconception",
    prompt: "If two substances both have 1 mole, does the heavier one have more particles?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Correct the misconception by explaining that one mole always contains the same number of particles regardless of mass.",
      goldReply:
        "That's a common misconception, but **1 mole of any substance contains the same number of particles**.\n\n" +
        "A heavier substance has a larger mass **per mole**, not more particles.\n\n" +
        "For example, 1 mol of hydrogen gas and 1 mol of carbon dioxide both contain the same number of molecules, even though carbon dioxide has a much greater mass.",
      mustInclude: ["same number of particles"],
    },
  },
    {
    id: "chem-primary-evaporation",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Primary evaporation",
    prompt: "Why do wet clothes dry when we hang them outside?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain evaporation using simple language suitable for Primary students.",
      goldReply:
        "Wet clothes dry because of **evaporation**.\n\n" +
        "The water on the clothes changes from a liquid into water vapour and mixes with the air. Warm temperatures and moving air help the clothes dry faster.",
      mustInclude: ["evaporation"],
    },
  },
  {
    id: "chem-jc-hydrogen-bonding",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Hydrogen bonding in water",
    prompt: "Why does water have a much higher boiling point than methane?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain hydrogen bonding in water compared with London dispersion forces in methane.",
      goldReply:
        "Water has a much higher boiling point because its molecules form **hydrogen bonds**, which are much stronger than the **London dispersion forces** between methane molecules.\n\n" +
        "More energy is needed to overcome hydrogen bonds, so water boils at a much higher temperature than methane.",
      mustInclude: ["hydrogen bonds", "London dispersion forces"],
    },
  },
  {
    id: "chem-secondary-ph",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Understanding pH",
    prompt: "What does a pH of 2 tell us?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that pH 2 indicates a strongly acidic solution using O-Level terminology.",
      goldReply:
        "A solution with **pH 2** is **strongly acidic**.\n\n" +
        "The lower the pH, the more acidic the solution. A pH of 7 is neutral, while values above 7 are alkaline.",
      mustInclude: ["strongly acidic"],
    },
  },
  {
    id: "chem-primary-filter",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Filtering muddy water",
    prompt: "How does a filter help separate muddy water?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain filtration using simple everyday language without introducing advanced terminology.",
      goldReply:
        "A **filter** lets the water pass through but traps the larger pieces of dirt or sand.\n\n" +
        "This separates the solid particles from the water, making the water much clearer.",
      mustInclude: ["filter"],
    },
  },
  {
    id: "chem-jc-equilibrium",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Dynamic equilibrium",
    prompt: "What does dynamic equilibrium mean?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define dynamic equilibrium and explain that forward and reverse reactions continue at equal rates.",
      goldReply:
        "**Dynamic equilibrium** is reached when the **forward and reverse reactions occur at the same rate** in a closed system.\n\n" +
        "The concentrations of reactants and products remain constant because they are being formed and used up at equal rates, even though both reactions continue.",
      mustInclude: ["same rate", "closed system"],
    },
  },
  {
    id: "chem-secondary-gas-test",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Test for oxygen",
    prompt: "How do you test whether a gas is oxygen?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Describe the standard oxygen gas test and expected observation.",
      goldReply:
        "To test for **oxygen**, insert a **glowing splint** into the gas.\n\n" +
        "If the gas is oxygen, the glowing splint **relights**.",
      mustInclude: ["glowing splint", "relights"],
    },
  },
    {
    id: "chem-secondary-co2-test",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Test for carbon dioxide",
    prompt: "How can I test whether a gas is carbon dioxide?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Describe the limewater test and the expected observation.",
      goldReply:
        "Bubble the gas through **limewater**.\n\n" +
        "If the gas is **carbon dioxide**, the limewater turns **milky** because a white precipitate of calcium carbonate forms.",
      mustInclude: ["limewater", "milky"],
    },
  },
  {
    id: "chem-primary-condensation",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Primary condensation",
    prompt: "Why do water droplets form on the outside of a cold can?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain condensation in simple language suitable for Primary students.",
      goldReply:
        "The cold can cools the air around it. Water vapour in the air loses heat and changes back into tiny liquid water droplets.\n\n" +
        "This change is called **condensation**.",
      mustInclude: ["condensation"],
    },
  },
  {
    id: "chem-jc-polarity",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why carbon dioxide is non-polar",
    prompt: "CO2 has polar bonds, so why is the molecule non-polar?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain bond polarity versus molecular polarity using the linear shape and cancellation of dipoles.",
      goldReply:
        "Each C=O bond in carbon dioxide is **polar** because oxygen is more electronegative than carbon.\n\n" +
        "However, CO₂ is **linear**, so the two bond dipoles are equal in magnitude and act in opposite directions. They cancel each other out, making the molecule **non-polar** overall.",
      mustInclude: ["linear", "cancel"],
    },
  },
  {
    id: "chem-secondary-neutralisation",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Meaning of neutralisation",
    prompt: "What is a neutralisation reaction?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define neutralisation and state the general products.",
      goldReply:
        "**Neutralisation** is the reaction between an **acid** and a **base (or alkali)**.\n\n" +
        "The products are **a salt and water**.",
      mustInclude: ["salt", "water"],
    },
  },
  {
    id: "chem-jc-mb-distribution",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Heating and Maxwell-Boltzmann",
    prompt: "Why does increasing temperature increase the rate of reaction?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain using the Maxwell-Boltzmann distribution and activation energy.",
      goldReply:
        "Increasing the temperature increases the average kinetic energy of the particles.\n\n" +
        "The **Maxwell-Boltzmann distribution** shifts so that a greater proportion of particles have energy equal to or greater than the **activation energy**. As a result, more successful collisions occur each second and the reaction rate increases.",
      mustInclude: ["activation energy", "Maxwell-Boltzmann"],
    },
  },
  {
    id: "chem-secondary-misconception-acid",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Strong vs concentrated acid",
    prompt: "Is a concentrated acid always a strong acid?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Correct the misconception by distinguishing strength from concentration.",
      goldReply:
        "Not necessarily. **Strength** and **concentration** describe different things.\n\n" +
        "A **strong acid** ionises completely in water, while a **concentrated acid** simply contains a large amount of acid dissolved in a given volume of solution.\n\n" +
        "For example, a dilute solution of hydrochloric acid is still a strong acid because it ionises completely.",
      mustInclude: ["strength", "concentration"],
    },
  },
    {
    id: "chem-primary-reversible-change",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Reversible change",
    prompt: "Is melting ice a reversible change? Why?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that melting ice is reversible because freezing changes it back into ice.",
      goldReply:
        "Yes, melting ice is a **reversible change**.\n\n" +
        "When ice melts, it becomes liquid water. If you cool the water again, it freezes back into ice. No new substance is formed.",
      mustInclude: ["reversible"],
    },
  },
  {
    id: "chem-secondary-reactivity-series",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Purpose of the reactivity series",
    prompt: "Why do we learn the reactivity series?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that the reactivity series helps predict reactions such as displacement and reactions with water or acids.",
      goldReply:
        "The **reactivity series** helps us compare how reactive different metals are.\n\n" +
        "It allows us to predict whether a metal will react with water or acids, and whether it can **displace** another metal from its compound.",
      mustInclude: ["displace"],
    },
  },
  {
    id: "chem-secondary-displacement",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Copper in zinc sulfate",
    prompt: "Will a copper strip react if it is placed in zinc sulfate solution?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain using the reactivity series that copper is less reactive than zinc, so no displacement occurs.",
      goldReply:
        "No. Copper is **less reactive** than zinc, so it cannot displace zinc from zinc sulfate solution.\n\n" +
        "A displacement reaction only happens when the solid metal is **more reactive** than the metal ion in solution.",
      mustInclude: ["less reactive", "displace"],
    },
  },
  {
    id: "chem-primary-rusting",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why iron rusts",
    prompt: "Why does iron rust when it is left outside?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain simply that iron reacts with oxygen and water to form rust.",
      goldReply:
        "Iron rusts because it reacts with **oxygen** and **water** in the air.\n\n" +
        "This forms a new substance called **rust**, which is why rusting is a chemical change.",
      mustInclude: ["rust"],
    },
  },
  {
    id: "chem-jc-le-chatelier",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Le Chatelier's principle",
    prompt: "Can you explain Le Chatelier's principle in simple terms?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "State Le Chatelier's principle and explain that equilibrium shifts to oppose a change.",
      goldReply:
        "**Le Chatelier's principle** states that when a system at equilibrium is disturbed, the equilibrium shifts in the direction that **opposes the change**.\n\n" +
        "For example, increasing the concentration of a reactant causes the equilibrium to shift towards the products to use up some of the added reactant.",
      mustInclude: ["opposes the change"],
    },
  },
  {
    id: "chem-secondary-electrolysis-definition",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Electrolysis definition",
    prompt: "What is electrolysis?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define electrolysis at O-Level without discussing electrode products.",
      goldReply:
        "**Electrolysis** is the chemical decomposition of an ionic compound by passing an electric current through it when it is **molten or dissolved in water**.\n\n" +
        "The moving ions carry the electric current and take part in chemical reactions at the electrodes.",
      mustInclude: ["molten or dissolved in water"],
    },
  },
    {
    id: "chem-jc-catalyst",
    suiteId: "chemistry",
    kind: "teaching",
    title: "How catalysts increase reaction rate",
    prompt: "How does a catalyst speed up a reaction?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that catalysts provide an alternative reaction pathway with lower activation energy and are not consumed.",
      goldReply:
        "A **catalyst** speeds up a reaction by providing an **alternative reaction pathway** with a **lower activation energy**.\n\n" +
        "Because more particles now have enough energy to react successfully, the reaction rate increases. The catalyst itself is **not consumed** during the reaction.",
      mustInclude: ["lower activation energy", "not consumed"],
    },
  },
  {
    id: "chem-jc-hess-law",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Meaning of Hess's Law",
    prompt: "Can you explain Hess's Law in simple terms?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "State Hess's Law and explain that enthalpy change is independent of the reaction pathway.",
      goldReply:
        "**Hess's Law** states that the overall enthalpy change of a reaction is **independent of the pathway taken**.\n\n" +
        "This means we can calculate an unknown enthalpy change by adding or subtracting other known enthalpy changes that lead to the same overall reaction.",
      mustInclude: ["independent of the pathway"],
    },
  },
  {
    id: "chem-secondary-electrolysis-electrode",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Meaning of cathode",
    prompt: "What happens at the cathode during electrolysis?",
    profile: secondaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "State that reduction occurs at the cathode and positive ions gain electrons there.",
      goldReply:
        "The **cathode** is the negative electrode during electrolysis.\n\n" +
        "**Positive ions (cations)** move to the cathode and **gain electrons**. This process is called **reduction**.",
      mustInclude: ["gain electrons", "reduction"],
    },
  },
  {
    id: "chem-primary-dissolving",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Does sugar disappear?",
    prompt: "When sugar dissolves in water, where does it go?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that the sugar is still present after dissolving using Primary-level language.",
      goldReply:
        "The sugar does **not disappear**.\n\n" +
        "It breaks up into tiny particles that spread throughout the water, so you can no longer see it. If the water evaporates, the sugar is left behind again.",
      mustInclude: ["does not disappear"],
    },
  },
  {
    id: "chem-jc-sn1-sn2",
    suiteId: "chemistry",
    kind: "teaching",
    title: "SN1 vs SN2 overview",
    prompt: "What's the difference between SN1 and SN2 reactions?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Give a high-level comparison suitable for H2 Chemistry without discussing advanced stereochemistry.",
      goldReply:
        "Both **SN1** and **SN2** are nucleophilic substitution reactions, but they differ in how they occur.\n\n" +
        "**SN1** proceeds in **two steps** through a carbocation intermediate, while **SN2** occurs in **one step** as the nucleophile attacks while the leaving group leaves.\n\n" +
        "At H2 level, remember that SN1 involves a carbocation intermediate, whereas SN2 does not.",
      mustInclude: ["carbocation", "one step", "two steps"],
    },
  },
  {
    id: "chem-jc-misconception-equilibrium",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Equilibrium misconception",
    prompt: "My friend said equilibrium means the reaction has stopped. Is that correct?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Correct the misconception by explaining that equilibrium is dynamic.",
      goldReply:
        "Not quite. At **dynamic equilibrium**, the reaction has **not stopped**.\n\n" +
        "The forward and reverse reactions are both still happening, but at the **same rate**. That is why the concentrations remain constant even though particles continue reacting.",
      mustInclude: ["dynamic equilibrium", "same rate"],
    },
  },
    {
    id: "chem-jc-bond-enthalpy",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Bond enthalpy",
    prompt: "What is meant by bond enthalpy?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Define bond enthalpy as the enthalpy change required to break one mole of covalent bonds in the gaseous state.",
      goldReply:
        "**Bond enthalpy** is the enthalpy change required to break **one mole of a specified covalent bond in the gaseous state**.\n\n" +
        "Because bond breaking requires energy, bond enthalpy values are always positive.",
      mustInclude: ["gaseous state"],
    },
  },
  {
    id: "chem-primary-melting",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why chocolate melts",
    prompt: "Why does chocolate melt when I hold it?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain melting using simple language and relate it to heat from the hand.",
      goldReply:
        "Your hand is warmer than the chocolate.\n\n" +
        "Heat moves from your hand to the chocolate, causing it to **melt** from a solid into a liquid.",
      mustInclude: ["melt"],
    },
  },
  {
    id: "chem-jc-kc",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Meaning of Kc",
    prompt: "What does the equilibrium constant Kc tell us?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain qualitatively what large and small Kc values indicate without requiring calculations.",
      goldReply:
        "The **equilibrium constant, Kc**, tells us the position of equilibrium.\n\n" +
        "A **large Kc** means products are favoured at equilibrium, while a **small Kc** means reactants are favoured.\n\n" +
        "Kc depends only on temperature.",
      mustInclude: ["temperature"],
    },
  },
  {
    id: "chem-primary-soluble",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Meaning of soluble",
    prompt: "What does it mean if something is soluble?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain soluble using simple language suitable for Primary students.",
      goldReply:
        "If a substance is **soluble**, it can dissolve in a liquid such as water.\n\n" +
        "For example, sugar is soluble in water because it dissolves and forms a solution.",
      mustInclude: ["dissolve"],
    },
  },
  {
    id: "chem-jc-esterification",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Esterification",
    prompt: "What is esterification?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that esterification is the reaction between a carboxylic acid and an alcohol to form an ester and water.",
      goldReply:
        "**Esterification** is the reaction between a **carboxylic acid** and an **alcohol**.\n\n" +
        "The products are an **ester** and **water**. This reaction is usually carried out with a concentrated acid catalyst, such as concentrated sulfuric acid.",
      mustInclude: ["ester", "water"],
    },
  },
  {
    id: "chem-primary-water-cycle",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Water cycle",
    prompt: "Can you explain the water cycle simply?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain evaporation, condensation and rain using simple language.",
      goldReply:
        "The Sun heats water in rivers, lakes and oceans, causing **evaporation**.\n\n" +
        "The water vapour cools and changes into tiny droplets by **condensation**, forming clouds. When the droplets become large enough, they fall as rain.",
      mustInclude: ["evaporation", "condensation"],
    },
  },
  {
    id: "chem-jc-exothermic-profile",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Exothermic energy profile",
    prompt: "How can I recognise an exothermic energy profile diagram?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that products are lower in energy than reactants and ΔH is negative.",
      goldReply:
        "In an **exothermic reaction**, the **products are at a lower energy level than the reactants**.\n\n" +
        "Energy is released to the surroundings, so the enthalpy change, **ΔH, is negative**.",
      mustInclude: ["ΔH", "negative"],
    },
  },
    {
    id: "chem-jc-catalyst-equilibrium-misconception",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Catalyst and equilibrium misconception",
    prompt: "My friend said adding a catalyst changes the position of equilibrium. Is that true?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Correct the misconception. Explain that a catalyst speeds up both forward and reverse reactions equally, so equilibrium is reached faster but its position does not change.",
      goldReply:
        "That's a very common misconception.\n\n" +
        "A **catalyst does not change the position of equilibrium**. Instead, it provides an alternative reaction pathway with a lower activation energy for **both the forward and reverse reactions**.\n\n" +
        "As a result, equilibrium is reached **more quickly**, but the equilibrium composition remains unchanged.",
      mustInclude: ["does not change", "both the forward and reverse"],
    },
  },
  {
    id: "chem-primary-salt-water",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Recovering salt from salt water",
    prompt: "How can we get the salt back after it dissolves in water?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain evaporation simply without introducing distillation.",
      goldReply:
        "You can leave the water to **evaporate** or gently heat it so the water changes into water vapour.\n\n" +
        "The water leaves, but the **salt stays behind** because it does not evaporate with the water.",
      mustInclude: ["evaporate"],
    },
  },
  {
    id: "chem-jc-pressure-equilibrium",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Pressure and equilibrium",
    prompt: "Why does increasing pressure sometimes shift an equilibrium, but sometimes it doesn't?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain using the number of moles of gaseous particles on each side of the equation.",
      goldReply:
        "Pressure only affects equilibria involving **gases**.\n\n" +
        "If the two sides of the equation have **different numbers of moles of gas**, increasing the pressure shifts the equilibrium towards the side with **fewer moles of gas**.\n\n" +
        "If both sides have the same number of gaseous molecules, changing the pressure has no effect on the equilibrium position.",
      mustInclude: ["fewer moles of gas"],
    },
  },
  {
    id: "chem-jc-memory-redox",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Remembering oxidation and reduction",
    prompt: "I keep mixing up oxidation and reduction. Do you have a good way to remember them?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Provide a memory aid while also explaining the chemistry.",
      goldReply:
        "A useful memory aid is **OIL RIG**:\n\n" +
        "**Oxidation Is Loss** of electrons.\n" +
        "**Reduction Is Gain** of electrons.\n\n" +
        "Remember that this describes what happens to **electrons**, which is especially useful when studying redox reactions at H2 level.",
      mustInclude: ["OIL RIG"],
    },
  },
  {
    id: "chem-primary-cooking-egg",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Cooking an egg",
    prompt: "Is cooking an egg a reversible change?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that cooking an egg is irreversible because a new substance forms.",
      goldReply:
        "No. Cooking an egg is an **irreversible change**.\n\n" +
        "Heating changes the egg into new substances, so you cannot turn a cooked egg back into a raw egg.",
      mustInclude: ["irreversible"],
    },
  },
  {
    id: "chem-jc-exam-technique",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Exam technique for explaining trends",
    prompt: "I lose marks when explaining periodic trends. Any exam tips?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Give exam-focused advice rather than reteaching periodic trends.",
      goldReply:
        "A useful exam tip is to explain **why** the trend happens instead of only stating the trend.\n\n" +
        "For example, don't just write 'atomic radius decreases'. Explain that the **nuclear charge increases while the electrons are added to the same shell**, so the electrons are pulled closer to the nucleus.\n\n" +
        "In H2 Chemistry, the explanation usually earns more marks than simply stating the trend.",
      mustInclude: ["why"],
    },
  },
  {
    id: "chem-jc-scaffold-haber",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Scaffold explanation of Haber Process",
    prompt: "I understand Le Chatelier's principle, but I still don't understand why high pressure is used in the Haber Process.",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Build on the student's prior knowledge and connect it to the Haber Process.",
      goldReply:
        "Since you already know **Le Chatelier's principle**, let's apply it here.\n\n" +
        "In the Haber Process:\n\n" +
        "N₂(g) + 3H₂(g) ⇌ 2NH₃(g)\n\n" +
        "There are **4 moles of gas** on the left but only **2 moles of gas** on the right.\n\n" +
        "Increasing the pressure shifts the equilibrium towards the side with fewer moles of gas, so **more ammonia is produced**. This is a direct application of Le Chatelier's principle.",
      mustInclude: ["4 moles", "2 moles"],
    },
  },
    {
    id: "chem-jc-kc-temperature",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why Kc changes only with temperature",
    prompt: "Why does changing the pressure not change Kc, but changing the temperature does?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that Kc is determined by temperature only. Distinguish between changing equilibrium position and changing the equilibrium constant.",
      goldReply:
        "It's helpful to separate **the equilibrium position** from **the equilibrium constant, Kc**.\n\n" +
        "Changing the pressure may shift the equilibrium position, but it does **not** change the value of **Kc**.\n\n" +
        "Only changing the **temperature** changes the energies of the reaction and therefore changes the value of **Kc**.",
      mustInclude: ["temperature", "equilibrium position"],
    },
  },
  {
    id: "chem-primary-ice-water",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Ice in a drink",
    prompt: "When ice melts in my drink, is a new substance formed?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that melting is a physical change and no new substance is formed.",
      goldReply:
        "No. When ice melts, it is still **water**.\n\n" +
        "Only the **state** changes from solid to liquid. Because no new substance is formed, melting is a **physical change**.",
      mustInclude: ["physical change"],
    },
  },
  {
    id: "chem-jc-bond-breaking",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Bond breaking misconception",
    prompt: "I thought breaking bonds releases energy. Why do my notes say bond breaking needs energy?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Correct the misconception by explaining that bond breaking is endothermic while bond formation is exothermic.",
      goldReply:
        "This is one of the most common misconceptions in H2 Chemistry.\n\n" +
        "**Breaking bonds always requires energy**, so it is an **endothermic** process.\n\n" +
        "**Forming new bonds releases energy**, making bond formation **exothermic**. Whether a reaction is overall exothermic or endothermic depends on the balance between these two energy changes.",
      mustInclude: ["bond formation", "endothermic"],
    },
  },
  {
    id: "chem-jc-compare-sn1-sn2",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Compare SN1 and SN2",
    prompt: "Could you summarise the differences between SN1 and SN2 in a table?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Compare SN1 and SN2 by number of steps, intermediate, and rate equation without discussing stereochemistry.",
      goldReply:
        "| Feature | SN1 | SN2 |\n" +
        "| --- | --- | --- |\n" +
        "| Steps | Two | One |\n" +
        "| Intermediate | Carbocation | None |\n" +
        "| Rate | Depends only on the halogenoalkane | Depends on both the halogenoalkane and the nucleophile |\n\n" +
        "A useful way to remember this is that **SN1 forms a carbocation first, whereas SN2 happens in a single concerted step**.",
      mustInclude: ["Carbocation", "Depends on both"],
    },
  },
  {
    id: "chem-primary-material-choice",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Choosing materials",
    prompt: "Why are saucepan handles often made of plastic instead of metal?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain using the idea that plastic is a poor conductor of heat.",
      goldReply:
        "Plastic is a **poor conductor of heat**, so it does not become hot as quickly as metal.\n\n" +
        "This helps protect your hands when you hold the saucepan.",
      mustInclude: ["poor conductor"],
    },
  },
  {
    id: "chem-jc-buffer-purpose",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Purpose of a buffer",
    prompt: "What's the point of using a buffer solution?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain the purpose of buffers qualitatively without derivations.",
      goldReply:
        "A **buffer solution** helps to **resist changes in pH** when small amounts of acid or alkali are added.\n\n" +
        "Buffers are useful whenever a fairly constant pH is needed, such as in biological systems or chemical reactions that are sensitive to pH.",
      mustInclude: ["resist changes in pH"],
    },
  },
  {
    id: "chem-jc-explain-wrong-answer",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Explain why an answer is wrong",
    prompt: "I wrote that graphite conducts electricity because carbon is a metal. Why is that wrong?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Correct the student's reasoning while affirming the correct property responsible for conductivity.",
      goldReply:
        "Your conclusion that graphite conducts electricity is correct, but the **reason** needs to be changed.\n\n" +
        "Carbon is **not a metal**. Graphite conducts because each carbon atom forms three covalent bonds, leaving **one delocalised electron** that can move through the structure and carry charge.\n\n" +
        "In exam questions, giving the correct explanation is just as important as giving the correct observation.",
      mustInclude: ["not a metal", "delocalised electron"],
    },
  },
    {
    id: "chem-primary-compare-solids-liquids",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Compare solids and liquids",
    prompt: "Can you help me remember the difference between a solid and a liquid?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Compare solids and liquids using simple language and a memorable summary suitable for Primary students.",
      goldReply:
        "Here's an easy way to remember it:\n\n" +
        "- A **solid** keeps its own shape.\n" +
        "- A **liquid** flows and takes the shape of its container.\n\n" +
        "Think of an ice cube and a glass of water. The ice cube keeps its shape, but the water changes shape to fit the glass.",
      mustInclude: ["shape"],
    },
  },
  {
    id: "chem-jc-lechatelier-catalyst",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Catalyst and Le Chatelier",
    prompt: "Why isn't a catalyst considered one of the changes in Le Chatelier's principle?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that Le Chatelier's principle concerns disturbances to equilibrium position, whereas catalysts affect only the rate of reaching equilibrium.",
      goldReply:
        "Le Chatelier's principle predicts how an equilibrium responds to changes such as **concentration, pressure or temperature**.\n\n" +
        "A catalyst is different because it **does not disturb the equilibrium position**. Instead, it speeds up both the forward and reverse reactions equally, so equilibrium is reached faster without changing the equilibrium composition.",
      mustInclude: ["does not disturb the equilibrium position"],
    },
  },
  {
    id: "chem-primary-why-salt-sugar-different",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Salt and sugar look similar",
    prompt: "Salt and sugar both look white. How are they different?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain that substances can look similar but have different properties using Primary-level language.",
      goldReply:
        "Even though salt and sugar both look white, they are **different substances**.\n\n" +
        "They taste different, are made of different particles, and are used for different purposes. This shows that substances can look similar but still have different properties.",
      mustInclude: ["different properties"],
    },
  },
  {
    id: "chem-jc-haber-compromise",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Why the Haber Process uses compromise conditions",
    prompt: "If low temperature gives a higher yield of ammonia, why doesn't the Haber Process use a very low temperature?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain the trade-off between equilibrium yield and reaction rate, introducing the idea of compromise conditions.",
      goldReply:
        "That's an excellent question because it highlights an important engineering trade-off.\n\n" +
        "A **lower temperature** gives a higher equilibrium yield of ammonia because the Haber Process is exothermic. However, the reaction becomes **too slow** to be economically practical.\n\n" +
        "Industry therefore uses a **compromise temperature**, giving a reasonable yield while keeping the reaction fast enough for large-scale production.",
      mustInclude: ["compromise", "too slow"],
    },
  },
  {
    id: "chem-primary-experiment-prediction",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Making predictions",
    prompt: "My teacher asked me to predict what will happen before an experiment. Why do we do that?",
    profile: primaryAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Explain the purpose of making predictions in simple language suitable for Primary students.",
      goldReply:
        "Making a **prediction** helps you think about what you expect to happen before you start the experiment.\n\n" +
        "After the experiment, you can compare your prediction with your observations and think about what you have learnt.",
      mustInclude: ["prediction"],
    },
  },
  {
    id: "chem-jc-study-strategy",
    suiteId: "chemistry",
    kind: "teaching",
    title: "Studying H2 Chemistry effectively",
    prompt: "There are so many reactions to memorise for H2 Chemistry. What's a better way to study than just memorising everything?",
    profile: jcAlex,
    targetAgent: "chemistry",
    scaffold: {
      contract:
        "Recommend understanding reaction patterns, organising reactions by functional groups, and practising application rather than rote memorisation.",
      goldReply:
        "Instead of trying to memorise every reaction separately, organise them into **reaction patterns**.\n\n" +
        "For example, study reactions by **functional group** (alkenes, alcohols, carboxylic acids, carbonyl compounds) and learn the common reagents, conditions and reaction types for each.\n\n" +
        "Then practise applying these patterns to unfamiliar questions. Understanding *why* reactions happen will help you remember them much more effectively than rote memorisation.",
      mustInclude: ["functional group", "reaction patterns"],
    },
  },
];
