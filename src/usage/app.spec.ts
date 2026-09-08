describe('example app tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // Reset state
        // await closeRegistryWithPriority();
    })

    it('dummy test', () => {
        expect(1).toBe(1);
    });
});
