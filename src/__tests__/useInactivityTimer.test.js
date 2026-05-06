import React from 'react';
import {useInactivityTimer, INACTIVITY_MS} from '../hooks/useInactivityTimer';
import {AppState} from 'react-native';

jest.mock('react-native', () =>
  ({
  AppState: {
    addEventListener: jest.fn(() => ({remove: jest.fn()})),
    currentState: 'active',
  },
}));

jest.useFakeTimers();

function TestComponent({onExpire}) {
  useInactivityTimer(onExpire);
  return null;
}

describe('useInactivityTimer', () => {
  let appStateCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    AppState.addEventListener.mockImplementation((event, cb) => {
      if (event === 'change') {
        appStateCallback = cb;
      }
      return {remove: jest.fn()};
    });
  });

  it('does not expire before threshold', () => {
    const onExpire = jest.fn();
    const renderer = require('react-test-renderer');
    renderer.create(<TestComponent onExpire={onExpire} />);
    jest.advanceTimersByTime(INACTIVITY_MS - 1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('expires after threshold', () => {
    const onExpire = jest.fn();
    const renderer = require('react-test-renderer');
    renderer.create(<TestComponent onExpire={onExpire} />);
    jest.advanceTimersByTime(INACTIVITY_MS);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('expires when app becomes active after long background', () => {
    const onExpire = jest.fn();
    const renderer = require('react-test-renderer');
    renderer.create(<TestComponent onExpire={onExpire} />);
    appStateCallback('background');
    jest.advanceTimersByTime(INACTIVITY_MS + 1);
    appStateCallback('active');
    expect(onExpire).toHaveBeenCalled();
  });

  it('does not expire when app becomes active before threshold', () => {
    const onExpire = jest.fn();
    const renderer = require('react-test-renderer');
    renderer.create(<TestComponent onExpire={onExpire} />);
    appStateCallback('background');
    appStateCallback('active');
    expect(onExpire).not.toHaveBeenCalled();
  });
});
