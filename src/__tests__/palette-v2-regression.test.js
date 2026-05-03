import React from 'react';
import renderer from 'react-test-renderer';
import PaletteV2RegressionScreen from '../components/testing/PaletteV2RegressionScreen';

describe('Palette V2 Visual Regression', () => {
  it('renders the full regression screen without crashing', () => {
    const tree = renderer.create(<PaletteV2RegressionScreen />).toJSON();
    expect(tree).toBeTruthy();
  });

  it('matches snapshot (V2 palette, typography, shadows, UI components)', () => {
    const tree = renderer.create(<PaletteV2RegressionScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
