import { useEffect, useState } from 'react';

const defaultValues = {
  name: '',
  description: '',
  isEnabled: true,
  isMastered: false
};

function DictionaryForm({ initialData, onSubmit, formId, isSubmitting }) {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setValues({
        name: initialData.name || '',
        description: initialData.description || '',
        isEnabled:
          initialData.isEnabled === undefined ? true : Boolean(initialData.isEnabled),
        isMastered: Boolean(initialData.isMastered)
      });
    } else {
      setValues(defaultValues);
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = values.name.trim();
    const trimmedDescription = values.description.trim();

    const nextErrors = {};
    if (!trimmedName) {
      nextErrors.name = 'Name is required.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      name: trimmedName,
      description: trimmedDescription ? trimmedDescription : null,
      isEnabled: values.isEnabled,
      isMastered: values.isMastered
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          placeholder="e.g. Travel Essentials"
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 ${
            errors.name ? 'border-red-400 focus:ring-red-500/60' : 'border-slate-300'
          }`}
          disabled={isSubmitting}
        />
        {errors.name ? (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange}
          placeholder="Add a short description for this dictionary (optional)."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <input
            type="checkbox"
            name="isEnabled"
            checked={values.isEnabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            disabled={isSubmitting}
          />
          <div>
            <p className="text-sm font-medium text-slate-800">Enabled</p>
            <p className="text-xs text-slate-500">
              Enabled dictionaries are available for learning experiences.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <input
            type="checkbox"
            name="isMastered"
            checked={values.isMastered}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            disabled={isSubmitting}
          />
          <div>
            <p className="text-sm font-medium text-slate-800">Mastered</p>
            <p className="text-xs text-slate-500">
              Mark as mastered when all words in this dictionary are learned.
            </p>
          </div>
        </label>
      </div>
    </form>
  );
}

export default DictionaryForm;
