// Types

type RegistryEntry = [any, string];

type Constructor = new (...args: any[]) => {};
interface RegisterOptions {
    closeMethodName?: string;
    priority?: number;
}

// Implementation

const clientRegistryWithPriority: Record<number, RegistryEntry[]> = {};

for (let i = 1; i <= 999; i++) {
    // Init priority arrays
    clientRegistryWithPriority[i] = [];
}

const defaultOptions = {
    closeMethodName: 'close',
    priority: 999
}

/**
 * Mixin function that overrides Base's constructor to add instance to client registry upon creation
 * @param {T extends Constructor} Base
 * @param {RegisterOptions} options 
 * @returns {Constructor & T} Registered version of Base class
 */
export function Register<T extends Constructor>(Base: T, options?: RegisterOptions): Constructor & T {
    return class extends Base {
        // Override Base's constructor to add instance to client registry any time a new instance is created
        private constructor(...args: any[]) {
            super(...args);

            const { closeMethodName, priority } = { ...defaultOptions, ...options };

            clientRegistryWithPriority[priority].push([this, closeMethodName]);

            // debug log
            console.debug(`Added client: ${this.constructor.name} to registry.`);
        }

        toString() {
            return this.constructor.name;
        }
    }
}

// for testing purposes
export function getPriorityRegistryLength(): number {
    let length = 0;

    for (const index in clientRegistryWithPriority) {
        const priorityArray = clientRegistryWithPriority[index];
        length += priorityArray.length
    }

    return length;
}

/**
 * Registers a signal listener that invokes the shutdown function. 
 * Defaults to SIGTERM unless signal is specified.
 * @param {string} [signal="SIGTERM"] Signal for which to register shutdown listener
 * @param {Function} [callback] Optional callback to invoke after registry is closed
 */
export function initShutdownHandler(signal = 'SIGTERM', callback?: Function) {
    process.on(signal, () => {
        shutdown(callback);
    });
}

/**
 * 
 * @param {string[]} signals 
 * @param {Function} [callback] Optional callback to invoke after registry is closed 
 */
export function initShutdownHandlers(signals: string[], callback?: Function) {
    for (const signal of signals) {
        process.on(signal, () => {
            shutdown(callback);
        });
    }
}

/**
 * Closes registry and then invokes optional callback
 * @param {Function} [callback] Optional callback to invoke after registry is closed 
 */
async function shutdown(callback?: Function) {
    await closeRegistryWithPriority();
    if (callback && typeof callback === 'function') {
        await callback();
    }
}

/**
 * Closes all clients in the client registry in priority order
 */
export async function closeRegistryWithPriority() {
    for (const index in clientRegistryWithPriority) {
        const priorityArray = clientRegistryWithPriority[index];
        while (priorityArray.length > 0) {
            const entry = priorityArray.shift();

            if (!entry) {
                continue;
            }

            const [client, closeMethodName] = entry;

            const closeMethod: Function = client?.[closeMethodName];

            if (closeMethod) {
                await closeMethod.bind(client)();
                // Error handling???
            }
        }
    }
}
