# Code Agent Prompt: 3D Character Observation Web App

## Objective
Develop a web application that allows users to interact with a 3D character via voice or text, with the character performing animations based on user inputs, featuring a currency system, shop, and user authentication. The development must proceed in phases, starting with a Minimum Viable Product (MVP, referred to as MCP in the requirements) to ensure iterative progress and feasibility. Adhere strictly to the provided requirements specification and code charter, including references to official documentation for key technologies.

## Instructions
1. **Phased Development Approach**:
   - **Phase 1: Implement the MCP**:
     - Focus exclusively on the MCP requirements first. Do not implement advanced features (e.g., voice interactions, animations beyond basic display, currency/shop systems) until the MCP is complete and verified.
     - Once the MCP is functional, report completion and await further instructions for subsequent phases (e.g., adding voice, animations, game mechanics).
   - **Subsequent Phases**:
     - Phase 2: Add voice interactions using AssemblyAI and ElevenLabs TTS.
     - Phase 3: Implement character animations and input evaluations.
     - Phase 4: Add game mechanics (currency, shop, parameters, achievements).
     - Phase 5: Enhance UI/UX (dark/light mode, backgrounds, etc.) and full testing.

2. **Follow the Requirements Specification**:
   - Implement all functional and non-functional requirements as outlined, starting with the MCP.
   - Use the specified tech stack: HTML, CSS, JavaScript,(A-Frame for 3D), FastAPI (backend), Gemini 2.5 Flash (primary language model, fallback to Gemini 2.0 Flash), ElevenLabs TTS (text-to-speech), AssemblyAI (speech-to-text).
   - Ensure mobile compatibility and responsive design from the start.
   - For MCP: Prioritize secure authentication, basic 3D display, navigation, and text-based conversation.

3. **Adhere to the Code Charter**:
   - Follow modular, clean code principles.
   - Reference official documentation URLs provided in the charter for implementation guidance. Do not improvise methods without consulting these docs first.
   - Include comprehensive documentation and unit tests.
   - Use Git for version control and follow the branching model (e.g., create a branch for MCP: `feature/mcp`).

4. **Deliverables**:
   - **For MCP Phase**: Full source code for frontend and backend implementing only MCP features.
   - Database schema for user authentication and basic session data.
   - API integration code for Gemini 2.0 Flash (for text conversations in MCP) and placeholders for future APIs.
   - Deployment instructions for a local development environment.
   - Verification report: Confirm that the MCP meets all specified requirements (e.g., screenshots of 3D display, login flow).

5. **Assumptions**:
   - Use SQLite for the database unless scalability is required (then PostgreSQL).
   - Optimize 3D assets for performance (e.g., low-poly models, even T-pose for MCP).
   - Implement simple sentiment analysis for conversations using Gemini 2.0 Flash in later phases.
   - For authentication in MCP: Use email-based 2FA (e.g., via one-time password sent to email) as the simplest secure method.

6. **Constraints**:
   - Ensure API latency is <500ms for responses using Gemini 2.0 Flash.
   - Follow WCAG 2.1 accessibility guidelines.
   - Handle API failures with retries and user-friendly error messages.
   - Strictly use official documentation for implementations (e.g., no custom loaders for 3D models without referencing A-Frame docs).

## References
- Requirements Specification: [Insert reference to requirements artifact]
- Code Charter: [Insert reference to code charter artifact]