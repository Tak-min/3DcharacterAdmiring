# Code Charter: 3D Character Observation Web App

## 1. Purpose
To ensure high-quality, maintainable, and scalable code, aligning with the requirements specification and industry best practices. Emphasize phased development starting with MCP and strict use of official documentation.

## 2. Coding Standards
- **Languages and Frameworks**:
  - Frontend: HTML5, CSS3, JavaScript (ES6+), Three.js (docs: https://threejs.org/docs/).
  - For VRM: @pixiv/three-vrm (docs: https://pixiv.github.io/three-vrm/docs/).
  - Backend: Python 3.9+, FastAPI.
  - Database: SQLite (dev), PostgreSQL (prod).
- **Style Guidelines**:
  - As previously defined.
- **File Structure**:
  - As previously defined; add phase-specific folders (e.g., `/src/mcp` for initial code).
- **Modularity**:
  - Build MCP modularly for easy extension.

## 3. Version Control
- **Git**:
  - Feature branches per phase (e.g., `feature/mcp`, `feature/voice-integration`).
  - Commit messages include phase reference.

## 4. Testing
- **Unit Tests**:
  - Cover MCP fully (e.g., login, 3D render, text chat).
  - Mock APIs (Gemini: https://ai.google.dev/gemini-api/docs; AssemblyAI: https://www.assemblyai.com/docs; ElevenLabs: https://elevenlabs.io/docs/capabilities/text-to-speech).
- **Integration/End-to-End**:
  - Phase-gated: Test MCP before advancing.

## 5. Documentation
- **Code Documentation**:
  - Include comments referencing official docs (e.g., "Implemented per Three.js GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader").
- **Project Documentation**:
  - README with phase progress; API docs.

## 6. Performance and Optimization
- **Targets**:
  - Ensure MCP meets latency/FPS; optimize using docs (e.g., Three.js performance tips).

## 7. Security
- **Authentication (MCP Focus)**:
  - Implement email 2FA securely; reference best practices.
- **API Security**:
  - Keys in env vars; rate limiting.

## 8. Deployment
- **Development**:
  - Docker; test MCP locally first.

## 9. Team Responsibilities
- **All Developers**:
  - Consult official docs before coding (Three.js, Three-VRM, AssemblyAI, Gemini, ElevenLabs).
  - Document any deviations with justification.

## 10. Review and Maintenance
- **Code Reviews**:
  - Verify doc references and phase compliance.
- **Maintenance**:
  - Iterative updates post-MCP.