import { registerClass, closeRegistry, getRegistryLength } from './balletic';

class TestClient {
    interval: NodeJS.Timeout;

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

const registeredTestClient = registerClass<typeof TestClient>(TestClient);

class RegisteredTestClient extends registeredTestClient {}

const registeredTestClientWithDestroy = registerClass<typeof TestClient>(TestClient, 'destroy');

class RegisteredTestClientWithDestroy extends registeredTestClientWithDestroy {}

describe('balletic tests', () => {
    const closeSpy = jest.spyOn(TestClient.prototype, 'close');
    const destroySpy = jest.spyOn(TestClient.prototype, 'destroy');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // Reset state
        await closeRegistry();
    })

    describe('registerClass', () => {
        it('should register an instance of RegisteredTestClient', () => {
            const testInstance = new RegisteredTestClient();

            expect(getRegistryLength()).toBe(1);

            testInstance.close();
            // Should clients remove themselves from the registry when explicitly closed?
        });
    });

    describe('closeRegistry', () => {
        it('should close registered instances', async () => {
            const testInstance = new RegisteredTestClient();

            await closeRegistry();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).not.toHaveBeenCalled();
        });

        it('should close registered instances with specifed close method name', async () => {
            const testInstance = new RegisteredTestClientWithDestroy();

            await closeRegistry();

            expect(destroySpy).toHaveBeenCalledTimes(1);
        });
    });
});