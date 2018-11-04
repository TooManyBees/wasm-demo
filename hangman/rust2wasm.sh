cargo build --release --target wasm32-unknown-unknown && cp ./target/wasm32-unknown-unknown/release/*.wasm dist && wasm-gc dist/*.wasm && cp src-web/* dist/
