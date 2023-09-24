const db = require("better-sqlite3")(":memory:");

db.exec("PRAGMA auto_vacuum = none");
db.exec("PRAGMA temp_store = memory");
db.exec("PRAGMA locking_mode = exclusive");
db.exec("PRAGMA user_version = 100");

const sql = `
WITH RECURSIVE c(x) AS (
  VALUES(1)
  UNION ALL
  SELECT x+1 FROM c WHERE x<50
)
SELECT x, x as a FROM c
`;

function createQuery(sql) {
  return db.prepare(sql);
}

let total = 10_000;
const runs = 100_000;

function bench(query) {
  const start = Date.now();
  for (let i = 0; i < runs; i++) query();
  const elapsed = Date.now() - start;
  const rate = Math.floor(runs / (elapsed / 1000));
  console.log(`time ${elapsed} ms rate ${rate}`);
  if (--total) process.nextTick(() => bench(query));
}

const query = createQuery(sql);
bench(() => query.all());