import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  syntax: string;
  /** Used to build a stable, unique render id. */
  id: string;
  /**
   * Fullscreen gets a bounded, drag-pannable viewport. Diagrams are routinely
   * wider than the modal, and without panning the right-hand nodes are simply
   * unreachable.
   */
  fullscreen?: boolean;
}

// Initialize once per page load, not per component mount.
let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    // The bare 'dark' theme renders very low-contrast against this page's
    // near-black surface — legible in isolation, washed out here. Pin the
    // palette to the site's own tokens so nodes and edges actually read.
    themeVariables: {
      darkMode: true,
      background: '#0f1117',
      primaryColor: '#2b3a55',
      primaryTextColor: '#e8ecf4',
      primaryBorderColor: '#64dfb4',
      secondaryColor: '#33425e',
      tertiaryColor: '#3a4a68',
      lineColor: '#7c8cf8',
      textColor: '#e8ecf4',
      mainBkg: '#2b3a55',
      nodeBorder: '#64dfb4',
      clusterBkg: '#161b26',
      clusterBorder: '#3a445c',
      edgeLabelBackground: '#0f1117',
      fontSize: '15px',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
    },
    // The syntax is LLM-generated, so keep HTML labels off and security strict.
    // 'strict' sanitizes labels and blocks click/script directives.
    securityLevel: 'strict',
    // htmlLabels MUST be false at the top level, not just under `flowchart`.
    // With only the nested flag, mermaid still emits <foreignObject> labels;
    // their inner HTML then inherits this page's CSS, collapses to ~1 character
    // wide, and every node renders empty with only the edges visible.
    // SVG <text> labels are immune to page styles.
    htmlLabels: false,
    flowchart: { useMaxWidth: true, htmlLabels: false, nodeSpacing: 50, rankSpacing: 55, curve: 'basis', padding: 12 },
    sequence: { useMaxWidth: true },
    logLevel: 'error'
  });
  initialized = true;
}

/**
 * Renders Mermaid to an SVG string via mermaid.render().
 *
 * This replaces the old mermaid.run() approach, which re-scanned the whole
 * document on every render — with several diagrams in a chat transcript that
 * meant re-parsing every one of them each time a new message arrived.
 */
/**
 * Mermaid builds a CSS selector from the render id, so the id must be a valid
 * selector fragment. Message ids reach us from several places (some are raw
 * `Math.random().toString()`, i.e. "0.0566…"), and a dot there makes mermaid
 * throw "not a valid selector" instead of rendering. Strip anything unsafe and
 * guarantee a leading letter.
 */
function toSafeRenderId(id: string): string {
  const cleaned = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `mermaid-${cleaned || 'diagram'}-${suffix}`;
}

/**
 * Click-and-drag to scroll the diagram. Pointer capture keeps the gesture alive
 * if the cursor leaves the element mid-drag, and a small movement threshold
 * means a plain click still behaves like a click.
 */
function attachDragPan(wrap: HTMLElement): () => void {
  let dragging = false;
  let startX = 0, startY = 0, scrollX = 0, scrollY = 0;

  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    scrollX = wrap.scrollLeft; scrollY = wrap.scrollTop;
    wrap.setPointerCapture(e.pointerId);
    wrap.style.cursor = 'grabbing';
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    wrap.scrollLeft = scrollX - (e.clientX - startX);
    wrap.scrollTop = scrollY - (e.clientY - startY);
  };
  const up = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try { wrap.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    wrap.style.cursor = 'grab';
  };

  wrap.addEventListener('pointerdown', down);
  wrap.addEventListener('pointermove', move);
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);

  return () => {
    wrap.removeEventListener('pointerdown', down);
    wrap.removeEventListener('pointermove', move);
    wrap.removeEventListener('pointerup', up);
    wrap.removeEventListener('pointercancel', up);
  };
}

export function MermaidDiagram({ syntax, id, fullscreen = false }: MermaidDiagramProps) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const renderId = useRef(toSafeRenderId(id));
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const detachPanRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!syntax || !hostRef.current) return;
    let cancelled = false;

    (async () => {
      ensureInit();
      try {
        // parse() validates without mutating the DOM — cheaper failure path.
        await mermaid.parse(syntax);
        const { svg: rendered } = await mermaid.render(renderId.current, syntax);
        if (cancelled || !hostRef.current) return;

        // Mount into a shadow root. This page's CSS was reaching into the SVG
        // and collapsing mermaid's labels — node text piled into one corner
        // while the edges drew correctly. The same syntax renders fine in a
        // bare page, so isolation is the fix rather than chasing each rule.
        // Mermaid's own <style> lives inside the SVG, so it still applies.
        if (!shadowRef.current) {
          shadowRef.current = hostRef.current.attachShadow({ mode: 'open' });
        }
        shadowRef.current.innerHTML = `
          <style>
            :host { display: block; }
            .wrap {
              overflow: auto;
              padding: 1rem;
              ${fullscreen ? 'height: 78vh; cursor: grab; touch-action: none;' : 'max-height: 100%;'}
            }
            .wrap > * { pointer-events: none; }
            svg { max-width: none !important; height: auto; display: block; margin: 0 auto; }
            svg .node rect, svg .node polygon, svg .node circle, svg .node path { stroke-width: 1.8px; }
          </style>
          <div class="wrap">${rendered}</div>`;

        if (fullscreen) {
          const wrap = shadowRef.current.querySelector<HTMLElement>('.wrap');
          const svgEl = shadowRef.current.querySelector('svg');

          // Mermaid emits width="100%", so the SVG shrinks to whatever box it's
          // given and never overflows — which makes panning meaningless and
          // squeezes big diagrams into unreadable thumbnails. Pin it to the
          // viewBox's natural size so it can overflow and be dragged around.
          if (svgEl) {
            const vb = svgEl.viewBox?.baseVal;
            if (vb && vb.width > 0) {
              svgEl.setAttribute('width', String(vb.width));
              svgEl.setAttribute('height', String(vb.height));
              (svgEl as unknown as HTMLElement).style.width = `${vb.width}px`;
              (svgEl as unknown as HTMLElement).style.height = `${vb.height}px`;
            }
          }

          if (wrap) {
            detachPanRef.current?.();
            detachPanRef.current = attachDragPan(wrap);
          }
        }

        setError(null);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setReady(false);
          setError(err instanceof Error ? err.message : 'Could not render this diagram');
        }
      }
    })();

    return () => {
      cancelled = true;
      detachPanRef.current?.();
      detachPanRef.current = null;
    };
  }, [syntax, fullscreen]);

  if (error) {
    return (
      <div className="diagram-error">
        <p>⚠️ {error}</p>
        <details className="diagram-debug">
          <summary>Show syntax</summary>
          <pre>{syntax}</pre>
        </details>
      </div>
    );
  }

  // The host must stay mounted for the shadow root to attach to, so the
  // loading hint sits alongside it rather than replacing it.
  return (
    <>
      {!ready && <div className="diagram-loading">Rendering diagram…</div>}
      <div className="mermaid-svg" ref={hostRef} />
    </>
  );
}
