import { Link } from 'react-router';
import { Icon } from './UI';
const icons = { message: 'chat-dots', confirm: 'check-lg', back: 'arrow-left', send: 'send', add: 'plus-lg', edit: 'pencil', delete: 'trash', search: 'search', print: 'printer', 'print-multiple': 'printer' };
export default function IconButton({ action = 'neutral', icon, label, to, loading = false, disabled = false, text = false, className = '', type = 'button', ...props }) {
  if (icon === 'arrow-left' && action === 'neutral') action = 'back';
  if (action === 'message') text = false;
  if (action === 'edit' && (!icon || ['pencil', 'pencil-square'].includes(icon))) text = false;
  const content = <><span className="action-icon" aria-hidden="true"><Icon name={icon || icons[action] || 'three-dots'} />{action === 'print-multiple' && <span className="print-plus">+</span>}</span>{text && <span>{label}</span>}</>;
  const attributes = { ...props, className: `icon-button action-${action} ${text ? 'action-with-text' : ''} ${className}`, 'aria-label': label, title: label, 'aria-busy': loading || undefined };
  if (to && !disabled && !loading) return <Link {...attributes} to={to}>{content}</Link>;
  return <button {...attributes} type={type} disabled={disabled || loading}>{content}</button>;
}
