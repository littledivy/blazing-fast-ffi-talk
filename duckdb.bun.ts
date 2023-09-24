// https://github.com/evanwashere/duckdb/blob/master/benches/bun.mjs

import { open } from "@evan/duckdb";
import { bench } from "./bench.mjs";

const db = open(":memory:");
const connection = db.connect();

const q = "select i, i as a from generate_series(1, 10) s(i)";

const p = connection.prepare(q);
console.log("benchmarking query: " + q);

bench(() => {
  p.query();
}, 100_000);

connection.close();
db.close();
