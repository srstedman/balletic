import {
    RegisteredTestClient,
    RegisteredTestClientWithDestroy,
    TestClient,
} from './__mocks__/testClient';

import { closeRegistry, getRegistryLength, Register } from './balletic';

describe('balletic tests', () => {
    const closeSpy = jest.spyOn(TestClient.prototype, 'close');
    const destroySpy = jest.spyOn(TestClient.prototype, 'destroy');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Reset state
        return closeRegistry();
    });

    describe('registerClass', () => {
        beforeAll(() => {
            jest.spyOn(global, 'clearInterval');
        });

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

            expect(clearInterval).toHaveBeenCalledTimes(1);
            expect((testInstance as any).balleticIsClosed).toBeTruthy();
        });

        it('should extend base close method when alternative close method name is provided', () => {
            const testInstance = new RegisteredTestClientWithDestroy();

            expect((testInstance as any).balleticIsClosed).toBeFalsy();

            testInstance.destroy();

            expect(clearInterval).toHaveBeenCalledTimes(1);
            expect((testInstance as any).balleticIsClosed).toBeTruthy();
        });
    });

    describe('closeRegistry', () => {
        it('should close registered instances', async () => {
            new RegisteredTestClient();

            expect(getRegistryLength()).toBe(1);

            const errors = await closeRegistry();

            expect(errors.length).toBe(0);
            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).not.toHaveBeenCalled();
            expect(getRegistryLength()).toBe(0);
        });

        it('should close registered instances with specifed close method name', async () => {
            new RegisteredTestClientWithDestroy();

            expect(getRegistryLength()).toBe(1);

            const errors = await closeRegistry();

            expect(errors.length).toBe(0);
            expect(destroySpy).toHaveBeenCalledTimes(1);
            expect(getRegistryLength()).toBe(0);
        });

        describe('error handling', () => {
            it('should return array of error messages', async () => {
                closeSpy.mockImplementationOnce(() => {
                    throw new Error('oops');
                });
                const client = new RegisteredTestClient();

                const errors = await closeRegistry();

                expect(errors.length).toBe(1);
                expect(closeSpy).toHaveBeenCalledTimes(1);
                expect(getRegistryLength()).toBe(0);

                // Close function was mocked, so actually close it now.
                client.close();
            });

            it('when provided close method does not exist, should not attempt to call close method', async () => {
                const improperlyRegisteredTest = Register<typeof TestClient>(TestClient, {
                    closeMethodName: 'disconnect',
                });
                class ImproperlyRegisteredTestClient extends improperlyRegisteredTest {}

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
});
