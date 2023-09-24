import {
  SQLITE3_OPEN_CREATE,
  SQLITE3_OPEN_MEMORY,
  SQLITE3_OPEN_PRIVATECACHE,
  SQLITE3_OPEN_READWRITE,
  SQLITE3_ROW,
  toCString,
  unwrap,
} from "./sqlite_shared.mjs";
import { dlopen } from "bun:ffi";
import { bench } from "./bench.mjs";

const { symbols } = dlopen("../sqlite3/build/libsqlite3_aarch64.dylib", {
  sqlite3_initialize: {
    args: [],
    returns: "i32",
  },
  sqlite3_open_v2: {
    args: [
      "ptr", // const char *filename
      "ptr", // sqlite3 **ppDb
      "i32", // int flags
      "u64", // const char *zVfs
    ],
    returns: "i32",
  },

  sqlite3_errstr: {
    args: ["i32" /** int errcode */],
    returns: "cstring",
  },

  sqlite3_prepare_v2: {
    args: [
      "u64", // sqlite3 *db
      "ptr", // const char *zSql
      "i32", // int nByte
      "ptr", // sqlite3_stmt **ppStmt
      "u64", // const char **pzTail
    ],
    returns: "i32",
  },

  sqlite3_exec: {
    args: [
      "u64", // sqlite3 *db
      "ptr", // const char *sql
      "u64", // sqlite3_callback callback
      "u64", // void *arg
      "ptr", // char **errmsg
    ],
    returns: "i32",
  },

  sqlite3_reset: {
    args: [
      "ptr", // sqlite3_stmt *pStmt
    ],
    returns: "i32",
  },

  sqlite3_step: {
    args: [
      "ptr", // sqlite3_stmt *pStmt
    ],
    returns: "i32",
  },

  sqlite3_column_int: {
    args: [
      "ptr", // sqlite3_stmt *pStmt
      "i32", // int iCol
    ],
    returns: "i32",
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

const db = pHandle[0] + 2 ** 32 * pHandle[1];

function exec(sql: string) {
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
SELECT x, x as a FROM c`;

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
  return (pHandle[0] + 2 ** 32 * pHandle[1]);
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
