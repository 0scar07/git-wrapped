import React from 'react';
import { Composition } from 'remotion';
import { Wrapped } from './Wrapped';
import { Card } from './Card';
import type { Props, WrappedData } from './types';
import demo from '../demo.json';

const defaults: Props = { data: demo as WrappedData, fps: 60, music: 'music.mp3', motionBlur: false, vertical: false };

export const Root: React.FC = () => (
  <>
    <Composition
      id="Wrapped"
      component={Wrapped}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={18 * 60}
      defaultProps={defaults}
      calculateMetadata={({ props }) => {
        const fps = props.fps ?? 60;
        const vertical = Boolean(props.vertical);
        return { fps, durationInFrames: Math.round(18 * fps), width: vertical ? 1080 : 1920, height: vertical ? 1920 : 1080 };
      }}
    />
    {/* Tarjeta resumen PNG: 1200×630 por defecto; `size` la cambia (p. ej. 1280×640 para la vista previa del repo) */}
    <Composition
      id="Card"
      component={Card}
      width={1200}
      height={630}
      fps={30}
      durationInFrames={1}
      defaultProps={defaults}
      calculateMetadata={({ props }) => (props.size ? { width: props.size[0], height: props.size[1] } : {})}
    />
  </>
);
