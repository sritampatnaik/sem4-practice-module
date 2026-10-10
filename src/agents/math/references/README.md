# Mathematics references

The official documents behind the Math agent, collected 12 September 2026. [`manifest.json`](./manifest.json) lists all 33 entries with source links, versions, retrieval status and checksums.

## How the agent uses them

- **Syllabus coverage** comes from the shared corpus (`data/syllabus/math.md`), built from the MOE curriculum documents below.
- **Exam format** (papers, marks, calculator rules, weightings, supplied formulae) comes from [`../exam-facts.ts`](../exam-facts.ts). Each fact there was checked against the SEAB document on 29 September 2026 and carries its source link.
- Nothing in this folder is loaded at runtime. Pedagogy guides and OpenStax books are background reading only; they do not establish Singapore syllabus coverage.

## Official documents

| Level | Curriculum (MOE, local PDF) | Assessment (SEAB) |
| --- | --- | --- |
| Primary | [Primary Mathematics P1 to P6](./official-curriculum/moe-p.pdf) | [PSLE Standard 0008](https://isomer-user-content.by.gov.sg/334/fe51f29b-04ae-4fcb-a907-8db04c028510/0008_y26_sy.pdf), [PSLE Foundation 0038](https://isomer-user-content.by.gov.sg/334/5c51824e-16d2-47cf-bf64-ea5774beca04/0038_y26_sy.pdf) |
| Secondary | [G1](./official-curriculum/moe-g1.pdf), [G2/G3](./official-curriculum/moe-g23.pdf), [Additional Mathematics](./official-curriculum/moe-am.pdf) | [O-Level Mathematics 4052](https://isomer-user-content.by.gov.sg/334/fece62fa-b6d4-4daf-ab47-96c9c168b51b/4052_y26_sy.pdf), [Additional Mathematics 4049](https://isomer-user-content.by.gov.sg/334/f4aaac1d-0d7f-492b-88d9-43e392418490/4049_y26_sy.pdf) |
| JC | [H1](./official-curriculum/moe-h1.pdf), [H2](./official-curriculum/moe-h2.pdf) | [H1 8865](https://isomer-user-content.by.gov.sg/334/ee60af06-7c13-484f-8f0c-1e37f3d2937c/8865_y26_sy.pdf), [H2 9758](https://isomer-user-content.by.gov.sg/334/f27e37f7-f0ec-4a35-b1e8-3a5e88ae2f81/9758_y26_sy.pdf), [MF27 formula list](https://isomer-user-content.by.gov.sg/334/34bda122-a7f7-484f-9b46-9c4ad006fa21/SEAB_Mathematics_MF27__2025__.pdf) |

The SEAB PDFs are linked, not stored: direct download was blocked when the library was collected. Publisher rights apply to all documents, and a local copy does not grant redistribution rights.

## Known gaps

- SEC syllabuses (2027 cohort), N(A)-Level and specimen papers are links only, not reviewed.
- No official question-level marking schemes are held; specimen answer booklets are not marking schemes.
- The PSLE Foundation mark split between papers is unconfirmed (see `exam-facts.ts`).
