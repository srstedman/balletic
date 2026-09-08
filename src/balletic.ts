type RegistryEntry = [any, string];

const clientRegistry: RegistryEntry[] = [];

type Constructor = new (...args: any[]) => {};

export function registerClass<T extends Constructor>(Base: T, closeMethodName = 'close'): Constructor & T {
    return class extends Base {
        // Override Base's constructor to add instance to client registry any time a new instance is created
        private constructor(...args: any[]) {
            super(...args);

            clientRegistry.push([this, closeMethodName]);

            // debug log
            console.debug(`Added client: ${this.constructor.name} to registry.`);
        }

        toString() {
            return this.constructor.name;
        }
    }
}

// for testing purposes
export function getRegistryLength(): number {
    return clientRegistry.length;
}

export function initShutdownHandler(signal = 'SIGTERM') {
    process.on(signal, () => {
        closeRegistry();
    });
}

export async function closeRegistry() {
    while (clientRegistry.length > 0) {
        const entry = clientRegistry.shift();

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
