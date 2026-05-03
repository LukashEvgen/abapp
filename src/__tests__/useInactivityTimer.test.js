import React, {useState} from 'react';
import {useInactivityTimer, INACTIVITY_MS} from '../hooks/useInactivityTimer';
import {AppState} from 'react-native';

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({remove: jest.fn()})),
  },
}));

jest.useFakeTimers();

function TestComponent({onExpire}) {
  useInactivityTimer(onExpire);
  return null;
}

describe('useInactivityTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('does not expire before threshold', () => {
    const onExpire = jest.fn();
    const renderer = require('react-test-renderer');
    renderer.create(<TestComponent onExpire={onExpire} />);
    jest.advanceTimersByTime(INACTIVITY_MS - 1);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
