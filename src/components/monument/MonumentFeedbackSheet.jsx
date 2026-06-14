import MonumentSheet from './MonumentSheet';
import BetaFeedbackForm from '../BetaFeedbackForm';
import { monument, monumentType } from './monumentTokens';

export default function MonumentFeedbackSheet({
  open,
  route = 'overview',
  onClose,
}) {
  return (
    <MonumentSheet open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="px-[18px] pb-2">
        <p className={monumentType.label} style={{ color: monument.inkGhost }}>Beta</p>
        <h2 className={`mt-2.5 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>
          Send feedback
        </h2>
        <p className={`mt-2 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
          Tell us what happened — bugs, confusing screens, or ideas.
        </p>
        <div className="mt-4">
          <BetaFeedbackForm route={route} compact monument />
        </div>
      </div>
    </MonumentSheet>
  );
}
