// Used to mock SIGTERM handlers
const processEvents: Record<string | symbol | number, Function> = {};

export const mockProcessOn = jest.spyOn(process, 'on').mockImplementation((signal: string | symbol, cb: Function): any => {
    processEvents[signal] = cb;
});

export const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null | undefined) => {
    process.exitCode = code;
}) as () => never);

export const mockProcessKill = jest.spyOn(process, 'kill').mockImplementation((pid: number, signal: string | number | undefined): any => {
    if (!signal) {
        return false;
    }
    processEvents[signal]();
    return true;
});

export const restoreProcessMocks = () => {
    mockProcessKill.mockRestore();
    mockProcessOn.mockRestore();
    mockProcessExit.mockRestore();
};
