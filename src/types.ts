export interface RegistryEntry {
    client: any;
    closeMethodName: string;
}

export type Constructor = new (...args: any[]) => {};

export interface RegisterOptions {
    closeMethodName?: string;
    priority?: number;
}
