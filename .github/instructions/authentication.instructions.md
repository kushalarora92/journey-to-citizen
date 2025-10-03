---
applyTo: '**'
---
# Authentication Instructions (Sign Up / Login)
These instructions cover the implementation of user authentication features, including sign-up and login functionalities, for the Journey to Citizen app. The authentication system will ensure secure access to user accounts and protect sensitive information.

## Requirements
- Implement secure user authentication using Firebase Authentication.
- Provide sign-up and login screens in the Expo frontend app.
- Validate user inputs (email format, password strength).
- Handle authentication state (logged in, logged out).
- Display appropriate error messages for failed authentication attempts.
- Ensure the backend (NestJS API) can verify authenticated requests.
- Use TypeScript for type safety and better developer experience.
- Follow best practices for security and data protection.
- Write unit tests for authentication functionalities.
- Document the authentication process and any relevant configurations.
- Ensure the app supports iOS, Android and web platforms.
- Use functional components and React hooks in the frontend.
- Use `use-gluestack-components` for UI components and NativeWind for styling.
- Maintain a consistent design language throughout the app.
- Use a centralized theme file for colors, fonts, and other design tokens.
- Keep it simple and user-friendly.
- Email / Password based authentication only (no social logins for now).
- Neat and clean UI.
- Add empty .env variables when needed (e.g. FIREBASE_API_KEY="") and I will fill them in later.
- Implement complete flow (sign up, email verification, login, logout, password reset).

- The default app is tab based
- Create an unauthenticated auth related pages
- Tabs are only accessible when logged in

- Keep tabs blank and empty for now [ONLY focus on authentication]
- after login redirect to (tabs), which can be blank
