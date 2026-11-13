import React from 'react';
import { Download, FileText, Printer, ShieldCheck, X } from 'lucide-react';
import { useHudStore } from '../../stores/useHudStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { generateMissionPDF } from '../../utils/exportPdf';

export const PDFExportModal: React.FC = () => {
  const { activeModal, closeModal } = useHudStore();
  const { manifest } = useMissionStore();
  const { solvedRoute } = useRouteStore();

  if (activeModal !== 'pdf' || !manifest) return null;

  const handleDownload = () => {
    generateMissionPDF(manifest, solvedRoute);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-lg bg-mars-dark border border-mars-border rounded-xl shadow-2xl overflow-hidden text-xs">
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Header */}
        <div className="p-3.5 bg-mars-void border-b border-mars-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-mars-cyan" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-mars-text">
              Export NASA EVA Tactical Manifest
            </h3>
          </div>
          <button onClick={closeModal} className="p-1 rounded text-mars-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Preview */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-mars-void border border-mars-border space-y-2">
            <div className="flex justify-between text-mars-muted">
              <span>DOCUMENT:</span>
              <span className="text-mars-cyan font-bold">NASA-EVA-SOL001-FLIGHT.PDF</span>
            </div>
            <div className="flex justify-between text-mars-muted">
              <span>MISSION:</span>
              <span className="text-mars-text">{manifest.missionName}</span>
            </div>
            <div className="flex justify-between text-mars-muted">
              <span>CREW:</span>
              <span className="text-mars-text">{manifest.astronauts.map(a => a.name).join(', ')}</span>
            </div>
            <div className="flex justify-between text-mars-muted">
              <span>WAYPOINTS:</span>
              <span className="text-mars-text">{manifest.waypoints.length} Tactical Stops</span>
            </div>
            {solvedRoute && (
              <div className="flex justify-between text-mars-muted">
                <span>TOTAL DIST / DURATION:</span>
                <span className="text-mars-amber font-bold">
                  {(solvedRoute.totalDistanceMeters / 1000).toFixed(2)} km / {Math.round(solvedRoute.totalTimeSeconds / 60)} min
                </span>
              </div>
            )}
          </div>

          <p className="text-mars-muted leading-relaxed text-[11px]">
            This export compiles a print-ready NASA Flight Controller briefing sheet including waypoint coordinate fixes, dwell durations, metabolic oxygen budgets, cumulative radiation estimates, and emergency abort contingency protocols.
          </p>

          <div className="p-2.5 rounded bg-mars-cyan/10 border border-mars-cyan/30 text-[10px] text-mars-cyan flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Format: Standard Flight Hardcopy (A4 Vector PDF)</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-mars-void border-t border-mars-border flex items-center justify-between">
          <button
            onClick={closeModal}
            className="px-3 py-1.5 rounded border border-mars-border text-mars-muted hover:text-white font-heading text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded bg-mars-rust hover:bg-mars-rust-light text-white font-heading font-bold text-xs uppercase tracking-wider shadow-rust-glow transition-all flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Flight Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
