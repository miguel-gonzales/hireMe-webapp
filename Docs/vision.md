## Recruitment Web Application

### v1
The **HireMe** app is a web app for the busy recruiter who needs to read thousands of CV's daily and filter the candidates with accuracy in the least time possible.
Unlike other screening applications, our app is designed to be lightweight and easy to use.

## Geofrey Moore Positioning Statement

For - Who - The - Unlike - Our product

**For** busy recruiters
**who** need to accurately screen thousands of CVs daily under tight deadlines,
**The HireMe app** is a lightweight web application
**that** automates candidate filtering with high precision.
**Unlike** bloated enterprise applicant tracking systems (ATS),
**our product** delivers a distraction-free, lightning-fast interface that cuts screening time in half without sacrificing candidate quality.

---

#  MVP Scope Definition Framework
**Lean MVP Framework** paired with **User Story Mapping** and **MoSCoW Prioritization Strategy**. 

### Core Persona Archetypes
1.  **The Job Candidate:** Seeking a frictionless, single-page application experience to submit their details.
2.  **The Recruiter Admin:** Requiring an unencumbered dashboard to rapidly review data and alter candidate states.

---

## MoSCoW Feature Categorization

### Must Have (Core MVP Engine)
* **Public Candidate Registration Form:** Single-step page capturing:
    * Full Name (Text field)
    * Email Address (Validated email field)
    * Phone Number (International format string)
    * Age (Integer field)
    * Country (Dropdown selection)
    * City (Text field)
    * English Proficiency (Standardized dropdown selection)
    * Mandatory CV Attachment (Hard-restricted to PDF format up to 5MB)
* **Secure Recruiter Admin Panel:** Simple authentication wrapper giving access to the candidate backlog.
* **Candidate Profile Inspection View:** Inline rendering or immediate link access to candidate data alongside their uploaded PDF document.
* **Pipeline State Machine:** Atomic state controls allowing recruiters to mark candidates explicitly as:
    * `In Review` (Default status upon submission)
    * `Accepted`
    * `Rejected`

### Should Have (Next Iteration / Deferred)
* Asynchronous email confirmation triggers to candidates upon application receipt.
* Visual notification alerts (Toasts) confirming successful state transitions in the admin panel.

### Could Have (Nice-to-Have Scale Enhancements)
* Global search functionality across candidate names, locations, or English levels.
* Tabbed view partitioning within the admin panel to isolate applicants by their current pipeline status.

### Won't Have (Explicitly Out of Scope for Release 1.0)
* Automated AI-driven CV parsing, keyword matching, or scoring engines.
* Multi-tenant recruiter permissions or complex workspace access control lists (ACLs).

---

## Technical Constraints & Data Specifications
* **Authentication Architecture:** Candidate flows are stateless (no login/password required). Recruiter interface is password-protected via basic session-based authentication.
* **English Level Enumeration Standard:** The dropdown selection will be locked to the following discrete tiers:
    * `Beginner (A1/A2)`
    * `Intermediate (B1/B2)`
    * `Advanced (C1)`
    * `Native / Fluent (C2)`