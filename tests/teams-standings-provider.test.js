import { describe, expect, it } from 'vitest';

import { COMMANDS, TREE_CONTEXT } from '../src/constants.js';
import { TeamsStandingsProvider } from '../src/providers/teams-tree-provider.js';

describe('teams standings provider', () => {
    it('renders teams sorted by descending score and wires the open-team command', () => {
        const provider = new TeamsStandingsProvider();

        provider.setSnapshot({
            problems: [],
            submissions: [],
            team: {
                contest: {
                    id: 4,
                    name: 'Regional Final',
                    teams: [
                        {
                            id: 9,
                            name: 'Bits',
                            score: 200,
                            problems: [
                                { id: 1, order: 1, solved: true, title: 'A + B' },
                            ],
                        },
                        {
                            id: 12,
                            name: 'Array Ninjas',
                            score: 350,
                            problems: [
                                { id: 1, order: 1, solved: true, title: 'A + B' },
                                { id: 2, order: 2, solved: true, title: 'Binary Search' },
                            ],
                        },
                    ],
                },
                name: 'Bits',
            },
            token: 'jwt-token',
        });

        expect(provider.getChildren()).toEqual([
            expect.objectContaining({
                command: expect.objectContaining({
                    command: COMMANDS.OPEN_TEAM_STANDING,
                }),
                contextValue: TREE_CONTEXT.STANDING_TEAM,
                description: '350 points | 2 solved',
                label: 'Array Ninjas',
            }),
            expect.objectContaining({
                contextValue: TREE_CONTEXT.STANDING_TEAM,
                description: '200 points | 1 solved',
                label: 'Bits',
            }),
        ]);
    });

    it('returns a placeholder row when the contest snapshot has no standings data', () => {
        const provider = new TeamsStandingsProvider();

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

        expect(provider.getChildren()).toEqual([
            expect.objectContaining({
                description: 'Refresh the contest to load the latest standings.',
                label: 'No team standings available',
            }),
        ]);
    });
});