
import { useMemo, useState } from "react";

const graph = {
  A: ["B", "C"], B: ["D", "E"], C: ["F", "G"],
  D: ["H", "I"], E: ["J", "K"], F: ["L", "M"], G: ["N", "O"],
  H: [], I: [], J: [], K: [], L: [], M: [], N: [], O: [],
};

const positions = {
  A: [450, 45], B: [250, 125], C: [650, 125],
  D: [150, 205], E: [350, 205], F: [550, 205], G: [750, 205],
  H: [80, 300], I: [180, 300], J: [280, 300], K: [380, 300],
  L: [480, 300], M: [580, 300], N: [680, 300], O: [800, 300],
};

const heuristic = {
  A: 7, B: 6, C: 4, D: 5, E: 4, F: 2, G: 3,
  H: 6, I: 4, J: 3, K: 2, L: 3, M: 1, N: 0, O: 2,
};

const costs = {
  AB: 2, AC: 3, BD: 3, BE: 2, CF: 2, CG: 4,
  DH: 2, DI: 4, EJ: 3, EK: 2, FL: 3, FM: 1, GN: 2, GO: 3,
};

const gameTree = {
  A: ["B", "C"],
  B: ["D", "E"], C: ["F", "G"],
  D: ["H", "I"], E: ["J", "K"],
  F: ["L", "M"], G: ["N", "O"],
  H: [], I: [], J: [], K: [], L: [], M: [], N: [], O: [],
};

const utilities = {
  H: 3, I: 5, J: 6, K: 9,
  L: 1, M: 2, N: 0, O: 7,
};

const gamePositions = {
  A: [450, 45],
  B: [250, 130], C: [650, 130],
  D: [150, 215], E: [350, 215],
  F: [550, 215], G: [750, 215],
  H: [80, 315], I: [180, 315], J: [280, 315], K: [380, 315],
  L: [480, 315], M: [580, 315], N: [680, 315], O: [800, 315],
};

const nodeType = Object.fromEntries(
  Object.keys(gameTree).map((node) => [
    node,
    node === "A" || ["D", "E", "F", "G"].includes(node)
      ? "MAX"
      : ["H", "I", "J", "K", "L", "M", "N", "O"].includes(node)
        ? "LEAF"
        : "MIN",
  ])
);

const algorithms = [
  { id: "bfs", name: "BFS", sub: "Breadth-First Search", icon: "↔" },
  { id: "dfs", name: "DFS", sub: "Depth-First Search", icon: "↓" },
  { id: "ucs", name: "UCS", sub: "Uniform-Cost Search", icon: "◉" },
  { id: "greedy", name: "Greedy", sub: "Best-First Search", icon: "◆" },
  { id: "astar", name: "A*", sub: "A-Star Search", icon: "✦" },
  { id: "game", name: "Minimax vs Alpha-Beta", sub: "Game Tree", icon: "♟" },
  { id: "queens", name: "8-Queens", sub: "Backtracking / CSP", icon: "♛" },
];

function buildSearchSteps(type) {
  const steps = [];
  const frontier = [{ node: "A", cost: 0, path: ["A"] }];
  const visited = [];
  const bestCost = { A: 0 };
  const gScores = { A: 0 };

  const snapshot = (item, message, extra = {}) => ({
    current: item.node,
    visited: [...visited],
    frontier: frontier.map((x) => x.node),
    path: [...item.path],
    cost: item.cost,
    bestCost: { ...bestCost },
    gScores: { ...gScores },
    message,
    ...extra,
  });

  while (frontier.length) {
    if (type === "dfs") frontier.reverse();

    if (["ucs", "greedy", "astar"].includes(type)) {
      const score = (item) =>
        type === "ucs" ? item.cost :
        type === "greedy" ? heuristic[item.node] :
        item.cost + heuristic[item.node];

      frontier.sort((a, b) => score(a) - score(b));
    }

    const item = frontier.shift();
    if (!item || visited.includes(item.node)) continue;

    visited.push(item.node);

    steps.push(
      snapshot(item, `Visiting node ${item.node}.`)
    );

    if (item.node === "N") {
      steps.push(
        snapshot(
          item,
          `Goal N found. Total path cost = ${item.cost}.`,
          { done: true }
        )
      );
      return steps;
    }

    for (const child of graph[item.node]) {
      if (visited.includes(child)) continue;

      const newCost = item.cost + (costs[item.node + child] ?? 1);

      if (
        ["ucs", "astar"].includes(type) &&
        bestCost[child] !== undefined &&
        newCost >= bestCost[child]
      ) {
        continue;
      }

      bestCost[child] = newCost;
      gScores[child] = newCost;

      frontier.push({
        node: child,
        cost: newCost,
        path: [...item.path, child],
      });
    }

    steps.push(
      snapshot(
        item,
        `Expanded ${item.node}; added its children to the frontier.`
      )
    );
  }

  return steps;
}

function buildGameSteps(useAlphaBeta) {
  const state = {};
  const steps = [];

  for (const node of Object.keys(gameTree)) {
    state[node] = {
      R: nodeType[node] === "MAX" ? "−∞" :
         nodeType[node] === "MIN" ? "+∞" :
         utilities[node],
      alpha: "−∞",
      beta: "+∞",
      status: "pending",
      change: "Not visited",
    };
  }

  const visited = [];
  const pruned = [];
  let leafEvaluations = 0;

  const show = (node, message, extra = {}) => {
    steps.push({
      node,
      message,
      state: JSON.parse(JSON.stringify(state)),
      visited: [...visited],
      pruned: [...pruned],
      leafEvaluations,
      ...extra,
    });
  };

  function visit(node, alpha, beta) {
    const type = nodeType[node];
    const record = state[node];

    record.status = "active";
    record.alpha = alpha === -Infinity ? "−∞" : alpha;
    record.beta = beta === Infinity ? "+∞" : beta;
    visited.push(node);

    show(
      node,
      `Enter ${node} (${type}). R = ${record.R}, α = ${record.alpha}, β = ${record.beta}.`
    );

    if (type === "LEAF") {
      record.R = utilities[node];
      record.status = "done";
      record.change = `Utility: ${utilities[node]}`;
      leafEvaluations++;
      show(node, `Leaf ${node} returns utility ${utilities[node]}.`);
      return utilities[node];
    }

    let result = type === "MAX" ? -Infinity : Infinity;
    let currentAlpha = alpha;
    let currentBeta = beta;

    for (let i = 0; i < gameTree[node].length; i++) {
      const child = gameTree[node][i];
      const childValue = visit(child, currentAlpha, currentBeta);
      const oldResult = result;

      if (type === "MAX") {
        result = Math.max(result, childValue);
        currentAlpha = Math.max(currentAlpha, result);
      } else {
        result = Math.min(result, childValue);
        currentBeta = Math.min(currentBeta, result);
      }

      record.R = result;
      record.alpha = currentAlpha === -Infinity ? "−∞" : currentAlpha;
      record.beta = currentBeta === Infinity ? "+∞" : currentBeta;
      record.change =
        `R: ${oldResult === -Infinity ? "−∞" : oldResult === Infinity ? "+∞" : oldResult} → ${result}; ` +
        (type === "MAX"
          ? `α: ${alpha === -Infinity ? "−∞" : alpha} → ${currentAlpha}`
          : `β: ${beta === Infinity ? "+∞" : beta} → ${currentBeta}`);

      show(
        node,
        `${node} (${type}): child ${child} returned ${childValue}. R = ${result}; α = ${currentAlpha}; β = ${currentBeta}.`
      );

      if (useAlphaBeta && currentAlpha >= currentBeta) {
        const remaining = gameTree[node].slice(i + 1);

        function markSubtree(n) {
          if (!pruned.includes(n)) pruned.push(n);
          state[n].status = "pruned";
          state[n].change = `Pruned because α ≥ β`;
          for (const c of gameTree[n]) markSubtree(c);
        }

        remaining.forEach(markSubtree);

        if (remaining.length) {
          show(
            node,
            `PRUNE ${remaining.join(", ")}: α (${currentAlpha}) ≥ β (${currentBeta}). These branches cannot change the decision.`,
            { prunedNow: remaining }
          );
        }
        break;
      }
    }

    record.R = result;
    record.alpha = currentAlpha === -Infinity ? "−∞" : currentAlpha;
    record.beta = currentBeta === Infinity ? "+∞" : currentBeta;
    record.status = "done";

    show(node, `${node} returns R = ${result}.`);
    return result;
  }

  const result = visit("A", -Infinity, Infinity);
  show("A", `Algorithm complete. Final root value R(A) = ${result}.`, {
    done: true,
    result,
  });

  return steps;
}

function buildQueensSteps() {
  const steps = [];
  const board = Array(8).fill(-1);
  let attempts = 0;
  let backtracks = 0;

  function add(row, col, status, message) {
    steps.push({
      board: [...board],
      row, col, status, message,
      attempts, backtracks,
    });
  }

  function safe(row, col) {
    for (let r = 0; r < row; r++) {
      const c = board[r];
      if (
        c === col ||
        Math.abs(c - col) === Math.abs(r - row)
      ) return false;
    }
    return true;
  }

  function solve(row) {
    if (row === 8) {
      add(7, board[7], "solution", "Solution found! All eight queens are safe.");
      return true;
    }

    for (let col = 0; col < 8; col++) {
      attempts++;
      add(row, col, "trying", `Trying row ${row + 1}, column ${col + 1}.`);

      if (!safe(row, col)) {
        add(row, col, "conflict", "Conflict detected: same column or diagonal.");
        continue;
      }

      board[row] = col;
      add(row, col, "placed", `Queen placed safely at row ${row + 1}, column ${col + 1}.`);

      if (solve(row + 1)) return true;

      board[row] = -1;
      backtracks++;
      add(row, col, "backtrack", `Backtrack: remove queen from row ${row + 1} and try another column.`);
    }

    return false;
  }

  solve(0);
  return steps;
}

const baseButton = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#172033",
  color: "#e2e8f0",
  cursor: "pointer",
  fontWeight: 650,
};

function Panel({ children, style = {} }) {
  return (
    <section style={{
      background: "linear-gradient(145deg, #141d31, #101727)",
      border: "1px solid #273650",
      borderRadius: 16,
      padding: 18,
      minWidth: 0,
      boxShadow: "0 8px 24px #00000016",
      ...style,
    }}>
      {children}
    </section>
  );
}

function TreeSVG({ step, game = false, algorithm = "bfs" }) {
  const visited = new Set(step?.visited ?? []);
  const frontier = new Set(step?.frontier ?? []);
  const path = new Set(step?.path ?? []);
  const pruned = new Set(step?.pruned ?? []);

  const showG = algorithm === "ucs" || algorithm === "astar";
  const showH = algorithm === "greedy" || algorithm === "astar";
  const showF = algorithm === "astar";

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox="0 0 900 355" style={{ width: "100%", minWidth: 490, display: "block" }}>
        {Object.entries(graph).flatMap(([parent, children]) =>
          children.map((child) => {
            const [x1, y1] = game ? gamePositions[parent] : positions[parent];
            const [x2, y2] = game ? gamePositions[child] : positions[child];
            return (
              <line key={parent + child}
                x1={x1} y1={y1 + 19} x2={x2} y2={y2 - 19}
                stroke={game && pruned.has(child) ? "#f87171" : "#42516c"}
                strokeWidth="2"
                strokeDasharray={game && pruned.has(child) ? "6 5" : "0"}
              />
            );
          })
        )}

        {Object.keys(graph).map((node) => {
          const [x, y] = game ? gamePositions[node] : positions[node];
          const current = step?.current === node || (game && step?.node === node);
          const done = visited.has(node);
          const queued = frontier.has(node);
          const onPath = path.has(node);
          const isPruned = game && pruned.has(node);

          const g = step?.gScores?.[node] ?? step?.bestCost?.[node];
          const h = heuristic[node];
          const f = g !== undefined ? g + h : undefined;

          let valueLabels = [];

          if (!game) {
            if (showG) valueLabels.push(`g=${g ?? "∞"}`);
            if (showH) valueLabels.push(`h=${h}`);
            if (showF) valueLabels.push(`f=${f ?? "∞"}`);
          }

          return (
            <g key={node} opacity={isPruned ? 0.5 : 1}>
              <circle cx={x} cy={y} r="18"
                fill={isPruned ? "#7f1d1d" : current ? "#2563eb" : onPath ? "#166534" : done ? "#334155" : queued ? "#854d0e" : "#172033"}
                stroke={current ? "#93c5fd" : isPruned ? "#f87171" : "#64748b"}
                strokeWidth="2"
              />
              <text x={x} y={y + 5} fill="white" textAnchor="middle" fontSize="13" fontWeight="700">{node}</text>

              {!game && valueLabels.length > 0 && (
                <text
                  x={x}
                  y={y + 32}
                  fill="#94a3b8"
                  textAnchor="middle"
                  fontSize={showF ? "10" : "11"}
                >
                  {valueLabels.join(" ")}
                </text>
              )}

              {game && utilities[node] !== undefined && (
                <text x={x} y={y + 34} fill="#86efac" textAnchor="middle" fontSize="12">
                  U={utilities[node]}
                </text>
              )}
              {game && isPruned && (
                <text x={x} y={y + 48} fill="#fca5a5" textAnchor="middle" fontSize="10">PRUNED</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GameTreePanel({ title, steps, index, alphaBeta, color }) {
  const step = steps[Math.min(index, steps.length - 1)];

  return (
    <Panel>
      <h3 style={{ color, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 0 }}>
        Step {Math.min(index + 1, steps.length)} / {steps.length} · Leaves evaluated: {step.leafEvaluations}
      </p>

      <TreeSVG step={step} game />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
        gap: 8,
        marginTop: 12,
      }}>
        {Object.keys(gameTree).map((node) => {
          const data = step.state[node];
          const active = step.node === node;
          return (
            <div key={node} style={{
              border: `1px solid ${active ? color : "#334155"}`,
              background: data.status === "pruned" ? "#451a1a" : active ? "#1e293b" : "#0c1423",
              borderRadius: 9,
              padding: 9,
              opacity: data.status === "pruned" ? 0.7 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 5 }}>
                <strong>{node}</strong>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{nodeType[node]}</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 5 }}>R = {String(data.R)}</div>
              <div style={{ fontSize: 12 }}>α = {String(data.alpha)}</div>
              <div style={{ fontSize: 12 }}>β = {String(data.beta)}</div>
              <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 6, overflowWrap: "anywhere" }}>
                {data.change}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        background: "#0b1220",
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        lineHeight: 1.6,
        fontSize: 13,
      }}>
        <strong>Step explanation</strong>
        <p style={{ marginBottom: 0 }}>{step.message}</p>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
        {alphaBeta
          ? "Pruned nodes are shown in red. α is MAX's lower bound; β is MIN's upper bound."
          : "Minimax evaluates all reachable leaves and does not prune branches."}
      </p>
    </Panel>
  );
}

function QueensBoard({ step }) {
  const board = step?.board ?? Array(8).fill(-1);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
      width: "100%",
      maxWidth: 480,
      margin: "20px auto",
      border: "3px solid #64748b",
      borderRadius: 4,
      overflow: "hidden",
    }}>
      {Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const queen = board[row] === col;
        const current = step?.row === row && step?.col === col;
        const currentColor =
          step?.status === "conflict" ? "#991b1b" :
          step?.status === "backtrack" ? "#92400e" :
          "#1d4ed8";

        return (
          <div key={i} title={`Row ${row + 1}, column ${col + 1}`} style={{
            aspectRatio: "1",
            display: "grid",
            placeItems: "center",
            background: current ? currentColor : (row + col) % 2 ? "#64748b" : "#dbeafe",
            color: queen ? "#0f172a" : "#93c5fd",
            fontSize: "clamp(17px, 3.3vw, 31px)",
            fontWeight: 700,
          }}>
            {queen ? "♛" : current ? "·" : ""}
          </div>
        );
      })}
    </div>
  );
}

function CompleteAlgorithmGuide() {
  const [active, setActive] = useState("A* Search");
const [showExample, setShowExample] = useState(false);
  const algorithms = {
    "BFS": {
      title: "Breadth-First Search",
      subtitle: "Level by level exploration",
      idea: "BFS pehle current level ke tamam nodes explore karta hai, phir aglay level par jata hai.",
      mechanism: "FIFO Queue",
      formula: "No heuristic function",
      values: "Selection depth ke mutabiq hoti hai.",
      time: "O(b^(d+1))",
      space: "O(b^(d+1))",
      complete: "Yes, finite branching factor ke saath.",
      optimal: "Yes, jab tamam step costs equal hon.",
      pros: "Shallowest solution dhoondta hai.",
      cons: "Memory bohat zyada use kar sakta hai."
    },
    "DFS": {
      title: "Depth-First Search",
      subtitle: "Go deep, then backtrack",
      idea: "DFS ek branch mein maximum depth tak jata hai. Dead end par backtrack karta hai.",
      mechanism: "LIFO Stack / Recursion",
      formula: "No heuristic function",
      values: "Deepest available node pehle explore hota hai.",
      time: "O(b^m)",
      space: "O(bm)",
      complete: "Infinite-depth spaces mein generally nahi.",
      optimal: "No, generally cheapest solution guarantee nahi karta.",
      pros: "Memory comparatively kam use karta hai.",
      cons: "Galat ya bohat deep branch mein phans sakta hai."
    },
    "UCS": {
      title: "Uniform-Cost Search",
      subtitle: "Lowest actual path cost first",
      idea: "UCS us frontier node ko expand karta hai jis tak start se pohanchne ki actual cost sab se kam ho.",
      mechanism: "Priority Queue",
      formula: "f(n) = g(n)",
      values: "g(n) = start se node tak accumulated cost.",
      time: "Cost model par depend karta hai.",
      space: "Cost model par depend karta hai.",
      complete: "Positive step costs aur suitable finite-cost assumptions mein.",
      optimal: "Yes, non-negative costs aur proper graph-search handling ke saath.",
      pros: "Cheapest path find kar sakta hai.",
      cons: "Bohat se low-cost nodes expand kar sakta hai."
    },
    "Greedy": {
      title: "Greedy Best-First Search",
      subtitle: "Closest-looking node first",
      idea: "Greedy us node ko prefer karta hai jo heuristic ke mutabiq goal ke sab se qareeb lagta hai.",
      mechanism: "Priority Queue",
      formula: "f(n) = h(n)",
      values: "h(n) = node se goal tak estimated remaining cost.",
      time: "Worst case exponential.",
      space: "Worst case exponential.",
      complete: "General infinite spaces mein guarantee nahi.",
      optimal: "No, generally cheapest path guarantee nahi karta.",
      pros: "Achhi heuristic se goal jaldi mil sakta hai.",
      cons: "Short-looking route asal mein mehnga ho sakta hai."
    },
    "A* Search": {
      title: "A* Search",
      subtitle: "Actual cost + estimated remaining cost",
      idea: "A* actual cost aur goal tak estimated cost ko combine karta hai, phir lowest f-value node select karta hai.",
      mechanism: "Priority Queue",
      formula: "f(n) = g(n) + h(n)",
      values: "g = actual cost, h = estimated remaining cost, f = estimated total cost.",
      time: "Worst case exponential.",
      space: "Worst case exponential.",
      complete: "Suitable positive step costs aur finite branching assumptions mein.",
      optimal: "Tree search mein admissible h; graph search mein consistent h ke saath.",
      pros: "Cost aur goal direction dono consider karta hai.",
      cons: "Memory bohat zyada use kar sakta hai."
    },
    "Minimax": {
      title: "Minimax",
      subtitle: "Choose the best move against an optimal opponent",
      idea: "MAX apna utility score maximize karta hai. MIN opponent ka score minimize karta hai.",
      mechanism: "Game tree + recursive evaluation",
      formula: "MAX = max(children), MIN = min(children)",
      values: "Leaf nodes utility score rakhte hain, jaise +10, 0, -10.",
      time: "O(b^m)",
      space: "O(bm) with depth-first implementation.",
      complete: "Finite game tree mein exhaustive search complete hai.",
      optimal: "Exhaustive search mein optimal against optimal opponent.",
      pros: "Opponent ke possible responses consider karta hai.",
      cons: "Large game trees mein computationally expensive hai."
    },
    "Alpha-Beta": {
      title: "Alpha-Beta Pruning",
      subtitle: "Skip branches that cannot change the decision",
      idea: "Alpha-Beta Minimax ki unnecessary branches prune karta hai. Sahi implementation mein final decision Minimax jaisa hi rehta hai.",
      mechanism: "Minimax + alpha and beta bounds",
      formula: "Prune when α ≥ β",
      values: "α = MAX ka best lower bound; β = MIN ka best upper bound.",
      time: "Worst O(b^m); ideal ordering O(b^(m/2)).",
      space: "O(bm) with depth-first implementation.",
      complete: "Finite game tree mein exhaustive search ke equivalent.",
      optimal: "Same as Minimax at the same search depth.",
      pros: "Kam nodes explore karke decision le sakta hai.",
      cons: "Move ordering performance par bohat asar dalti hai."
    }
  };

  const selected = algorithms[active];

  const colors = {
    BFS: "#38bdf8",
    DFS: "#a78bfa",
    UCS: "#34d399",
    Greedy: "#fbbf24",
    "A* Search": "#22d3ee",
    Minimax: "#fb7185",
    "Alpha-Beta": "#c084fc"
  };

  const cardStyle = {
    background: "var(--guide-card, #111827)",
    border: "1px solid var(--guide-border, #273449)",
    borderRadius: "14px",
    padding: "18px",
    minWidth: 0
  };

  const headingStyle = {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: "8px"
  };

  const valueStyle = {
    fontSize: "14px",
    lineHeight: 1.7,
    overflowWrap: "anywhere"
  };

  const treeNode = (x, y, label, fill = "#1e293b") => (
    <g key={`${x}-${y}-${label}`}>
      <circle cx={x} cy={y} r="21" fill={fill} stroke="#64748b" strokeWidth="1.5" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fill="#f8fafc" fontWeight="700">{label}</text>
    </g>
  );

  return (
    <section
      id="complete-algorithm-guide"
      style={{
        color: "var(--guide-text, #f1f5f9)",
        background: "var(--guide-bg, #080d18)",
        border: "1px solid var(--guide-border, #273449)",
        borderRadius: "22px",
        padding: "clamp(16px, 3vw, 32px)",
        margin: "36px 0",
        fontFamily: "inherit"
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            color: "#22d3ee",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            marginBottom: "10px"
          }}>
            AI SEARCH • CONCEPTS • COMPLEXITY
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            lineHeight: 1.15,
            fontWeight: 850,
            margin: "0 0 14px"
          }}>
            Complete Algorithm Guide
          </h2>
          <p style={{
            color: "#94a3b8",
            maxWidth: "760px",
            lineHeight: 1.8,
            margin: 0
          }}>
            Har algorithm ka purpose, working, formulas, node values,
            complexity aur exam-relevant differences ek jagah.
          </p>
        </div>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "22px"
        }}>
          {Object.keys(algorithms).map(name => (
            <button
              key={name}
              onClick={() => {
                setActive(name);
                setShowExample(false);
              }}
              style={{
                border: `1px solid ${active === name ? colors[name] : "#334155"}`,
                borderRadius: "10px",
                padding: "10px 14px",
                background: active === name ? `${colors[name]}18` : "#0f172a",
                color: active === name ? colors[name] : "#cbd5e1",
                fontWeight: 750,
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <div style={{
          ...cardStyle,
          borderColor: colors[active],
          marginBottom: "18px"
        }}>
          <div style={{
            color: colors[active],
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.12em"
          }}>
            ALGORITHM BREAKDOWN
          </div>
          <h3 style={{ fontSize: "25px", margin: "8px 0" }}>
            {selected.title}
          </h3>
          <p style={{ color: "#94a3b8", margin: "0 0 18px" }}>
            {selected.subtitle}
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
            gap: "12px"
          }}>
            {[
              ["Core idea", selected.idea],
              ["Data structure", selected.mechanism],
              ["Selection rule", selected.formula],
              ["Node values", selected.values],
              ["Time complexity", selected.time],
              ["Space complexity", selected.space],
              ["Completeness", selected.complete],
              ["Optimality", selected.optimal],
              ["Advantage", selected.pros],
              ["Limitation", selected.cons]
            ].map(([label, value]) => (
              <div key={label} style={{
                background: "#0b1220",
                borderRadius: "10px",
                padding: "13px",
                border: "1px solid #243247"
              }}>
                <div style={headingStyle}>{label}</div>
                <div style={valueStyle}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "16px",
          marginBottom: "20px"
        }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Understand the symbols</h3>
            {[
              ["b", "Branching factor: aik node ke children ki tadaad."],
              ["d", "Shallowest solution ki depth."],
              ["m", "Maximum search depth."],
              ["g(n)", "Start node se n tak actual accumulated path cost."],
              ["h(n)", "Node n se goal tak estimated remaining cost."],
              ["f(n)", "Frontier node ki selection/evaluation value."],
              ["U(n)", "Game tree mein node ki utility."],
              ["α (alpha)", "Current path par MAX ki best lower bound."],
              ["β (beta)", "Current path par MIN ki best upper bound."]
            ].map(([symbol, explanation]) => (
              <div key={symbol} style={{
                display: "grid",
                gridTemplateColumns: "74px 1fr",
                gap: "10px",
                padding: "9px 0",
                borderBottom: "1px solid #243247"
              }}>
                <strong style={{ color: "#22d3ee" }}>{symbol}</strong>
                <span style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.65 }}>
                  {explanation}
                </span>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Formula comparison</h3>
            {[
              ["BFS", "Level order; no heuristic priority."],
              ["DFS", "Depth-first; no heuristic priority."],
              ["UCS", "f(n) = g(n)"],
              ["Greedy", "f(n) = h(n)"],
              ["A*", "f(n) = g(n) + h(n)"],
              ["Minimax", "MAX: max(children); MIN: min(children)"],
              ["Alpha-Beta", "Prune when α ≥ β."]
            ].map(([name, formula]) => (
              <div key={name} style={{
                padding: "11px 0",
                borderBottom: "1px solid #243247"
              }}>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                  {name}
                </div>
                <code style={{
                  color: "#67e8f9",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                  fontSize: "13px"
                }}>
                  {formula}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>A* worked example</h3>
          <p style={{ color: "#94a3b8", lineHeight: 1.75 }}>
            Suppose node B tak actual cost 4 hai aur estimated remaining cost 6 hai.
            A* uski evaluation value calculate karta hai.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "10px"
          }}>
            {[
              ["g(B)", "4", "Actual cost"],
              ["h(B)", "6", "Estimated remaining"],
              ["f(B)", "10", "4 + 6 = 10"]
            ].map(([symbol, value, note]) => (
              <div key={symbol} style={{
                textAlign: "center",
                padding: "14px 6px",
                background: "#0b1220",
                borderRadius: "10px"
              }}>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>{symbol}</div>
                <div style={{ color: "#22d3ee", fontSize: "26px", fontWeight: 850 }}>
                  {value}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "11px" }}>{note}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "13px", lineHeight: 1.75, color: "#cbd5e1" }}>
            A* frontier mein aam tor par sab se kam f-value wala node choose karta hai.
            Is ka matlab yeh nahi ke hamesha goal tak pohanchne ka exact final cost maloom hai;
            f(n) estimated total cost hoti hai.
          </p>
        </div>

        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Minimax tree: utility propagation</h3>
          <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.7 }}>
            Root MAX hai. Us ke children MIN hain. Leaves ke utility scores se values
            neeche se upar calculate hoti hain.
          </p>
          <svg viewBox="0 0 320 220" role="img" aria-label="Minimax example tree" style={{ width: "100%", maxWidth: "480px", display: "block", margin: "0 auto" }}>
            <g stroke="#64748b" strokeWidth="1.5" fill="none">
              <path d="M160 38 L85 83 M160 38 L235 83" />
              <path d="M85 103 L42 153 M85 103 L105 153" />
              <path d="M235 103 L215 153 M235 103 L278 153" />
            </g>
            {treeNode(160, 28, "3", "#164e63")}
            {treeNode(85, 93, "3", "#713f12")}
            {treeNode(235, 93, "2", "#713f12")}
            {treeNode(42, 163, "3")}
            {treeNode(105, 163, "5")}
            {treeNode(215, 163, "2")}
            {treeNode(278, 163, "9")}
            <text x="160" y="10" fill="#94a3b8" fontSize="10" textAnchor="middle">MAX</text>
            <text x="85" y="68" fill="#94a3b8" fontSize="10" textAnchor="middle">MIN</text>
            <text x="235" y="68" fill="#94a3b8" fontSize="10" textAnchor="middle">MIN</text>
            <text x="160" y="207" fill="#94a3b8" fontSize="10" textAnchor="middle">Leaves = utility values</text>
          </svg>
          <button
            onClick={() => setShowExample(!showExample)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #334155",
              borderRadius: "10px",
              background: "#0f172a",
              color: "#67e8f9",
              fontWeight: 750,
              cursor: "pointer"
            }}
          >
            {showExample ? "Hide explanation" : "Show step-by-step explanation"}
          </button>
          {showExample && (
            <div style={{
              marginTop: "14px",
              padding: "14px",
              background: "#0b1220",
              borderRadius: "10px",
              lineHeight: 1.9,
              fontSize: "13px"
            }}>
              <p>1. Left MIN node: min(3, 5) = 3.</p>
              <p>2. Right MIN node: min(2, 9) = 2.</p>
              <p>3. Root MAX node: max(3, 2) = 3.</p>
              <p style={{ color: "#67e8f9", marginBottom: 0 }}>
                Final decision: MAX left branch choose karega, jis ki value 3 hai.
              </p>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Alpha-Beta Pruning</h3>
          <p style={{ lineHeight: 1.8, color: "#cbd5e1" }}>
            Alpha-Beta Minimax ko optimize karta hai. Alpha MAX ka current best lower bound
            hai aur beta MIN ka current best upper bound. Jab alpha beta ke barabar ya us se
            bara ho jaye, remaining branch ko prune kiya ja sakta hai.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "12px"
          }}>
            <div style={{ background: "#0b1220", borderRadius: "10px", padding: "14px" }}>
              <div style={{ color: "#a78bfa", fontWeight: 800 }}>α = −∞ initially</div>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.7 }}>
                MAX ka best lower bound. MAX node par alpha update hota hai.
              </p>
            </div>
            <div style={{ background: "#0b1220", borderRadius: "10px", padding: "14px" }}>
              <div style={{ color: "#fbbf24", fontWeight: 800 }}>β = +∞ initially</div>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.7 }}>
                MIN ka best upper bound. MIN node par beta update hota hai.
              </p>
            </div>
          </div>
          <div style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "10px",
            background: "#251326",
            border: "1px solid #713f7c",
            textAlign: "center"
          }}>
            <div style={{ color: "#e9d5ff", fontSize: "12px" }}>PRUNING CONDITION</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#d8b4fe" }}>
              α ≥ β
            </div>
            <div style={{ fontSize: "12px", color: "#c4b5fd" }}>
              Further search cannot change the final choice on this path.
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Algorithm comparison</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              minWidth: "600px",
              textAlign: "left"
            }}>
              <thead>
                <tr style={{ color: "#67e8f9", background: "#0b1220" }}>
                  {["Algorithm", "Selection", "Heuristic?", "Optimal?", "Memory"].map(h => (
                    <th key={h} style={{ padding: "12px", borderBottom: "1px solid #334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["BFS", "Shallowest level", "No", "Equal step costs", "High"],
                  ["DFS", "Deepest node", "No", "Generally no", "Low"],
                  ["UCS", "Lowest g", "No", "Yes, under cost assumptions", "Can be high"],
                  ["Greedy", "Lowest h", "Yes", "Generally no", "Can be high"],
                  ["A*", "Lowest g + h", "Yes", "Yes, under heuristic assumptions", "High"],
                  ["Minimax", "MAX/MIN utility", "Leaf evaluation", "At searched depth", "Depth-first: O(bm)"],
                  ["Alpha-Beta", "Minimax with pruning", "Leaf evaluation", "Same as Minimax", "Depth-first: O(bm)"]
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i} style={{
                        padding: "11px 12px",
                        borderBottom: "1px solid #243247",
                        color: i === 0 ? "#e2e8f0" : "#cbd5e1",
                        verticalAlign: "top"
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.7, marginBottom: 0 }}>
            Complexity depends on search assumptions, branching factor, solution depth,
            edge costs, heuristic quality, graph handling, and move ordering.
            The bounds above are standard textbook summaries, not universal guarantees.
          </p>
        </div>

        <div style={{
          ...cardStyle,
          borderColor: "#155e75"
        }}>
          <h3 style={{ marginTop: 0 }}>Last-minute exam revision</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            {[
              "BFS = FIFO queue; level by level.",
              "DFS = LIFO stack; deep first, then backtrack.",
              "UCS = lowest actual path cost g(n).",
              "Greedy = lowest heuristic h(n).",
              "A* = actual path cost + estimated remaining cost.",
              "Admissible heuristic true remaining cost ko overestimate nahi karti.",
              "Consistent heuristic: h(n) ≤ c(n,n') + h(n').",
              "Minimax = MAX maximizes; MIN minimizes.",
              "Alpha-Beta pruning condition = α ≥ β.",
              "Alpha-Beta Minimax ka answer change nahi karta; nodes kam explore karta hai."
            ].map((item, i) => (
              <div key={item} style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                lineHeight: 1.65,
                fontSize: "13px"
              }}>
                <span style={{ color: "#22d3ee", fontWeight: 850 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


export default function App() {
  const [algorithm, setAlgorithm] = useState("bfs");
  const [stepIndex, setStepIndex] = useState(0);

  const searchSteps = useMemo(() => buildSearchSteps(algorithm), [algorithm]);
  const minimaxSteps = useMemo(() => buildGameSteps(false), []);
  const alphaSteps = useMemo(() => buildGameSteps(true), []);
  const queenSteps = useMemo(() => buildQueensSteps(), []);

  const isGame = algorithm === "game";
  const isQueens = algorithm === "queens";

  const steps = isGame
    ? Array.from({ length: Math.max(minimaxSteps.length, alphaSteps.length) }, (_, i) => i)
    : isQueens ? queenSteps : searchSteps;

  const index = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const step = isQueens ? queenSteps[index] : searchSteps[index];

  function selectAlgorithm(id) {
    setAlgorithm(id);
    setStepIndex(0);
  }

  const buttonStyle = (active = false) => ({
    ...baseButton,
    background: active ? "linear-gradient(135deg, #2563eb, #4f46e5)" : "#172033",
    borderColor: active ? "#60a5fa" : "#334155",
    textAlign: "left",
  });

  return (
    <main style={{
      minHeight: "100vh",
      padding: "clamp(14px, 3vw, 30px)",
      boxSizing: "border-box",
      background: "radial-gradient(ellipse at top left, #18264b 0%, #0b1020 48%, #080c16 100%)",
      color: "#e5e7eb",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    }}>
      <header style={{ maxWidth: 1500, margin: "0 auto 24px" }}>
        <div style={{ color: "#93c5fd", fontSize: 11, letterSpacing: 3, fontWeight: 800 }}>
          BSCS · ARTIFICIAL INTELLIGENCE LAB
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 44px)",
          letterSpacing: "-1px",
          margin: "10px 0",
        }}>
          AI Algorithm <span style={{ color: "#60a5fa" }}>Visualizer</span>
        </h1>
        <p style={{ color: "#a5b4cc", maxWidth: 760, lineHeight: 1.7, marginBottom: 0 }}>
          Learn how search algorithms explore a graph, how Minimax makes decisions,
          how Alpha-Beta prunes unnecessary branches, and how backtracking solves 8-Queens.
        </p>
      </header>

      <div style={{
        maxWidth: 1500,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 155px), 1fr))",
        gap: 10,
        marginBottom: 20,
      }}>
        {algorithms.map((item) => (
          <button key={item.id} onClick={() => selectAlgorithm(item.id)} style={buttonStyle(algorithm === item.id)}>
            <span style={{ display: "block", fontSize: 21, marginBottom: 7 }}>{item.icon}</span>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{item.name}</span>
            <span style={{ display: "block", fontSize: 11, color: "#cbd5e1", marginTop: 5, lineHeight: 1.4 }}>
              {item.sub}
            </span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        {isGame ? (
          <>
            <Panel style={{ marginBottom: 14 }}>
              <h2 style={{ margin: "0 0 8px" }}>Minimax vs Alpha-Beta Pruning</h2>
              <p style={{ color: "#a5b4cc", lineHeight: 1.7, margin: 0 }}>
                Follow each node's R, α and β. MAX tries to maximize the result;
                MIN tries to minimize it. Initial values are α = −∞ and β = +∞.
                A branch can be pruned when α ≥ β.
              </p>
            </Panel>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 470px), 1fr))",
              gap: 14,
              alignItems: "start",
            }}>
              <GameTreePanel
                title="01 · Minimax"
                steps={minimaxSteps}
                index={Math.min(index, minimaxSteps.length - 1)}
                alphaBeta={false}
                color="#93c5fd"
              />
              <GameTreePanel
                title="02 · Alpha-Beta"
                steps={alphaSteps}
                index={Math.min(index, alphaSteps.length - 1)}
                alphaBeta
                color="#86efac"
              />
            </div>

            <Panel style={{ marginTop: 14 }}>
              <h3 style={{ marginTop: 0 }}>Final comparison</h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}>
                <div style={{ background: "#0b1220", padding: 14, borderRadius: 10 }}>
                  <div style={{ color: "#93c5fd", fontSize: 12 }}>MINIMAX ROOT VALUE</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {minimaxSteps[minimaxSteps.length - 1].result}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Leaf evaluations: {minimaxSteps[minimaxSteps.length - 1].leafEvaluations}
                  </div>
                </div>
                <div style={{ background: "#0b1220", padding: 14, borderRadius: 10 }}>
                  <div style={{ color: "#86efac", fontSize: 12 }}>ALPHA-BETA ROOT VALUE</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {alphaSteps[alphaSteps.length - 1].result}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Leaf evaluations: {alphaSteps[alphaSteps.length - 1].leafEvaluations}
                  </div>
                </div>
              </div>
              <p style={{ color: "#a5b4cc", fontSize: 13, lineHeight: 1.7 }}>
                Both algorithms return the same minimax value. Alpha-Beta can evaluate fewer leaves
                because it prunes branches that cannot affect the final decision.
              </p>
            </Panel>
          </>
        ) : isQueens ? (
          <Panel>
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", alignItems: "start" }}>
              <div>
                <h2 style={{ margin: "0 0 8px" }}>The 8-Queens Problem</h2>
                <p style={{ color: "#a5b4cc", maxWidth: 700, lineHeight: 1.7, margin: 0 }}>
                  Place eight queens so that no two share a row, column, or diagonal.
                  The solver uses backtracking: try a safe square, continue, and undo a choice if it leads to a dead end.
                </p>
              </div>
              <span style={{ border: "1px solid #334155", padding: "8px 11px", borderRadius: 9, fontSize: 12 }}>
                Constraint Satisfaction Problem
              </span>
            </div>

            <QueensBoard step={step} />

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
              gap: 10,
            }}>
              {[
                ["CURRENT STEP", `${index + 1} / ${queenSteps.length}`],
                ["ATTEMPTS", step?.attempts ?? 0],
                ["BACKTRACKS", step?.backtracks ?? 0],
                ["QUEENS PLACED", step?.board?.filter((x) => x !== -1).length ?? 0],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#0b1220", padding: 13, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 5 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0b1220", borderRadius: 10, padding: 14, marginTop: 14, lineHeight: 1.7 }}>
              <strong>What's happening?</strong>
              <p style={{ marginBottom: 0 }}>{step?.message}</p>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 12 }}>
              Blue = current attempt · Red = conflict · Amber = backtracking · ♛ = placed queen
            </p>
          </Panel>
        ) : (
          <Panel>
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 6px" }}>
                  {algorithms.find((item) => item.id === algorithm)?.sub}
                </h2>
                <p style={{ color: "#a5b4cc", marginTop: 0 }}>
                  Start node: A · Goal node: N
                </p>
              </div>
              <span style={{ border: "1px solid #334155", padding: "8px 11px", borderRadius: 9, fontSize: 12, height: "fit-content" }}>
                Step {index + 1} / {searchSteps.length}
              </span>
            </div>

            <TreeSVG step={step} algorithm={algorithm} />

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
              gap: 10,
              marginTop: 12,
            }}>
              {[
                ["CURRENT NODE", step?.current ?? "—"],
                ["VISITED", step?.visited?.length ?? 0],
                ["FRONTIER", step?.frontier?.length ?? 0],
                ["PATH COST", step?.cost ?? "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#0b1220", padding: 13, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 5, overflowWrap: "anywhere" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0b1220", padding: 14, borderRadius: 10, marginTop: 14, lineHeight: 1.7 }}>
              <strong>Step explanation</strong>
              <p style={{ marginBottom: 0 }}>{step?.message}</p>
              <p style={{ color: "#86efac", marginBottom: 0 }}>
                Path: {step?.path?.join(" → ") ?? "—"}
              </p>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 12 }}>
              Blue = current node · Green = path · Grey = visited · Amber = frontier
            </p>
          </Panel>
        )}

        <Panel style={{
          marginTop: 14,
          position: "sticky",
          bottom: 8,
          zIndex: 5,
          background: "#111b2e",
          boxShadow: "0 8px 32px #00000055",
        }}>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
            <button style={baseButton} onClick={() => setStepIndex(0)} disabled={index === 0}>
              ↺ Reset
            </button>
            <button style={baseButton} onClick={() => setStepIndex((v) => Math.max(0, v - 1))} disabled={index === 0}>
              ← Previous
            </button>
            <button
              style={{ ...baseButton, background: "linear-gradient(135deg, #2563eb, #4f46e5)", borderColor: "#60a5fa" }}
              onClick={() => setStepIndex((v) => Math.min(steps.length - 1, v + 1))}
              disabled={index >= steps.length - 1}
            >
              Next Step →
            </button>
            <div style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 12 }}>
              Step {index + 1} of {steps.length}
            </div>
          </div>
          <div style={{ height: 4, background: "#263249", borderRadius: 99, overflow: "hidden", marginTop: 12 }}>
            <div style={{
              height: "100%",
              width: `${steps.length > 1 ? (index / (steps.length - 1)) * 100 : 100}%`,
              background: "linear-gradient(90deg, #3b82f6, #34d399)",
              transition: "width 0.2s ease",
            }} />
          </div>
        </Panel>

        <footer style={{ textAlign: "center", color: "#64748b", fontSize: 12, padding: "22px 0 6px" }}>
          AI Algorithm Visualizer · Built with React · Designed for learning
        </footer>
        <CompleteAlgorithmGuide />
      </div>
    </main>
  );
}
