const EXPLICIT_PUBLIC_COLLECTION_KEYS = [
    'publicCases',
    'public_cases',
    'publicSamples',
    'public_samples',
    'publicTestcases',
    'public_testcases',
    'samples',
    'sampleCases',
];

const GENERIC_COLLECTION_KEYS = ['cases', 'testcases'];

/**
 * Extract public testcase pairs from the problem payload while tolerating the
 * naming differences used by contest backends.
 * @param {object | undefined | null} problem
 * @returns {{ input: string, output: string }[]}
 */
export function extractPublicCases(problem) {
    for (const key of EXPLICIT_PUBLIC_COLLECTION_KEYS) {
        const explicitCases = normalizeCaseCollection(problem?.[key]);
        if (explicitCases.length) {
            return explicitCases;
        }
    }

    for (const key of GENERIC_COLLECTION_KEYS) {
        const genericCases = normalizeCaseCollection(problem?.[key], { requirePublicMarker: true });
        if (genericCases.length) {
            return genericCases;
        }
    }

    return [];
}

/**
 * Normalize one testcase collection into `.in`/`.out` string pairs.
 * @param {unknown} collection
 * @param {{ requirePublicMarker?: boolean }} [options]
 * @returns {{ input: string, output: string }[]}
 */
function normalizeCaseCollection(collection, { requirePublicMarker = false } = {}) {
    if (!Array.isArray(collection)) {
        return [];
    }

    return collection
        .filter(entry => !requirePublicMarker || isMarkedPublic(entry))
        .map(entry => normalizeCaseEntry(entry))
        .filter(Boolean);
}

/**
 * Decide whether a generic testcase entry is public.
 * @param {unknown} entry
 * @returns {boolean}
 */
function isMarkedPublic(entry) {
    if (!entry || typeof entry !== 'object') {
        return false;
    }

    return entry.public === true
        || entry.isPublic === true
        || entry.visibility === 'public'
        || entry.type === 'public';
}

/**
 * Normalize one testcase entry across array and object payload shapes.
 * @param {unknown} entry
 * @returns {{ input: string, output: string } | null}
 */
function normalizeCaseEntry(entry) {
    if (Array.isArray(entry) && entry.length >= 2) {
        return buildNormalizedCase(entry[0], entry[1]);
    }

    if (!entry || typeof entry !== 'object') {
        return null;
    }

    return buildNormalizedCase(
        pickCaseValue(entry, ['input', 'stdin', 'in']),
        pickCaseValue(entry, ['output', 'stdout', 'out']),
    );
}

/**
 * Pick the first non-empty testcase field from a list of possible keys.
 * @param {Record<string, unknown>} entry
 * @param {string[]} keys
 * @returns {unknown}
 */
function pickCaseValue(entry, keys) {
    return keys
        .map(key => entry[key])
        .find(value => value != null && value !== '');
}

/**
 * Convert one input/output pair to strings and discard incomplete entries.
 * @param {unknown} input
 * @param {unknown} output
 * @returns {{ input: string, output: string } | null}
 */
function buildNormalizedCase(input, output) {
    if (input == null || output == null) {
        return null;
    }

    return {
        input: String(input),
        output: String(output),
    };
}