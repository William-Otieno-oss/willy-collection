export function FormGroup({ children, className = "" }) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function FormLabel({ htmlFor, children, required = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 mb-2"
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
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
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helperText && <p className="text-gray-500 text-sm mt-1">{helperText}</p>}
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
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-none ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
          className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </FormGroup>
  );
}
