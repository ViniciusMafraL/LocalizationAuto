import { useAppState } from './store/useAppStore';
import { StageHeader } from './components/StageHeader/StageHeader';
import { Setup } from './stages/Setup/Setup';
import { Upload } from './stages/Upload/Upload';
import { Analyse } from './stages/Analyse/Analyse';
import { Report } from './stages/Report/Report';
import { ApiKeyGate } from './components/ApiKeyGate/ApiKeyGate';

export function App() {
  const { stage } = useAppState();

  return (
    <ApiKeyGate>
      <div>
        <StageHeader current={stage} />
        {stage === 'setup' && <Setup />}
        {stage === 'upload' && <Upload />}
        {stage === 'analyse' && <Analyse />}
        {stage === 'report' && <Report />}
      </div>
    </ApiKeyGate>
  );
}
