(module
  (memory $memory 1 3)
  (export "memory" (memory $memory))
  (func (export "grow") (result i32)
    (grow_memory (i32.const 1)))
  (func (export "store") (param $val f64)
    (f64.store (i32.const 0) (get_local $val)))
)
