// Pure, DOM-free helpers for label layout: text wrapping and pairwise
// collision avoidance. Kept framework-agnostic and side-effect-free so they
// unit test cleanly without a browser/canvas.

const AVG_CHAR_WIDTH_FACTOR = 0.56; // heuristic for a typical UI sans-serif

export function estimateTextWidth(text, fontSize) {
  return text.length * fontSize * AVG_CHAR_WIDTH_FACTOR;
}

/** Greedy word-wrap into lines that each fit within maxWidth px at fontSize. */
export function wrapLabel(label, maxWidth, fontSize = 12) {
  const words = label.trim().split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Bounding box (in px) a wrapped label would occupy, centered on its anchor. */
export function measureLabelBox(lines, fontSize = 12, lineHeight = 14) {
  const width = Math.max(...lines.map((line) => estimateTextWidth(line, fontSize)), 0);
  const height = lines.length * lineHeight;
  return { width, height };
}

function overlapAmount(a, b, padding) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const overlapX = (a.width + b.width) / 2 + padding - Math.abs(dx);
  const overlapY = (a.height + b.height) / 2 + padding - Math.abs(dy);
  return { dx, dy, overlapX, overlapY };
}

/**
 * Iterative pairwise declutter: nudges overlapping label boxes apart along
 * whichever axis has the smaller overlap, until no pair overlaps or the
 * iteration budget runs out. Boxes are {id, x, y, width, height} centers;
 * returns a new array, input is untouched.
 */
export function resolveLabelCollisions(boxes, { iterations = 60, padding = 4 } = {}) {
  const result = boxes.map((box) => ({ ...box }));

  for (let iter = 0; iter < iterations; iter += 1) {
    let moved = false;

    for (let i = 0; i < result.length; i += 1) {
      for (let j = i + 1; j < result.length; j += 1) {
        const a = result[i];
        const b = result[j];
        const { dx, dy, overlapX, overlapY } = overlapAmount(a, b, padding);

        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          if (overlapX < overlapY) {
            const push = (overlapX / 2) * (dx >= 0 ? 1 : -1) || overlapX / 2;
            a.x -= push;
            b.x += push;
          } else {
            const push = (overlapY / 2) * (dy >= 0 ? 1 : -1) || overlapY / 2;
            a.y -= push;
            b.y += push;
          }
        }
      }
    }

    if (!moved) break;
  }

  return result;
}
