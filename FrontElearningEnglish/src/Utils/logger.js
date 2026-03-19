/**
 * Logger utility - Only logs in development mode
 * Prevents console.log spam in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Log general information (development only)
     */
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    /**
     * Log informational messages (development only)
     */
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    /**
     * Log warnings (always logged)
     */
    warn: (...args) => {
        console.warn(...args);
    },

    /**
     * Log errors (always logged)
     */
    error: (...args) => {
        console.error(...args);
    },

    /**
     * Log debug information (development only)
     */
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },

    /**
     * Group logs together (development only)
     */
    group: (label, ...args) => {
        if (isDevelopment) {
            console.group(label);
            args.forEach(arg => console.log(arg));
            console.groupEnd();
        }
    }
};

export default logger;
