# GitHub Metadata, Pinned Repositories & Settings Guide

This document outlines the exact metadata, bio strings, topic tags, and pinned repositories for **Point Reyes Sound, Inc.** and **Dr. Romit Chakraborty**.

> **Note on Publication**: Per instructions, **none of these changes have been applied to remote GitHub settings or live profiles**. Everything is staged locally for your review and approval.

---

## 1. Point Reyes Sound Organization Profile (`@point-reyes-sound`)

### Profile Fields (Settings → Organization profile)
* **Organization Name**: `Point Reyes Sound, Inc.`
* **Description / Tagline**:  
  `Continuous phase-space kinetics for strongly correlated electrons. Resolving mean-field bottlenecks in catalysis, battery interfaces, and quantum materials.`  
  *(Replaces the opaque 3-word placeholder `"Long Electrons "`)*
* **URL**: `https://pointreyessound.com`
* **Public Email**: `directors@pointreyessound.com`
* **Location**: `Point Reyes Station, CA & Berkeley, CA`
* **Twitter username**: *(Leave empty unless official company handle exists)*

### Recommended Pinned Repositories (Limit to Flagships)
1. **`point-reyes-sound/point-reyes-sound`**  
   *Description*: `Continuous phase-space kinetics for strongly correlated electrons. Web app, 3D interactive reaction chamber, and research portal.`  
   *Topics*: `quantum-chemistry`, `quantum-kinetics`, `boltzmann-equation`, `electronic-structure`, `threejs`, `webgl`, `phase-space`, `materials-science`
2. **`point-reyes-sound/p1_qbescf`**  
   *Description*: `Open numerical datasets, potential energy curves, and validation suites for QBE-SCF (arXiv:2608.14979).`  
   *Topics*: `open-data`, `computational-chemistry`, `benchmarks`, `singlet-fission`, `conical-intersections`, `potential-energy-surfaces`

> **Note on `papermache`**: Do NOT pin `papermache` on the PRS organization profile, as Paper Mâché has its own standalone repository and is decoupled from the core electronic structure offering.

---

## 2. Founder Personal Profile (`@RomitChakraborty`)

### Profile Fields (Settings → Public profile)
* **Name**: `Romit Chakraborty, Ph.D.`
* **Bio**:  
  `Founder & CEO @point-reyes-sound. Theoretical quantum chemist & physicist. Ph.D. UChicago, UC Berkeley / LBNL, PsiQuantum.`  
  *(Currently empty / null)*
* **Company**: `@point-reyes-sound`
* **Location**: `Point Reyes Station & Berkeley, CA`
* **Website / Blog**: `https://pointreyessound.com` (or `https://www.rchakraborty.dev`)
* **Social Accounts**:  
  * LinkedIn: `https://www.linkedin.com/in/chakrabortyromit/`
  * ORCID: `https://orcid.org/0000-0002-4638-6346`

### Recommended Pinned Repositories
1. **`point-reyes-sound/point-reyes-sound`** *(Pin from organization)*  
   *Why*: Demonstrates active leadership of the core company codebase and 3D simulation engine.
2. **`point-reyes-sound/p1_qbescf`** *(Pin from organization)*  
   *Why*: Directly showcases peer-reviewed reproduction datasets for the flagship QBE-SCF preprint.
3. **`RomitChakraborty/cas-orbital-opt-gd`**  
   *Description*: `Active-space orbital optimization via gradient descent on the matrix of sines of the principal angles.`  
   *Why*: Proves deep mathematical domain expertise in electronic structure and Riemannian geometry.
4. **`RomitChakraborty/phase-space-quantum-chemistry`**  
   *Description*: `Phase-space parameter extraction and Wigner distribution tools from ab initio calculations.`  
   *Why*: Reinforces long-term academic continuity leading up to Point Reyes Sound.

> **Repositories to Unpin on Personal Profile**:
> * `restoration`: Unrelated video/image upscaling script from 2025.
> * `cp_kinetics_monocular_video`: Empty repository description and unrelated to core quantum physics thesis.

---

## 3. Deployment Steps (Once Approved)

### Step A: Point Reyes Sound Organization Profile
1. Copy content of [`docs/github-presentation/ORGANIZATION_PROFILE_README.md`](file:///Users/romitchakraborty/QAI/point-reyes-sound/docs/github-presentation/ORGANIZATION_PROFILE_README.md) to `profile/README.md` in repository `point-reyes-sound/.github`.
2. Update Organization Description under `https://github.com/organizations/point-reyes-sound/settings/profile`.
3. Pin `point-reyes-sound` and `p1_qbescf` on `https://github.com/point-reyes-sound`.

### Step B: Founder Personal Profile
1. Copy content of [`docs/github-presentation/FOUNDER_PROFILE_README.md`](file:///Users/romitchakraborty/QAI/point-reyes-sound/docs/github-presentation/FOUNDER_PROFILE_README.md) to `/Users/romitchakraborty/QAI/RomitChakraborty/README.md`.
2. Update Bio under `https://github.com/settings/profile`.
3. Customize pins on `https://github.com/RomitChakraborty` to feature the 4 recommended repos above.
