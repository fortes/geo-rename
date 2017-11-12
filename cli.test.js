jest.mock('./geo-rename', () => {
  return {tagFiles: jest.fn(async () => true)};
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
});

describe('argument handling', () => {
  test('usage info if no arguments', async () => {
    await main([]);
    expect(console.log).toHaveBeenCalled();
    expect(console.log.mock.calls[0][0]).toMatchSnapshot();
  });

  test('parses and passes options', async () => {
    await main(['-f', '--offline', '--skip-backup', '/path/to/images', '--cache-folder', '/tmp/']);
    expect(tagFiles).toHaveBeenCalled();
    expect(tagFiles.mock.calls[0][1]).toMatchSnapshot();
  });
});
