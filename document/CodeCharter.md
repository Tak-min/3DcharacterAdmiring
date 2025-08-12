# Code Charter: 3D Character Observation Web App

## 4. Testing
-   **Unit Tests**:
    -   Frontend: Jest for React components, Three.js utilities.
    -   Backend: Pytest for Flask routes, services, and **Gemini 2.0 Flash** integration.
    -   Coverage: Minimum 80%.
-   **Integration Tests**:
    -   Test API integrations (**Gemini 2.0 Flash primary, Gemini 1.5 Flash fallback**, **ElevenLabs**, AssemblyAI).
    -   Mock **Gemini 2.0 Flash** API to avoid rate limits during testing.
-   **End-to-End Tests**:
    -   Use Cypress for UI testing (e.g., login, options, character interactions).

## 7. Security
-   **Authentication**:
    -   Use JWT for session management.
    -   Hash passwords with bcrypt.
    -   Implement two-factor authentication (2FA) for login.
-   **API Security**:
    -   Store **Gemini 2.0 Flash** and other API keys in environment variables.
    -   Use rate limiting on backend endpoints.
-   **Data Privacy**:
    -   Comply with GDPR/CCPA for user data.
    -   Encrypt sensitive data (e.g., user emails) in the database.