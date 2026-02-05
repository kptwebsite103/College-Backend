describe('mongooseLoader retry behavior', () => {
  let loader;
  let mockConnect;
  let realExit;
  let setTimeoutSpy;

  beforeEach(() => {
    jest.resetModules();
    realExit = process.exit;
    process.exit = jest.fn();

    // make setTimeout call the callback immediately to avoid dealing with timers
    setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((cb, ms) => {
      try { cb(); } catch (e) { /* ignore */ }
      return 0;
    });

    mockConnect = jest.fn();
    jest.doMock('../../config/database', () => ({ connect: mockConnect }));
    loader = require('../../loaders/mongooseLoader');
  });

  afterEach(() => {
    process.exit = realExit;
    setTimeoutSpy.mockRestore();
  });

  test('retries until success', async () => {
    // fail twice, then succeed
    mockConnect.mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce(true);

    await expect(loader()).resolves.toBeUndefined();
    expect(mockConnect).toHaveBeenCalledTimes(3);
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('exits after max attempts', async () => {
    mockConnect.mockRejectedValue(new Error('always-fail'));

    // Set low retry count for faster test
    process.env.DB_CONN_RETRY_ATTEMPTS = '3';
    process.env.DB_CONN_RETRY_DELAY_MS = '10';

    await expect(loader()).resolves.toBeUndefined();

    // The loader calls process.exit on final failure
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});