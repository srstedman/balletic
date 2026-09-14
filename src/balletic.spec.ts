import { mockProcessOn, processEvents, resetProcessMocks, restoreProcessMocks } from '__mocks__/process';
import { closeRegistry, getRegistryLength, initShutdownHandler, initShutdownHandlers, Register } from './balletic';

class TestClient {
    interval;

    constructor() {
        this.interval = setInterval(() => {
            console.log(`test interval`)
        }, 5000);
    }

    close() {
        clearInterval(this.interval);
    }

    destroy() {
        this.close();
    }
}

const registeredTestClient = Register<typeof TestClient>(TestClient);
class RegisteredTestClient extends registeredTestClient { }

const registeredTestClientWithDestroy = Register<typeof TestClient>(TestClient, { closeMethodName: 'destroy' });
class RegisteredTestClientWithDestroy extends registeredTestClientWithDestroy { }

describe('balletic tests', () => {
    const closeSpy = jest.spyOn(TestClient.prototype, 'close');
    const destroySpy = jest.spyOn(TestClient.prototype, 'destroy');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Reset state
        return closeRegistry();
    })

    afterAll(() => {
        restoreProcessMocks();
    });

    describe('registerClass', () => {
        it('should register an instance of RegisteredTestClient', () => {
            const testInstance = new RegisteredTestClient();

            expect(getRegistryLength()).toBe(1);

            testInstance.close();

            expect((testInstance as any).balleticIsClosed).toBeTruthy();
        });

         it('should extend base close method', () => {
            const testInstance = new RegisteredTestClient();

            expect((testInstance as any).balleticIsClosed).toBeFalsy();

            testInstance.close();

            expect((testInstance as any).balleticIsClosed).toBeTruthy();
        });
    });

    describe('closeRegistry', () => {
        it('should close registered instances', async () => {
            new RegisteredTestClient();

            const errors = await closeRegistry();

            expect(errors.length).toBe(0);
            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).not.toHaveBeenCalled();
            expect(getRegistryLength()).toBe(0);
        });

        it('should close registered instances with specifed close method name', async () => {
            new RegisteredTestClientWithDestroy();

            const errors = await closeRegistry();

            expect(errors.length).toBe(0);
            expect(destroySpy).toHaveBeenCalledTimes(1);
            expect(getRegistryLength()).toBe(0);
        });

        describe('error handling', () => {
            it('should return array of error messages', async () => {
                closeSpy.mockImplementationOnce(() => { throw new Error('oops') });
                const client = new RegisteredTestClient();

                const errors = await closeRegistry();

                expect(errors.length).toBe(1);
                expect(closeSpy).toHaveBeenCalledTimes(1);
                expect(getRegistryLength()).toBe(0);

                // Close function was mocked, so actually close it now.
                client.close();
            });

            it('when provided close method does not exist, should not attempt to call close method', async () => {
                const improperlyRegisteredTest = Register<typeof TestClient>(TestClient, { closeMethodName: 'disconnect' });
                class ImproperlyRegisteredTestClient extends improperlyRegisteredTest { }

                const client = new ImproperlyRegisteredTestClient();

                const errors = await closeRegistry();

                expect(errors.length).toBe(1);
                expect(closeSpy).not.toHaveBeenCalled();
                expect(getRegistryLength()).toBe(0);

                // Close function was not invoked, so actually close it now.
                client.close();
            });
        });
    });

    describe('set up listeners', () => {
        beforeEach(() => {
            resetProcessMocks();
        });

        describe('initShutdownHandler', () => {
            it('when no signal is specified, should register SIGTERM listener', () => {
                const signal = 'SIGTERM';

                initShutdownHandler();

                expect(mockProcessOn).toHaveBeenCalledWith(signal, expect.any(Function));
            });

            describe('default', () => {
                it('should set up SIGTERM listener with no callback', async () => {
                    const signal = 'SIGTERM';

                    initShutdownHandler();

                    expect(Object.keys(processEvents)).toEqual([signal]);

                    new RegisteredTestClient();

                    // Await callback
                    await processEvents[signal]();

                    expect(closeSpy).toHaveBeenCalledTimes(1);
                    expect(getRegistryLength()).toBe(0);
                });
            });

            describe('when callback is provided', () => {
                it('signal listener should close registry and then invoke callback', async () => {
                    const signal = 'SIGTERM';
                    const callback = jest.fn();

                    initShutdownHandler(signal, callback);

                    expect(Object.keys(processEvents)).toEqual([signal]);

                    new RegisteredTestClient();

                    // Await callback
                    await processEvents[signal]();

                    expect(closeSpy).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(getRegistryLength()).toBe(0);
                });
            });

            describe('error handling', () => {
                it('when an error is encountered, should set exitCode to 1', async () => {
                    const signal = 'SIGTERM';
                    closeSpy.mockImplementationOnce(() => { throw new Error('oops') });

                    initShutdownHandler();

                    const client = new RegisteredTestClient();

                    // Await callback
                    await processEvents[signal]();

                    expect(closeSpy).toHaveBeenCalledTimes(1);
                    expect(getRegistryLength()).toBe(0);
                    expect(process.exitCode).toBe(1);

                    client.close();
                });
            });
        });

        describe('initShutdownHandlers', () => {
            it('should set up listeners for all signals provided', async () => {
                const signals = ['SIGTERM', 'SIGINT'];

                initShutdownHandlers(signals);

                expect(Object.keys(processEvents)).toEqual(signals);
            });

            describe('when callback is provided', () => {
                it('signal listener should close registry and then invoke callback', async () => {
                    const signals = ['SIGTERM', 'SIGINT'];
                    const callback = jest.fn();

                    initShutdownHandlers(signals, callback);

                    new RegisteredTestClient();

                    // Await callbacks
                    await processEvents[signals[0]]();

                    expect(closeSpy).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(getRegistryLength()).toBe(0);

                    new RegisteredTestClient();

                    await processEvents[signals[1]]();

                    expect(closeSpy).toHaveBeenCalledTimes(2);
                    expect(callback).toHaveBeenCalledTimes(2);
                    expect(getRegistryLength()).toBe(0);
                });
            });
        });
    });
});
