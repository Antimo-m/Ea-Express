import { useRef, useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import Modal from './Modal';
import IconButton from './IconButton';
import { Icon } from './UI';

export default function FilterToolbar({ search, primary, secondary, count = 0, onApply, onReset, label = 'Filtri' }) {
  const form = useRef(null);
  const mobile = useMobile();
  const [open, setOpen] = useState(false);
  function dismiss() {
    form.current?.reset();
    setOpen(false);
  }
  function submit(event) {
    event.preventDefault();
    onApply(Object.fromEntries([...new FormData(event.currentTarget)].filter(([, value]) => value !== '')));
    setOpen(false);
  }
  const apply = <IconButton action="search" type="submit" label="Applica filtri" />;
  const reset = <IconButton action="reset" label="Ripristina filtri" onClick={() => { form.current?.reset(); onReset(); setOpen(false); }} />;
  return <form ref={form} className={`portal-filter-toolbar ${search ? 'has-search' : ''}`} aria-label={label} onSubmit={submit}>
    {search && <div className="portal-filter-search"><Icon name="search" />{search}</div>}
    {!mobile && <div className="portal-filter-primary">{primary}</div>}
    <div className="portal-filter-actions">
      {(mobile || secondary) && <button type="button" className="button secondary filter-more" aria-haspopup="dialog" onClick={() => setOpen(true)}><Icon name="sliders" />{mobile ? 'Filtri' : 'Altri filtri'}{count > 0 && ` · ${count}`}</button>}
      {!mobile && apply}
      {reset}
    </div>
    <Modal open={open} title={label} onClose={dismiss}>
      <div className="portal-filter-fields">{mobile && primary}{secondary}</div>
      <footer className="modal-actions">{apply}{reset}</footer>
    </Modal>
  </form>;
}
