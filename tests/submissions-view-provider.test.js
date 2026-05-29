import { describe, expect, it } from 'vitest';

import { TREE_CONTEXT } from '../src/constants.js';
import { SubmissionsViewProvider } from '../src/submissions-tree-provider.js';

describe('submissions view provider', () => {
    it('renders sorted problems for the team submissions view and marks the selected problem', () => {
        const provider = new SubmissionsViewProvider();

        provider.setSnapshot({
            problems: [
                { id: 2, hash: 'prob-b', order: 2, title: 'Binary Search' },
                { id: 1, hash: 'prob-a', order: 1, title: 'A + B' },
            ],
            submissions: [
                {
                    id: 11,
                    status: 'ACCEPTED',
                    submittedAt: '2026-05-28T03:10:00.000Z',
                    problem: { id: 1, title: 'A + B' },
                },
            ],
            team: {
                contest: {
                    id: 4,
                    name: 'Regional Final',
                },
                name: 'Bits',
            },
            token: 'jwt-token',
        });

        expect(provider.getChildren()).toEqual([
            expect.objectContaining({
                contextValue: TREE_CONTEXT.SUBMISSION_PANEL_PROBLEM,
                description: '1 previous submission',
                label: 'A + B',
            }),
            expect.objectContaining({
                contextValue: TREE_CONTEXT.SUBMISSION_PANEL_PROBLEM,
                description: 'No submissions yet',
                label: 'Binary Search',
            }),
        ]);

        provider.selectProblem({ id: 1 });

        expect(provider.getSelectedProblem()).toEqual(expect.objectContaining({
            id: 1,
            title: 'A + B',
        }));
        expect(provider.getChildren()[0]).toEqual(expect.objectContaining({
            description: 'Selected for submission',
        }));
    });

    it('clears the selected problem when the snapshot is reset', () => {
        const provider = new SubmissionsViewProvider();

        provider.setSnapshot({
            problems: [
                { id: 1, hash: 'prob-a', order: 1, title: 'A + B' },
            ],
            submissions: [],
            team: {
                contest: {
                    id: 4,
                    name: 'Regional Final',
                },
                name: 'Bits',
            },
            token: 'jwt-token',
        });
        provider.selectProblem({ id: 1 });

        provider.setSnapshot(null);

        expect(provider.getSelectedProblem()).toBeNull();
        expect(provider.getChildren()).toEqual([]);
    });
});