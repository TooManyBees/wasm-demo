(module
  (memory (export "memory") 1)
  (func (export "giveString") (param $ptr i32) (param $len i32)
    (; this function is a no-op ;))
  (func (export "getString") (result i32)
    i32.const 1024)
  (data (i32.const 1024) "☎️ Hello, world! 🌐\00"))
