import { describe, expect, it, vi } from 'vitest';

vi.mock('vscode', () => ({
    ThemeColor: class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    },
    ThemeIcon: class ThemeIcon {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
    },
}), { virtual: true });

import { ContestTreeProvider } from '../src/providers/contest-tree-provider.js';
import { COMMANDS, TREE_CONTEXT } from '../src/constants.js';

describe('contest tree provider', () => {
    it('returns an empty tree while no contest snapshot is loaded so the welcome action can render', () => {
        const provider = new ContestTreeProvider();

        expect(provider.getChildren()).toEqual([]);
    });

    it('renders the contest header, problems, and per-problem submissions after login', () => {
        const provider = new ContestTreeProvider();

        provider.setSnapshot({
            problems: [
                { id: 1, hash: 'prob-a', order: 1, title: 'A + B' },
                { id: 2, hash: 'prob-b', order: 2, title: 'Binary Search' },
            ],
            submissions: [
                {
                    id: 11,
                    status: 'WRONG_ANSWER',
                    submittedAt: '2026-05-28T03:00:00.000Z',
                    problem: { id: 1, title: 'A + B' },
                },
                {
                    id: 12,
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

        const rootChildren = provider.getChildren();

        expect(rootChildren).toEqual([
            expect.objectContaining({
                description: 'Bits',
                iconPath: expect.objectContaining({
                    id: 'trophy',
                }),
                label: 'Regional Final',
            }),
            expect.objectContaining({
                contextValue: TREE_CONTEXT.PROBLEM,
                description: '2 submissions',
                label: 'A + B',
            }),
            expect.objectContaining({
                contextValue: TREE_CONTEXT.PROBLEM,
                description: '0 submissions',
                label: 'Binary Search',
            }),
        ]);

        expect(rootChildren[1].command).toBeUndefined();

        const problemChildren = provider.getChildren(rootChildren[1]);
        expect(problemChildren).toEqual([
            expect.objectContaining({
                command: expect.objectContaining({
                    command: COMMANDS.OPEN_SUBMISSION,
                }),
                contextValue: TREE_CONTEXT.SUBMISSION,
                description: 'Accepted',
                iconPath: expect.objectContaining({
                    color: expect.objectContaining({
                        id: 'testing.iconPassed',
                    }),
                    id: 'pass-filled',
                }),
                label: '#12',
            }),
            expect.objectContaining({
                description: 'Wrong Answer',
                iconPath: expect.objectContaining({
                    color: expect.objectContaining({
                        id: 'testing.iconFailed',
                    }),
                    id: 'error',
                }),
                label: '#11',
            }),
        ]);
    });

    it('renders and refreshes the offline contest countdown from the normalized snapshot target', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-28T03:58:30.000Z'));

        const provider = new ContestTreeProvider();
        const listener = vi.fn();
        provider.onDidChangeTreeData(listener);

        provider.setSnapshot({
            problems: [],
            submissions: [],
            team: {
                contest: {
                    countdownTargetMs: new Date('2026-05-28T04:00:00.000Z').getTime(),
                    duration: 180,
                    id: 4,
                    name: 'Regional Final',
                    remainingTime: 90_000,
                    startTime: '2026-05-28T01:00:00.000Z',
                },
                name: 'Bits',
            },
            token: 'jwt-token',
        });

        expect(provider.getChildren()[0].description).toBe('Bits | 01:30 left');

        vi.advanceTimersByTime(1000);

        expect(listener).toHaveBeenCalledTimes(2);
        expect(provider.getChildren()[0].description).toBe('Bits | 01:29 left');

        provider.dispose();
        vi.useRealTimers();
    });

    it('does not start an offline contest countdown when the fetched snapshot has no countdown target', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-28T03:58:30.000Z'));

        const provider = new ContestTreeProvider();
        const listener = vi.fn();
        provider.onDidChangeTreeData(listener);

        provider.setSnapshot({
            problems: [],
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

        expect(provider.getChildren()[0].description).toBe('Bits');

        vi.advanceTimersByTime(1000);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(provider.getChildren()[0].description).toBe('Bits');

        provider.dispose();
        vi.useRealTimers();
    });
});