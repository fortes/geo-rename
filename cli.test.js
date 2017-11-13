jest.mock('./geo-rename', () => {
  return {tagFiles: jest.fn(async () => true)};
});
jest.mock('./log', () => {
  return {
    trace: jest.fn(() => {}),
    verbose: jest.fn(() => {}),
  };
});

const {tagFiles} = require('./geo-rename');

const {main} = require('./cli');

beforeEach(() => {
  console._originalError = console.error;
  console._originalLog = console.log;
  console.error = jest.fn(() => {});
  console.log = jest.fn(() => {});
});

afterEach(() => {
  console.error = console._originalError;
  console.log = console._originalLog;
  tagFiles.mockReset();
});

describe('argument handling', () => {
  test('usage info if no files', async () => {
    await main(['-s']);
    expect(console.log).toHaveBeenCalled();
    expect(console.log.mock.calls[0][0]).toMatchSnapshot();
    expect(tagFiles).not.toHaveBeenCalled();
  });

  test('usage info if unknown argument', async () => {
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
    await main(['images', '--foo']);
    expect(console.error).toHaveBeenCalled();
    expect(console.error.mock.calls[0][0]).toMatchSnapshot();
    expect(console.log).toHaveBeenCalled();
    expect(console.log.mock.calls[0][0]).toMatchSnapshot();
    expect(tagFiles).not.toHaveBeenCalled();
  });

  test('passes options', async () => {
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
    await main([
      '-f',
      '--offline',
      '--skip-backup',
      '/path/to/images',
      '--cache-folder',
      '/tmp/',
      '-v',
      '--debug',
    ]);
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
    expect(tagFiles).toHaveBeenCalled();
    expect(tagFiles.mock.calls[0][1]).toMatchSnapshot();
  });
});
