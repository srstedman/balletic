export const setExitCode = (code: number) => {
    process.exitCode = code;
};

export const setProcessOnListener = (
    eventName: string | symbol,
    callback: (...args: any) => void,
) => {
    process.on(eventName, callback);
};
