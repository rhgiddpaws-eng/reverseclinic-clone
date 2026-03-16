const forwardedArgs = process.argv.slice(2);
process.argv = ["node", "scripts/build-mirror-pages.mjs", ...forwardedArgs];
await import("./build-mirror-pages.mjs");
