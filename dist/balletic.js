const clientRegistry = [];
export function registerClass(Base, closeMethodName = 'close') {
    return class extends Base {
        // Override Base's constructor to add instance to client registry any time a new instance is created
        constructor(...args) {
            super(...args);
            clientRegistry.push([this, closeMethodName]);
            // debug log
            console.debug(`Added client: ${this.constructor.name} to registry. Registered clients: ${JSON.stringify(clientRegistry)}`);
        }
    };
}
export function initShutdownHandler(signal = 'SIGTERM') {
    process.on(signal, () => {
        closeRegistry();
    });
}
export function closeRegistry() {
    while (clientRegistry.length > 0) {
        const entry = clientRegistry.shift();
        if (!entry) {
            continue;
        }
        const [client, closeMethodName] = entry;
        const closeMethod = client?.[closeMethodName];
        if (closeMethod) {
            closeMethod();
        }
    }
}
