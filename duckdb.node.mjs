import duckdb from 'duckdb';
import { benchAsync } from "./bench.mjs";

const db = new duckdb.Database(':memory:');

const q = 'select i, i as a from generate_series(1, 10) s(i)';

const p = db.prepare(q);

console.log('benchmarking query:', q);

benchAsync(async () => {
  await new Promise(r => p.all(r));
}, 100_000);
