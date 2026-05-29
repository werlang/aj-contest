import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

function createContext() {
    const secrets = new Map();
    const state = new Map();

    return {
        secrets: {
            async get(key) {
                return secrets.get(key);
            },
            async store(key, value) {
                secrets.set(key, value);
            },
            async delete(key) {
                secrets.delete(key);
            },
        },
        globalState: {
            get(key, fallbackValue = undefined) {
                return state.has(key) ? state.get(key) : fallbackValue;
            },
            async update(key, value) {
                if (value === undefined) {
                    state.delete(key);
                    return;
                }

                state.set(key, value);
            },
        },
    };
}

function jsonResponse(payload, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        async json() {
            return payload;
        },
    };
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

describe('contest session flow', () => {
    it('logs a team in, persists the session token, and loads the contest snapshot', async () => {
        const context = createContext();
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ token: 'team-jwt-token' }))
            .mockResolvedValueOnce(jsonResponse({
                team: {
                    id: 9,
                    hash: 'teamhash9',
                    name: 'Bits',
                    contest: {
                        id: 4,
                        name: 'Regional Final',
                    },
                },
            }))
            .mockResolvedValueOnce(jsonResponse({
                problems: [
                    { id: 1, hash: 'prob-a', title: 'A + B', order: 1 },
                ],
            }))
            .mockResolvedValueOnce(jsonResponse({
                submissions: [
                    { id: 22, status: 'PENDING', problem: { id: 1, title: 'A + B' } },
                ],
            }));

        const session = await import('../src/contest-session.js');
        const result = await session.loginAndLoadContest({
            baseUrl: 'https://api.autojudge.test/base',
            context,
            password: '123456',
            teamId: 'teamhash9',
        });

        expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://api.autojudge.test/base/teams/teamhash9/login', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer 123456',
            }),
        }));
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.autojudge.test/base/teams', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer team-jwt-token',
            }),
        }));
        expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://api.autojudge.test/base/contests/4/problems', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer team-jwt-token',
            }),
        }));
        expect(fetchMock).toHaveBeenNthCalledWith(4, 'https://api.autojudge.test/base/submissions', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer team-jwt-token',
            }),
        }));
        expect(result).toEqual({
            problems: [
                { id: 1, hash: 'prob-a', title: 'A + B', order: 1 },
            ],
            submissions: [
                { id: 22, status: 'PENDING', problem: { id: 1, title: 'A + B' } },
            ],
            team: {
                id: 9,
                hash: 'teamhash9',
                name: 'Bits',
                contest: {
                    id: 4,
                    name: 'Regional Final',
                },
            },
            token: 'team-jwt-token',
        });

        const storedSession = await session.readStoredSession(context);
        expect(storedSession).toEqual({
            teamId: 'teamhash9',
            token: 'team-jwt-token',
        });
    });

    it('clears an invalid saved session instead of keeping a broken token around', async () => {
        const context = createContext();
        const session = await import('../src/contest-session.js');

        await session.writeStoredSession(context, {
            teamId: 'ghost-team',
            token: 'expired-token',
        });

        fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid token.' }, 401));

        const restored = await session.restoreContestSession({
            baseUrl: 'https://api.autojudge.test',
            context,
        });

        expect(restored).toBeNull();
        expect(await session.readStoredSession(context)).toBeNull();
    });

    it('submits a solution with the stored contest token', async () => {
        const context = createContext();
        const session = await import('../src/contest-session.js');

        await session.writeStoredSession(context, {
            teamId: 'teamhash9',
            token: 'team-jwt-token',
        });

        fetchMock.mockResolvedValueOnce(jsonResponse({
            submission: {
                id: 31,
                status: 'PENDING',
            },
        }, 201));

        const result = await session.submitSolution({
            baseUrl: 'https://api.autojudge.test/base',
            code: 'print("hi")\n',
            context,
            filename: 'main.py',
            problemId: 1,
        });

        expect(fetchMock).toHaveBeenCalledWith('https://api.autojudge.test/base/submissions', expect.objectContaining({
            body: JSON.stringify({
                code: 'print("hi")\n',
                filename: 'main.py',
                problemId: 1,
            }),
            headers: expect.objectContaining({
                Authorization: 'Bearer team-jwt-token',
                'Content-Type': 'application/json',
            }),
            method: 'POST',
        }));
        expect(result).toEqual({
            id: 31,
            status: 'PENDING',
        });
    });
});