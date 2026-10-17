# AI Algorithm Visualizer

An interactive, web-based visualization tool for understanding fundamental Artificial Intelligence algorithms through step-by-step animations, visual search trees, and algorithm analysis.

## Overview

AI Algorithm Visualizer is a React-based educational project designed to make complex AI concepts easier to understand. It demonstrates how search algorithms explore states, how Minimax makes decisions in game trees, how Alpha-Beta Pruning reduces unnecessary evaluations, and how backtracking solves constraint-satisfaction problems.

## Features

### 1. Search Algorithms
- **Breadth-First Search (BFS):** Explores nodes level by level.
- **Depth-First Search (DFS):** Explores a branch before backtracking.
- **Uniform-Cost Search (UCS):** Expands the node with the lowest accumulated path cost.
- **Greedy Best-First Search:** Selects nodes using a heuristic estimate.
- **A* Search:** Combines path cost and heuristic estimates using `f(n) = g(n) + h(n)`.

### 2. Game Tree Search
- Minimax algorithm visualization.
- Alpha-Beta Pruning demonstration.
- MAX and MIN node evaluation.
- Alpha and beta value tracking.
- Visual identification of pruned branches and evaluated leaves.

### 3. 8-Queens Problem
- Visualizes the backtracking approach.
- Demonstrates safe queen placement.
- Shows how the algorithm handles conflicts and backtracks.
- Tracks placement attempts and backtracking steps.

### 4. Algorithm Learning Guide
- Algorithm definitions and explanations.
- Important formulas and terminology.
- Time and space complexity.
- Completeness and optimality comparisons.
- A* worked example.
- Minimax and Alpha-Beta Pruning explanations.
- Quick exam revision notes.

### 5. Interactive Controls
- Step-by-step execution.
- Next Step and Previous Step controls.
- Reset functionality.
- Visual representation of search progress and algorithm states.

## Tech Stack

- **React** — Component-based user interface.
- **JavaScript** — Algorithm implementation and application logic.
- **HTML5** — Application structure.
- **CSS** — Styling and visual presentation.
- **SVG** — Search trees and algorithm visualizations.

## Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/ai-algorithm-visualizer.git
   ```

2. Navigate to the project directory:

   ```bash
   cd ai-algorithm-visualizer
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in your terminal, commonly `http://localhost:5173`.

> **Note:** These instructions assume the project uses Vite. If your project uses a different setup, adjust the commands according to its `package.json`.

## Learning Objectives

This project helps students understand:

- Uninformed and informed search strategies.
- Heuristic evaluation in AI.
- Path costs and evaluation functions.
- Minimax decision-making.
- Alpha-Beta Pruning optimization.
- Backtracking and constraint-satisfaction problems.
- Algorithm complexity and performance trade-offs.

## Project Structure

The exact structure may vary, but a typical React project looks like this:

```text
ai-algorithm-visualizer/
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
├── index.html
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Future Improvements

Potential enhancements include:

- Custom graph creation and editing.
- Adjustable algorithm speed.
- User-defined start and goal nodes.
- Interactive quizzes and practice challenges.
- Additional AI algorithms.
- Responsive design improvements.
- Deployment with a public live demo.

## Contributing

Suggestions, bug reports, and improvements are welcome. Feel free to fork the repository and submit a pull request.

## License

This project is available for educational and learning purposes. A specific open-source license has not been selected yet.

---

**Built with React to make Artificial Intelligence algorithms easier to visualize, understand, and learn.**
