---
applyTo: '**'
---
# App Management Instructions
These instructions cover the implementation of app features.

## MVP Requirements Initial Summary

- Profile setup: status (visitor / worker / student / PR), PR landing date / entry date, maybe country, tax info if needed: These are essential to compute eligibility date, and you can expand later.
- Absence / travel log UI: Must allow multiple entries, including same-day day trips, specify departure & return dates.
- Eligibility date estimate: Show “earliest possible date you could apply,” plus “current estimated date based on data entered.”
- Ongoing count / dashboard: Show how many days counted so far (PR days, pre-PR credit, absences), days left, progress bar.
- Reminders & notifications: e.g. “you have upcoming travel; log it”, “eligibility date has moved due to new absence” etc.
- Disclaimers, rule summary: So users understand the rules, especially pre-PR credit, cap, exceptions.
- Export or print summary: So that user can take with them to application, or for their records. User can generate a report suitable for IRCC application (shows trips, PR date, days etc.).
- Privacy / security measures: make sure all sensitive data (dates, travel history) are stored safely; clear privacy policy.

## Detailed Requirements / flow
- Fetch user profile data from Firestore via Firebase Functions
- Profile creation is the first step for users to access the platform's features
- When a user logs in for the first time (and profile is not complete), prompt them to complete their profile
    - display name
    - current status in Canada (e.g., visitor, student, worker, permanent resident). (editable in profiles tab)
    - Ask them if they have PR (yes/no)
        - if yes, ask for PR date (date picker)
        - if no, skip this question
    - Ask them if they were physically present in Canada prior to receiving PR (yes/no)
        - if yes, mention to fill out details in profile tab
    - Ask them if they have any travel absences from Canada in the last 5 years (yes/no)
        - if yes, mention to fill out details in travel absence tab
    - submit button and redirect to:
        - if yes to physically present in Canada prior to receiving PR --> profile tab
        - else if yes to travel absences from Canada --> travel absence tab
        - else --> dashboard

- Profile tab
    - Show user information: email, display name, status, PR date (if any)
    - Allow editing of display name and status
    - Show a section for presence in Canada prior to PR
        - List of single line entries with from/to dates and purpose of visit (visitor, study permit, work permit, protected person, business, no legal status)
        - click to view details in modal, also give an option to edit
        - Button to add new entry (opens modal or new screen)
        - do not allow future dates
        - create this as a reusable component that can be used in travel absence tab as well
    - Show a note in the bottom to fill out travel absences from Canada, if applicable
    - On every save, update the date of earliest apply date for citizenship based on the information provided if there is a change

- Travel Absence tab
    - use the reusable component from profile tab to show existing absences
    - List of single line entries entries with from/to dates
        - List of absences with from/to dates and place (optional)
        - click to view details in modal, also give an option to edit
        - Button to add new absence (opens modal or new screen)
        - Also, allow future dates here for user to plan ahead
    - On every save, update the date of earliest apply date for citizenship based on the information provided if there is a change

- Dashboard tab
    - Show welcome message with display name
    - Show the calculated earliest apply date for citizenship based on profile information
    - Show a counter of days remaining to apply for citizenship
    - Make UI appealing and engaging - maybe use some illustrations / graphs
    - Quick links to Profile and Travel Absence tabs to encourage users to complete their information
    - Also add a disclaimer that this is based on the information provided
    - Also add a small disclaimer towards the end that this is not legal advice and users should consult official resources or legal experts for accurate information
    - Show a small section on how earliest apply date is calculated based on the information provided specific to user

    
How to calculate earliest apply date for citizenship:
    - User must have been physically present in Canada for at least 1095 days (3 years) in the last 5 years before applying.
    - Each day before becoming a permanent resident counts as half a day, up to a maximum of 365 days (1 year).
    - Absences from Canada can affect the count of days
    - List all of your time outside of Canada in the 5 years before the date of your application. You must list all the time spent outside of Canada, regardless of the reason for your absence. You must also list all trips where you left and returned to Canada on the same day or next day, including day trips to the United States. Once you list all of your absences indicating the day you left and the day you returned to Canada, you will calculate the "total # of days outside of Canada". You will only count the full days outside of Canada, because the day you left and day you returned to Canada counts as time physically present in Canada.
    - Count only the full days you were outside Canada. The day you left and the day you returned are treated as days physically present in Canada and therefore are NOT counted as days outside.

- Store profile in Firestore `users/{userId}` collection
- Profile data structure:
  - `displayName`: string (optional)
  - `status`: 'active' | 'inactive'
  - `prDate`: Timestamp (optional)
    - `presenceInCanada`: Array of objects with:
      - `from`: Timestamp
      - `to`: Timestamp
      - `purpose`: string (visitor, study permit, work permit, protected person, business, no legal status)
  - `travelAbsences`: Array of objects with:
      - `from`: Timestamp
      - `to`: Timestamp
      - `place`: string (optional)
  - `createdAt`: Timestamp (auto)
  - `updatedAt`: Timestamp (auto)
  - Add any additional fields as needed per app requirements

## Technical Implementation
- Use Firebase Functions `getUserInfo` to fetch profile
- Use Firebase Functions `updateUserProfile` to manage entire profile and updates
- Profile state should be managed in React Context
- Use TypeScript for type safety
- Follow existing Firebase patterns in the codebase

## UI Guidelines
- Use gluestack-ui components for consistency
- Simple, clean, and user-friendly interface
- Show loading states while fetching/updating
- Display appropriate error messages
- Validate inputs before submitting

## Notes
- This is a generic profile template
- Customize fields based on specific app requirements
- Keep profile management simple and extendable
- Profile data belongs to the user and follows Firestore security rules