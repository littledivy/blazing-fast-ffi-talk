import { bench } from "./bench.mjs";
const { symbols } = Deno.dlopen("./hashing.dylib", {
    hash: {
        parameters: ["buffer", "i32"],
        result: "i32",
    },
})

const { hash } = symbols;

const buffer = new Uint8Array(1024 * 10);
console.log('hashing', buffer.byteLength, "bytes:", hash(buffer, buffer.byteLength));
bench(() => hash(buffer, buffer.byteLength));