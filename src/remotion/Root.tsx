import React from 'react';
import { Composition } from 'remotion';
import { Wrapped } from './Wrapped';
import type { Props, WrappedData } from './types';
import demo from '../demo.json';

export const Root: React.FC = () => (
  <Composition
    id="Wrapped"
    component={Wrapped}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={18 * 60}
    defaultProps={{ data: demo as WrappedData, fps: 60, music: null } satisfies Props}
    calculateMetadata={({ props }) => {
      const fps = props.fps ?? 60;
      return { fps, durationInFrames: Math.round(18 * fps) };
    }}
  />
);
