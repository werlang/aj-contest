import * as vscode from 'vscode';
import { normalizeBaseUrl } from '../services/contest-api.js';

const config = {
    SUPPORTED_EXTENSIONS: ['.c', '.cpp', '.java', '.js', '.php', '.py'],
    BASE_URL:  normalizeBaseUrl(vscode.workspace.getConfiguration('autojudgeContest').get('baseUrl', 'https://api.autojudge.io')),
    POLL_INTERVAL_MS: Number(vscode.workspace.getConfiguration('autojudgeContest').get('pollIntervalMs', 5000)),
    TEAM_PANEL_REFRESH_INTERVAL_MS: 15000,
};

export const {
    SUPPORTED_EXTENSIONS,
    BASE_URL,
    POLL_INTERVAL_MS,
    TEAM_PANEL_REFRESH_INTERVAL_MS
} = config;

export default config;