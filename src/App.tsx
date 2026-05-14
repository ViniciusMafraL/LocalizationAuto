import { useAppState } from './store/useAppStore';
import { StageHeader } from './components/StageHeader/StageHeader';
import { Setup } from './stages/Setup/Setup';
import { Upload } from './stages/Upload/Upload';
import { Analyse } from './stages/Analyse/Analyse';
import { Report } from './stages/Report/Report';

export function App() {
  const { stage } = useAppState();

  return (
    <div>
      <StageHeader current={stage} />
      {stage === 'setup' && <Setup />}
      {stage === 'upload' && <Upload />}
      {stage === 'analyse' && <Analyse />}
      {stage === 'report' && <Report />}
    </div>
  );
}
