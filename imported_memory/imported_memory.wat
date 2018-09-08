(module
  (memory (import "import" "memory") 1)
  (func (export "double") (param $ptr i32) (param $len i32)
    (local $end i32)
    (set_local $end
      (i32.mul
        (i32.const 4)
        (i32.add (get_local $ptr) (get_local $len))))

    (loop $loop
      (i32.store (get_local $ptr)
        (i32.mul (i32.load (get_local $ptr)) (i32.const 2)))
      (br_if $loop
        (i32.lt_s
          (tee_local $ptr (i32.add (get_local $ptr) (i32.const 4)))
          (get_local $end)))
    )
))
