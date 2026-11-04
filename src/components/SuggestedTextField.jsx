import { useContext, useEffect, useId, useRef, useState } from 'react';
import { FormErrorsContext } from '../context/FormErrorsContext';
import { useApi } from '../hooks/useApi';
import { loadTextPolicy } from '../services/text-policy';
import { portalTextError } from '../utils/text-policy';
import { Field } from './UI';

export default function SuggestedTextField({ name, formName = name, value, onChange, suggestions = [], label, help, width, readOnly = false, ...props }) {
  const list = useId();
  const input = useRef(null);
  const errors = useContext(FormErrorsContext);
  const [clearedErrors, setClearedErrors] = useState();
  const resource = useApi(loadTextPolicy);
  const localError = readOnly ? null : portalTextError(value, resource.data);
  const fieldErrors = localError ? [localError] : errors[name] !== clearedErrors ? errors[name] : undefined;

  useEffect(() => {
    input.current?.setCustomValidity(localError || '');
  }, [localError]);

  return <>
    <FormErrorsContext.Provider value={{...errors, [name]: fieldErrors}}>
      <Field name={name} label={label} width={width} help={<>{help}{resource.error && <span role="status"> Controllo del testo non disponibile. <button type="button" className="button secondary" onClick={resource.reload}>Riprova</button></span>}</>}>
        <input {...props} readOnly={readOnly} ref={input} name={formName} value={value} list={readOnly ? undefined : list} onChange={event => {
          setClearedErrors(errors[name]);
          event.currentTarget.setCustomValidity(portalTextError(event.target.value, resource.data) || '');
          onChange(event);
        }} />
      </Field>
    </FormErrorsContext.Provider>
    {!readOnly && <datalist id={list}>{suggestions.map(option => <option key={option} value={option} />)}</datalist>}
  </>;
}
