import {
    createSafeActionClient,
    DEFAULT_SERVER_ERROR_MESSAGE,
} from 'next-safe-action';

export const actionClient = createSafeActionClient({
    handleServerError(e) {
        console.error('Failed to execute action:', e.message);

        return DEFAULT_SERVER_ERROR_MESSAGE;
    },
});