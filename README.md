# Nuclear Atlas

A 3D educational explorer for nuclear fission and fusion, inspired by the interaction pattern of [Human Atlas](https://github.com/ashemag/human-atlas).

- Assemble and dissect eight independently selectable systems in each machine.
- Use one continuous, reversible slider through a fixed itinerary: whole-machine separation (0–15%), all eight systems and their smaller components in order (15–75%), then atoms and particles (75–100%). Fission has 60 stops and fusion has 67. Component shortcuts jump within this tour instead of replacing it.
- Drill into every system: pull a component to open its internals, or use the labeled buttons. Breadcrumbs provide reversible navigation. Fission reaches fuel pellets, a schematic crystal, a uranium atom, and its nucleus; fusion reaches fuel ions and nuclei, plus magnet windings, cables, strands, and filaments. Nuclei separate into their complete proton and neutron populations; representative nucleons reveal schematic valence quarks and gluon fields. Quarks stay together in this view; this is not a reactor reaction or a model of free quarks.
- Inspect, hide, isolate, or label components. Orbit with mouse, touch, or keyboard.
- Follow five stages from a nuclear reaction to a power cycle with play/pause, seeking, replay, and speed controls.
- Compare fission and deuterium–tritium fusion on a shared reaction timeline.
- Responsive layout, source notes, and a graceful WebGL-unavailable message.

The fission machine is a simplified pressurized water reactor. The fusion machine is a simplified tokamak linked to a **conceptual** steam power cycle. ITER itself will not generate electricity. All geometry, field lines, particle positions, and timing are illustrative. This is not an engineering, reactor-kinetics, or plasma simulation.

## Development

Node 22.13+; use the committed npm lockfile.

```
npm ci
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

The Three.js models are procedural; no external model downloads or API keys are required. Scientific references are linked in the app and listed in `app/atlas-data.ts`. Sources are the U.S. Department of Energy, NRC, and ITER. Original Human Atlas code and anatomy assets were not reused.

## Validation

The model checks cover finite geometry and particle transforms, component coverage, flow paths, timeline boundaries, assembly endpoints, and reaction accounting. Nested-dissection checks cover path resolution, all eight systems before the atomic phase, continuous forward/reverse sampling at every stop, component jumps, isotope nucleon counts, valence content, drag thresholds, and finite geometry at every layer. Type checking and the production build are separate checks.

Browser validation covered the ordered stops for every system in both reactors, machine separation before component entry, uninterrupted dragging into quark views, reverse dragging, next/back across a system boundary, and 1280 × 900 and 390 × 844 viewports. Earlier validation also covered direct part pulling and reaction playback. Screenshots were inspected at desktop and phone widths. WebMCP valid calls were checked against visible page state; invalid component input was rejected without mutating state.

## Optional WebMCP

`get_nuclear_atlas_state` reads the current state. `explore_nuclear_atlas` selects a process, optionally jumps to a component, and sets the full-tour dissection position (0 = whole reactor, 15–75 = all systems in order, 75–100 = particles). An explicit separation value takes precedence over the component’s starting position. Invalid input is rejected before changing state. The tools perform only in-page actions and require no external service.
