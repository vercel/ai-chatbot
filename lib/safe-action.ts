import {
    createSafeActionClient,
    DEFAULT_SERVER_ERROR_MESSAGE,
} from 'next-safe-action';

export class ActionError extends Error { }

export const actionClient = createSafeActionClient({
    handleServerError(e) {
        console.error('Failed to execute action:', e.message);

        if (e instanceof ActionError) {
            return e.message;
        }

        return DEFAULT_SERVER_ERROR_MESSAGE;
    },
});