import { closeRegistryWithPriority, getPriorityRegistryLength, Register } from './balletic';

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

const registeredTestClient = Register<typeof TestClient>(TestClient);
class RegisteredTestClient extends registeredTestClient {}

const registeredTestClientWithDestroy = Register<typeof TestClient>(TestClient, {closeMethodName: 'destroy'});
class RegisteredTestClientWithDestroy extends registeredTestClientWithDestroy {}

describe('balletic tests', () => {
    const closeSpy = jest.spyOn(TestClient.prototype, 'close');
    const destroySpy = jest.spyOn(TestClient.prototype, 'destroy');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // Reset state
        await closeRegistryWithPriority();
    })

    describe('registerClass', () => {
        it('should register an instance of RegisteredTestClient', () => {
            const testInstance = new RegisteredTestClient();

            expect(getPriorityRegistryLength()).toBe(1);

            testInstance.close();
            // Should clients remove themselves from the registry when explicitly closed?
        });
    });

    describe('closeRegistryWithPriority', () => {
        it('should close registered instances', async () => {
            new RegisteredTestClient();

            await closeRegistryWithPriority();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).not.toHaveBeenCalled();
        });

        it('should close registered instances with specifed close method name', async () => {
            new RegisteredTestClientWithDestroy();

            await closeRegistryWithPriority();

            expect(destroySpy).toHaveBeenCalledTimes(1);
        });
    });
});
