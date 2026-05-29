# Architecture

- Keep `src/extension.js` as the stable VS Code entrypoint while organizing implementation behind ownership-based folders: `commands/`, `controllers/`, `providers/`, `services/`, `workspace/`, `presentation/`, and `utils/`.
