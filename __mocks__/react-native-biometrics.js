export default {
  isSensorAvailable: jest.fn(() => Promise.resolve({available: true})),
  simplePrompt: jest.fn(() => Promise.resolve({success: true})),
};
