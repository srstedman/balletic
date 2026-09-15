import { mockSetExitCode, mockSetProcessOnListener } from './__mocks__/processAdapter';
import { RegisteredTestClient, TestClient } from './__mocks__/testClient';

import { closeRegistry, getRegistryLength } from './balletic';
import { initShutdownHandler, initShutdownHandlers } from './initListeners';

describe('set up listeners', () => {
    const closeSpy = jest.spyOn(TestClient.prototype, 'close');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Reset state
        return closeRegistry();
    });

    describe('initShutdownHandler', () => {
        it('when no signal is specified, should register SIGTERM listener', () => {
            const signal = 'SIGTERM';

            initShutdownHandler();

            expect(mockSetProcessOnListener).toHaveBeenCalledWith(signal, expect.any(Function));
        });

        describe('default', () => {
            it('should set up SIGTERM listener with no callback', async () => {
                const signal = 'SIGTERM';

                initShutdownHandler();

                new RegisteredTestClient();

                expect(mockSetProcessOnListener.mock.calls[0][0]).toBe(signal);

                // Await callback
                await mockSetProcessOnListener.mock.calls[0][1]();

                expect(closeSpy).toHaveBeenCalledTimes(1);
                expect(getRegistryLength()).toBe(0);
            });
        });

        describe('when callback is provided', () => {
            it('signal listener should close registry and then invoke callback', async () => {
                const signal = 'SIGHUP';
                const callback = jest.fn();

                initShutdownHandler(signal, callback);

                new RegisteredTestClient();

                expect(mockSetProcessOnListener.mock.calls[0][0]).toBe(signal);

                // Await callback
                await mockSetProcessOnListener.mock.calls[0][1]();

                expect(closeSpy).toHaveBeenCalledTimes(1);
                expect(callback).toHaveBeenCalledTimes(1);
                expect(getRegistryLength()).toBe(0);
            });
        });

        describe('error handling', () => {
            it('when an error is encountered, should set exitCode to 1', async () => {
                closeSpy.mockImplementationOnce(() => {
                    throw new Error('oops');
                });

                initShutdownHandler();

                const client = new RegisteredTestClient();

                // Await callback
                await mockSetProcessOnListener.mock.calls[0][1]();

                expect(closeSpy).toHaveBeenCalledTimes(1);
                expect(getRegistryLength()).toBe(0);
                expect(mockSetExitCode).toHaveBeenCalledWith(1);

                client.close();
            });
        });
    });

    describe('initShutdownHandlers', () => {
        it('should set up listeners for all signals provided', async () => {
            const signals = ['SIGTERM', 'SIGINT'];

            initShutdownHandlers(signals);

            expect(mockSetProcessOnListener).toHaveBeenCalledTimes(signals.length);
            expect(mockSetProcessOnListener.mock.calls[0][0]).toBe(signals[0]);
            expect(mockSetProcessOnListener.mock.calls[1][0]).toBe(signals[1]);
        });

        describe('when callback is provided', () => {
            it('signal listener should close registry and then invoke callback', async () => {
                const signals = ['SIGTERM', 'SIGINT'];
                const callback = jest.fn();

                initShutdownHandlers(signals, callback);

                new RegisteredTestClient();

                // Await callbacks
                await mockSetProcessOnListener.mock.calls[0][1]();

                expect(closeSpy).toHaveBeenCalledTimes(1);
                expect(callback).toHaveBeenCalledTimes(1);
                expect(getRegistryLength()).toBe(0);

                new RegisteredTestClient();

                await mockSetProcessOnListener.mock.calls[1][1]();

                expect(closeSpy).toHaveBeenCalledTimes(2);
                expect(callback).toHaveBeenCalledTimes(2);
                expect(getRegistryLength()).toBe(0);
            });
        });
    });
});
