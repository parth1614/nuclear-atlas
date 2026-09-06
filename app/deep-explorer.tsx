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
  separation,
  overview = false,
  phase,
}: {
  overview?: boolean;
  phase: 'machine' | 'components' | 'particles';
  separation: number;
  kind: Kind;
  path: string[];
  onNavigate: (path: string[]) => void;
  onExit: () => void;
  onReaction: () => void;
}) {
  const chain = resolveDetailPath(kind, path),
    node = chain.at(-1)!;
  const [selected, setSelected] = useState<string | null>(null),
    [isolated, setIsolated] = useState(false),
    [pull, setPull] = useState(node?.scale !== 'SUBNUCLEAR SCALE'),
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
        <h1>
          {node.shape === 'proton'
            ? 'Inside a proton.'
            : node.shape === 'neutron'
              ? 'Inside a neutron.'
              : `Inside ${node.name.toLowerCase()}.`}
        </h1>
        <p>
          {phase === 'components'
            ? 'Keep dragging to open every component in order. The atomic close-up comes after all eight systems.'
            : node.scale === 'SUBNUCLEAR SCALE'
              ? 'Valence quarks and the strong interaction · A schematic view inside one nucleon.'
              : 'Keep dragging inward, from matter to its smaller constituents.'}
        </p>
      </div>
      <div className="deep-tools">
        <Tabs
          value={pull ? 'pull' : 'orbit'}
          onValueChange={(v) => setPull(v === 'pull')}
        >
          <TabsList aria-label="Drag behavior">
            <TabsTrigger
              value="pull"
              disabled={node.scale === 'SUBNUCLEAR SCALE'}
            >
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
        overview={overview}
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
            {node.children.length ? 'Nested components' : 'Component close-up'}
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
                    {['uranium', 'deuterium', 'tritium'].includes(node.shape) &&
                    ['proton', 'neutron'].includes(p.id)
                      ? `${node.shape === 'uranium' ? (p.id === 'proton' ? 92 : 143) : p.id === 'proton' ? 1 : node.shape === 'tritium' ? 2 : 1} in this nucleus · inspect one`
                      : p.children.length
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
            ? 'Select a piece to inspect it, or keep dragging through the full tour.'
            : 'Keep dragging to continue to the next component.'}
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
        {(node.reaction || node.scale === 'SUBNUCLEAR SCALE') && (
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
