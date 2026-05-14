import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { AppStateContext, AppDispatchContext, useAppReducer } from './store/useAppStore';

function Root() {
  const [state, dispatch] = useAppReducer();
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        <App />
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
