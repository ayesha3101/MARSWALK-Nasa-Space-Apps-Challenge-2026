import React, { useEffect, useState } from 'react';
import { Award, BookOpen, CheckCircle, Database, FileText, Info, ShieldCheck, X } from 'lucide-react';
import { useHudStore } from '../../stores/useHudStore';

export const DataHonestyModal: React.FC = () => {
  const { activeModal, closeModal } = useHudStore();
  const [provenance, setProvenance] = useState<any>(null);

  useEffect(() => {
    if (activeModal === 'honesty') {
      fetch('/data/data_provenance.json')
        .then((res) => res.json())
        .then((data) => setProvenance(data))
        .catch((err) => console.error('Failed to load provenance:', err));
    }
  }, [activeModal]);

  if (activeModal !== 'honesty') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-mars-dark/95 border border-mars-border rounded-xl shadow-2xl flex flex-col font-mono overflow-hidden">
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Header */}
        <div className="p-3.5 bg-mars-void border-b border-mars-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-mars-cyan" />
            <h3 className="font-heading font-bold text-sm tracking-wider text-mars-text uppercase">
              Scientific Data Honesty & Provenance
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded text-mars-muted hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Core Philosophy Statement */}
          <div className="p-3 rounded-lg bg-mars-card border border-mars-border">
            <h4 className="font-heading font-bold text-xs text-mars-cyan uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-mars-cyan" />
              <span>NASA Space Apps Data Transparency Commitment</span>
            </h4>
            <p className="text-mars-muted text-[11px] leading-relaxed">
              Every pixel, slope gradient, and metabolic vector in MARSWALK is traceable to real NASA and USGS planetary datasets.
              Where specific instrument spatial footprints are interpolated or synthesized, they are explicitly tagged with <span className="text-mars-amber font-bold">[SIMULATED]</span> badges and documented here. We never fake silently.
            </p>
          </div>

          {/* Layer Provenance Table */}
          <div>
            <h4 className="font-heading font-bold text-xs text-mars-text uppercase tracking-wider mb-2">
              Cartographic & Geophysical Layers
            </h4>
            <div className="space-y-2">
              {provenance?.layers?.map((layer: any) => (
                <div
                  key={layer.id}
                  className="p-2.5 rounded border border-mars-border bg-mars-void/60 text-[11px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-mars-text">{layer.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        layer.simulated
                          ? 'bg-mars-amber/20 border border-mars-amber/40 text-mars-amber'
                          : 'bg-mars-cyan/20 border border-mars-cyan/40 text-mars-cyan'
                      }`}
                    >
                      {layer.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-mars-muted space-y-0.5">
                    <div><span className="text-mars-dim">Source:</span> {layer.source}</div>
                    <div><span className="text-mars-dim">Resolution:</span> {layer.resolution}</div>
                    <div><span className="text-mars-dim">Notes:</span> {layer.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical & Biophysical Models */}
          <div className="p-3 rounded bg-mars-void/40 border border-mars-border space-y-2">
            <h4 className="font-heading font-bold text-xs text-mars-text uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-mars-rust" />
              <span>Physiological & Terrain Models</span>
            </h4>
            <div className="text-[10px] text-mars-muted space-y-1 leading-relaxed">
              <div>
                <strong className="text-mars-text">Suit Mobility Limit (20°):</strong> Maximum safe slope traversable by a pressurized planetary spacesuit without mechanical winches or tether anchors. Slopes &gt;20° are treated as impassable barriers in the A* cost grid.
              </div>
              <div>
                <strong className="text-mars-text">Metabolic Oxygen Burn:</strong> Modeled after the Santee and Margaria-Minetti biophysical equations for planetary locomotion. Resting burn rate: 0.82 L/min; walking on flat terrain: 1.35 L/min; uphill 18° climb: up to 2.45 L/min.
              </div>
              <div>
                <strong className="text-mars-text">Radiation Model:</strong> MSL RAD baseline galactic cosmic ray (GCR) background of 27.2 µSv/h (0.65 mSv/sol), adjusted by atmospheric column density and topographic ridge shadowing.
              </div>
            </div>
          </div>

          {/* Attribution & Credits */}
          <div className="border-t border-mars-border/40 pt-3 flex items-center justify-between text-[10px] text-mars-muted">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-mars-amber" />
              <span>NASA Space Apps Challenge 2026 // Team Marswalk</span>
            </div>
            <span>JPL / Caltech / USGS / ESA</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-mars-void border-t border-mars-border flex justify-end">
          <button
            onClick={closeModal}
            className="py-1 px-4 rounded bg-mars-rust hover:bg-mars-rust-light text-white font-heading font-bold text-xs uppercase tracking-wider shadow-rust-glow transition-all"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
