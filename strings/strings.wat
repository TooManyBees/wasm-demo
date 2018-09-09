(module
  (memory (export "memory") 1)
  (func (export "getString") (result i32)
    i32.const 1024)
  (data (i32.const 1024) "☎️ Hello, world! 🌐\00"))
