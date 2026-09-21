import type { EvalItem } from "../types";
import { jcAlex, primaryAlex, secondaryAlex } from "./profiles";

export const physicsItems: EvalItem[] = [
  {
    id: "physics-kmh",
    suiteId: "physics",
    kind: "teaching",
    title: "72 km/h to m/s",
    prompt: "Convert 72 km/h to m/s and show working.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use unitConverter. Answer 20 m/s with SI units.",
      goldReply: "72 km/h × (1000 m / 1 km) × (1 h / 3600 s) = 20 m/s.",
      mustInclude: ["20", "m/s"],
      requiredTools: ["unitConverter"],
    },
  },
  {
    id: "physics-quantum",
    suiteId: "physics",
    kind: "teaching",
    title: "Quantum is A-Level",
    prompt: "Is quantum physics in O-Level or A-Level?",
    profile: {
      name: "Alex",
      notes: [],
      diagnostic: {},
      gradeLevel: "secondary",
    },
    targetAgent: "physics",
    scaffold: {
      contract: "Search syllabus. A-Level / JC, not O-Level. No university dump.",
      goldReply:
        "Quantum physics sits in A-Level / JC Physics, not O-Level. O-Level stops at waves, electricity, and nuclear physics at intro level.",
      mustInclude: ["A-Level / JC, not O-Level"],
      mustNotInclude: ["dump university quantum content"],
      requiredTools: ["documentSearch"],
      source: "readme-smoke",
    },
  },
  {
    id: "physics-fma",
    suiteId: "physics",
    kind: "teaching",
    title: "F = ma",
    prompt: "A 2 kg mass accelerates at 3 m/s^2. Find the force.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Principle, formula, substitution with units. F = 6 N.",
      goldReply: "Newton's second law: F = ma = 2 kg × 3 m/s^2 = 6 N.",
      mustInclude: ["6", "n"],
      requiredTools: ["formulaLookup"],
    },
  },
  {
    id: "physics-ohm",
    suiteId: "physics",
    kind: "teaching",
    title: "Ohm's law",
    prompt: "A 12 V battery drives 3 A through a resistor. Find the resistance.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "V = IR so R = 4 Ω.",
      goldReply: "Ohm's law: R = V/I = 12 V / 3 A = 4 Ω.",
      mustInclude: ["4"],
      requiredTools: ["formulaLookup"],
    },
  },
  {
    id: "physics-suvat",
    suiteId: "physics",
    kind: "teaching",
    title: "SUVAT from rest",
    prompt: "A car starts from rest and accelerates at 2 m/s^2 for 5 s. Find its final speed.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "v = u + at with u = 0. v = 10 m/s.",
      goldReply: "Use v = u + at. u = 0, a = 2 m/s^2, t = 5 s, so v = 10 m/s.",
      mustInclude: ["10", "m/s"],
      requiredTools: ["formulaLookup"],
    },
  },
  {
    id: "physics-waves",
    suiteId: "physics",
    kind: "teaching",
    title: "v = fλ",
    prompt: "A wave has frequency 50 Hz and wavelength 2 m. Find its speed.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "v = fλ = 100 m/s.",
      goldReply: "Wave speed v = fλ = 50 Hz × 2 m = 100 m/s.",
      mustInclude: ["100", "m/s"],
      requiredTools: ["formulaLookup"],
    },
  },
  {
    id: "physics-primary-forces",
    suiteId: "physics",
    kind: "teaching",
    title: "Primary pushes and pulls",
    prompt: "What is a force, in Primary Science?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Pushes and pulls. No vectors or F=ma.",
      goldReply:
        "A force is a push or a pull. It can change an object's speed, direction, or shape. We do not use F = ma at Primary.",
      mustInclude: ["push"],
      mustNotInclude: ["vector component"],
    },
  },
  {
    id: "physics-units-trap",
    suiteId: "physics",
    kind: "teaching",
    title: "Call out missing units",
    prompt: "A student writes speed = 20. What is wrong?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Singapore exam trap: numeric answers need SI units.",
      goldReply:
        "The number is incomplete. Speed needs a unit, usually m/s. Marks are lost for missing units.",
      mustInclude: ["unit"],
    },
  },
  {
    id: "physics-lens",
    suiteId: "physics",
    kind: "teaching",
    title: "Thin lens O-Level",
    prompt: "State the real-is-positive sign convention for a thin lens at O-Level.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Real-is-positive convention. Stay O-Level.",
      goldReply:
        "At O-Level, real object, real image, and real focal length are taken as positive. Virtual distances are negative.",
      mustInclude: ["real", "positive"],
      requiredTools: ["formulaLookup"],
    },
  },
  {
    id: "physics-energy",
    suiteId: "physics",
    kind: "teaching",
    title: "KE at JC",
    prompt: "A 2 kg mass moves at 3 m/s. Find its kinetic energy.",
    profile: jcAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "KE = 1/2 mv^2 = 9 J.",
      goldReply: "Kinetic energy E_k = 1/2 mv^2 = 0.5 × 2 × 9 = 9 J.",
      mustInclude: ["9", "j"],
      requiredTools: ["formulaLookup"],
    },
  },
  {
    id: "physics-faq-primary-seeing-objects",
    suiteId: "physics",
    kind: "teaching",
    title: "Seeing objects by reflected light",
    prompt: "How can we see an object that does not produce light?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain source → object → eyes through reflection. Correct the misconception that eyes emit light. Keep the explanation at Primary level.",
      goldReply:
        "Light from a source strikes the object and is reflected into our eyes. Eyes do not send out light.",
      mustInclude: ["light", "reflect"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-primary-shadows",
    suiteId: "physics",
    kind: "teaching",
    title: "Shadow formation and size",
    prompt: "How are shadows formed, and why does their size change?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain that an object blocks light travelling in straight lines and that source, object and screen positions affect shadow size. Keep the explanation at Primary level.",
      goldReply:
        "A shadow forms when an object blocks light travelling in straight lines. Its size depends on the positions of the source, object and screen.",
      mustInclude: ["light", "block"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-primary-heat-temperature",
    suiteId: "physics",
    kind: "teaching",
    title: "Heat versus temperature",
    prompt: "What is the difference between heat and temperature?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish energy transferred due to a temperature difference from how hot or cold something is. Keep the explanation at Primary level.",
      goldReply:
        "Heat is energy transferred because of a temperature difference. Temperature measures how hot or cold something is.",
      mustInclude: ["energy", "temperature"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-primary-complete-circuit",
    suiteId: "physics",
    kind: "teaching",
    title: "Why a bulb needs a complete circuit",
    prompt: "Why does a bulb light only in a complete circuit?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain the need for a complete conducting path and that a break stops current throughout a simple series circuit. Keep the explanation at Primary level.",
      goldReply:
        "Charge must have a closed conducting path. A break anywhere in a simple series circuit stops the current throughout it.",
      mustInclude: ["circuit", "current"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-primary-energy-conversion",
    suiteId: "physics",
    kind: "teaching",
    title: "Energy conversion in a device",
    prompt: "Is energy used up when a device operates?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain conservation of energy and a lamp's conversion of electrical energy into light and thermal energy. Keep the explanation at Primary level.",
      goldReply:
        "Energy is converted and transferred—not destroyed. A lamp converts electrical energy mainly into light and thermal energy.",
      mustInclude: ["energy", "light"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-primary-contact-forces",
    suiteId: "physics",
    kind: "teaching",
    title: "Contact, non-contact and balanced forces",
    prompt: "What forces can act on an object, and must objects touch?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Give contact and non-contact examples and explain that a stationary object may have balanced forces. Avoid advanced vector treatment at Primary level.",
      goldReply:
        "Contact forces include friction and spring force; non-contact forces include gravity and magnetism. A stationary object can still have balanced forces acting on it.",
      mustInclude: ["friction", "gravity", "balanced"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-motion-quantities",
    suiteId: "physics",
    kind: "teaching",
    title: "Distance, displacement, speed, velocity and acceleration",
    prompt:
      "What is the difference between distance, displacement, speed, velocity and acceleration?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Define and distinguish the five quantities and their scalar/vector nature. For graphs, identify quantities explicitly: displacement–time gradient gives velocity, velocity–time gradient gives acceleration, velocity–time signed area gives displacement, and speed–time area gives distance. Stay at O-Level depth.",
      goldReply:
        "Distance and speed are scalars; displacement, velocity and acceleration include direction. Graph gradients and areas represent different quantities.",
      mustInclude: ["scalar", "direction"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-force-motion",
    suiteId: "physics",
    kind: "teaching",
    title: "Force and constant velocity",
    prompt: "Does an object need a force to keep moving?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain Newton's first law: zero resultant force permits constant velocity; a non-zero resultant force changes velocity. Stay at O-Level depth.",
      goldReply:
        "No. A resultant force is required to change velocity, not to maintain constant velocity.",
      mustInclude: ["force", "velocity"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-third-law-pair",
    suiteId: "physics",
    kind: "teaching",
    title: "Weight and normal force are not a third-law pair",
    prompt: "Are weight and normal contact force a Newton’s third-law pair?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain that weight and normal contact force act on the same object, whereas a Newton's third-law pair acts on two different interacting objects. Stay at O-Level depth.",
      goldReply:
        "No; both act on the same object. Third-law forces act on two different interacting objects.",
      mustInclude: ["same object", "different"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-falling-objects",
    suiteId: "physics",
    kind: "teaching",
    title: "Falling objects in vacuum and air",
    prompt: "Do heavier objects fall faster?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain equal gravitational acceleration in a vacuum at the same location and the effect of air resistance relative to weight. Stay at O-Level depth.",
      goldReply:
        "In a vacuum, all objects have the same gravitational acceleration. Differences in air arise from drag relative to weight.",
      mustInclude: ["vacuum", "acceleration"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-work-energy-power",
    suiteId: "physics",
    kind: "teaching",
    title: "Work, energy and power",
    prompt: "What is the difference between work, energy and power?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish work as energy transferred by a force, energy as capacity to cause change, and power as the rate of energy transfer. Stay at O-Level depth.",
      goldReply:
        "Work is energy transferred by a force; energy is the capacity of a system to cause change; power is the rate of energy transfer.",
      mustInclude: ["energy", "rate"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-thermal-transfer",
    suiteId: "physics",
    kind: "teaching",
    title: "Conduction, convection and radiation",
    prompt: "How do conduction, convection and radiation differ?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish particle interactions, bulk fluid motion and electromagnetic transfer. Explain that radiation can travel through a vacuum. Stay at O-Level depth.",
      goldReply:
        "Conduction occurs through particle interactions, convection through bulk fluid motion, and radiation through electromagnetic waves.",
      mustInclude: ["conduction", "convection", "radiation"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-wave-transfer",
    suiteId: "physics",
    kind: "teaching",
    title: "Wave energy transfer and wave equation",
    prompt: "Do waves carry matter, and how are speed, frequency and wavelength related?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain energy transfer with particles generally oscillating about equilibrium, state v = fλ, and distinguish sound's need for a medium from electromagnetic waves. Call formulaLookup for the wave relationship. Stay at O-Level depth.",
      goldReply:
        "Waves transfer energy; particles of the medium usually oscillate about equilibrium. The relationship is \\(v=f\\lambda\\). Sound requires a medium; electromagnetic waves do not.",
      mustInclude: ["energy", "medium"],
      requiredTools: ["formulaLookup"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-series-parallel",
    suiteId: "physics",
    kind: "teaching",
    title: "Current, voltage and resistance in circuits",
    prompt: "How do current, voltage and resistance behave in series and parallel circuits?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Define current and voltage; explain the same current and divided voltage in series, shared voltage and divided current in parallel. Include that series resistances add and parallel equivalent resistance is less than the smallest positive branch resistance. Stay at O-Level depth.",
      goldReply:
        "Current is charge flow rate; voltage is energy transferred per charge. Series components share current, while parallel branches share voltage.",
      mustInclude: ["current", "voltage"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-secondary-half-life",
    suiteId: "physics",
    kind: "teaching",
    title: "Radioactive half-life and zero activity",
    prompt: "What does radioactive half-life mean, and does the activity ever become exactly zero?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Define half-life for undecayed nuclei or activity. Qualify the never-exactly-zero statement as a property of the continuous exponential model; a finite sample can eventually have no undecayed radioactive nuclei. Stay at O-Level depth.",
      goldReply:
        "Half-life is the time for the number of undecayed nuclei—or activity—to halve. The mathematical model approaches zero but never reaches it exactly.",
      mustInclude: ["half", "activity"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-jc-uncertainties",
    suiteId: "physics",
    kind: "teaching",
    title: "Combining uncertainties and interpreting error bars",
    prompt: "How should uncertainties be combined, and what do error bars mean?",
    profile: jcAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "At JC level, explain adding absolute uncertainties for sums/differences, adding fractional or percentage uncertainties for products/quotients, and multiplying fractional uncertainty by the absolute exponent for a power. Interpret error bars according to the stated uncertainty convention.",
      goldReply:
        "Absolute uncertainties are typically combined for sums; fractional or percentage uncertainties for products and powers. Error bars show the plausible range of measured values.",
      mustInclude: ["uncertaint", "error bar"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-jc-centripetal-force",
    suiteId: "physics",
    kind: "teaching",
    title: "Centripetal force as an inward resultant",
    prompt: "What provides the centripetal force in circular motion?",
    profile: jcAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain that centripetal force describes the inward resultant of existing forces rather than a separate additional force. Give examples such as gravity, tension or friction. Stay at JC depth.",
      goldReply:
        "“Centripetal force” is not an additional force—it is the inward resultant of real forces such as gravity, tension or friction.",
      mustInclude: ["inward", "resultant"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-jc-conservation-laws",
    suiteId: "physics",
    kind: "teaching",
    title: "When momentum and energy are conserved",
    prompt: "When should momentum or energy conservation be used?",
    profile: jcAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "State the negligible-external-impulse condition for momentum conservation. Distinguish conserved mechanical energy when there is no net non-conservative work from an energy balance that explicitly accounts for non-conservative work or transfers. Stay at JC depth.",
      goldReply:
        "Momentum is conserved when external impulse is negligible. Mechanical energy is conserved only when energy transfer by non-conservative forces is absent or properly included.",
      mustInclude: ["momentum", "energy"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-jc-fields-potential",
    suiteId: "physics",
    kind: "teaching",
    title: "Field strength, potential and potential energy",
    prompt: "What is the difference between field strength, potential and potential energy?",
    profile: jcAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish gravitational/electric field strength as force per unit mass/charge, potential as potential energy per unit mass/charge, and potential energy as a property of the interacting system. Stay at JC depth.",
      goldReply:
        "Field strength is force per unit mass or charge; potential is potential energy per unit mass or charge; potential energy belongs to the interacting system.",
      mustInclude: ["force", "potential"],
      source: "user-provided",
    },
  },
  {
    id: "physics-faq-jc-wave-particle-duality",
    suiteId: "physics",
    kind: "teaching",
    title: "Wave-particle duality of light",
    prompt: "How can light behave as both a wave and a particle?",
    profile: jcAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain wave evidence from interference/diffraction and quantised photon evidence from the photoelectric effect. Compare intensity at fixed frequency and photon energy as frequency changes. Stay at JC depth without a university-level derivation.",
      goldReply:
        "Interference and diffraction reveal wave behaviour; the photoelectric effect shows quantised photon interactions. Greater intensity supplies more photons, while greater frequency raises each photon’s energy.",
      mustInclude: ["photon", "frequency"],
      source: "user-provided",
    },
  },
  {
    id: "physics-031-transparent-and-opaque-materials",
    suiteId: "physics",
    kind: "teaching",
    title: "Transparent and opaque materials",
    prompt: "Why can I see through clear glass but not cardboard?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish transmission from opacity at Primary level; do not say transparent objects produce light.",
      goldReply:
        "Clear glass transmits most visible light, so light from objects behind it can reach your eyes. Opaque cardboard blocks that light.",
      mustInclude: ["light", "transmit"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-032-mirror-in-a-dark-room",
    suiteId: "physics",
    kind: "teaching",
    title: "Mirror in a dark room",
    prompt: "Will a mirror let me see my face in a completely dark room?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Reject the misconception that mirrors emit light. Explain source, reflection and eyes without advanced optics.",
      goldReply:
        "No. A mirror reflects light; it does not produce light. Without a light source, there is no light from your face for the mirror to reflect into your eyes.",
      mustInclude: ["reflect", "light"],
      source: "original:misconception; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-033-magnetic-poles",
    suiteId: "physics",
    kind: "teaching",
    title: "Magnetic poles",
    prompt: "What happens when two north poles of magnets are brought together?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "State repulsion for like poles and distinguish it from attraction of unlike poles.",
      goldReply:
        "The two north poles repel. Like magnetic poles repel, whereas unlike poles attract.",
      mustInclude: ["repel"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-034-not-all-metals-are-magnetic",
    suiteId: "physics",
    kind: "teaching",
    title: "Not all metals are magnetic",
    prompt: "A pupil says every metal is attracted to a magnet. Is that correct?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Correct the all-metals misconception using familiar materials and a classroom-scale qualification.",
      goldReply:
        "No. Not all metals are strongly attracted to a magnet. Iron is attracted, but aluminium and copper are not in an ordinary classroom magnet test.",
      mustInclude: ["iron", "aluminium"],
      source: "original:misconception; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-035-friction-helps-walking",
    suiteId: "physics",
    kind: "teaching",
    title: "Friction helps walking",
    prompt: "Why are rough shoe soles useful when we walk?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain useful friction and grip; avoid claiming that friction is always harmful or that roughness guarantees grip on every surface.",
      goldReply:
        "Rough soles can provide grip through friction with the ground. This helps prevent slipping as the foot pushes against the ground.",
      mustInclude: ["friction"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-036-melting-and-mass",
    suiteId: "physics",
    kind: "teaching",
    title: "Melting and mass",
    prompt:
      "Ice melts inside a closed container without anything entering or leaving. Does its mass decrease?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Distinguish state change from loss of matter; do not confuse mass with volume.",
      goldReply:
        "No. Its mass stays the same because the same matter remains in the closed container; only its state changes from solid to liquid.",
      mustInclude: ["mass", "same"],
      source: "original:misconception; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-037-metal-and-wooden-spoons",
    suiteId: "physics",
    kind: "teaching",
    title: "Metal and wooden spoons",
    prompt:
      "A metal spoon and a wooden spoon have been in the same room for hours. Why may the metal feel colder?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish temperature from rate of heat transfer; do not infer a lower temperature solely from touch.",
      goldReply:
        "They can be at the same temperature. Metal transfers heat away from your warmer hand faster than wood, so it feels colder.",
      mustInclude: ["heat", "temperature"],
      source: "original:misconception; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-038-coat-as-an-insulator",
    suiteId: "physics",
    kind: "teaching",
    title: "Coat as an insulator",
    prompt: "Does a coat make heat to keep a person warm?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Explain insulation and reduced heat loss in Primary language.",
      goldReply:
        "An ordinary coat does not make heat. It traps air and reduces heat loss from the body to the cooler surroundings.",
      mustInclude: ["heat", "air"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-039-wire-core-and-covering",
    suiteId: "physics",
    kind: "teaching",
    title: "Wire core and covering",
    prompt: "Why does a classroom circuit wire have a metal core and plastic covering?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish conductor from insulator. Use a low-voltage classroom context without unsafe mains instructions.",
      goldReply:
        "The metal core conducts electricity to complete the circuit. The plastic covering is an electrical insulator that helps prevent unintended contact with the conducting core.",
      mustInclude: ["conduct", "insulat"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-040-independent-branches",
    suiteId: "physics",
    kind: "teaching",
    title: "Independent branches",
    prompt:
      "Two bulbs are on separate parallel branches of a simple battery circuit. One bulb is removed. Can the other stay lit?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain separate complete paths with simple language; no resistor algebra is needed.",
      goldReply:
        "Yes, if the other branch still provides a complete path through the battery and its bulb. Removing one branch need not break the other branch.",
      mustInclude: ["branch", "complete"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-041-fair-electromagnet-test",
    suiteId: "physics",
    kind: "teaching",
    title: "Fair electromagnet test",
    prompt:
      "How can I fairly investigate whether more wire turns make a classroom electromagnet stronger?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Identify changed, measured and controlled variables and repeat trials. Use a teacher-supervised low-voltage setup.",
      goldReply:
        "Change only the number of turns. Keep the core, battery arrangement, wire type and test objects the same. Compare how many identical paper clips it can lift and repeat the trials.",
      mustInclude: ["turns", "same", "repeat"],
      source: "original:concept; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-042-centimetres-to-metres",
    suiteId: "physics",
    kind: "teaching",
    title: "Centimetres to metres",
    prompt: "A toy ramp is 150 cm long. Convert its length to metres.",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use unitConverter with cm to m. Answer 1.5 m and show the scale factor.",
      goldReply: "There are 100 cm in 1 m. Therefore 150 cm ÷ 100 = 1.5 m.",
      mustInclude: ["1.5", "m"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-043-grams-to-kilograms",
    suiteId: "physics",
    kind: "teaching",
    title: "Grams to kilograms",
    prompt: "A classroom model has a mass of 750 g. Convert this to kilograms.",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use unitConverter with g to kg. Answer 0.75 kg.",
      goldReply: "There are 1000 g in 1 kg. Therefore 750 g ÷ 1000 = 0.75 kg.",
      mustInclude: ["0.75", "kg"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-044-minutes-to-seconds",
    suiteId: "physics",
    kind: "teaching",
    title: "Minutes to seconds",
    prompt: "A fair-test observation lasts 2.5 minutes. How many seconds is that?",
    profile: primaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use unitConverter with min to s. Answer 150 s.",
      goldReply: "One minute is 60 s, so 2.5 × 60 = 150 s.",
      mustInclude: ["150", "s"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; MOE Primary Science 2023",
    },
  },
  {
    id: "physics-045-metres-per-second-to-kilometres-per-hour",
    suiteId: "physics",
    kind: "teaching",
    title: "Metres per second to kilometres per hour",
    prompt: "Convert 18 m/s to km/h and show the conversion factor.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use unitConverter from m/s to km/h. Accept equivalent factor working; answer 64.8 km/h.",
      goldReply: "Multiply by 3.6: 18 m/s × 3.6 = 64.8 km/h.",
      mustInclude: ["64.8", "km/h"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-046-centimetres-to-millimetres",
    suiteId: "physics",
    kind: "teaching",
    title: "Centimetres to millimetres",
    prompt: "Convert a wire diameter of 0.75 cm to millimetres.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use unitConverter from cm to mm. Answer 7.5 mm.",
      goldReply: "Since 1 cm = 10 mm, 0.75 cm × 10 = 7.5 mm.",
      mustInclude: ["7.5", "mm"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-047-kilonewtons-to-newtons",
    suiteId: "physics",
    kind: "teaching",
    title: "Kilonewtons to newtons",
    prompt: "Convert 1.25 kN into newtons.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use unitConverter from kN to N. Accept 1250 N or equivalent scientific notation.",
      goldReply: "The prefix kilo means 1000. Thus 1.25 kN = 1250 N.",
      mustInclude: ["N"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-048-kilojoules-to-joules",
    suiteId: "physics",
    kind: "teaching",
    title: "Kilojoules to joules",
    prompt: "Convert 2.4 kJ into joules.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use unitConverter from kJ to J. Accept 2400 J or equivalent scientific notation.",
      goldReply: "Since 1 kJ = 1000 J, 2.4 kJ = 2400 J.",
      mustInclude: ["J"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-049-kilowatts-to-watts",
    suiteId: "physics",
    kind: "teaching",
    title: "Kilowatts to watts",
    prompt: "Convert an appliance power of 0.85 kW to watts.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use unitConverter from kW to W. Answer 850 W or equivalent scientific notation.",
      goldReply: "Since 1 kW = 1000 W, 0.85 kW = 850 W.",
      mustInclude: ["W"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-050-celsius-to-kelvin",
    suiteId: "physics",
    kind: "teaching",
    title: "Celsius to kelvin",
    prompt: "Convert 25 degrees Celsius to kelvin using the 273.15 offset.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use unitConverter with from C and to K; answer 298.15 K. A multiplicative conversion alone is incorrect.",
      goldReply: "T = 25 + 273.15 = 298.15 K.",
      mustInclude: ["298.15", "K"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-051-kelvin-to-celsius",
    suiteId: "physics",
    kind: "teaching",
    title: "Kelvin to Celsius",
    prompt: "Convert 310.15 K to degrees Celsius using the 273.15 offset.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use unitConverter with from K and to C. Answer 37 degrees Celsius; accept °C or written Celsius.",
      goldReply: "Temperature in degrees Celsius = 310.15 − 273.15 = 37 °C.",
      mustInclude: ["37"],
      requiredTools: ["unitConverter"],
      source: "original:conversion; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-052-resultant-force-with-si-data",
    suiteId: "physics",
    kind: "teaching",
    title: "Resultant force with SI data",
    prompt: "A trolley of mass 4.0 kg accelerates at 2.5 m/s². Find the resultant force.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use formulaLookup. Show F = ma and answer 10 N with the acceleration direction.",
      goldReply:
        "Principle: Newton's second law. Formula: F = ma. Substitution: F = 4.0 kg × 2.5 m/s². Answer: 10 N, in the direction of acceleration.",
      mustInclude: ["10", "N"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-053-mass-from-force-and-acceleration",
    suiteId: "physics",
    kind: "teaching",
    title: "Mass from force and acceleration",
    prompt: "A resultant force of 12 N produces an acceleration of 3.0 m/s². Find the mass.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup and rearrange F = ma correctly. Answer 4 kg; do not invert F/a.",
      goldReply:
        "Principle: Newton's second law. Formula: m = F/a. Substitution: m = 12 N ÷ 3.0 m/s². Answer: 4.0 kg.",
      mustInclude: ["4", "kg"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-054-deceleration-and-final-velocity",
    suiteId: "physics",
    kind: "teaching",
    title: "Deceleration and final velocity",
    prompt:
      "A car moves at 20 m/s and has constant acceleration −4.0 m/s² for 3.0 s. Find its final velocity.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use formulaLookup. Retain the negative acceleration and answer positive 8 m/s.",
      goldReply:
        "Principle: constant-acceleration motion. Formula: v = u + at. Substitution: v = 20 + (−4.0)(3.0). Answer: 8.0 m/s in the original direction.",
      mustInclude: ["8", "m/s"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-055-displacement-from-rest",
    suiteId: "physics",
    kind: "teaching",
    title: "Displacement from rest",
    prompt:
      "A cart starts from rest with constant acceleration 2.4 m/s² for 5.0 s. Using s = ut + ½at², find its displacement.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup for the supplied SUVAT relation. Include the half and square the time; answer 30 m.",
      goldReply:
        "Principle: constant-acceleration motion. Formula: s = ut + ½at². Substitution: s = 0 + 0.5 × 2.4 × 5.0². Answer: 30 m in the acceleration direction.",
      mustInclude: ["30", "m"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-056-kinetic-energy-with-fractional-mass",
    suiteId: "physics",
    kind: "teaching",
    title: "Kinetic energy with fractional mass",
    prompt: "A 0.40 kg ball moves at 5.0 m/s. Find its kinetic energy.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use formulaLookup. Square speed and retain the one-half factor; answer 5 J.",
      goldReply:
        "Principle: energy associated with motion. Formula: E_k = ½mv². Substitution: E_k = 0.5 × 0.40 × 5.0². Answer: 5.0 J.",
      mustInclude: ["5", "J"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-057-potential-energy-with-specified-g",
    suiteId: "physics",
    kind: "teaching",
    title: "Potential energy with specified g",
    prompt:
      "A 2.0 kg object is lifted vertically by 3.0 m. Take g = 10 m/s². Find its gain in gravitational potential energy.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup. Use the explicitly supplied g = 10 rather than 9.81; answer 60 J.",
      goldReply:
        "Principle: energy increases on lifting in a uniform gravitational field. Formula: ΔE_p = mgΔh. Substitution: ΔE_p = 2.0 × 10 × 3.0. Answer: 60 J.",
      mustInclude: ["60", "J"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-058-density-from-si-mass-and-volume",
    suiteId: "physics",
    kind: "teaching",
    title: "Density from SI mass and volume",
    prompt: "A solid has mass 0.54 kg and volume 0.00020 m³. Calculate its density.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup. Accept 2700 kg/m³ or 2.7 × 10³ kg m⁻³; do not confuse volume with area.",
      goldReply:
        "Principle: density is mass per volume. Formula: ρ = m/V. Substitution: ρ = 0.54/0.00020. Answer: 2700 kg/m³.",
      mustInclude: ["kg"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-059-pressure-on-an-area",
    suiteId: "physics",
    kind: "teaching",
    title: "Pressure on an area",
    prompt: "A perpendicular force of 150 N acts uniformly over 0.030 m². Find the pressure.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup. Answer 5000 Pa or 5.0 × 10³ Pa, with normal force divided by area.",
      goldReply:
        "Principle: pressure is normal force per area. Formula: p = F/A. Substitution: p = 150/0.030. Answer: 5000 Pa.",
      mustInclude: ["Pa"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-060-current-through-a-resistor",
    suiteId: "physics",
    kind: "teaching",
    title: "Current through a resistor",
    prompt: "A 3.0 Ω resistor has 9.0 V across it. Find the current.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use formulaLookup; answer 3 A with correct rearrangement and units.",
      goldReply:
        "Principle: the resistor follows Ohm's law. Formula: I = V/R. Substitution: I = 9.0/3.0. Answer: 3.0 A.",
      mustInclude: ["3", "A"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-061-electrical-power-from-current-and-voltage",
    suiteId: "physics",
    kind: "teaching",
    title: "Electrical power from current and voltage",
    prompt: "A lamp takes 0.50 A at 12 V. Find its electrical power input.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup. Answer 6 W and distinguish electrical input from useful light output.",
      goldReply:
        "Principle: electrical energy transfer per second. Formula: P = VI. Substitution: P = 12 × 0.50. Answer: 6.0 W.",
      mustInclude: ["6", "W"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-062-sound-wavelength",
    suiteId: "physics",
    kind: "teaching",
    title: "Sound wavelength",
    prompt: "Sound travels at 340 m/s with frequency 170 Hz. Calculate the wavelength.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Use formulaLookup. Answer 2 m and distinguish wavelength from frequency.",
      goldReply:
        "Principle: wave speed relates frequency and wavelength. Formula: λ = v/f. Substitution: λ = 340/170. Answer: 2.0 m.",
      mustInclude: ["2", "m"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-063-refraction-and-unchanged-frequency",
    suiteId: "physics",
    kind: "teaching",
    title: "Refraction and unchanged frequency",
    prompt:
      "Light passes from air into glass. Which of its frequency, speed and wavelength changes?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain continuity of frequency and linked changes of speed and wavelength. Do not say frequency falls on entering glass.",
      goldReply:
        "Its frequency stays the same across the boundary. Its speed decreases in glass, so its wavelength also decreases.",
      mustInclude: ["frequency", "wavelength"],
      source: "original:concept; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-064-sound-through-a-vacuum",
    suiteId: "physics",
    kind: "teaching",
    title: "Sound through a vacuum",
    prompt: "Can a ringing bell be heard through a perfect vacuum between it and the listener?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish mechanical sound from electromagnetic light; do not imply all waves need matter.",
      goldReply:
        "No. Sound needs a material medium to transfer its vibrations. A vacuum has no medium to carry sound, although light can cross it.",
      mustInclude: ["sound", "medium"],
      source: "original:misconception; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-065-current-is-not-consumed",
    suiteId: "physics",
    kind: "teaching",
    title: "Current is not consumed",
    prompt:
      "Is there less current just after a lamp than just before it in a steady simple series circuit?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Distinguish energy transfer from charge consumption in steady series current.",
      goldReply:
        "No. The steady current is the same on both sides because charge is conserved. The lamp transfers electrical energy; it does not use up charge.",
      mustInclude: ["current", "charge"],
      source: "original:misconception; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-066-terminal-velocity-and-balanced-forces",
    suiteId: "physics",
    kind: "teaching",
    title: "Terminal velocity and balanced forces",
    prompt: "A falling object has reached terminal velocity. Are there no forces acting on it?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain balanced non-zero forces, zero resultant and zero acceleration; do not equate zero resultant with rest.",
      goldReply:
        "Forces still act: weight downward and air resistance upward. They balance, so the resultant force and acceleration are zero while the object keeps falling at constant velocity.",
      mustInclude: ["weight", "zero"],
      source: "original:concept; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-067-series-resistance",
    suiteId: "physics",
    kind: "teaching",
    title: "Series resistance",
    prompt:
      "Two resistors of 4.0 Ω and 6.0 Ω are connected in series. Use R_total = R1 + R2 to find their total resistance.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup; if the catalogue has no series-resistance entry, acknowledge that and use the relation supplied in the question. Answer 10 Ω; do not invent a successful lookup.",
      goldReply:
        "Principle: series resistances add. Formula: R_total = R1 + R2. Substitution: R_total = 4.0 + 6.0. Answer: 10 Ω.",
      mustInclude: ["10"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-068-random-radioactive-decay",
    suiteId: "physics",
    kind: "teaching",
    title: "Random radioactive decay",
    prompt:
      "Can knowing a half-life tell us the exact moment when one particular nucleus will decay?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract: "Distinguish random individual decay from predictable population trends.",
      goldReply:
        "No. Decay of an individual nucleus is random. Half-life describes the statistical behaviour of a large population, not an appointment for each nucleus.",
      mustInclude: ["random", "nucleus"],
      source: "original:misconception; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-069-o-level-photoelectric-boundary",
    suiteId: "physics",
    kind: "teaching",
    title: "O-Level photoelectric boundary",
    prompt: "For the 2026 O-Level Physics 6091 syllabus, must I study the photoelectric effect?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Identify 6091 and distinguish its listed content from H2 quantum; unfamiliar contexts with supplied information are still possible.",
      goldReply:
        "The photoelectric effect is not a listed requirement of 6091. O-Level includes light, electromagnetic waves and radioactivity; the detailed photoelectric topic belongs to H2 Physics 9478 in this map.",
      mustInclude: ["6091", "photoelectric"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-070-pure-versus-combined-science",
    suiteId: "physics",
    kind: "teaching",
    title: "Pure versus combined Science",
    prompt:
      "Can I use the 2026 Physics 6091 syllabus as the complete syllabus for Science (Physics, Chemistry) 5086?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Do not claim the local pure-Physics map fully covers combined Science or invent 5086 exclusions.",
      goldReply:
        "No. 6091 is the pure Physics syllabus; 5086 is a separate combined Science syllabus. There is overlap, but check the official 5086 document for its actual outcomes and exclusions.",
      mustInclude: ["6091", "5086"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-071-o-level-lens-scope",
    suiteId: "physics",
    kind: "teaching",
    title: "O-Level lens scope",
    prompt:
      "Does 2026 O-Level Physics 6091 explicitly require the thin-lens equation and its real-is-positive sign convention?",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Distinguish the official topic-12 outcomes from the existing tool's school lens formula; do not treat the tool catalogue as syllabus evidence.",
      goldReply:
        "In 6091, topic 12 lists converging-lens ray diagrams, focal length and image characteristics. It does not list the thin-lens equation or that sign convention as a required learning outcome; that algebra should be labelled extension.",
      mustInclude: ["ray diagram", "6091"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-072-missing-value-for-force",
    suiteId: "physics",
    kind: "teaching",
    title: "Missing value for force",
    prompt: "A trolley has mass 2.0 kg. Find its resultant force.",
    profile: secondaryAlex,
    targetAgent: "physics",
    scaffold: {
      contract:
        "Ask one concise clarification for acceleration. Do not assume rest, a = g or zero resultant force. A formula lookup is acceptable but cannot supply the missing physical value.",
      goldReply:
        "What is the trolley's acceleration? Mass alone does not determine the resultant force.",
      mustInclude: ["acceleration"],
      source: "original:clarification; SEAB Physics 6091 (2026)",
    },
  },
  {
    id: "physics-073-absolute-uncertainty-in-a-sum",
    suiteId: "physics",
    kind: "teaching",
    title: "Absolute uncertainty in a sum",
    prompt:
      "H1 8867: Two lengths are (2.00 ± 0.02) m and (3.00 ± 0.03) m. Add them, adding their absolute uncertainties.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup. If no uncertainty rule is found, acknowledge the limitation and use the rule supplied in the question. Preserve decimal-place consistency; do not combine in quadrature.",
      goldReply:
        "Principle: absolute uncertainties add for a sum using the stated convention. Formula: L = L1 + L2 and ΔL = ΔL1 + ΔL2. Substitution: L = 2.00 + 3.00; ΔL = 0.02 + 0.03. Answer: (5.00 ± 0.05) m.",
      mustInclude: ["5.00", "0.05", "m"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-074-one-dimensional-sticking-collision",
    suiteId: "physics",
    kind: "teaching",
    title: "One-dimensional sticking collision",
    prompt:
      "H1 8867: A 2.0 kg trolley at 3.0 m/s hits a stationary 1.0 kg trolley and they stick together. External impulse is negligible. Use m1u1 + m2u2 = (m1 + m2)v to find their common velocity.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup; use the supplied relation if absent and acknowledge that limitation. Answer 2 m/s; do not conserve kinetic energy for a sticking collision.",
      goldReply:
        "Principle: conserve total momentum. Formula: v = (m1u1 + m2u2)/(m1 + m2). Substitution: v = (2.0 × 3.0 + 1.0 × 0)/(2.0 + 1.0). Answer: 2.0 m/s in the original moving trolley's direction.",
      mustInclude: ["2", "m/s"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-075-impulse-from-a-triangular-graph",
    suiteId: "physics",
    kind: "teaching",
    title: "Impulse from a triangular graph",
    prompt:
      "H1 8867: A force–time graph is triangular, with base 0.20 s and height 40 N. Find the impulse using impulse = area under the graph.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any no-match before using the supplied area rule. Use the triangle factor; answer 4 N s or 4 kg m/s.",
      goldReply:
        "Principle: impulse equals the force–time area. Formula: impulse = ½ × base × height. Substitution: impulse = 0.5 × 0.20 × 40. Answer: 4.0 N s.",
      mustInclude: ["4"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-076-centripetal-acceleration",
    suiteId: "physics",
    kind: "teaching",
    title: "Centripetal acceleration",
    prompt:
      "H1 8867: An object travels uniformly at 6.0 m/s around a circle of radius 3.0 m. Use a = v²/r to find its acceleration.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any no-match before applying the supplied equation. Answer 12 m/s² inward; constant speed does not mean zero acceleration.",
      goldReply:
        "Principle: changing velocity direction requires centripetal acceleration. Formula: a = v²/r. Substitution: a = 6.0²/3.0. Answer: 12 m/s² towards the centre.",
      mustInclude: ["12", "centre"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-077-hooke-s-law-with-si-extension",
    suiteId: "physics",
    kind: "teaching",
    title: "Hooke's law with SI extension",
    prompt:
      "H1 8867: A spring obeys F = kx with k = 200 N/m and extension x = 0.015 m. Find the force magnitude.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup; if no entry is found, acknowledge the limit and use the supplied equation. Answer 3 N, using extension rather than total spring length.",
      goldReply:
        "Principle: linear elastic behaviour within the stated Hooke's-law regime. Formula: F = kx. Substitution: F = 200 × 0.015. Answer: 3.0 N.",
      mustInclude: ["3", "N"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-078-potential-energy-using-9-81",
    suiteId: "physics",
    kind: "teaching",
    title: "Potential energy using 9.81",
    prompt:
      "H1 8867: A 0.50 kg object rises by 2.0 m in a uniform field with g = 9.81 m/s². Find the potential-energy increase to two significant figures.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use formulaLookup. Respect the specified g and requested precision; distinguish working value 9.81 J from final 9.8 J.",
      goldReply:
        "Principle: energy change on lifting in a uniform field. Formula: ΔE_p = mgΔh. Substitution: ΔE_p = 0.50 × 9.81 × 2.0 = 9.81 J. Answer: 9.8 J to two significant figures.",
      mustInclude: ["9.8", "J"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-079-parallel-resistance",
    suiteId: "physics",
    kind: "teaching",
    title: "Parallel resistance",
    prompt:
      "H1 8867: Resistors of 6.0 Ω and 3.0 Ω are in parallel. Use 1/R = 1/R1 + 1/R2 to find the equivalent resistance.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup; if absent, acknowledge the limitation and use the supplied relation. Answer 2 Ω; do not add the resistances as for series.",
      goldReply:
        "Principle: parallel conductances add. Formula: 1/R = 1/R1 + 1/R2. Substitution: 1/R = 1/6.0 + 1/3.0 = 1/2.0. Answer: 2.0 Ω, less than either branch resistance.",
      mustInclude: ["2"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-080-activity-after-two-half-lives",
    suiteId: "physics",
    kind: "teaching",
    title: "Activity after two half-lives",
    prompt:
      "H1 8867: A source has initial activity 800 Bq and half-life 3.0 h. Using A = A0(1/2)^n, find its expected activity after 6.0 h, ignoring background.",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any absent entry before using the supplied decay rule. Answer 200 Bq; distinguish activity from half-life.",
      goldReply:
        "Principle: activity halves each half-life. Formula: A = A0(1/2)^n. Substitution: n = 6.0/3.0 = 2 and A = 800 × (1/2)². Answer: 200 Bq.",
      mustInclude: ["200", "Bq"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-081-photon-energy",
    suiteId: "physics",
    kind: "teaching",
    title: "Photon energy",
    prompt:
      "H2 9478: Use E = hf with h = 6.63 × 10⁻³⁴ J s to find the energy of a photon of frequency 5.00 × 10¹⁴ Hz. Give three significant figures.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup; acknowledge a missing photon entry and apply the supplied formula. Accept equivalent scientific notation with three significant figures.",
      goldReply:
        "Principle: a photon's energy depends on frequency. Formula: E = hf. Substitution: E = (6.63 × 10⁻³⁴)(5.00 × 10¹⁴) = 3.315 × 10⁻¹⁹ J. Answer: 3.32 × 10⁻¹⁹ J.",
      mustInclude: ["J"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-082-capacitance-from-charge-and-voltage",
    suiteId: "physics",
    kind: "teaching",
    title: "Capacitance from charge and voltage",
    prompt:
      "H2 9478: A capacitor stores 6.0 × 10⁻⁶ C at 3.0 V. Use capacitance = Q/V to find its capacitance in farads.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup; acknowledge any no-match before using the supplied equation. Use F for capacitance, not C for charge; accept equivalent scientific notation.",
      goldReply:
        "Principle: capacitance measures stored charge per potential difference. Formula: C = Q/V. Substitution: C = (6.0 × 10⁻⁶)/3.0. Answer: 2.0 × 10⁻⁶ F.",
      mustInclude: ["F"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-083-rc-time-constant",
    suiteId: "physics",
    kind: "teaching",
    title: "RC time constant",
    prompt:
      "H2 9478: A resistor is 2000 Ω and a capacitor is 5.0 × 10⁻⁶ F. Calculate the time constant using τ = RC.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge a missing RC entry before using the supplied relation. Answer 0.010 s or equivalent notation; the time constant is not the time of complete discharge.",
      goldReply:
        "Principle: the RC product sets the exponential time scale. Formula: τ = RC. Substitution: τ = 2000 × 5.0 × 10⁻⁶. Answer: 0.010 s.",
      mustInclude: ["s"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-084-signed-shm-acceleration",
    suiteId: "physics",
    kind: "teaching",
    title: "Signed SHM acceleration",
    prompt:
      "H2 9478: An oscillator obeys a = −ω²x. With ω = 4.0 rad/s and displacement x = +0.050 m, find its acceleration.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any no-match before using the supplied relation. Preserve the negative sign and restoring direction.",
      goldReply:
        "Principle: SHM acceleration points towards equilibrium. Formula: a = −ω²x. Substitution: a = −4.0² × 0.050. Answer: −0.80 m/s², opposite to the positive displacement.",
      mustInclude: ["0.8"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-085-heating-without-phase-change",
    suiteId: "physics",
    kind: "teaching",
    title: "Heating without phase change",
    prompt:
      "H2 9478: Heat 0.20 kg of water through 5.0 K, with specific heat capacity 4200 J/(kg K) and no losses or phase change. Use Q = mcΔT.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any missing thermal entry before using the supplied equation. Answer 4200 J or equivalent notation. Treat 5.0 K as a temperature interval, with no 273.15 offset.",
      goldReply:
        "Principle: heating changes internal energy. Formula: Q = mcΔT. Substitution: Q = 0.20 × 4200 × 5.0. Answer: 4200 J.",
      mustInclude: ["J"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-086-ideal-gas-pressure",
    suiteId: "physics",
    kind: "teaching",
    title: "Ideal-gas pressure",
    prompt:
      "H2 9478: An ideal gas has n = 1.00 mol, T = 300 K and V = 0.0250 m³. Use pV = nRT and R = 8.31 J/(mol K) to calculate pressure to three significant figures.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any missing ideal-gas entry before using the supplied relation. Keep absolute temperature and SI volume; accept equivalent three-significant-figure notation.",
      goldReply:
        "Principle: ideal-gas equation of state. Formula: p = nRT/V. Substitution: p = 1.00 × 8.31 × 300/0.0250 = 99720 Pa. Answer: 9.97 × 10⁴ Pa.",
      mustInclude: ["Pa"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-087-sinusoidal-r-m-s-current",
    suiteId: "physics",
    kind: "teaching",
    title: "Sinusoidal r.m.s. current",
    prompt:
      "H2 9478: A sinusoidal current has peak value 10√2 A. Use I_rms = I_peak/√2 to find its r.m.s. value.",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Call formulaLookup and acknowledge any missing AC entry before using the supplied relation. Answer 10 A; do not confuse r.m.s. with zero cycle-average current.",
      goldReply:
        "Principle: r.m.s. current gives the same mean resistive heating as an equivalent direct current. Formula: I_rms = I_peak/√2. Substitution: I_rms = 10√2/√2. Answer: 10 A.",
      mustInclude: ["10", "A"],
      requiredTools: ["formulaLookup"],
      source: "original:calculation; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-088-repeats-and-systematic-error",
    suiteId: "physics",
    kind: "teaching",
    title: "Repeats and systematic error",
    prompt: "H2 9478: Will taking more readings remove a balance's fixed zero error?",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Distinguish random uncertainty from systematic bias. Do not claim repetition removes all error.",
      goldReply:
        "No. Repeating and averaging can reduce random scatter, but a fixed zero error is systematic and remains. Check the zero, recalibrate or apply an appropriate correction.",
      mustInclude: ["random", "systematic"],
      source: "original:misconception; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-089-coherence-and-stable-interference",
    suiteId: "physics",
    kind: "teaching",
    title: "Coherence and stable interference",
    prompt:
      "H2 9478: Why do two sources need a stable phase relationship to produce a stable interference pattern?",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain the role of a stable phase difference in interference; do not require the sources to be in phase rather than merely phase-locked.",
      goldReply:
        "A constant phase difference keeps constructive and destructive interference at fixed locations. If the relative phase varies randomly, the fringes shift and average out over time.",
      mustInclude: ["phase", "interference"],
      source: "original:concept; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-090-photoelectric-threshold-versus-intensity",
    suiteId: "physics",
    kind: "teaching",
    title: "Photoelectric threshold versus intensity",
    prompt:
      "H2 9478: Light is below a metal's threshold frequency. In the ordinary single-photon photoelectric model, will increasing intensity make electrons emerge?",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Explain the single-photon threshold model; do not invoke multiphoton exceptions or say intensity increases each photon's energy.",
      goldReply:
        "No. Each photon still has insufficient energy to release an electron. More intensity at the same frequency means more photons, not more energy per photon. The frequency must reach the threshold.",
      mustInclude: ["photon", "frequency"],
      source: "original:misconception; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-091-h1-quantum-exclusion",
    suiteId: "physics",
    kind: "teaching",
    title: "H1 quantum exclusion",
    prompt: "For the 2026 H1 Physics 8867 syllabus, is the photoelectric effect a listed topic?",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch and distinguish nuclear from quantum coverage. Do not treat every JC topic as H1 content.",
      goldReply:
        "No. H1 8867 includes nuclear physics but does not list a quantum/photoelectric topic. Photoelectric emission is in the H2 9478 quantum section.",
      mustInclude: ["8867", "9478"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-092-h1-circular-motion-inclusion",
    suiteId: "physics",
    kind: "teaching",
    title: "H1 circular motion inclusion",
    prompt: "Is circular motion included in the 2026 H1 Physics 8867 syllabus?",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Explicitly confirm inclusion; do not apply an outdated or generic assumption that circular motion is H2-only.",
      goldReply:
        "Yes. H1 8867 topic 7 includes circular motion, centripetal acceleration and gravitational circular orbits.",
      mustInclude: ["8867", "circular"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-093-h1-thermal-and-wave-exclusions",
    suiteId: "physics",
    kind: "teaching",
    title: "H1 thermal and wave exclusions",
    prompt:
      "Do the 2026 H1 Physics 8867 topics include SHM, superposition and ideal-gas thermal physics?",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Distinguish listed H1 outcomes from prerequisite knowledge and unfamiliar contexts with supplied information.",
      goldReply:
        "These are not listed H1 8867 topics. Oscillations, waves/superposition and thermal physics are in H2 9478. O-Level prerequisite ideas can still be used in H1.",
      mustInclude: ["8867", "9478"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-094-h1-practical-assessment",
    suiteId: "physics",
    kind: "teaching",
    title: "H1 practical assessment",
    prompt: "Does 2026 H1 Physics 8867 have a separate practical examination paper?",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Say there is no separate practical paper without claiming that H1 excludes all experimental skills.",
      goldReply:
        "No. H1 8867 has Papers 1 and 2 only. Practical learning and interpreting experimental information can still be part of the course.",
      mustInclude: ["8867", "practical"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 8867 (2026)",
    },
  },
  {
    id: "physics-095-revised-h2-capacitors-and-rc",
    suiteId: "physics",
    kind: "teaching",
    title: "Revised H2 capacitors and RC",
    prompt: "Are capacitance and RC charging and discharging included in 2026 H2 Physics 9478?",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Confirm inclusion under revised 9478; do not infer that the legacy syllabus has the same requirements.",
      goldReply:
        "Yes. H2 9478 topic 14 includes capacitance and stored energy; topic 16 includes capacitor combinations and exponential RC charging and discharging.",
      mustInclude: ["9478", "RC"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-096-legacy-h2-rc-distinction",
    suiteId: "physics",
    kind: "teaching",
    title: "Legacy H2 RC distinction",
    prompt:
      "I am taking the legacy 2026 H2 Physics 9749 syllabus. Are the revised 9478 capacitor and RC requirements automatically part of my course?",
    profile: { ...jcAlex, notes: ["Takes legacy H2 Physics 9749; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Keep the two 2026 H2 codes separate and avoid claiming an unfamiliar capacitor context can never appear.",
      goldReply:
        "No. Follow 9749 for your registered course. Capacitance and RC charging/discharging are not listed 9749 topics; they are explicit in revised 9478. Supplied unfamiliar contexts can still test known principles.",
      mustInclude: ["9749", "9478"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 9749 (2026)",
    },
  },
  {
    id: "physics-097-h2-spreadsheet-practical-requirement",
    suiteId: "physics",
    kind: "teaching",
    title: "H2 spreadsheet practical requirement",
    prompt:
      "For 2026 H2 Physics 9478, must I be able to process practical data in a spreadsheet?",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch and confirm the 9478 spreadsheet requirement; do not automatically transfer it to 9749.",
      goldReply:
        "Yes. The 9478 practical requirements include spreadsheet data processing and analysis, including graphs and trendlines. This supports the practical assessment; it does not replace understanding measurement and uncertainty.",
      mustInclude: ["9478", "spreadsheet"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-098-jc-does-not-identify-course",
    suiteId: "physics",
    kind: "teaching",
    title: "JC does not identify course",
    prompt: "I am in JC. Is quantum physics in my syllabus?",
    profile: { ...jcAlex, notes: [] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch and ask a concise course/code clarification. Do not infer H2 merely from gradeLevel jc or invent a syllabus code from the student's year.",
      goldReply:
        "Which Physics course and syllabus code are you taking: H1 8867, H2 9478 or legacy H2 9749? The quantum coverage depends on the course.",
      mustInclude: ["H1", "H2"],
      requiredTools: ["documentSearch"],
      source: "original:clarification; SEAB A-Level listing (2026)",
    },
  },
  {
    id: "physics-099-h2-versus-university-quantum",
    suiteId: "physics",
    kind: "teaching",
    title: "H2 versus university quantum",
    prompt: "Does 2026 H2 Physics 9478 require solving the full Schrödinger equation?",
    profile: { ...jcAlex, notes: ["Takes H2 Physics 9478; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch. Distinguish H2 quantum outcomes from university mathematics without denying that quantum physics itself is in H2.",
      goldReply:
        "No full Schrödinger-equation solution is listed in the 9478 outcomes. H2 quantum physics focuses on specified photon/photoelectric, matter-wave and energy-level ideas; a university derivation would be extension.",
      mustInclude: ["9478", "quantum"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 9478 (2026)",
    },
  },
  {
    id: "physics-100-h1-nuclear-inclusion",
    suiteId: "physics",
    kind: "teaching",
    title: "H1 nuclear inclusion",
    prompt:
      "Does the 2026 H1 Physics 8867 syllabus include nuclear binding energy and radioactive half-life?",
    profile: { ...jcAlex, notes: ["Takes H1 Physics 8867; examination year 2026."] },
    targetAgent: "physics",
    scaffold: {
      contract:
        "Use documentSearch and confirm both nuclear topics while distinguishing quantum coverage.",
      goldReply:
        "Yes. H1 8867 topic 11 includes nuclear physics, including binding energy and radioactive half-life. This does not make the separate H2 quantum/photoelectric topic part of H1.",
      mustInclude: ["8867", "binding", "half"],
      requiredTools: ["documentSearch"],
      source: "original:boundary; SEAB Physics 8867 (2026)",
    },
  },
];
