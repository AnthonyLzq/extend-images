import { useEffect, useRef, useState } from 'react';
import { computePlacement } from '../lib/placement';

// How long to wait after the last keystroke before re-rendering the canvas.
const RENDER_DEBOUNCE_MS = 300;

interface Loaded {
  img: HTMLImageElement;
  url: string;
  name: string;
}

interface Padding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export default function ImageExtender() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  // Values the canvas actually renders from, debounced so typing doesn't
  // re-render (or flash errors) on every keystroke.
  const [renderWidth, setRenderWidth] = useState('');
  const [renderHeight, setRenderHeight] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [padding, setPadding] = useState<Padding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLoaded((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { img, url, name: file.name };
      });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
      // Render a new image immediately, without waiting for the debounce.
      setRenderWidth(String(img.naturalWidth));
      setRenderHeight(String(img.naturalHeight));
      setError(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setLoaded(null);
      setError('Could not read this file as an image.');
    };
    img.src = url;
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setRenderWidth(width);
      setRenderHeight(height);
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [width, height]);

  useEffect(() => {
    if (!loaded) {
      setPreview(null);
      setPadding(null);
      return;
    }
    const w = Number(renderWidth);
    const h = Number(renderHeight);
    const place = computePlacement(
      loaded.img.naturalWidth,
      loaded.img.naturalHeight,
      w,
      h,
    );
    if (!place.ok) {
      setPreview(null);
      setPadding(null);
      setError(
        place.reason === 'smaller'
          ? `The final size can't be smaller than the original image (${loaded.img.naturalWidth}\u00d7${loaded.img.naturalHeight}).`
          : 'Enter a valid final size (whole numbers, 1 or greater).',
      );
      return;
    }
    setError(null);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Draw at natural size: the image is never scaled, only offset.
    ctx.drawImage(loaded.img, place.offsetX, place.offsetY);
    setPadding({
      left: place.offsetX,
      right: w - loaded.img.naturalWidth - place.offsetX,
      top: place.offsetY,
      bottom: h - loaded.img.naturalHeight - place.offsetY,
    });
    setPreview(canvas.toDataURL('image/png'));
  }, [loaded, renderWidth, renderHeight]);

  const baseName = loaded ? loaded.name.replace(/\.[^.]+$/, '') : 'image';
  const w = Number(renderWidth);
  const h = Number(renderHeight);

  return (
    <section className="extender" aria-label="Image canvas extender">
      <div className="file-row">
        <button type="button" onClick={() => inputRef.current?.click()}>
          Choose image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handlePick(e.target.files?.[0])}
        />
        <span className="pads">
          {loaded
            ? `${loaded.name} \u2014 ${loaded.img.naturalWidth}\u00d7${loaded.img.naturalHeight}px`
            : 'No image selected yet.'}
        </span>
      </div>

      {loaded && (
        <>
          <div className="fields">
            <label>
              Final width (px)
              <input
                type="number"
                min={1}
                step={1}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </label>
            <label>
              Final height (px)
              <input
                type="number"
                min={1}
                step={1}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {preview && padding && (
            <div className="result">
              <div className="checker">
                <img
                  src={preview}
                  alt={`Preview of ${baseName} centered on a ${w}\u00d7${h} transparent canvas`}
                />
              </div>
              <p className="pads">
                Empty space added \u2014 left {padding.left}px, right{' '}
                {padding.right}px, top {padding.top}px, bottom {padding.bottom}
                px.
              </p>
              <a
                className="buttonish"
                href={preview}
                download={`${baseName}-${w}x${h}.png`}
              >
                Download PNG
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
