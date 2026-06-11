# User Stories & Gherkin Specifications: HireMe App MVP

This document translates the scoped MVP into development-ready functional criteria using **Behavior-Driven Development (BDD)** notation via **Gherkin syntax**.

---

## Epic 1: Candidate Ingestion Flow

### Feature: Candidate Job Application Submission
  As an applicant seeking a job,
  I want to submit my profile details and CV,
  So that recruiters can evaluate my profile.

  ```gherkin
  Scenario: Successful profile submission with valid data
    Given I am on the HireMe registration page
    When I fill in the "Full Name" with "Jane Doe"
    And I fill in the "Email" with "jane.doe@example.com"
    And I fill in the "Phone" with "+123456789"
    And I fill in the "Age" with "28"
    And I select "United States" from the "Country" dropdown
    And I fill in the "City" with "New York"
    And I select "Fluent" from the "English Level" dropdown
    And I attach a valid "resume.pdf" file
    And I click the "Submit Application" button
    Then I should see a success message saying "Application submitted successfully"
    And my data and CV should be stored securely in the database
    And my initial application status should default to "In Review"
  ```

  ```gherkin
  Scenario: Submission fails because CV is missing
    Given I am on the HireMe registration page
    When I fill in all mandatory text fields with valid data
    But I do not attach a PDF CV
    And I click the "Submit Application" button
    Then I should see an error validation message saying "A PDF resume is required"
    And my application data should not be committed to the database
  ```

  ```gherkin
  Scenario: Submission fails due to unsupported file format
    Given I am on the HireMe registration page
    When I fill in all mandatory text fields with valid data
    And I attach a file named "photo.jpg" instead of a PDF
    And I click the "Submit Application" button
    Then I should see an error validation message saying "Invalid file format. Only PDF files are permitted."
    And my application data should not be committed to the database
  ```
---

## Epic 2: Recruiter Administration & Pipeline Controls

### Feature: Candidate Profile Review Dashboard
  As a recruiter admin,
  I want to view a candidate's submitted information and CV,
  So that I can quickly assess their fit for the role.

  Scenario: Admin successfully views an applicant's complete profile
    Given I am logged into the HireMe admin panel
    And I am navigating the candidate dashboard roster
    When I click on the record for candidate "Jane Doe"
    Then I should see her text fields clearly displayed: Name, Email, Phone, Age, Country, City, and English Level
    And I should see a distinct interactive element to open or preview her "resume.pdf"
    And her current application state should be displayed as "In Review"

### Feature: Pipeline Status Lifecycle Management
  As a recruiter admin,
  I want to change the status of an application,
  So that I can transition candidates through the evaluation pipeline cleanly.

  Scenario Outline: Admin changes candidate application state
    Given I am logged into the HireMe admin panel
    And I am inspecting the profile view of an applicant with an initial status of "In Review"
    When I select the "<New Status>" option from the status workflow dropdown
    Then the candidate's status should update to "<New Status>" in the system records
    And the display should update to reflect the state modification instantly

    Examples:
      | New Status |
      | Accepted   |
      | Rejected   |
      | In Review  |
      