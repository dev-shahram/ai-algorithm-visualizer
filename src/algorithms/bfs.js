
export function bfs(grid, start, goal) {
  const rows = grid.length;
  const cols = grid[0].length;

  const key = ([r, c]) => `${r},${c}`;

  const queue = [start];
  let head = 0;

  const visited = new Set([key(start)]);
  const parent = new Map();
  const explored = [];

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (head < queue.length) {
    const current = queue[head++];
    explored.push(current);

    if (
      current[0] === goal[0] &&
      current[1] === goal[1]
    ) {
      break;
    }

    for (const [dr, dc] of directions) {
      const nr = current[0] + dr;
      const nc = current[1] + dc;

      if (
        nr < 0 || nr >= rows ||
        nc < 0 || nc >= cols
      ) {
        continue;
      }

      if (grid[nr][nc] === 1) continue;

      const next = [nr, nc];
      const nextKey = key(next);

      if (visited.has(nextKey)) continue;

      visited.add(nextKey);
      parent.set(nextKey, current);
      queue.push(next);
    }
  }

  const reached = visited.has(key(goal));

  if (!reached) {
    return { explored, path: [], found: false };
  }

  const path = [];
  let current = goal;

  while (key(current) !== key(start)) {
    path.push(current);
    current = parent.get(key(current));
  }

  path.push(start);
  path.reverse();

  return { explored, path, found: true };
}
