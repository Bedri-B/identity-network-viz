// Hub-and-spoke traversal order for pairwise mapping: item i is the hub for
// one screen, spokes are every item after it in the list, so each unordered
// pair is rated exactly once across the whole walk (no pair asked twice).
export function hubSpokeSteps(items) {
  const steps = [];
  for (let i = 0; i < items.length - 1; i += 1) {
    steps.push({ hub: items[i], spokes: items.slice(i + 1) });
  }
  return steps;
}
