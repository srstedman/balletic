import { setExitCode, setProcessOnListener } from './adapters/processAdapter';
import { closeRegistry } from './balletic';

/**
 * Registers a signal listener that invokes the shutdown function.
 * Defaults to SIGTERM unless signal is specified.
 * @param {string} [signal="SIGTERM"] Signal for which to register shutdown listener
 * @param {Function} [callback] Optional callback to invoke after registry is closed
 */
export function initShutdownHandler(signal = 'SIGTERM', callback?: Function) {
    console.log(`setProcessOnListener: ${setProcessOnListener}`);
    setProcessOnListener(signal, async () => {
        await shutdown(callback);
    });
}

/**
 *
 * @param {string[]} signals
 * @param {Function} [callback] Optional callback to invoke after registry is closed
 */
export function initShutdownHandlers(signals: string[], callback?: Function) {
    for (const signal of signals) {
        setProcessOnListener(signal, async () => {
            await shutdown(callback);
        });
    }
}

/**
 * Closes registry and then invokes optional callback
 * @param {Function} [callback] Optional callback to invoke after registry is closed
 */
async function shutdown(callback?: Function) {
    const errors = await closeRegistry();
    if (callback && typeof callback === 'function') {
        await callback();
    }
    if (errors.length) {
        setExitCode(1);
    }
}
