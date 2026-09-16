import { useState } from 'react';
import { Field } from './UI';
const emptyPackage = () => ({ weight_kg: '', length_cm: '', width_cm: '', height_cm: '' });
export default function PackageFields({ order }) {
  const [count, setCount] = useState(order?.parcel_count || 1);
  const [packages, setPackages] = useState(order?.packages || Array.from({ length: count }, emptyPackage));
  const active = Array.from({ length: Math.max(1, Math.min(100, Number(count) || 1)) }, (_, index) => packages[index] || emptyPackage());
  return <div className="package-fields">
    <Field label="Numero di pacchi" name="parcel_count" type="number" min="1" max="100" required value={count} onChange={event => setCount(event.target.value)} />
    <input type="hidden" name="packages" value={JSON.stringify(active)} />
    {active.map((item, index) => <fieldset className="package-measurements" key={index}>
      <legend>Pacco {index + 1}</legend>
      <div className="form-grid">
        {[['weight_kg', 'Peso (kg)', 0.01, 1000], ['length_cm', 'Lunghezza (cm)', 1, 500], ['width_cm', 'Larghezza (cm)', 1, 500], ['height_cm', 'Altezza (cm)', 1, 500]].map(([name, label, min, max]) => <Field key={name} name={`packages.${index}.${name}`} label={label} type="number" inputMode="decimal" min={min} max={max} step="0.01" required value={item[name]} onChange={event => setPackages(previous => { const next = [...previous]; next[index] = {...item, [name]: event.target.value}; return next; })} />)}
      </div>
    </fieldset>)}
  </div>;
}
