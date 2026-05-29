import { COMMANDS, TREE_CONTEXT } from './constants.js';

/**
 * Provide the dedicated submissions panel below the contest explorer.
 */
export class SubmissionsViewProvider {
    constructor() {
        this.listeners = new Set();
        this.selectedProblemId = null;
        this.snapshot = null;
    }

    /**
     * Subscribe to tree refresh events.
     * @param {(item?: unknown) => void} listener
     * @returns {{ dispose: () => void }}
     */
    onDidChangeTreeData(listener) {
        this.listeners.add(listener);

        return {
            dispose: () => {
                this.listeners.delete(listener);
            },
        };
    }

    /**
     * Refresh the visible submissions tree.
     */
    refresh() {
        for (const listener of this.listeners) {
            listener(undefined);
        }
    }

    /**
     * Replace the shared contest snapshot used to render submission targets.
     * @param {{ problems: object[], submissions: object[] } | null} snapshot
     */
    setSnapshot(snapshot) {
        this.snapshot = snapshot;
        if (!snapshot || !snapshot.problems.some(problem => problem.id === this.selectedProblemId)) {
            this.selectedProblemId = null;
        }

        this.refresh();
    }

    /**
     * Mark one problem as the active submission target.
     * @param {{ id: number | string } | undefined | null} problem
     * @returns {object | null}
     */
    selectProblem(problem) {
        this.selectedProblemId = problem?.id ?? null;
        this.refresh();
        return this.getSelectedProblem();
    }

    /**
     * Return the currently selected submission target, if any.
     * @returns {object | null}
     */
    getSelectedProblem() {
        if (!this.snapshot || this.selectedProblemId == null) {
            return null;
        }

        return this.snapshot.problems.find(problem => problem.id === this.selectedProblemId) ?? null;
    }

    /**
     * Return the visible children for the submissions panel.
     * @param {Record<string, unknown> | undefined} element
     * @returns {Array<Record<string, unknown>>}
     */
    getChildren(element) {
        if (element?.children) {
            return element.children;
        }

        if (!this.snapshot) {
            return [];
        }

        return this.snapshot.problems
            .slice()
            .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER))
            .map(problem => buildSubmissionTargetItem(problem, this.snapshot.submissions, this.selectedProblemId));
    }

    /**
     * Return the TreeItem-compatible shape for a node.
     * @param {Record<string, unknown>} element
     * @returns {Record<string, unknown>}
     */
    getTreeItem(element) {
        return element;
    }
}

/**
 * Build one selectable problem row for the submissions panel.
 * @param {object} problem
 * @param {object[]} submissions
 * @param {number | string | null} selectedProblemId
 * @returns {Record<string, unknown>}
 */
function buildSubmissionTargetItem(problem, submissions, selectedProblemId) {
    const submissionCount = submissions.filter(submission => submission.problem?.id === problem.id).length;
    const isSelected = selectedProblemId === problem.id;

    return {
        label: problem.title.trim(),
        description: isSelected
            ? 'Selected for submission'
            : submissionCount
                ? `${submissionCount} previous submission${submissionCount === 1 ? '' : 's'}`
                : 'No submissions yet',
        collapsibleState: 0,
        contextValue: TREE_CONTEXT.SUBMISSION_PANEL_PROBLEM,
        command: {
            command: COMMANDS.SELECT_SUBMISSION_PROBLEM,
            title: 'Select Problem for Submission',
            arguments: [problem],
        },
        problem,
    };
}