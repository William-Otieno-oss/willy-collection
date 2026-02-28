export function FormGroup({ children, className = "" }) {
  return <div className={`mb-7 ${className}`}>{children}</div>;
}

export function FormLabel({ htmlFor, children, required = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-neutral-700 mb-2.5"
    >
      {children}
      {required && <span className="text-error ml-1.5">*</span>}
    </label>
  );
}

export function FormInput({
  label,
  error,
  required = false,
  helperText,
  ...props
}) {
  return (
    <FormGroup>
      {label && (
        <FormLabel htmlFor={props.id} required={required}>
          {label}
        </FormLabel>
      )}
      <input
        {...props}
        className={`form-input ${error ? "border-error focus:ring-error focus:border-error" : ""}`}
      />
      {error && <p className="form-error">{error}</p>}
      {helperText && <p className="form-helper">{helperText}</p>}
    </FormGroup>
  );
}

export function FormSelect({
  label,
  error,
  required = false,
  options,
  ...props
}) {
  return (
    <FormGroup>
      {label && (
        <FormLabel htmlFor={props.id} required={required}>
          {label}
        </FormLabel>
      )}
      <select
        {...props}
        className={`form-input ${error ? "border-error focus:ring-error focus:border-error" : ""}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </FormGroup>
  );
}

export function FormTextarea({ label, error, required = false, ...props }) {
  return (
    <FormGroup>
      {label && (
        <FormLabel htmlFor={props.id} required={required}>
          {label}
        </FormLabel>
      )}
      <textarea
        {...props}
        className={`form-input resize-none ${error ? "border-error focus:ring-error focus:border-error" : ""}`}
      />
      {error && <p className="form-error">{error}</p>}
    </FormGroup>
  );
}

export function FormCheckbox({ label, error, ...props }) {
  return (
    <FormGroup>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...props}
          className="w-4 h-4 border-neutral-300 rounded focus:ring-2 focus:ring-brand"
        />
        <span className="text-sm font-medium text-neutral-700">{label}</span>
      </label>
      {error && <p className="form-error">{error}</p>}
    </FormGroup>
  );
}
