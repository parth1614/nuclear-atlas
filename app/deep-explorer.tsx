'use client';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Layers3,
  MousePointer2,
  Orbit,
  RotateCcw,
  Atom,
  Focus,
  ArrowUpRight,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import ReactorScene from './reactor-scene';
import { resolveDetailPath, canEnter } from './detail-data';
import type { Kind } from './atlas-data';
export default function DeepExplorer({
  kind,
  path,
  onNavigate,
  onExit,
  onReaction,
}: {
  kind: Kind;
  path: string[];
  onNavigate: (path: string[]) => void;
  onExit: () => void;
  onReaction: () => void;
}) {
  const chain = resolveDetailPath(kind, path),
    node = chain.at(-1)!;
  const [separation, setSeparation] = useState(25),
    [selected, setSelected] = useState<string | null>(null),
    [isolated, setIsolated] = useState(false),
    [pull, setPull] = useState(true),
    [labels, setLabels] = useState(false),
    [reset, setReset] = useState(0);
  if (!node)
    return (
      <section className="workbench">
        <button onClick={onExit}>Back to reactor</button>
      </section>
    );
  const parts = node.children.length ? node.children : [node];
  const chosen = parts.find((p) => p.id === selected) ?? node;
  const selectedChild = node.children.find((p) => p.id === selected);
  const canGo = selectedChild && canEnter(selectedChild);
  const dive = (id: string) => {
    const child = node.children.find((p) => p.id === id);
    if (child && canEnter(child)) onNavigate([...path, id]);
  };
  const resetParts = () => {
    setSeparation(0);
    setReset((v) => v + 1);
    setIsolated(false);
    setSelected(null);
  };
  const source =
    [...chain].reverse().find((n) => n.source)?.source ??
    (kind === 'fission'
      ? 'https://www.nrc.gov/reading-rm/basic-ref/students/science-101/what-is-an-nuclear-fuel'
      : 'https://www.iter.org/components');
  return (
    <section
      className="workbench deep-workbench"
      aria-label={`Inside ${node.name}`}
    >
      <nav className="depth-breadcrumb" aria-label="Dissection path">
        <ol>
          <li>
            <button onClick={onExit}>
              <ArrowLeft size={14} />
              Reactor
            </button>
          </li>
          {chain.map((n, i) => (
            <li key={i}>
              <ChevronRight size={12} />
              <button
                aria-current={i === chain.length - 1 ? 'page' : undefined}
                onClick={() => onNavigate(path.slice(0, i + 1))}
              >
                {n.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="deep-heading">
        <p className="eyebrow">
          LAYER {chain.length} / {node.scale}
        </p>
        <h1>Inside {node.name.toLowerCase()}.</h1>
        <p>
          {node.children.length
            ? 'Pull a part out to open its next layer.'
            : 'You’ve reached the innermost modeled layer.'}
        </p>
      </div>
      <div className="deep-tools">
        <Tabs
          value={pull ? 'pull' : 'orbit'}
          onValueChange={(v) => setPull(v === 'pull')}
        >
          <TabsList aria-label="Drag behavior">
            <TabsTrigger value="pull">
              <MousePointer2 />
              Pull apart
            </TabsTrigger>
            <TabsTrigger value="orbit">
              <Orbit />
              Orbit
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <label htmlFor="deep-labels">
          <Switch
            id="deep-labels"
            checked={labels}
            onCheckedChange={setLabels}
          />
          Labels
        </label>
        <button
          className="icon-button"
          aria-label="Reset all pulled parts"
          onClick={resetParts}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <ReactorScene
        kind={kind}
        detailNode={node}
        explode={separation}
        selected={selected}
        isolated={isolated}
        labels={labels}
        reset={reset}
        dragToOpen={pull}
        onSelect={setSelected}
        onDive={dive}
        enterable={node.children.filter(canEnter).map((n) => n.id)}
      />
      <aside className="deep-parts glass">
        <div className="panel-heading">
          <Layers3 size={16} />
          <strong>
            {node.children.length ? 'Nested components' : 'At the core'}
          </strong>
        </div>
        <div className="deep-part-list">
          {parts.map((p) => (
            <div key={p.id} className={selected === p.id ? 'active' : ''}>
              <button
                className="deep-part-select"
                aria-pressed={selected === p.id}
                onClick={() => setSelected(p.id)}
              >
                <span className="part-dot" style={{ background: p.color }} />
                <span>
                  {p.name}
                  <small>
                    {p.children.length
                      ? `${p.children.length} inner components`
                      : p.reaction
                        ? 'Nuclear close-up'
                        : 'Last modeled layer'}
                  </small>
                </span>
              </button>
              {node.children.length > 0 && canEnter(p) && (
                <button
                  className="deep-enter"
                  onClick={() => dive(p.id)}
                  aria-label={`Explore inside ${p.name}`}
                  title={`Explore inside ${p.name}`}
                >
                  <ChevronRight size={19} />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="deep-list-hint">
          {node.children.length
            ? 'You can also select a part, then choose “Explore inside.”'
            : 'Change levels using the path above.'}
        </p>
      </aside>
      <aside className="deep-reading glass" aria-live="polite">
        <p className="eyebrow">{chosen.scale}</p>
        <h2>{chosen.name}</h2>
        <p>{chosen.description}</p>
        {canGo && (
          <button
            className="primary-button"
            onClick={() => dive(selectedChild.id)}
          >
            <Layers3 size={16} />
            Explore inside
            <ArrowRight size={16} />
          </button>
        )}
        {node.reaction && (
          <button className="primary-button" onClick={onReaction}>
            <Atom size={16} />
            See the {kind} reaction
            <ArrowRight size={16} />
          </button>
        )}
        {selected && (
          <button
            className={`outline-button ${isolated ? 'active' : ''}`}
            onClick={() => setIsolated((v) => !v)}
          >
            <Focus size={15} />
            {isolated ? 'Show surrounding pieces' : 'Isolate this piece'}
          </button>
        )}
        <a
          className="source-link"
          href={source}
          target="_blank"
          rel="noreferrer"
        >
          Science reference
          <ArrowUpRight size={13} />
        </a>
      </aside>
      <div className="transport deep-transport glass">
        <div className="transport-top">
          <div>
            <span className="eyebrow">DISSECT THIS LAYER</span>
            <h2>
              {node.children.length
                ? 'Reveal what’s inside.'
                : 'Inspect the core.'}
            </h2>
          </div>
          <span className="percent-value">
            {Math.round(separation)}
            <small>%</small>
          </span>
        </div>
        <Slider
          aria-label="Separate nested components"
          value={[separation]}
          onValueChange={(v) =>
            setSeparation(Array.isArray(v) ? v[0] : (v as number))
          }
        />
        <div className="range-labels">
          <span>Assembled</span>
          <span>Separated</span>
        </div>
      </div>
      <div className="deep-footnote">
        <span>
          {pull
            ? 'Pull a piece · Drag empty space to orbit'
            : 'Drag to orbit · Scroll to zoom'}
        </span>
        <span>Scale changes between levels · Illustrative geometry</span>
      </div>
    </section>
  );
}
