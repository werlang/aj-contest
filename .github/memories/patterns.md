# Patterns

- Keep contest-extension skill docs and nested manual-validation references aligned with the current manifest and runtime surface whenever the extension command or view surface changes.
- Use a dedicated view provider for panel-specific state and keep shared contest workflows in the controller plus focused workspace helpers when multiple VS Code views expose the same actions.
- Poll submission verdicts from the controller after submit, use the session layer to read the authenticated submissions feed, and merge final results back into the shared snapshot so explorer rows update in place.
- When multiple views and timed refresh loops depend on the same contest state, keep the shared snapshot in the controller and let providers stay renderers instead of state owners.
- Place shared standings normalization and submission-status logic in neutral utility modules so controllers, providers, services, and presentation layers do not depend sideways on one another.
