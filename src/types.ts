interface RegistryEntry {
    instance: any;
    closeMethodName: string;
}

type Constructor = new (...args: any[]) => {};

interface RegisterOptions {
    closeMethodName?: string;
    priority?: number;
}
