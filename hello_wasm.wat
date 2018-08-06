(module
    (func (export "add_one") (param $value i32) (result i32)
        get_local $value
        i32.const 1
        i32.add))
