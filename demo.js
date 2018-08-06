(function() {
    async function loadAll({ name, desc, importObj }) {
        return fetch(`${name}.wasm`)
            .then(r => r.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes, importObj))
            // .then(wasm => wasm.instance.exports)
            .then(wasm => ({ name, desc, wasm, importObj }));
    }

    async function loadAllAsync({ name, desc, importObj }) {
        return WebAssembly.instantiateStreaming(fetch(`${name}.wasm`), importObj)
            // .then(wasm => wasm.instance.exports)
            .then(wasm => ({ name, desc, wasm, importObj }));
    }

    function loadExamples(examples) {
        window.examples = examples;
            Promise.all(examples.map(loadAllAsync)).then(function(results) {
            const windowVar = 'wasm';
            const { wasm, labels } = results.reduce(function(acc, { name, desc, wasm, importObj }) {
                acc.wasm[name] = Object.assign({ importObj }, wasm);
                acc.labels.push(`${windowVar}.${name} (${desc})`);
                return acc
            }, { wasm: {}, labels: [] });

            window[windowVar] = wasm;
            console.log(labels.join("\n"));
        })
        .catch(e => console.warn(e));
    }

    window.loadExamples = loadExamples;
})()
