import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal">
          <h1>Qualcosa non ha funzionato.</h1>
          <p>Ricarica la pagina per riprendere il lavoro.</p>
          <button className="button" onClick={() => window.location.reload()}>
            Ricarica
          </button>
        </main>
      );
    return this.props.children;
  }
}
