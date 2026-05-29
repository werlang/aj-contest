# Decisions

- Fetch contest details from `GET /contests/:id` during snapshot loading and refresh so countdown data comes from the real contest contract instead of inferred team-summary fields.
- Public-case export always writes beside the active source file and ignores testcase-path configuration, while custom testcase creation keeps its separate path behavior.
