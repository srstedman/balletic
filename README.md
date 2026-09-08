# Balletic
Balletic is a lightweight tool for handling graceful client shutdown in Node.js. Registering a client overrides its constructor, such that creating a new instance adds the instance to the global client registry. Registered client instances are shut down sequentially when `closeRegistry` is called or when the built in shutdown listener is invoked.


## Registering a Client
```ts
class TestClient {
    interval: NodeJS.Timeout;

    constructor() {
        // Demonstrates a client that will not be GC'd until explicitly closed
        this.interval = setInterval(() => {
            console.log(`hello!`);
        }, 5000);
    }

    close() {
        clearInterval(this.interval);
    }
}

// Register client
const registeredTestClient = Register<typeof TestClient>(TestClient);
const client = new registeredTestClient();

// Optionally, create a class type so that we have a named constructor
class RegisteredTestClient extends registeredTestClient {}
const clientWithNamedConstructor = new RegisteredTestClient();

// Sets up a SIGTERM listener which will close registered clients upon receiving a SIGTERM signal
initShutdownHandler();
```

### Prerequisites
Clients must either have a `close` method implemented, or you must provide the name of the close method when a client is registered,
 eg.

 ```ts
 class TestClient {
    interval: NodeJS.Timeout;

    constructor() {
        // Demonstrates a client that will not be GC'd until explicitly destroyed
        this.interval = setInterval(() => {
            console.log(`hello!`);
        }, 5000);
    }

    destroy() {
        clearInterval(this.interval);
    }
}

const RegisteredTestClientWithDestroy = Register(TestClient, 'destroy');
 ```

### Priority
Optionally specify a priority (`1-999`) for a registered class. Priority applies to the registered class, not each instance created; all instances of a registered class will share a priority. Within a priority level, registered clients are closed sequentially in the order in which they are created. Priority can be useful when you have a client that must complete pending tasks (eg. a server instance with pending requests) before the clients it is dependent on (eg. database client, logger client) can be closed. Default priority is `999`.

```ts
// TODO: add example
```

## Implementing shutdown signal listener
Balletic provides a general purpose shutdown listener which sequentially closes each registered client when the specified signal is received and then invokes an optional callback. Use the callback if you need additional cleanup after the client registry is closed.

### Shutdown callback
Use the shutdown callback if there are additional tasks to execute after the client registry is closed.
