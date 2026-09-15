import { setExitCode, setProcessOnListener } from './processAdapter';

const clientRegistry: Record<number, RegistryEntry[]> = {};

for (let i = 1; i <= 999; i++) {
    // Init priority arrays
    clientRegistry[i] = [];
}

const defaultOptions = {
    closeMethodName: 'close',
    priority: 999,
};

/**
 * Mixin function that overrides Base's constructor to add instance to client registry upon creation
 * @param {T extends Constructor} Base
 * @param {RegisterOptions} options
 * @returns {Constructor & T} Registered version of Base class
 */
export function Register<T extends Constructor>(
    Base: T,
    options?: RegisterOptions,
): Constructor & T {
    return class extends Base {
        balleticIsClosed: boolean;
        balleticCloseMethodName: keyof Constructor;

        // Override Base's constructor to add instance to client registry any time a new instance is created
        private constructor(...args: any[]) {
            super(...args);

            const { closeMethodName, priority } = { ...defaultOptions, ...options };

            this.balleticIsClosed = false;
            this.balleticCloseMethodName = closeMethodName as keyof Constructor;
            console.debug(`this.closeMethodName: ${this.balleticCloseMethodName}`);

            clientRegistry[priority].push({ instance: this, closeMethodName });

            // Override the base close method - keep original implementation but set balleticIsClosed to true
            // This way, it will not be closed again when the registry is closed
            const baseCloseMethod: Function = this[this.balleticCloseMethodName];

            if (baseCloseMethod) {
                this[this.balleticCloseMethodName] = (() => {
                    if (!this.balleticIsClosed) {
                        baseCloseMethod.bind(this)();
                        this.balleticIsClosed = true;
                    }
                }) as never;
            }

            // Debug log
            console.debug(`Added client: ${this.constructor.name} to registry.`);
        }
    };
}

// For testing purposes
export function getRegistryLength(): number {
    let length = 0;

    for (const index in clientRegistry) {
        const priorityArray = clientRegistry[index];
        length += priorityArray.length;
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

/**
 * Closes all clients in the client registry in priority order
 *  @returns {Promise<string[]>} Array containing any error messages from client close methods
 */
export async function closeRegistry(): Promise<string[]> {
    const errors = [];

    for (const index in clientRegistry) {
        const priorityArray = clientRegistry[index];
        while (priorityArray.length > 0) {
            const entry = priorityArray.shift();

            if (!entry) {
                continue;
            }

            const { instance, closeMethodName } = entry;

            const closeMethod: Function = instance?.[closeMethodName];

            try {
                if (!closeMethod) {
                    throw new Error(
                        `Provided method ${closeMethodName} does not exist on class ${instance.constructor.name}.`,
                    );
                }

                await closeMethod();
            } catch (e) {
                const message = (e as Error)?.message;
                console.log(`Error closing instance of ${instance.constructor.name}: ${message}`);
                errors.push(message);
            }
        }
    }

    return errors;
}
