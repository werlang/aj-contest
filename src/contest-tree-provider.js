import { COMMANDS, TREE_CONTEXT } from './constants.js';

/**
 * Minimal tree provider used to bootstrap the contest sidebar before the auth
 * and API-backed contest state are implemented.
 */
export class ContestTreeProvider {
    constructor() {
        this.listeners = new Set();
        this.snapshot = null;
        this.state = 'loggedOut';
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
     * Refresh the full tree and optionally update the visible state label.
     * @param {'loggedIn' | 'loggedOut'} [state]
     */
    refresh(state) {
        if (state) {
            this.state = state;
        }

        for (const listener of this.listeners) {
            listener(undefined);
        }
    }

    /**
     * Replace the visible contest snapshot and refresh the tree.
     * @param {{ problems: object[], submissions: object[], team: { contest: { id: number, name: string }, name: string }, token: string } | null} snapshot
     */
    setSnapshot(snapshot) {
        this.snapshot = snapshot;
        this.state = snapshot ? 'loggedIn' : 'loggedOut';
        this.refresh();
    }

    /**
     * Return the visible children for a given tree node.
     * @param {Record<string, unknown> | undefined} element
     * @returns {Array<Record<string, unknown>>}
     */
    getChildren(element) {
        if (element?.children) {
            return element.children;
        }

        if (!this.snapshot || this.state === 'loggedOut') {
            return [
                {
                    label: 'Login to AutoJudge',
                    description: 'Team access required',
                    collapsibleState: 0,
                    contextValue: TREE_CONTEXT.LOGIN,
                    command: {
                        command: COMMANDS.LOGIN_TEAM,
                        title: 'Login Team',
                    },
                },
            ];
        }

        const problemItems = this.snapshot.problems
            .slice()
            .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER))
            .map(problem => {
                const submissions = this.snapshot.submissions
                    .filter(submission => submission.problem?.id === problem.id)
                    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
                    .map(submission => ({
                        label: `#${submission.id}`,
                        description: submission.status,
                        collapsibleState: 0,
                        contextValue: TREE_CONTEXT.SUBMISSION,
                        command: {
                            command: COMMANDS.OPEN_SUBMISSION,
                            title: 'Open Submission Result',
                            arguments: [submission],
                        },
                        submission,
                    }));

                return {
                    label: problem.title.trim(),
                    description: `${submissions.length} submission${submissions.length === 1 ? '' : 's'}`,
                    collapsibleState: submissions.length ? 1 : 0,
                    contextValue: TREE_CONTEXT.PROBLEM,
                    command: {
                        command: COMMANDS.OPEN_PROBLEM,
                        title: 'Open Problem',
                        arguments: [problem],
                    },
                    children: submissions,
                    problem,
                };
            });

        return [
            {
                label: this.snapshot.team.contest.name.trim(),
                description: this.snapshot.team.name.trim(),
                collapsibleState: 0,
                contextValue: TREE_CONTEXT.CONTEST,
            },
            ...problemItems,
        ];
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