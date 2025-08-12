# Code Agent Prompt: 3D Character Observation Web App

## Objective
Develop a web application that allows users to interact with a 3D character via voice or text, with the character performing animations based on user inputs, featuring a currency system, shop, and user authentication.

## Instructions
1.  **Implement the Minimum Competent Product (MCP) first**:
    -   Implement the following core features as the initial deliverable before adding more complex functionality:
        -   **User Authentication**: Implement a simple login and registration system using email-based two-factor authentication for enhanced security.
        -   **Access Control**: The home screen must be inaccessible without a successful login.
        -   **3D Character Display**: Display a 3D character on the home screen. A T-pose is acceptable; the focus is on correct and stable rendering.
        -   **UI Navigation**:
            -   Include a hamburger icon in the top-right corner of the screen.
            -   Clicking the icon should reveal a sidebar that is normally hidden.
            -   The sidebar must contain a button to navigate to the options screen.
        -   **Options Screen**: The options screen (`option.html`) should only provide a logout function.
        -   **Text-based Conversation**: Allow users to interact with the character using a text input field. Voice-based conversation will be implemented in a later phase.
2.  **Adhere to the Code Charter**:
    -   Follow modular, clean code principles.
    -   Include comprehensive documentation and unit tests.
    -   Use Git for version control and follow the branching model.
3.  **Deliverables**:
    -   Full source code for frontend and backend.
    -   Database schema for user data, currency, and character parameters.
    -   API integration code for **Gemini 2.0 Flash (primary), Gemini 1.5 Flash (fallback)**, ElevenLabs, and AssemblyAI.
    -   Deployment instructions for a local development environment.
4.  **Assumptions**:
    -   Use SQLite for the database unless scalability is required (then PostgreSQL).
    -   Optimize 3D assets for performance (e.g., low-poly models).
    -   Implement a simple sentiment analysis system for input evaluation using **Gemini 2.0 Flash**.
5.  **Constraints**:
    -   Ensure API latency is <500ms for voice responses using **Gemini 2.0 Flash**.
    -   Follow WCAG 2.1 accessibility guidelines.
    -   Handle API failures with retries and user-friendly error messages, prioritizing **Gemini 2.0 Flash** stability.
6.  **References & Learning**:
    -   Study the following official documentation to ensure correct API usage and best practices:
        -   **Three.js**: [https://threejs.org/docs/](https://threejs.org/docs/)
        -   **GLTFLoader (for Three.js)**: [https://threejs.org/docs/#examples/en/loaders/GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
        -   **Three.vrm**: [https://github.com/pixiv/three-vrm](https://github.com/pixiv/three-vrm)
        -   **AssemblyAI API**: [https://www.assemblyai.com/docs/api-reference](https://www.assemblyai.com/docs/api-reference)
        -   **Gemini API**: [https://ai.google.dev/docs/gemini_api_overview](https://ai.google.dev/docs/gemini_api_overview)
        -   **ElevenLabs TTS API**: [https://elevenlabs.io/docs](https://elevenlabs.io/docs)