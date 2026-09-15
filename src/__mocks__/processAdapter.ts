export const mockSetExitCode = jest.fn();

export const mockSetProcessOnListener = jest.fn();

jest.mock('../processAdapter', () => {
    return {
        setExitCode: mockSetExitCode,
        setProcessOnListener: mockSetProcessOnListener,
    };
});
