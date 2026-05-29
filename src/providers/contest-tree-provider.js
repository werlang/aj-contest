import * as vscode from 'vscode';
import {
    buildContestHeaderDescription,
    formatSubmissionStatus,
    resolveContestCountdownTarget,
} from '../presentation/contest-presentation.js';
import { COMMANDS, TREE_CONTEXT } from '../constants.js';
import { isPassedSubmission, isPendingSubmission } from '../utils/submission-status.js';

const COUNTDOWN_REFRESH_INTERVAL_MS = 1000;

/**
 * Provide the contest explorer tree for logged-in contest snapshots.
 */
export class ContestTreeProvider {
    constructor() {
        this.countdownTargetMs = null;
        this.countdownTimer = null;
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
        this.countdownTargetMs = resolveContestCountdownTarget(snapshot?.team?.contest ?? null);
        this.state = snapshot ? 'loggedIn' : 'loggedOut';
        this.syncCountdownTimer();
        this.refresh();
    }

    /**
     * Dispose the tree provider and stop any local countdown refresh interval.
     */
    dispose() {
        this.clearCountdownTimer();
    }

    /**
     * Return the currently rendered contest snapshot.
     * @returns {{ problems: object[], submissions: object[], team: object, token: string } | null}
     */
    getSnapshot() {
        return this.snapshot;
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
            return [];
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
                        description: formatSubmissionStatus(submission.status),
                        collapsibleState: 0,
                        contextValue: TREE_CONTEXT.SUBMISSION,
                        iconPath: getSubmissionIcon(submission.status),
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
                    children: submissions,
                    problem,
                };
            });

        return [
            {
                label: this.snapshot.team.contest.name.trim(),
                description: buildContestHeaderDescription(this.snapshot.team, this.countdownTargetMs),
                collapsibleState: 0,
                contextValue: TREE_CONTEXT.CONTEST,
                iconPath: new vscode.ThemeIcon('trophy', new vscode.ThemeColor('charts.blue')),
                tooltip: buildContestHeaderTooltip(this.snapshot.team, this.countdownTargetMs),
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

    /**
     * Start or stop the local countdown refresh based on the current snapshot.
     */
    syncCountdownTimer() {
        this.clearCountdownTimer();

        if (this.countdownTargetMs == null || this.countdownTargetMs <= Date.now()) {
            return;
        }

        // Keep the countdown current without re-fetching contest data each second.
        this.countdownTimer = setInterval(() => {
            this.refresh();

            if (this.countdownTargetMs != null && this.countdownTargetMs <= Date.now()) {
                this.clearCountdownTimer();
            }
        }, COUNTDOWN_REFRESH_INTERVAL_MS);
    }

    /**
     * Clear the local countdown refresh interval when it is no longer needed.
     */
    clearCountdownTimer() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }
}

/**
 * Map an AutoJudge submission status to a deterministic tree icon at the VS Code boundary.
 * @param {string | undefined | null} status
 * @returns {import('vscode').ThemeIcon}
 */
function getSubmissionIcon(status) {
    if (isPassedSubmission(status)) {
        return new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('testing.iconPassed'));
    }

    if (isPendingSubmission(status)) {
        return new vscode.ThemeIcon('history', new vscode.ThemeColor('charts.yellow'));
    }

    return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
}

/**
 * Build the richer contest-header tooltip shown in the explorer.
 * @param {{ contest?: { name?: string }, name?: string }} team
 * @param {number | null} countdownTargetMs
 * @returns {string}
 */
function buildContestHeaderTooltip(team, countdownTargetMs) {
    const tooltipLines = [team?.contest?.name?.toString().trim() || 'Contest'];
    const description = buildContestHeaderDescription(team, countdownTargetMs);

    if (description) {
        tooltipLines.push(description);
    }

    return tooltipLines.join('\n');
}