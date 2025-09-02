# Requirements Specification: 3D Character Observation Web App

## 1. Project Overview
A web application that enables users to interact with a 3D character via voice or text, with the character responding through speech and animations. Features include a currency system, shop, user authentication, and dynamic character parameters. Development will proceed in phases, starting with a Minimum Viable Product (MVP, referred to as MCP) to validate core functionality iteratively.

## 2. Phased Development
- **Phase 1: MCP (Minimum Viable Product)**:
  - Focus on core authentication, basic UI navigation, 3D display, and text-based conversation.
  - Specific MCP Requirements:
    - Login and new user registration functionality.
    - Use email-based 2FA (e.g., OTP sent via email) for secure authentication.
    - Home screen accessible only after login.
    - Display a 3D character on the home screen (T-pose acceptable; ensure correct rendering).
    - Hamburger icon in the top-right corner; clicking it reveals a sidebar (hidden by default) with a button to navigate to the options screen.
    - Options screen (option.html) provides only logout functionality.
    - Text-based conversation with the character (using Gemini 2.0 Flash for responses).
- **Subsequent Phases**:
  - Phase 2: Add voice input/output (AssemblyAI, ElevenLabs TTS) and basic animations.
  - Phase 3: Implement input evaluation, currency, and shop.
  - Phase 4: Add character parameters, profiles, achievements.
  - Phase 5: Full UI enhancements (modes, selections) and optimizations.

## 3. Functional Requirements

### 3.1 User Interaction (Starting in MCP)
- **Text Input (MCP)**:
  - Users interact via text input in MCP; generate responses using Gemini 2.0 Flash.
- **Voice and Advanced Interactions (Post-MCP)**:
  - Add voice input (AssemblyAI Speech-to-Text) and output (ElevenLabs TTS).
  - Character animations based on inputs (e.g., blushing, laughing).
  - Click/tap detection on 3D model for reactions.

### 3.2 Game Mechanics (Post-MCP)
- **Currency System**:
  - Earn currency through interactions evaluated by Gemini 2.0 Flash.
- **Shop and Items**:
  - Purchase items affecting affinity.
- **Character Parameters and Profiles**:
  - Track and display affinity, hunger, emotions, backgrounds.
- **Achievements**:
  - Track and display metrics.

### 3.3 User Interface (Starting in MCP)
- **Sidebar Navigation (MCP)**:
  - Hamburger icon reveals sidebar with options button.
- **Settings/Options (MCP)**:
  - Logout only in MCP; expand later to include modes, selections.
- **3D Model Selection (Post-MCP)**:
  - Choose from predefined models.

### 3.4 Authentication (MCP)
- **Login/Registration**:
  - Email-based with 2FA (OTP via email for simplicity and security).
  - Google OAuth optional in later phases.
- **Data Privacy**:
  - Comply with GDPR/CCPA.

### 3.5 Technical Requirements
- **Frontend**:
  - HTML, CSS, JavaScript; Three.js for 3D (reference official docs: https://threejs.org/docs/).
  - For VRM models: Use @pixiv/three-vrm (reference: https://pixiv.github.io/three-vrm/docs/).
- **Backend**:
  - Flask (Python); SQLite/PostgreSQL.
  - WebSocket for real-time (post-MCP).
- **APIs**:
  - **Language Model**: Gemini 2.0 Flash (primary), Gemini 1.5 Flash (fallback); reference: https://ai.google.dev/gemini-api/docs.
  - **Text-to-Speech**: ElevenLabs TTS; reference: https://elevenlabs.io/docs/capabilities/text-to-speech.
  - **Speech-to-Text**: AssemblyAI; reference: https://www.assemblyai.com/docs.
- **Deployment**:
  - Local/cloud; Docker.

## 4. Non-Functional Requirements
- **Performance**:
  - <500ms latency for responses (Gemini, ElevenLabs).
  - 60 FPS for 3D in MCP and beyond.
- **Scalability/Security/Accessibility**:
  - As previously defined; emphasize in MCP for authentication security.

## 5. Assumptions and Constraints
- Start with MCP; iterate based on verification.
- Use official docs for all implementations to ensure correctness.

## 6. Risks and Mitigations
- **Risk**: Overly complex initial implementation.
  - **Mitigation**: Strict adherence to phased approach.
- **Risk**: API integration issues.
  - **Mitigation**: Reference official docs; implement fallbacks.