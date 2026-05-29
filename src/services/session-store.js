const TOKEN_SECRET_KEY = 'autojudgeContest.teamToken';
const SESSION_METADATA_KEY = 'autojudgeContest.session';

/**
 * Persist the team JWT in VS Code secrets and only the non-sensitive metadata
 * required to recover the session in global state.
 * @param {import('vscode').ExtensionContext | { secrets: object, globalState: object }} context
 * @param {{ teamId: string, token: string }} session
 * @returns {Promise<void>}
 */
export async function writeStoredSession(context, session) {
    await context.secrets.store(TOKEN_SECRET_KEY, session.token);
    await context.globalState.update(SESSION_METADATA_KEY, {
        teamId: session.teamId,
    });
}

/**
 * Read the persisted team session from VS Code storage.
 * @param {import('vscode').ExtensionContext | { secrets: object, globalState: object }} context
 * @returns {Promise<{ teamId: string, token: string } | null>}
 */
export async function readStoredSession(context) {
    const token = await context.secrets.get(TOKEN_SECRET_KEY);
    const metadata = context.globalState.get(SESSION_METADATA_KEY, null);

    if (!token || !metadata?.teamId) {
        return null;
    }

    return {
        teamId: metadata.teamId,
        token,
    };
}

/**
 * Remove the persisted session from both secrets and global state.
 * @param {import('vscode').ExtensionContext | { secrets: object, globalState: object }} context
 * @returns {Promise<void>}
 */
export async function clearStoredSession(context) {
    await context.secrets.delete(TOKEN_SECRET_KEY);
    await context.globalState.update(SESSION_METADATA_KEY, undefined);
}