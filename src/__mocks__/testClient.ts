import { Register } from '../balletic';

export class TestClient {
    interval;

    constructor() {
        this.interval = setInterval(() => {
            console.log(`test interval`);
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
export class RegisteredTestClient extends registeredTestClient {}

const registeredTestClientWithDestroy = Register<typeof TestClient>(TestClient, {
    closeMethodName: 'destroy',
});
export class RegisteredTestClientWithDestroy extends registeredTestClientWithDestroy {}
