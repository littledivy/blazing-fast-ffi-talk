import {
  SQLITE3_OPEN_CREATE,
  SQLITE3_OPEN_MEMORY,
  SQLITE3_OPEN_PRIVATECACHE,
  SQLITE3_OPEN_READWRITE,
  SQLITE3_ROW,
  toCString,
  unwrap,
} from "./sqlite_shared.mjs";
import { bench } from "./bench.mjs";

const { symbols } = Deno.dlopen("../sqlite3/build/libsqlite3_aarch64.dylib", {
  sqlite3_initialize: {
    parameters: [],
    result: "i32",
  },
  sqlite3_open_v2: {
    parameters: [
      "buffer",
      "buffer",
      "i32",
      "pointer",
    ],
    result: "i32",
  },
  sqlite3_exec: {
    parameters: [
      "pointer", // sqlite3 *db
      "buffer", // const char *sql
      "pointer", // sqlite3_callback callback
      "pointer", // void *arg
      "buffer", // char **errmsg
    ],
    result: "i32",
  },
  sqlite3_prepare_v2: {
    parameters: [
      "pointer", // sqlite3 *db
      "buffer", // const char *zSql
      "i32", // int nByte
      "buffer", // sqlite3_stmt **ppStmt
      "pointer", // const char **pzTail
    ],
    result: "i32",
  },
  sqlite3_reset: {
    parameters: [
      "pointer", // sqlite3_stmt *pStmt
    ],
    result: "i32",
  },
  sqlite3_step: {
    parameters: [
      "pointer", // sqlite3_stmt *pStmt
    ],
    result: "i32",
  },

  sqlite3_column_int: {
    parameters: [
      "pointer", // sqlite3_stmt *pStmt
      "i32", // int iCol
    ],
    result: "i32",
  },
});

const {
  sqlite3_initialize,
  sqlite3_open_v2,
  sqlite3_exec,
  sqlite3_prepare_v2,
  sqlite3_reset,
  sqlite3_step,
  sqlite3_column_int,
} = symbols;

sqlite3_initialize();

const pHandle = new Uint32Array(2);
unwrap(
  sqlite3_open_v2(
    toCString(":memory:"),
    pHandle,
    SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_PRIVATECACHE |
      SQLITE3_OPEN_CREATE | SQLITE3_OPEN_MEMORY,
    null,
  ),
);

const db = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);

function exec(sql) {
  const _pErr = new Uint32Array(2);
  unwrap(sqlite3_exec(db, toCString(sql), null, null, _pErr));
}

exec("PRAGMA auto_vacuum = none");
exec("PRAGMA temp_store = memory");
exec("PRAGMA locking_mode = exclusive");
exec("PRAGMA user_version = 100");

const sql = `WITH RECURSIVE c(x) AS (
  VALUES(1)
  UNION ALL
  SELECT x+1 FROM c WHERE x<50
)
SELECT x, x as a FROM c;`;

function prepareStatement() {
  const pHandle = new Uint32Array(2);
  unwrap(
    sqlite3_prepare_v2(
      db,
      toCString(sql),
      sql.length,
      pHandle,
      null,
    ),
  );
  return Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
}

const prepared = prepareStatement();
function run(): number[] {
  const result: number[] = new Array(50);

  let status = SQLITE3_ROW;
  while(status === SQLITE3_ROW) {
    status = sqlite3_step(prepared);
    const int = sqlite3_column_int(prepared, 0);
    result[int] = int;
  }
  sqlite3_reset(prepared);
  return result;
}

console.log(`result: ${run()}`);

bench(run);
