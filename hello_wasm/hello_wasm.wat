(module
    (func (export "passthroughI32") (param $value i32) (result i32)
      get_local $value)
    (func (export "passthroughF32") (param $value f32) (result f32)
      get_local $value)
)
