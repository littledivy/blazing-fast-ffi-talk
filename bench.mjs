let total = 10_000;

export function bench(query, runs = 100_000) {
  const start = performance.now();
  for (let i = 0; i < runs; i++) query();
  const elapsed = Math.floor(performance.now() - start);
  const rate = Math.floor(runs / (elapsed / 1000));
  console.log(`time ${elapsed} ms rate ${rate}`);
  if (--total) bench(query, runs);
}

export async function benchAsync(query, runs = 100_000) {
  const start = performance.now();
  for (let i = 0; i < runs; i++) await query();
  const elapsed = Math.floor(performance.now() - start);
  const rate = Math.floor(runs / (elapsed / 1000));
  console.log(`time ${elapsed} ms rate ${rate}`);
  if (--total) await benchAsync(query, runs);
}