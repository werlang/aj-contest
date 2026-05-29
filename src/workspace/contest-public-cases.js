/**
 * Extract public testcase pairs from the problem payload while tolerating the
 * naming differences used by contest backends.
 * @param {object | undefined | null} problem
 * @returns {{ input: string, output: string }[]}
 */
export function extractPublicCases(problem) {
    const casesInput = problem?.input;
    const casesOutput = problem?.output;

    if (!casesInput || !casesOutput || casesInput.length === 0 || casesOutput.length === 0) {
        return [];
    }

    const normalizedInput = normalizeCases(casesInput);
    const normalizedOutput = normalizeCases(casesOutput);

    if (!Array.isArray(normalizedInput) || !Array.isArray(normalizedOutput) || normalizedInput.length !== normalizedOutput.length) {
        return [];
    }

    const pairedCases = [];
    for (let i = 0; i < normalizedInput.length; i++) {
        const input = normalizedInput[i];
        const output = normalizedOutput[i];
        const normalizedCase = normalizeProblemCase(input, output);
        if (normalizedCase) {
            pairedCases.push(normalizedCase);
        }
    }

    return pairedCases;
}

function normalizeCases(cases) {
    if (Array.isArray(cases)) {
        return cases;
    }

    if (typeof cases === 'string') {
        try {
            const parsed = JSON.parse(cases);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [cases];
        } catch {
            // Ignore JSON parse errors and fallback to raw string handling
            return [cases];
        }
    }

    return [];
}

/**
 * 
 * @param {object | undefined | null} problem
 * @returns {{ input: string, output: string } | null}
 */
function normalizeProblemCase(input, output) {
    if (!input || !output) {
        return null;
    }

    if (!isInlineCaseValue(input) || !isInlineCaseValue(output)) {
        return null;
    }

    return {
        input: String(input),
        output: String(output),
    };
}

/**
 * Accept only scalar inline sample fields so malformed objects or arrays do not
 * end up exported as `[object Object]` or other surprising file contents.
 * @param {unknown} value
 * @returns {boolean}
 */
function isInlineCaseValue(value) {
    return typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
        || typeof value === 'bigint';
}