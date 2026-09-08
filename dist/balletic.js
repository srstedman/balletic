// const clientRegistry: RegistryEntry[] = [];
const clientRegistryWithPriority = {};
for (let i = 1; i <= 999; i++) {
    // init priority arrays
    clientRegistryWithPriority[i] = [];
}
const defaultOptions = {
    closeMethodName: 'close',
    priority: 999
};
export function Register(Base, options) {
    return class Registered extends Base {
        // Override Base's constructor to add instance to client registry any time a new instance is created
        constructor(...args) {
            super(...args);
            const { closeMethodName, priority } = { ...defaultOptions, ...options };
            // clientRegistry.push([this, closeMethodName]);
            clientRegistryWithPriority[priority].push([this, closeMethodName]);
            // debug log
            console.debug(`Added client: ${this.constructor.name} to registry.`);
        }
        toString() {
            return this.constructor.name;
        }
    };
}
// // for testing purposes
// export function getRegistryLength(): number {
//     return clientRegistry.length;
// }
export function getPriorityRegistryLength() {
    let length = 0;
    for (const index in clientRegistryWithPriority) {
        const priorityArray = clientRegistryWithPriority[index];
        length += priorityArray.length;
    }
    return length;
}
export function initShutdownHandler(signal = 'SIGTERM', callback) {
    process.on(signal, () => {
        shutdown(callback);
    });
}
/**
 *
 */
export function initShutdownHandlers(signals, callback) {
    for (const signal of signals) {
        process.on(signal, () => {
            shutdown(callback);
        });
    }
}
async function shutdown(callback) {
    await closeRegistryWithPriority();
    if (callback && typeof callback === 'function') {
        await callback();
    }
}
// export async function closeRegistry() {
//     while (clientRegistry.length > 0) {
//         const entry = clientRegistry.shift();
//         if (!entry) {
//             continue;
//         }
//         const [client, closeMethodName] = entry;
//         const closeMethod: Function = client?.[closeMethodName];
//         if (closeMethod) {
//             await closeMethod.bind(client)();
//             // Error handling???
//         }
//     }
// }
export async function closeRegistryWithPriority() {
    for (const index in clientRegistryWithPriority) {
        const priorityArray = clientRegistryWithPriority[index];
        while (priorityArray.length > 0) {
            const entry = priorityArray.shift();
            if (!entry) {
                continue;
            }
            const [client, closeMethodName] = entry;
            const closeMethod = client?.[closeMethodName];
            if (closeMethod) {
                await closeMethod.bind(client)();
                // Error handling???
            }
        }
    }
}
