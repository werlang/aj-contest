import { describe, expect, it } from 'vitest';

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

describe('VS Code contest session storage', () => {
    it('stores the token in secrets and only non-sensitive metadata in global state', async () => {
        const context = createContext();
        const store = await import('../src/session-store.js');

        await store.writeStoredSession(context, {
            teamId: 'abc123',
            token: 'jwt-value',
        });

        expect(await store.readStoredSession(context)).toEqual({
            teamId: 'abc123',
            token: 'jwt-value',
        });
    });

    it('removes both the token and metadata when the session is cleared', async () => {
        const context = createContext();
        const store = await import('../src/session-store.js');

        await store.writeStoredSession(context, {
            teamId: 'abc123',
            token: 'jwt-value',
        });
        await store.clearStoredSession(context);

        expect(await store.readStoredSession(context)).toBeNull();
    });
});