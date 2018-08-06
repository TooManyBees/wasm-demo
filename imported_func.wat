(module
    (func $logTime (import "import" "logTime") (param f64))
    (func $getTimestamp (import "import" "getTimestamp") (result f64))
    (func (export "sumNumbersUpto") (param $counter i32) (result i32)
        (local $sum i32)
        (local $elapsed f64)

        (set_local $elapsed
            (call $getTimestamp))

        (set_local $sum
            (i32.const 0))

        (loop $work_loop
            (set_local $counter
                (i32.sub
                    (get_local $counter)
                    (i32.const 1)))

            (set_local $sum
                (i32.add
                    (get_local $sum)
                    (get_local $counter)))

            (br_if $work_loop
                (get_local $counter)))

        (call $logTime
            (tee_local $elapsed
                (f64.sub
                    (call $getTimestamp)
                    (get_local $elapsed))))

        (get_local $sum)
        ))
