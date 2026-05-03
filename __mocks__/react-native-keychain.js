let storedPassword = null;

export const setGenericPassword = jest.fn((username, password, options) => {
  storedPassword = password;
  return Promise.resolve();
});

export const getGenericPassword = jest.fn((options) => {
  if (storedPassword) {
    return Promise.resolve({username: 'user', password: storedPassword});
  }
  return Promise.resolve(false);
});

export const resetGenericPassword = jest.fn((options) => {
  storedPassword = null;
  return Promise.resolve(true);
});
