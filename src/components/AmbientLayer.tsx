import { useEffect, useRef, useState } from 'react';

interface AmbientLayerProps {
  src: string | null;
}

export function AmbientLayer({ src }: AmbientLayerProps) {
  const [layerA, setLayerA] = useState('');
  const [layerB, setLayerB] = useState('');
  const [activeB, setActiveB] = useState(false);
  const prevSrc = useRef('');

  useEffect(() => {
    if (!src || src === prevSrc.current) return;
    prevSrc.current = src;

    if (!activeB) {
      setLayerB(src);
      setActiveB(true);
    } else {
      setLayerA(src);
      setActiveB(false);
    }
  }, [src]);

  const layerStyle = (url: string, visible: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: '-60px',
    backgroundImage: url ? `url(${url})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(80px) brightness(0.12) saturate(2.5)',
    opacity: visible ? 1 : 0,
    transition: 'opacity 1200ms ease',
    willChange: 'opacity',
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div style={layerStyle(layerA, !activeB)} />
      <div style={layerStyle(layerB, activeB)} />
    </div>
  );
}
