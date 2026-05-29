# Bugs

- Initialize manifest-gated VS Code context keys during activation before creating views that depend on them; otherwise welcome content and title actions can disappear on first load.
- Parse the full numeric suffix for custom testcase filenames such as `-custom-100.in`; fixed-width parsing causes `Create Test Cases` to collide and overwrite existing pairs once numbering exceeds `99`.
