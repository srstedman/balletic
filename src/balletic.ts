import { Constructor, RegisterOptions, RegistryEntry } from 'src/types';

/**
 * Global client registry
 */
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

        // Override Base's constructor to add instance to clsrc/balletic.tsient registry any time a new instance is created
        private constructor(...args: any[]) {
            super(...args);

            const { closeMethodName, priority } = { ...defaultOptions, ...options };

            this.balleticIsClosed = false;
            this.balleticCloseMethodName = closeMethodName as keyof Constructor;
            console.debug(`this.closeMethodName: ${this.balleticCloseMethodName}`);

            clientRegistry[priority].push({ client: this, closeMethodName });

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

/**
 * For testing purposes
 * @returns {number}  Total number of clients in registry
 */
export function getRegistryLength(): number {
    let length = 0;

    for (const index in clientRegistry) {
        const priorityArray = clientRegistry[index];
        length += priorityArray.length;
    }

    return length;
}

/**
 * Closes all clients in the client registry in priority order
 *  @returns {Promise<string[]>} Array containing any error messages from client close methods
 */
export async function closeRegistry(): Promise<string[]> {
    const errors: string[] = [];

    for (const index in clientRegistry) {
        const priorityArray = clientRegistry[index];

        const promises: Promise<void>[] = [];

        while (priorityArray.length > 0) {
            const entry = priorityArray.shift();

            if (!entry) {
                continue;
            }

            const { client, closeMethodName } = entry;

            const closeMethod: Function = client?.[closeMethodName];

            try {
                if (!closeMethod) {
                    throw new Error(
                        `Provided method ${closeMethodName} does not exist on class ${client.constructor.name}.`,
                    );
                }

                promises.push(closeMethod());
            } catch (e) {
                const message = (e as Error)?.message;
                console.log(`Error closing instance of ${client.constructor.name}: ${message}`);
                errors.push(message);
            }
        }

        // Clients at the same priority level will be closed asynchronously, but we await the closing of all
        // before progressing to the next priority level.
        await Promise.allSettled(promises);
    }

    return errors;
}
