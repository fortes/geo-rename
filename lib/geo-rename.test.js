jest.mock('./cache', () => ({
  open: jest.fn(),
  close: jest.fn(),
  get: jest.fn(),
  write: jest.fn(),
}))

const {tagFiles} = require('./geo-rename');

test('opens cache', () => {

})
