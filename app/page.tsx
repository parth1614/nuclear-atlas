'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import {
  Atom,
  ArrowUpRight,
  Layers3,
  RotateCcw,
  MoveUpRight,
  Play,
  Pause,
  Focus,
  Info,
  ArrowRight,
  Box,
  Scan,
  Activity,
  Orbit,
  ChevronRight,
  Check,
  Scale,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ReactorScene from './reactor-scene';
import {
  PARTS,
  STAGES,
  SOURCES,
  stageIndex,
  assemblySeparation,
  type Kind,
  type Mode,
  type View,
} from './atlas-data';
const numberValue = (v: number | readonly number[]) =>
  Array.isArray(v) ? v[0] : (v as number);
export default function Home() {
  const [kind, setKind] = useState<Kind>('fission'),
    [compare, setCompare] = useState(false),
    [mode, setMode] = useState<Mode>('dissect'),
    [view, setView] = useState<View>('machine');
  const [explode, setExplode] = useState(18),
    [assembly, setAssembly] = useState(0),
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [follow, setFollow] = useState(true);
  const [selected, setSelected] = useState<string | null>(null),
    [hidden, setHidden] = useState<string[]>([]),
    [isolated, setIsolated] = useState(false),
    [labels, setLabels] = useState(false),
    [rotation, setRotation] = useState(false),
    [cameraView, setCameraView] = useState<'perspective' | 'front' | 'top'>(
      'perspective',
    ),
    [reset, setReset] = useState(0),
    [info, setInfo] = useState(false),
    [mobileParts, setMobileParts] = useState(false);
  const stage = STAGES[kind][stageIndex(progress)];
  const part = PARTS[kind].find((p) => p.id === selected);
  const operating = mode === 'operate';
  const reactionOnly = compare || (view === 'nucleus' && !follow);
  const maxProgress = reactionOnly ? 20 : 100;
  const runtime = useRef({
    kind,
    mode,
    view,
    compare,
    explode,
    assembly,
    progress,
    selected,
    hidden,
    isolated,
  });
  useLayoutEffect(() => {
    runtime.current = {
      kind,
      mode,
      view,
      compare,
      explode,
      assembly,
      progress,
      selected,
      hidden,
      isolated,
    };
  }, [
    kind,
    mode,
    view,
    compare,
    explode,
    assembly,
    progress,
    selected,
    hidden,
    isolated,
  ]);
  const stop = () => setPlaying(false);
  const changeKind = useCallback((next: string) => {
    setPlaying(false);
    setSelected(null);
    setHidden([]);
    setIsolated(false);
    setMobileParts(false);
    setProgress(0);
    setReset((v) => v + 1);
    if (next === 'compare') {
      setCompare(true);
      setView('nucleus');
      setMode('operate');
      setFollow(false);
    } else {
      setKind(next as Kind);
      setCompare(false);
      setView('machine');
      setMode('dissect');
      setExplode(18);
      setFollow(true);
    }
  }, []);
  const changeMode = (next: Mode) => {
    setMode(next);
    setPlaying(false);
    setSelected(null);
    setIsolated(false);
    setHidden([]);
    if (next === 'assemble') {
      setView('machine');
      setAssembly(0);
    }
    if (next === 'dissect') {
      setView('machine');
      setExplode(45);
    }
    if (next === 'operate') {
      setProgress(0);
      setView('nucleus');
      setFollow(true);
    }
  };
  const selectPart = (id: string) => {
    setPlaying(false);
    setFollow(false);
    setSelected(id);
    setHidden((h) => h.filter((x) => x !== id));
    setMobileParts(false);
  };
  const changeView = (next: View) => {
    setView(next);
    setPlaying(false);
    setProgress(0);
    setFollow(false);
    setIsolated(false);
    if (next === 'nucleus') setMode('operate');
  };
  const seek = (p: number) => {
    setProgress(p);
    setPlaying(false);
    if (follow && !compare) {
      const s = STAGES[kind][stageIndex(p)];
      setView(s.view);
      setSelected(s.view === 'machine' ? s.part : null);
    }
  };
  const playJourney = () => {
    setCompare(false);
    setMode('operate');
    setView('nucleus');
    setFollow(true);
    setProgress(0);
    setSelected(null);
    setHidden([]);
    setIsolated(false);
    setPlaying(true);
  };
  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (mode === 'assemble') {
      if (assembly >= 100) setAssembly(0);
    } else if (progress >= maxProgress) {
      setProgress(0);
      if (follow && !compare) setView('nucleus');
    }
    setPlaying(true);
  };
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        delta = Math.min(now - last, 150);
      last = now;
      if (document.hidden) return;
      const state = runtime.current;
      if (mode === 'assemble') {
        const next = Math.min(100, state.assembly + (delta / 80) * speed);
        setAssembly(next);
        if (next >= 100) setPlaying(false);
      } else {
        const next = Math.min(
          maxProgress,
          state.progress + (delta / 250) * speed,
        );
        setProgress(next);
        if (next >= maxProgress) setPlaying(false);
        if (follow && !compare) {
          const nextStage = STAGES[state.kind][stageIndex(next)];
          setView(nextStage.view);
          setSelected(nextStage.view === 'machine' ? nextStage.part : null);
        }
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [playing, mode, maxProgress, speed, follow, compare]);
  useEffect(() => {
    type Tool = {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const doc = document as Document & {
      modelContext?: {
        registerTool: (
          tool: Tool,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    };
    const ctx = doc.modelContext;
    if (!ctx?.registerTool) return;
    const life = new AbortController();
    const tools: Tool[] = [
      {
        name: 'get_nuclear_atlas_state',
        title: 'Read Nuclear Atlas',
        description:
          'Read the current nuclear process, view, selected component, and animation position.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => runtime.current,
      },
      {
        name: 'explore_nuclear_atlas',
        title: 'Explore a nuclear process',
        description:
          'Select fission or fusion, inspect a component, and set the dissection amount. Updates the visible model and pauses playback.',
        inputSchema: {
          type: 'object',
          properties: {
            process: { enum: ['fission', 'fusion'] },
            component: { type: 'string' },
            separation: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['process'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          if (!input || typeof input !== 'object' || Array.isArray(input))
            throw new Error('Expected an object.');
          const d = input as Record<string, unknown>;
          if (
            Object.keys(d).some(
              (k) => !['process', 'component', 'separation'].includes(k),
            )
          )
            throw new Error('Unknown property.');
          if (d.process !== 'fission' && d.process !== 'fusion')
            throw new Error('Choose fission or fusion.');
          const k = d.process;
          if (
            d.component !== undefined &&
            (typeof d.component !== 'string' ||
              !PARTS[k].some((p) => p.id === d.component))
          )
            throw new Error('Unknown component for this process.');
          if (
            d.separation !== undefined &&
            (typeof d.separation !== 'number' ||
              !Number.isFinite(d.separation) ||
              d.separation < 0 ||
              d.separation > 100)
          )
            throw new Error('Separation must be between 0 and 100.');
          flushSync(() => {
            changeKind(k);
            setMode('dissect');
            setView('machine');
            setExplode(typeof d.separation === 'number' ? d.separation : 18);
            setSelected(typeof d.component === 'string' ? d.component : null);
          });
          return runtime.current;
        },
      },
    ];
    tools.forEach((tool) => {
      try {
        void Promise.resolve(
          ctx.registerTool(tool, { signal: life.signal }),
        ).catch(() => {});
      } catch {
        /* The explorer remains usable without experimental browser support. */
      }
    });
    return () => life.abort();
  }, [changeKind]);
  const resetAll = () => {
    setPlaying(false);
    setSelected(null);
    setHidden([]);
    setIsolated(false);
    setLabels(false);
    setRotation(false);
    setCameraView('perspective');
    setReset((v) => v + 1);
    setProgress(0);
    setAssembly(0);
    setExplode(0);
    if (operating && follow && !compare) setView('nucleus');
  };
  const separation = assemblySeparation(mode, assembly, explode);
  const sceneProps = {
    explode: separation,
    view,
    progress,
    playing,
    operating,
    selected,
    hidden,
    isolated,
    labels,
    rotation,
    cameraView,
    reset,
    onSelect: selectPart,
  };
  return (
    <main className={`atlas ${kind} ${compare ? 'comparison' : ''}`}>
      <header className="masthead">
        <Link className="brand" href="/" aria-label="Nuclear Atlas home">
          <Atom size={29} strokeWidth={1.6} />
          <span>
            Nuclear Atlas
            <span className="brand-tag">INSIDE EVERYTHING / 001</span>
          </span>
        </Link>
        <Tabs
          value={compare ? 'compare' : kind}
          onValueChange={(v) => changeKind(String(v))}
        >
          <TabsList className="reactor-tabs" aria-label="Nuclear process">
            <TabsTrigger value="fission">
              01 <span>Fission</span>
            </TabsTrigger>
            <TabsTrigger value="fusion">
              02 <span>Fusion</span>
            </TabsTrigger>
            <TabsTrigger value="compare">
              <Scale size={15} />
              <span>Compare</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <button className="about-button" onClick={() => setInfo(true)}>
          <Info size={17} />
          <span>About the atlas</span>
        </button>
      </header>
      <section
        className={`workbench ${view === 'nucleus' ? 'nucleus-view' : ''}`}
        aria-label="Interactive nuclear explorer"
      >
        <div className="scene-head">
          <p className="eyebrow">
            {compare
              ? 'TWO REACTIONS. ONE CLOSER LOOK.'
              : kind === 'fission'
                ? '01 / SPLITTING THE ATOM'
                : '02 / BRINGING NUCLEI TOGETHER'}
          </p>
          <h1>
            {compare
              ? 'A different kind of energy.'
              : kind === 'fission'
                ? 'From nucleus\nto electricity.'
                : 'Fusion, layer\nby layer.'}
          </h1>
          <p>
            {compare
              ? 'Scrub through both reactions together.'
              : 'Take it apart. See what makes it work.'}
          </p>
        </div>
        {!compare && (
          <>
            <div className="scene-caption">
              <span className="live-dot" />
              {kind === 'fission'
                ? 'PRESSURIZED WATER REACTOR'
                : 'TOKAMAK · CONCEPTUAL POWER PLANT'}
            </div>
            <Tabs
              className="mode-selector"
              value={mode}
              onValueChange={(v) => changeMode(v as Mode)}
            >
              <TabsList aria-label="Exploration mode">
                <TabsTrigger value="assemble">
                  <Box />
                  Assemble
                </TabsTrigger>
                <TabsTrigger value="dissect">
                  <Scan />
                  Dissect
                </TabsTrigger>
                <TabsTrigger value="operate">
                  <Activity />
                  Operate
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <button
              className="mobile-parts-button"
              onClick={() => setMobileParts((v) => !v)}
            >
              <Layers3 size={15} />
              {mobileParts ? 'Close components' : 'Components'}
            </button>
          </>
        )}
        {compare ? (
          <div className="comparison-scenes">
            {(['fission', 'fusion'] as Kind[]).map((k) => (
              <section className={`comparison-cell ${k}`} key={k}>
                <div className="comparison-label">
                  <span className="eyebrow">
                    {k === 'fission' ? '01 / FISSION' : '02 / FUSION'}
                  </span>
                  <h2>
                    {k === 'fission'
                      ? 'One heavy nucleus splits.'
                      : 'Two light nuclei combine.'}
                  </h2>
                </div>
                <ReactorScene
                  kind={k}
                  view="nucleus"
                  explode={0}
                  progress={progress}
                  playing={playing}
                  operating
                  compact
                  reset={reset}
                />
                <div className="equation">
                  {k === 'fission'
                    ? '²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n'
                    : '²H + ³H → ⁴He + n'}
                  <span>+ energy</span>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <ReactorScene kind={kind} {...sceneProps} />
        )}
        {!compare && view === 'machine' && (
          <aside
            className={`layers-panel glass ${mobileParts ? 'mobile-open' : ''}`}
            aria-label="Model components"
          >
            <div className="panel-heading">
              <Layers3 size={16} />
              <strong>Inside the machine</strong>
              <span className="count">08</span>
            </div>
            <p className="panel-subtitle">Select a part to look closer.</p>
            <div className="parts-list">
              {PARTS[kind].map((p, i) => (
                <div
                  className={`part-row ${selected === p.id ? 'selected' : ''} ${hidden.includes(p.id) ? 'hidden-part' : ''}`}
                  key={p.id}
                >
                  <button
                    className="part-select"
                    onClick={() => selectPart(p.id)}
                    aria-pressed={selected === p.id}
                  >
                    <span className="part-number">0{i + 1}</span>
                    <span
                      className="part-dot"
                      style={{ background: p.color }}
                    />
                    <span>{p.name}</span>
                  </button>
                  <Switch
                    className="part-switch"
                    aria-label={`Show ${p.name}`}
                    checked={!hidden.includes(p.id)}
                    onCheckedChange={(visible) => {
                      setHidden((h) =>
                        visible ? h.filter((id) => id !== p.id) : [...h, p.id],
                      );
                      if (!visible && selected === p.id) {
                        setSelected(null);
                        setIsolated(false);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="layers-footer">
              <button
                onClick={() => {
                  setHidden([]);
                  setIsolated(false);
                  setSelected(null);
                }}
              >
                Show all
              </button>
              <span>
                {
                  PARTS[kind].filter(
                    (p) =>
                      !hidden.includes(p.id) &&
                      (!isolated || selected === p.id),
                  ).length
                }{' '}
                / 8 visible
              </span>
            </div>
          </aside>
        )}
        {!compare && view === 'nucleus' && (
          <aside className="nucleus-key glass">
            <span className="eyebrow">AT THE NUCLEAR SCALE</span>
            <h2>
              {kind === 'fission'
                ? 'A chain begins here.'
                : 'Light nuclei. New energy.'}
            </h2>
            <p>
              {kind === 'fission'
                ? 'A neutron meets uranium-235. Scrub forward to see the nucleus split and release more neutrons.'
                : 'Deuterium and tritium combine, producing a helium nucleus and a neutron.'}
            </p>
            <div className="particle-key">
              <span>
                <i className="proton" />
                Proton
              </span>
              <span>
                <i className="neutron" />
                Neutron
              </span>
            </div>
            <p className="model-note">
              Positions and timing are illustrative. Nuclei are not solid balls.
            </p>
          </aside>
        )}
        {!compare && (
          <div className="view-tools">
            <Tabs value={view} onValueChange={(v) => changeView(v as View)}>
              <TabsList aria-label="Model scale">
                <TabsTrigger value="machine">
                  <Box />
                  Machine
                </TabsTrigger>
                <TabsTrigger value="nucleus">
                  <Atom />
                  Nucleus
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="camera-buttons">
              <button
                className={`icon-button ${cameraView === 'perspective' ? 'active' : ''}`}
                title="Perspective view"
                aria-label="Perspective view"
                onClick={() => setCameraView('perspective')}
              >
                ¾
              </button>
              <button
                className={`icon-button ${cameraView === 'front' ? 'active' : ''}`}
                title="Front view"
                aria-label="Front view"
                onClick={() => setCameraView('front')}
              >
                F
              </button>
              <button
                className={`icon-button ${cameraView === 'top' ? 'active' : ''}`}
                title="Top view"
                aria-label="Top view"
                onClick={() => setCameraView('top')}
              >
                T
              </button>
              <span className="tool-divider" />
              <button
                className={`icon-button ${rotation ? 'active' : ''}`}
                aria-label="Auto rotate"
                aria-pressed={rotation}
                onClick={() => setRotation((v) => !v)}
              >
                <Orbit size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Reset view and layers"
                onClick={resetAll}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            {view === 'machine' && (
              <label className="label-toggle" htmlFor="show-model-labels">
                <Switch
                  id="show-model-labels"
                  checked={labels}
                  onCheckedChange={setLabels}
                  aria-label="Show model labels"
                />
                Labels
              </label>
            )}
          </div>
        )}
        {!compare && (
          <aside
            className={`inspector glass ${part ? 'has-selection' : ''}`}
            aria-label="Component explanation"
          >
            <div className="inspector-top">
              <span className="eyebrow">
                {part
                  ? 'COMPONENT / ' +
                    String(PARTS[kind].indexOf(part) + 1).padStart(2, '0')
                  : operating
                    ? 'ENERGY JOURNEY'
                    : 'THE BIG PICTURE'}
              </span>
              {part && (
                <button
                  aria-label="Close component details"
                  onClick={() => {
                    setSelected(null);
                    setIsolated(false);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <h2>
              {part
                ? part.name
                : operating
                  ? stage.title
                  : kind === 'fission'
                    ? 'Split. Heat. Spin.'
                    : 'Confine. Fuse. Capture.'}
            </h2>
            <p>
              {part
                ? part.description
                : operating
                  ? stage.description
                  : kind === 'fission'
                    ? 'Start with the core. Follow its heat through two separate water circuits, all the way to the generator.'
                    : 'Explore a tokamak, then follow a conceptual route from fusion heat to electricity.'}
            </p>
            {part ? (
              <>
                <div className="insight">
                  <span>{part.role}</span>
                  <p>{part.fact}</p>
                </div>
                <button
                  className={`outline-button ${isolated ? 'active' : ''}`}
                  onClick={() => setIsolated((v) => !v)}
                >
                  <Focus size={15} />
                  {isolated
                    ? 'Show surrounding parts'
                    : 'Isolate this component'}
                </button>
                <a
                  className="source-link"
                  href={SOURCES[part.source].url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the science <ArrowUpRight size={13} />
                </a>
              </>
            ) : (
              <>
                <div className="energy-chain">
                  <span>Nuclear</span>
                  <ChevronRight />
                  <span>Heat</span>
                  <ChevronRight />
                  <span>Motion</span>
                </div>
                <button className="primary-button" onClick={playJourney}>
                  <Play size={14} fill="currentColor" />
                  Follow the energy
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </aside>
        )}
        {!compare && view === 'nucleus' && (
          <div className="reaction-equation">
            <span className="eyebrow">
              {kind === 'fission'
                ? 'ONE POSSIBLE FISSION CHANNEL'
                : 'DEUTERIUM–TRITIUM FUSION'}
            </span>
            <div>
              {kind === 'fission'
                ? '²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n'
                : '²H + ³H → ⁴He + n'}
              <span> + energy</span>
            </div>
          </div>
        )}
        <div className="orbit-hint">
          <MoveUpRight size={14} />
          <span>Drag to orbit · Pinch or scroll to zoom</span>
        </div>
        <div
          className={`transport glass ${compare ? 'compare-transport' : ''}`}
        >
          {mode === 'dissect' && !compare ? (
            <>
              <div className="transport-top">
                <div>
                  <span className="eyebrow">DISSECT THE MACHINE</span>
                  <h2>One machine. Every layer.</h2>
                </div>
                <span className="percent-value">
                  {Math.round(explode)}
                  <small>%</small>
                </span>
              </div>
              <Slider
                aria-label="Separate components"
                value={[explode]}
                onValueChange={(v) => setExplode(numberValue(v))}
              />
              <div className="range-labels">
                <span>Assembled</span>
                <span>Fully separated</span>
              </div>
            </>
          ) : (
            <>
              <div className="transport-top">
                <button
                  className="play-button"
                  onClick={togglePlayback}
                  aria-label={
                    playing
                      ? 'Pause animation'
                      : mode === 'assemble'
                        ? 'Play assembly'
                        : compare
                          ? 'Play both reactions'
                          : 'Play energy journey'
                  }
                >
                  {playing ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>
                <div className="transport-title">
                  <span className="eyebrow">
                    {mode === 'assemble'
                      ? 'FROM PARTS TO WHOLE'
                      : compare
                        ? 'FISSION / FUSION'
                        : reactionOnly
                          ? 'INSIDE THE REACTION'
                          : `STEP ${stageIndex(progress) + 1} OF 5`}
                  </span>
                  <h2>
                    {mode === 'assemble'
                      ? assembly >= 100
                        ? 'Ready to explore.'
                        : 'Bring it all together.'
                      : compare
                        ? 'Two reactions. Side by side.'
                        : reactionOnly
                          ? kind === 'fission'
                            ? 'Watch one fission event.'
                            : 'Watch nuclei combine.'
                          : stage.title}
                  </h2>
                </div>
                <button
                  className="speed-button"
                  onClick={() =>
                    setSpeed((v) => (v === 1 ? 0.5 : v === 0.5 ? 2 : 1))
                  }
                  aria-label={`Playback speed ${speed} times. Change speed.`}
                >
                  {speed}×
                </button>
                <button
                  className="icon-button"
                  aria-label="Restart animation"
                  onClick={() => {
                    setPlaying(false);
                    setProgress(0);
                    setAssembly(0);
                    if (follow && !compare) setView('nucleus');
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <Slider
                aria-label={
                  mode === 'assemble'
                    ? 'Assembly progress'
                    : 'Reaction and energy timeline'
                }
                value={[mode === 'assemble' ? assembly : progress]}
                max={mode === 'assemble' ? 100 : maxProgress}
                onValueChange={(v) => {
                  if (mode === 'assemble') {
                    setAssembly(numberValue(v));
                    stop();
                  } else seek(numberValue(v));
                }}
              />
              {mode === 'assemble' ? (
                <div className="range-labels">
                  <span>Individual components</span>
                  <span>{Math.round(assembly)}% assembled</span>
                </div>
              ) : reactionOnly ? (
                <div className="range-labels">
                  <span>Before the reaction</span>
                  <span>Products + energy</span>
                </div>
              ) : (
                <div className="journey-stages">
                  {STAGES[kind].map((s, i) => (
                    <button
                      className={
                        stageIndex(progress) === i
                          ? 'current'
                          : progress > i * 20
                            ? 'complete'
                            : ''
                      }
                      onClick={() => {
                        setFollow(true);
                        setProgress(i * 20);
                        setView(s.view);
                        setSelected(s.view === 'machine' ? s.part : null);
                        setPlaying(false);
                      }}
                      key={s.short}
                      aria-current={
                        stageIndex(progress) === i ? 'step' : undefined
                      }
                    >
                      <span>
                        {progress > (i + 1) * 20 ? <Check size={10} /> : i + 1}
                      </span>
                      {s.short}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="scale-note">
          {compare
            ? 'NUCLEAR REACTIONS'
            : view === 'machine'
              ? 'ENGINEERING SCALE'
              : 'NUCLEAR SCALE'}
          <span>Illustrative · Not to scale</span>
        </div>
      </section>
      <footer>
        <span>
          <span className="footer-mark" />
          NUCLEAR ATLAS<span className="footer-separator">/</span>Curiosity, in
          three dimensions.
        </span>
        <button onClick={() => setInfo(true)}>
          Science, sources & model notes <ArrowUpRight size={13} />
        </button>
      </footer>
      <Dialog open={info} onOpenChange={setInfo}>
        <DialogContent className="about-dialog">
          <DialogTitle>Nuclear Atlas</DialogTitle>
          <DialogDescription>
            An interactive introduction to fission, fusion, and the machines
            built around them.
          </DialogDescription>
          <div className="about-content">
            <p>
              Assemble the parts, dissect a machine, or follow its energy
              journey. Select components in the model or the list to learn what
              each one does.
            </p>
            <h3>What this model represents</h3>
            <p>
              The fission view illustrates a pressurized water reactor. The
              fusion view combines a simplified tokamak with a conceptual
              electricity-generation cycle.{' '}
              <strong>ITER itself will not generate electricity.</strong>
            </p>
            <p>
              Shapes, component counts, distances, speeds, field lines, and
              particle trajectories are simplified for explanation. Fission has
              many possible products; the displayed barium–krypton reaction is
              one example. This is an educational animation, not an engineering
              or plasma simulation.
            </p>
            <h3>Explore with your keyboard</h3>
            <p>
              Tab through controls. Use arrow keys on sliders and tabs. Focus
              the 3D canvas and use arrow keys to rotate, or + and − to zoom.
              Playback starts only when you choose it.
            </p>
            <h3>Science & references</h3>
            <div className="source-list">
              {SOURCES.map((s) => (
                <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
                  <span>
                    {s.title}
                    <small>{s.publisher}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </div>
            <p className="credit">
              Interaction inspired by{' '}
              <a
                href="https://github.com/ashemag/human-atlas"
                target="_blank"
                rel="noreferrer"
              >
                Human Atlas by ashemag
              </a>
              . All 3D geometry in this atlas is generated for this project.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
