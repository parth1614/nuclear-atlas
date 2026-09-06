import type { Kind } from './atlas-data';
export type DetailShape =
  | 'bundle'
  | 'cladding'
  | 'pellets'
  | 'pellet'
  | 'lattice'
  | 'oxygen'
  | 'atom'
  | 'uranium'
  | 'deuterium'
  | 'tritium'
  | 'ions'
  | 'electrons'
  | 'plasma'
  | 'coil'
  | 'cable'
  | 'strands'
  | 'filaments'
  | 'shell'
  | 'plate'
  | 'grid'
  | 'pipes'
  | 'water'
  | 'impeller'
  | 'shaft'
  | 'blades'
  | 'windings'
  | 'blocks'
  | 'blanket'
  | 'divertor'
  | 'absorber'
  | 'spring'
  | 'proton'
  | 'neutron'
  | 'quark'
  | 'gluons';
export type DetailNode = {
  id: string;
  name: string;
  shape: DetailShape;
  description: string;
  scale: string;
  color: string;
  position: [number, number, number];
  offset: [number, number, number];
  children: DetailNode[];
  reaction?: boolean;
  source?: string;
};
const colors = {
  steel: '#a4bac6',
  fuel: '#d97b43',
  ceramic: '#574d45',
  water: '#63accc',
  copper: '#b78758',
  cyan: '#16bac5',
  dark: '#455e71',
};
function n(
  id: string,
  name: string,
  shape: DetailShape,
  description: string,
  children: DetailNode[] = [],
  options: Partial<
    Omit<DetailNode, 'id' | 'name' | 'shape' | 'description' | 'children'>
  > = {},
): DetailNode {
  return {
    id,
    name,
    shape,
    description,
    children,
    scale: 'COMPONENT SCALE',
    color: colors.steel,
    position: [0, 0, 0],
    offset: [2, 0, 0],
    ...options,
  };
}
const particleSource = 'https://www.energy.gov/science/doe-explainsprotons';
function nucleon(id: 'proton' | 'neutron'): DetailNode {
  const flavors =
    id === 'proton' ? ['up', 'up', 'down'] : ['up', 'down', 'down'];
  return n(
    id,
    id === 'proton' ? 'Protons' : 'Neutrons',
    id,
    `Look inside one representative ${id}. Its valence content is ${id === 'proton' ? 'two up quarks and one down quark' : 'one up quark and two down quarks'}. Gluons and a sea of quark–antiquark pairs also contribute. The layout is schematic: quarks remain confined, and reactor reactions do not pull them out.`,
    [
      ...flavors.map((flavor, i) =>
        n(
          `quark-${i + 1}`,
          `${flavor === 'up' ? 'Up' : 'Down'} quark · ${i + 1}`,
          'quark',
          `A ${flavor} valence quark inside this ${id}. Quarks have no known smaller constituents. These spheres and their colors are symbols, not literal sizes, positions, or color charges.`,
          [],
          {
            scale: 'SUBNUCLEAR SCALE',
            color: flavor === 'up' ? '#d77d49' : '#568aab',
            position: [
              [-1, 0.7, 0],
              [1, 0.7, 0],
              [0, -0.9, 0],
            ][i] as [number, number, number],
            offset: [0, 0, 0],
            source: particleSource,
          },
        ),
      ),
      n(
        'gluons',
        'Gluon field & quark sea',
        'gluons',
        'Gluons carry the strong interaction between quarks. Curved lines symbolize the field; this is not a literal set of springs. Sea quarks and antiquarks are not individually counted in this simple valence diagram.',
        [],
        {
          scale: 'SUBNUCLEAR SCALE',
          color: colors.cyan,
          offset: [0, 0, 0],
          source:
            'https://www.energy.gov/science/doe-explainsquarks-and-gluons',
        },
      ),
    ],
    {
      scale: 'SUBNUCLEAR SCALE',
      color: id === 'proton' ? colors.fuel : colors.water,
      offset: [id === 'proton' ? -2.1 : 2.1, 0, 0],
      source: particleSource,
    },
  );
}
const proton = nucleon('proton'),
  neutron = nucleon('neutron');
const uraniumCore = n(
  'nucleus',
  'Uranium-235 nucleus',
  'uranium',
  '92 protons and 143 neutrons form this U-235 nucleus. Separate the two populations, then inspect one representative proton or neutron. This conceptual view is not a fission event; use the reaction player to see fission.',
  [proton, neutron],
  { scale: 'NUCLEAR SCALE', color: colors.fuel, reaction: true },
);
const uraniumAtom = n(
  'uranium-atom',
  'Uranium atom · U-235 example',
  'atom',
  'Zoom from a uranium site in the crystal to its nucleus. Typical reactor fuel contains mostly U-238; U-235 is shown here to explain fission. The electron cloud is schematic, not a set of planetary orbits.',
  [
    uraniumCore,
    n(
      'electron-cloud',
      'Electron cloud',
      'electrons',
      'Electrons occupy quantum states around the nucleus. This diffuse cloud only marks their surrounding region.',
      [],
      { scale: 'ATOMIC SCALE', color: colors.water, offset: [-2, 0, 0] },
    ),
  ],
  { scale: 'ATOMIC SCALE', color: colors.fuel },
);
const crystal = n(
  'crystal',
  'Uranium dioxide crystal',
  'lattice',
  'A fuel pellet is a ceramic made of uranium dioxide (UO₂). Uranium sites form a face-centered cubic structure; oxygen occupies the tetrahedral sites. Corner and face atoms are shared by neighboring unit cells. The displayed cell is an idealized fluorite structure.',
  [
    uraniumAtom,
    n(
      'oxygen-sites',
      'Oxygen sites',
      'oxygen',
      'Oxygen atoms are part of the ceramic fuel structure. They are not the fissile uranium nuclei that sustain the chain reaction.',
      [],
      {
        scale: 'ATOMIC SCALE',
        color: colors.water,
        position: [2.2, 0, 0],
        offset: [1, 0, 0],
      },
    ),
  ],
  {
    scale: 'ATOMIC SCALE',
    color: colors.ceramic,
    source:
      'https://www.sciencedirect.com/science/article/pii/S0022311508002249',
  },
);
const pellets = n(
  'pellets',
  'Ceramic fuel pellets',
  'pellets',
  'Small uranium dioxide cylinders are stacked inside a fuel rod. Pull out the representative pellet to look inside the material.',
  [
    n(
      'pellet',
      'One fuel pellet',
      'pellet',
      'A dense ceramic pellet contains many crystals and vastly more atoms than can be shown. Continue inward to an illustrative uranium dioxide crystal.',
      [crystal],
      { color: colors.ceramic },
    ),
  ],
  { color: colors.ceramic, offset: [-2.2, 0, 0] },
);
const fuelRod = n(
  'fuel-rods',
  'Fuel rods',
  'bundle',
  'Each sealed rod encloses a stack of fuel pellets inside metal cladding. This close-up shows the layers of one representative rod.',
  [
    n(
      'cladding',
      'Metal cladding',
      'cladding',
      'The surrounding metal tube contains the ceramic fuel. Conventional water-reactor fuel commonly uses zirconium-alloy cladding.',
      [],
      { color: colors.steel, offset: [2.2, 0, 0] },
    ),
    pellets,
    n(
      'end-plug',
      'End plug & spring',
      'spring',
      'Sealed end fittings close the rod. A spring above the pellet stack helps hold the pellets in place; the upper space accommodates gas.',
      [],
      { position: [0, 2.6, 0], offset: [0, 1.5, 0] },
    ),
  ],
  {
    color: colors.fuel,
    source:
      'https://www.nrc.gov/reading-rm/basic-ref/students/science-101/what-is-an-nuclear-fuel',
  },
);
const fuel = n(
  'fuel',
  'Fuel assembly',
  'bundle',
  'A structured bundle holds fuel rods in place while water flows around them. Open the rods to continue toward the fuel and its nuclei.',
  [
    fuelRod,
    n(
      'spacer-grids',
      'Spacer grids',
      'grid',
      'Grid structures support the rods and preserve coolant passages between them.',
      [],
      { color: colors.dark, offset: [0, 0, 2] },
    ),
    n(
      'upper-nozzle',
      'Upper end fitting',
      'plate',
      'The upper fitting holds the assembly together and supports handling.',
      [],
      { position: [0, 2.6, 0], offset: [0, 1.5, 0] },
    ),
    n(
      'lower-nozzle',
      'Lower end fitting',
      'plate',
      'The lower fitting supports the assembly and provides coolant-entry passages.',
      [],
      { position: [0, -2.6, 0], offset: [0, -1.5, 0] },
    ),
  ],
);
const tubes = n(
  'tube-bundle',
  'Heat-transfer tubes',
  'pipes',
  'Thin metal tube walls separate two fluids while allowing heat to pass between them.',
  [
    n(
      'tube-wall',
      'Tube wall',
      'cladding',
      'Heat conducts through the metal wall. Fluids on opposite sides stay separated in this schematic.',
      [],
      { offset: [2, 0, 0] },
    ),
    n(
      'inside-fluid',
      'Fluid inside the tube',
      'water',
      'The fluid inside the tube carries heat along the channel.',
      [],
      { color: colors.fuel, offset: [-2, 0, 0] },
    ),
    n(
      'outside-fluid',
      'Surrounding fluid',
      'water',
      'Fluid outside the tube exchanges heat through the wall, without mixing with the inner circuit.',
      [],
      { color: colors.water, position: [0, 0, 1.3], offset: [0, 0, 2] },
    ),
  ],
  { color: colors.copper },
);
const shaft = n(
  'rotor',
  'Rotor assembly',
  'shaft',
  'The rotor turns as a single assembly. Blade rows transfer force to a shared shaft.',
  [
    n(
      'blade-rows',
      'Blade rows',
      'blades',
      'Moving blades extract energy from the expanding steam and apply torque to the shaft.',
      [],
      { color: colors.copper, offset: [0, 1.8, 0] },
    ),
    n(
      'shaft',
      'Drive shaft',
      'shaft',
      'The shaft carries mechanical rotation onward to the generator.',
      [],
      { color: colors.dark, offset: [0, -1.5, 0] },
    ),
  ],
);
const turbine = n(
  'turbine',
  'Steam turbine',
  'blades',
  'Steam flows through stationary and moving blade rows. The expanding steam drives the rotor.',
  [
    n(
      'casing',
      'Turbine casing',
      'shell',
      'The casing encloses and guides the steam path.',
      [],
      { offset: [0, 2.5, 0] },
    ),
    shaft,
    n(
      'stator-blades',
      'Stationary blade rows',
      'blades',
      'Fixed blades guide the steam onto the moving blades.',
      [],
      { color: colors.dark, position: [0, 0, -0.7], offset: [0, 0, -2] },
    ),
  ],
);
const generator = n(
  'generator',
  'Electrical generator',
  'windings',
  'A rotating magnetic field interacts with stationary windings to generate electricity. This is a generic teaching model.',
  [
    n(
      'housing',
      'Generator housing',
      'shell',
      'The housing supports and protects the rotating and stationary systems.',
      [],
      { offset: [0, 2.5, 0] },
    ),
    n(
      'rotor',
      'Magnetic rotor',
      'shaft',
      'The turbine turns the magnetic rotor.',
      [],
      { color: colors.dark, offset: [-2, 0, 0] },
    ),
    n(
      'stator',
      'Stator & windings',
      'windings',
      'Stationary copper windings surround the rotor. A changing magnetic field induces voltage in them.',
      [
        n(
          'copper-winding',
          'Copper winding',
          'coil',
          'An insulated conductor is wound into repeated turns.',
          [
            n(
              'conductor',
              'Conductor',
              'cable',
              'The copper conductor carries electrical current.',
              [],
              { color: colors.copper },
            ),
            n(
              'insulation',
              'Electrical insulation',
              'cladding',
              'Insulation separates adjacent conductors and the grounded core.',
              [],
              { color: colors.steel, offset: [2, 0, 0] },
            ),
          ],
          { color: colors.copper },
        ),
        n(
          'iron-core',
          'Laminated core',
          'blocks',
          'Thin magnetic-steel laminations guide magnetic flux and help limit eddy-current losses.',
          [],
          { color: colors.dark, position: [0, 0, -1.4], offset: [0, 0, -2] },
        ),
      ],
      { color: colors.copper, offset: [2.5, 0, 0] },
    ),
  ],
);
const steam = n(
  'steam',
  'Heat exchanger',
  'pipes',
  'Open the housing to reveal the tube bundle and the two separate sides of the heat-transfer surface.',
  [
    n(
      'shell',
      'Outer shell',
      'shell',
      'The shell encloses one side of the heat exchanger.',
      [],
      { offset: [2.5, 0, 0] },
    ),
    tubes,
    n(
      'tube-sheet',
      'Tube sheet',
      'plate',
      'A structural plate supports the tube ends and separates the fluid regions.',
      [],
      { position: [0, -2.5, 0], offset: [0, -1.5, 0] },
    ),
  ],
);
const condenser = n(
  'condenser',
  'Condenser & return',
  'pipes',
  'Cooling-water tubes remove heat from exhaust steam. The steam condenses and returns to the power cycle.',
  [
    tubes,
    n(
      'water-box',
      'Water chamber',
      'shell',
      'A chamber distributes cooling water through the tube bundle.',
      [],
      { position: [0, 2.8, 0], offset: [0, 1, 0] },
    ),
    n(
      'return-pump',
      'Return pump',
      'impeller',
      'A pump sends the condensed water back toward the heat exchanger.',
      [
        n(
          'impeller',
          'Pump impeller',
          'impeller',
          'A rotating impeller transfers mechanical energy to the water.',
          [],
          { color: colors.copper },
        ),
        n(
          'pump-casing',
          'Pump casing',
          'shell',
          'The surrounding casing guides the flow.',
          [],
          { offset: [2.2, 0, 0] },
        ),
      ],
      { position: [2.5, -1, 0], offset: [1.5, 0, 0] },
    ),
  ],
);
const primary = n(
  'primary',
  'Primary cooling circuit',
  'pipes',
  'Follow the machinery that moves pressurized water through the reactor and the steam generator.',
  [
    n(
      'pipe-wall',
      'Pipe wall',
      'cladding',
      'The pressure boundary encloses circulating water.',
      [],
      { offset: [2, 0, 0] },
    ),
    n(
      'coolant',
      'Coolant channel',
      'water',
      'Primary water collects heat from fuel and transfers it to the steam generator.',
      [],
      { color: colors.water, offset: [-2, 0, 0] },
    ),
    n(
      'pump',
      'Coolant pump',
      'impeller',
      'The pump circulates water through the primary loop.',
      [
        n(
          'impeller',
          'Impeller',
          'impeller',
          'Rotating blades transfer energy to the water.',
          [],
          { color: colors.copper },
        ),
        n(
          'motor-shaft',
          'Motor shaft',
          'shaft',
          'The motor drives the pump shaft.',
          [],
          { color: colors.dark, offset: [0, 2, 0] },
        ),
      ],
      { position: [0, -2.6, 0], offset: [0, -1, 0] },
    ),
  ],
);
const rods = n(
  'rods',
  'Control rod system',
  'bundle',
  'Neutron absorbers inside metal rods regulate the chain reaction. This represents the function, not a specific absorber formulation.',
  [
    n(
      'rod-sheath',
      'Rod sheath',
      'cladding',
      'A surrounding metal sheath encloses the absorber.',
      [],
      { offset: [2, 0, 0] },
    ),
    n(
      'absorber',
      'Neutron absorber',
      'absorber',
      'Absorber material captures neutrons, reducing those available for further fission.',
      [],
      { color: colors.dark, offset: [-2, 0, 0] },
    ),
    n(
      'drive',
      'Drive mechanism',
      'shaft',
      'A drive moves the rods into or out of the core.',
      [],
      { position: [0, 2.7, 0], offset: [0, 1, 0] },
    ),
  ],
);
const vessel = n(
  'vessel',
  'Reactor vessel',
  'shell',
  'A steel pressure vessel surrounds the core and internal support structures.',
  [
    n(
      'steel-wall',
      'Steel pressure wall',
      'shell',
      'The thick steel wall contains pressurized water.',
      [],
      { offset: [2.5, 0, 0] },
    ),
    n(
      'internal-support',
      'Internal support',
      'grid',
      'Internal structures locate the fuel and guide coolant through the core.',
      [],
      { color: colors.dark, offset: [0, -2, 0] },
    ),
    fuel,
  ],
);
const deuterium = n(
  'deuterium',
  'Deuterium nucleus',
  'deuterium',
  'One proton and one neutron form a deuterium nucleus. In a fully ionized fusion plasma it is not surrounded by a bound electron. Separate the nucleons to inspect their internal structure.',
  [proton, neutron],
  {
    scale: 'NUCLEAR SCALE',
    color: colors.cyan,
    position: [-1.5, 0, 0],
    offset: [-1.5, 0, 0],
    reaction: true,
  },
);
const tritium = n(
  'tritium',
  'Tritium nucleus',
  'tritium',
  'One proton and two neutrons form a tritium nucleus. Separate its nucleons, or open the reaction player to see fusion with deuterium.',
  [proton, neutron],
  {
    scale: 'NUCLEAR SCALE',
    color: colors.fuel,
    position: [1.5, 0, 0],
    offset: [1.5, 0, 0],
    reaction: true,
  },
);
const ions = n(
  'fuel-ions',
  'Fuel nuclei',
  'ions',
  'Zoom to a representative deuterium–tritium pair. These are nuclei in a plasma, not neutral atoms with attached electrons.',
  [deuterium, tritium],
  { scale: 'NUCLEAR SCALE', color: colors.cyan, reaction: true },
);
const plasma = n(
  'plasma',
  'Fusion plasma',
  'plasma',
  'The plasma contains free electrons and fuel nuclei. This is a conceptual separation of particle populations, not solid layers that can be peeled off.',
  [
    ions,
    n(
      'free-electrons',
      'Free electrons',
      'electrons',
      'Electrons are separate charged particles throughout the plasma. Their motion also responds to electromagnetic fields.',
      [],
      { scale: 'PARTICLE SCALE', color: colors.water, offset: [0, 2, 0] },
    ),
  ],
  { color: colors.cyan },
);
const cable = n(
  'cable',
  'Superconducting cable',
  'cable',
  'An ITER-style cable-in-conduit conductor combines superconducting and copper strands inside a jacket with helium cooling.',
  [
    n(
      'strands',
      'Strand bundle',
      'strands',
      'Many fine strands form the cable. High-field ITER magnets use niobium-tin superconducting strands together with copper.',
      [
        n(
          'filaments',
          'Superconducting filaments',
          'filaments',
          'A strand contains fine superconducting regions within a stabilizing matrix. The magnification here illustrates the hierarchy, not a fabrication specification.',
          [],
          { scale: 'MATERIAL SCALE', color: colors.copper },
        ),
        n(
          'copper-matrix',
          'Copper matrix',
          'cladding',
          'Copper surrounds and stabilizes the superconducting regions.',
          [],
          { color: colors.copper, offset: [2.2, 0, 0] },
        ),
      ],
      { color: colors.copper, offset: [-1.5, 0, 0] },
    ),
    n(
      'steel-jacket',
      'Steel jacket',
      'cladding',
      'The surrounding jacket supports the cable and contains the cooling flow.',
      [],
      { offset: [2, 0, 0] },
    ),
    n(
      'helium-channel',
      'Helium cooling channel',
      'water',
      'Helium removes heat so the conductor can remain at superconducting temperatures.',
      [],
      { color: colors.water, offset: [0, 0, 2] },
    ),
  ],
  {
    source:
      'https://www.iter.org/mag/5/superconductivity-it-gets-current-flowing',
    color: colors.copper,
  },
);
const coils = n(
  'coils',
  'Magnetic field coil',
  'coil',
  'Pull apart a simplified superconducting magnet to follow its construction from the coil case down to its conductor.',
  [
    n(
      'coil-case',
      'Structural case',
      'shell',
      'A strong surrounding case supports electromagnetic loads.',
      [],
      { offset: [2.5, 0, 0] },
    ),
    n(
      'winding-pack',
      'Winding pack',
      'coil',
      'Repeated turns of conductor form a winding pack. Open it to inspect a representative cable.',
      [
        cable,
        n(
          'turn-insulation',
          'Turn insulation',
          'cladding',
          'Electrical insulation separates the conductor turns.',
          [],
          { color: colors.steel, offset: [2.3, 0, 0] },
        ),
      ],
      { color: colors.copper, offset: [-1.5, 0, 0] },
    ),
  ],
  { source: 'https://www.iter.org/machine/magnets' },
);
const blanket = n(
  'blanket',
  'Blanket & shielding',
  'blanket',
  'A conceptual future power-plant blanket absorbs neutron energy. Materials and arrangements vary by design; this is not the ITER blanket design.',
  [
    n(
      'first-wall',
      'Plasma-facing wall',
      'plate',
      'The first wall faces the plasma and transfers absorbed heat to cooling systems.',
      [],
      { color: colors.dark, position: [0, 0, 1], offset: [0, 0, 2] },
    ),
    n(
      'breeding-region',
      'Breeding region · conceptual',
      'blocks',
      'A lithium-bearing region in a future plant could breed tritium when exposed to neutrons. This view shows only its role and relative position.',
      [],
      { color: '#c3aa70', offset: [-2, 0, 0] },
    ),
    n(
      'cooling',
      'Cooling passages',
      'pipes',
      'Cooling passages carry away heat deposited in the surrounding structures.',
      [tubes],
      { color: colors.water, position: [0, 0, -0.7], offset: [0, 0, -2] },
    ),
    n(
      'backing',
      'Structural backing',
      'plate',
      'A backing structure supports the module.',
      [],
      { position: [0, 0, -1.2], offset: [2, 0, 0] },
    ),
  ],
);
const fusionVessel = n(
  'vessel',
  'Vacuum vessel',
  'shell',
  'The toroidal chamber separates the plasma environment from surrounding machine systems.',
  [
    n(
      'chamber-wall',
      'Chamber wall',
      'shell',
      'The wall forms the vacuum boundary.',
      [],
      { offset: [2.5, 0, 0] },
    ),
    blanket,
    plasma,
  ],
);
const divertor = n(
  'divertor',
  'Divertor module',
  'divertor',
  'A heat-resistant surface and actively cooled support manage intense particle and heat exhaust.',
  [
    n(
      'surface',
      'Plasma-facing surface',
      'blocks',
      'Heat-resistant armor receives intense exhaust loads. Tungsten is used for ITER’s divertor targets.',
      [],
      { color: colors.dark, position: [0, 0.5, 0], offset: [0, 2, 0] },
    ),
    n(
      'cooling-tube',
      'Cooling tube',
      'pipes',
      'Active coolant removes heat from the target.',
      [tubes],
      { color: colors.copper, offset: [-2, 0, 0] },
    ),
    n(
      'support',
      'Support cassette',
      'plate',
      'The cassette supports the divertor components.',
      [],
      { position: [0, -0.7, 0], offset: [0, -2, 0] },
    ),
  ],
);
export const DETAIL_ROOTS: Record<Kind, DetailNode[]> = {
  fission: [fuel, rods, vessel, primary, steam, turbine, generator, condenser],
  fusion: [
    plasma,
    coils,
    fusionVessel,
    blanket,
    divertor,
    {
      ...steam,
      description:
        'A conceptual future power cycle exchanges recovered heat with a separate steam circuit.',
    },
    {
      ...turbine,
      name: 'Turbine & generator',
      children: [...turbine.children, generator],
    },
    condenser,
  ],
};
export function resolveDetailPath(kind: Kind, path: string[]): DetailNode[] {
  const result: DetailNode[] = [];
  let choices = DETAIL_ROOTS[kind];
  for (const id of path) {
    const node = choices.find((n) => n.id === id);
    if (!node) break;
    result.push(node);
    choices = node.children;
  }
  return result;
}
export function canEnter(node: DetailNode) {
  return node.children.length > 0 || !!node.reaction;
}
export function dragCompletion(dx: number, dy: number) {
  return Math.min(1, Math.hypot(dx, dy) / 90);
}

export type DissectionPhase = 'machine' | 'components' | 'particles';
export interface DepthLevel {
  path: string[];
  label: string;
  node?: DetailNode;
  phase: DissectionPhase;
  start: number;
  end: number;
  systemIndex?: number;
  systemLabel?: string;
  overview?: boolean;
}
export const DISSECTION_PHASES = [
  { id: 'machine', label: 'Machine', start: 0 },
  { id: 'components', label: '8 components', start: 15 },
  { id: 'particles', label: 'Particles', start: 75 },
] as const;
const particleScale = (node: DetailNode) =>
  [
    'ATOMIC SCALE',
    'NUCLEAR SCALE',
    'PARTICLE SCALE',
    'SUBNUCLEAR SCALE',
  ].includes(node.scale);
// A fixed itinerary: selecting a part never replaces the remaining machine tour.
export function depthRoute(kind: Kind): DepthLevel[] {
  const route: DepthLevel[] = [
    { path: [], label: 'Whole reactor', phase: 'machine', start: 0, end: 15 },
  ];
  const roots = DETAIL_ROOTS[kind];
  const rootIds = new Set(roots.map((n) => n.id));
  roots.forEach((root, systemIndex) => {
    const levels: Omit<DepthLevel, 'start' | 'end'>[] = [];
    const visit = (node: DetailNode, path: string[]) => {
      if (particleScale(node) || (path.length > 1 && rootIds.has(node.id)))
        return;
      levels.push({
        path,
        label: node.name,
        node,
        phase: 'components',
        systemIndex,
        systemLabel: root.name,
        overview:
          node.children.length > 0 && node.children.every(particleScale),
      });
      node.children.forEach((child) => visit(child, [...path, child.id]));
    };
    visit(root, [root.id]);
    const start = 15 + systemIndex * 7.5;
    levels.forEach((level, i) =>
      route.push({
        ...level,
        start: start + (i / levels.length) * 7.5,
        end: start + ((i + 1) / levels.length) * 7.5,
      }),
    );
  });
  const crystal = ['fuel', 'fuel-rods', 'pellets', 'pellet', 'crystal'];
  const atom = [...crystal, 'uranium-atom'];
  const nuclei = ['plasma', 'fuel-ions'];
  const paths =
    kind === 'fission'
      ? [
          crystal,
          [...crystal, 'oxygen-sites'],
          atom,
          [...atom, 'electron-cloud'],
          [...atom, 'nucleus'],
          [...atom, 'nucleus', 'proton'],
          [...atom, 'nucleus', 'neutron'],
        ]
      : [
          ['plasma', 'free-electrons'],
          nuclei,
          [...nuclei, 'deuterium'],
          [...nuclei, 'tritium'],
          [...nuclei, 'deuterium', 'proton'],
          [...nuclei, 'tritium', 'neutron'],
        ];
  paths.forEach((path, i) => {
    const node = resolveDetailPath(kind, path).at(-1)!;
    route.push({
      path,
      node,
      label:
        node.shape === 'proton'
          ? 'Inside a proton · quarks'
          : node.shape === 'neutron'
            ? 'Inside a neutron · quarks'
            : node.name,
      phase: 'particles',
      start: 75 + (i / paths.length) * 25,
      end: 75 + ((i + 1) / paths.length) * 25,
    });
  });
  return route;
}
export function depthSample(route: DepthLevel[], value: number) {
  const depth = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const found = route.findIndex(
    (level) => depth >= level.start && depth < level.end,
  );
  const index = found < 0 ? route.length - 1 : found;
  const level = route[index];
  // Finish opening each view before crossing to the next one.
  const separation = Math.min(
    100,
    ((depth - level.start) / (level.end - level.start)) * 125,
  );
  return { ...level, index, depth, separation };
}
export function depthForPath(kind: Kind, path: string[]) {
  const route = depthRoute(kind);
  const chain = resolveDetailPath(kind, path);
  for (let length = path.length; length > 0; length--) {
    const exact = route.find(
      (level) => level.path.join('/') === path.slice(0, length).join('/'),
    );
    const canonical =
      exact ?? route.find((level) => level.node === chain[length - 1]);
    if (canonical) return canonical.start;
  }
  return 0;
}
