import { useMemo, useRef, useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import Modal from './Modal';
import IconButton from './IconButton';
import { Form, Icon } from './UI';

export default function FilterToolbar({ search, primary, secondary, count = 0, onApply, onReset, label = 'Filtri', errors, validate }) {
  const form = useRef(null);
  const mobile = useMobile();
  const [open, setOpen] = useState(false);
  const [clientErrors, setClientErrors] = useState({});
  const [dismissedErrors, setDismissedErrors] = useState();
  const fieldErrors = useMemo(() => ({...errors, ...clientErrors}), [errors, clientErrors]);
  const showErrors = mobile && (Object.keys(clientErrors).length > 0 || (Object.keys(errors || {}).length > 0 && errors !== dismissedErrors));
  function dismiss() {
    form.current?.reset();
    setClientErrors({});
    setDismissedErrors(errors);
    setOpen(false);
  }
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries([...new FormData(event.currentTarget)].filter(([, value]) => value !== ''));
    const failures = validate?.(values) || {};
    setClientErrors(failures);
    if (Object.keys(failures).length) return;
    onApply(values);
    setOpen(false);
  }
  const apply = <IconButton action="search" type="submit" label="Applica filtri" />;
  const reset = <IconButton action="reset" label="Ripristina filtri" onClick={() => { form.current?.reset(); setClientErrors({}); setDismissedErrors(errors); onReset(); setOpen(false); }} />;
  return <Form ref={form} errors={fieldErrors} className={`portal-filter-toolbar ${search ? 'has-search' : ''}`} aria-label={label} onSubmit={submit}>
    {search && <div className="portal-filter-search"><Icon name="search" />{search}</div>}
    {!mobile && <div className="portal-filter-primary">{primary}</div>}
    <div className="portal-filter-actions">
      {(mobile || secondary) && <button type="button" className="button secondary filter-more" aria-haspopup="dialog" onClick={() => setOpen(true)}><Icon name="sliders" />{mobile ? 'Filtri' : 'Altri filtri'}{count > 0 && ` · ${count}`}</button>}
      {!mobile && apply}
      {reset}
    </div>
    <Modal open={open || showErrors} title={label} onClose={dismiss}>
      <div className="portal-filter-fields">{mobile && primary}{secondary}</div>
      <footer className="modal-actions">{apply}{reset}</footer>
    </Modal>
  </Form>;
}
