import { bench } from "./bench.mjs";
import { dlopen, ptr } from "bun:ffi";

const { symbols } = dlopen("./hashing.dylib", {
    hash: {
        args: ["ptr", "i32"],
        returns: "i32",
    },
})

const { hash } = symbols;

const buffer = new Uint8Array(1024 * 10);
console.log('hashing', buffer.byteLength, "bytes:", hash(ptr(buffer), buffer.byteLength));
bench(() => hash(ptr(buffer), buffer.byteLength));