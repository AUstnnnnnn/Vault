import { useState } from 'react';

const PASSWORD = import.meta.env.VITE_APP_PASSWORD as string;
const SESSION_KEY = 'vault_auth';

export function useAuth() {
  return sessionStorage.getItem(SESSION_KEY) === 'ok';
}

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'ok');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  if (authed) return <>{children}</>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'ok');
      setAuthed(true);
    } else {
      setError(true);
      setShaking(true);
      setInput('');
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="gate">
      <div className={`gate-box ${shaking ? 'shake' : ''}`}>
        <div className="gate-logo">The Vault</div>
        <p className="gate-hint">Enter password to continue</p>
        <form onSubmit={submit} className="gate-form">
          <input
            className={`gate-input ${error ? 'error' : ''}`}
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
          />
          <button className="gate-btn" type="submit">Enter</button>
        </form>
        {error && <p className="gate-error">Wrong password</p>}
      </div>
    </div>
  );
}
