const wasmPath = name => `${name}/${name}.wasm`;

async function loadAsync({ name, importObj }) {
    return WebAssembly.instantiateStreaming(fetch(wasmPath(name)), importObj)
        .then(wasm => wasm.instance.exports);
}

function exampleSource(name, importObj, prefix) {
    prefix = prefix || '';
    if (importObj) {
        return `
${prefix}
importObj = ${serialize(importObj)};
WebAssembly.instantiateStreaming(
    fetch("${name}.wasm"),
    importObj,
).then(wasm => { window.${name} = wasm.instance.exports; });
`.trim();
    } else {
        return `
${prefix}
WebAssembly.instantiateStreaming(fetch("${name}.wasm"), {})
.then(wasm => { window.${name} = wasm.instance.exports; });
`.trim();
    }
}

function fakeObj(source) {
    function f() {};
    f.toString = () => source;
    return f;
}
