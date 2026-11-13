import React, { useEffect, useRef, memo } from 'react';
import {
  Activity,
  Battery,
  Pause,
  Play,
  Radiation,
  RotateCcw,
  Thermometer,
  Zap
} from 'lucide-react';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useIsPhone, useIsDesktop } from '../../hooks/useMediaQuery';

export const TimelineScrubber: React.FC = memo(() => {
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const play = useTimelineStore((s) => s.play);
  const pause = useTimelineStore((s) => s.pause);
  const playbackSpeed = useTimelineStore((s) => s.playbackSpeed);
  const setSpeed = useTimelineStore((s) => s.setSpeed);
  const scrubToTime = useTimelineStore((s) => s.scrubToTime);

  // Consumables (now throttled at 5Hz in the store)
  const o2RemainingPercent = useTimelineStore((s) => s.o2RemainingPercent);
  const o2RemainingHours = useTimelineStore((s) => s.o2RemainingHours);
  const batteryRemainingPercent = useTimelineStore((s) => s.batteryRemainingPercent);
  const suitCoreTempC = useTimelineStore((s) => s.suitCoreTempC);
  const metabolicKcalHr = useTimelineStore((s) => s.metabolicKcalHr);
  const cumulativeRadUSv = useTimelineStore((s) => s.cumulativeRadUSv);

  const solvedRoute = useRouteStore((s) => s.solvedRoute);

  const isPhone = useIsPhone();
  const isDesktop = useIsDesktop();

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const currentTimeRef = useRef<number>(useTimelineStore.getState().currentTimeSec);

  const sliderRef = useRef<HTMLInputElement>(null);
  const timeDisplayRef = useRef<HTMLDivElement>(null);

  const totalTime = solvedRoute ? Math.max(1, solvedRoute.totalTimeSeconds) : 10800;

  const formatHoursMins = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // High performance playback loop: directly drives DOM input & readout without React re-render thrashing
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const nextTime = currentTimeRef.current + deltaSec * playbackSpeed * 18;

      if (nextTime >= totalTime) {
        currentTimeRef.current = totalTime;
        scrubToTime(totalTime);
        if (sliderRef.current) sliderRef.current.value = totalTime.toString();
        if (timeDisplayRef.current) {
          timeDisplayRef.current.textContent = `${formatHoursMins(totalTime)} / ${formatHoursMins(totalTime)}`;
        }
        pause();
      } else {
        currentTimeRef.current = nextTime;
        scrubToTime(nextTime);
        if (sliderRef.current) sliderRef.current.value = Math.round(nextTime).toString();
        if (timeDisplayRef.current) {
          timeDisplayRef.current.textContent = `${formatHoursMins(nextTime)} / ${formatHoursMins(totalTime)}`;
        }
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, totalTime, scrubToTime, pause]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    currentTimeRef.current = val;
    scrubToTime(val);
    if (timeDisplayRef.current) {
      timeDisplayRef.current.textContent = `${formatHoursMins(val)} / ${formatHoursMins(totalTime)}`;
    }
  };

  const handleReset = () => {
    currentTimeRef.current = 0;
    scrubToTime(0);
    if (sliderRef.current) sliderRef.current.value = '0';
    if (timeDisplayRef.current) {
      timeDisplayRef.current.textContent = `00:00:00 / ${formatHoursMins(totalTime)}`;
    }
  };

  // Mobile compact layout
  if (isPhone) {
    return (
      <div className="w-full bg-mars-void/95 backdrop-blur-hud border-t border-mars-border px-2 py-1 text-xs font-mono select-none">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => { if (isPlaying) pause(); else play(); }}
            className="p-2 rounded-lg bg-mars-rust hover:bg-mars-rust-light text-white shadow-rust-glow transition-all shrink-0 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <input
            ref={sliderRef}
            type="range"
            min="0"
            max={totalTime}
            step="1"
            defaultValue={currentTimeRef.current}
            onChange={handleSliderChange}
            className="flex-1 accent-mars-rust cursor-pointer h-2 bg-mars-dark rounded-lg touch-pan-x"
          />

          <div
            ref={timeDisplayRef}
            className="text-[10px] font-bold text-mars-cyan shrink-0 tabular-nums font-mono"
          >
            {formatHoursMins(currentTimeRef.current)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1 px-0.5">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleReset}
              className="p-1 rounded bg-mars-dark border border-mars-border text-mars-muted"
              title="Reset to Habitat"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <div className="flex rounded bg-mars-dark border border-mars-border p-0.5 text-[9px]">
              {([1, 5, 20] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    playbackSpeed === spd
                      ? 'bg-mars-cyan text-black font-bold'
                      : 'text-mars-muted'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[9px]">
            <span className={o2RemainingPercent < 25 ? 'text-mars-red' : 'text-mars-cyan'}>
              O₂ {o2RemainingPercent}%
            </span>
            <span className="text-mars-amber">{cumulativeRadUSv}µSv</span>
            <span className="text-mars-text">{suitCoreTempC}°C</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop / Tablet layout
  return (
    <div className="w-full bg-mars-void/95 backdrop-blur-hud border-t border-mars-border px-3 py-1.5 text-xs font-mono select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Playback Controls Cluster */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              if (isPlaying) pause();
              else play();
            }}
            className="p-2 rounded-xl bg-mars-rust hover:bg-mars-rust-light text-white shadow-rust-glow transition-all active:scale-95"
            title={isPlaying ? 'Pause Timeline' : 'Play EVA Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-mars-dark border border-mars-border text-mars-muted hover:text-white transition-all active:scale-95"
            title="Reset to Habitat Airlock (Start)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Buttons */}
          <div className="flex rounded-lg bg-mars-dark border border-mars-border p-0.5 text-[10px]">
            {([1, 5, 20] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  playbackSpeed === spd
                    ? 'bg-mars-cyan text-black font-bold shadow-hud-glow'
                    : 'text-mars-muted hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Direct DOM Time Readout */}
          <div
            ref={timeDisplayRef}
            className="px-2.5 py-1 rounded-lg bg-mars-card border border-mars-border text-[11px] font-bold text-mars-cyan tabular-nums tracking-wider"
          >
            {formatHoursMins(currentTimeRef.current)} / {formatHoursMins(totalTime)}
          </div>
        </div>

        {/* Timeline Range Scrubber */}
        <div className="flex-1 w-full mx-1 sm:mx-2 flex items-center space-x-2">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max={totalTime}
            step="1"
            defaultValue={currentTimeRef.current}
            onChange={handleSliderChange}
            className="w-full accent-mars-rust cursor-pointer h-2 bg-mars-dark rounded-lg"
          />
        </div>

        {/* Consumables Mini Telemetry (Throttled at 5Hz in store) */}
        {isDesktop && (
          <div className="flex items-center space-x-2 text-[10px] shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-mars-card border border-mars-border">
              <Activity className="w-3.5 h-3.5 text-mars-cyan" />
              <div>
                <span className="text-mars-muted">O₂: </span>
                <span className={`font-bold ${o2RemainingPercent < 25 ? 'text-mars-red animate-pulse' : 'text-mars-cyan'}`}>
                  {o2RemainingPercent}% ({o2RemainingHours}h)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-mars-card border border-mars-border">
              <Battery className="w-3.5 h-3.5 text-mars-amber" />
              <div>
                <span className="text-mars-muted">BATT: </span>
                <span className="font-bold text-mars-text">{batteryRemainingPercent}%</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-mars-card border border-mars-border">
              <Thermometer className="w-3.5 h-3.5 text-mars-text" />
              <div>
                <span className="text-mars-muted">SUIT: </span>
                <span className="font-bold text-mars-text">{suitCoreTempC}°C</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-mars-card border border-mars-border">
              <Radiation className="w-3.5 h-3.5 text-mars-amber" />
              <div>
                <span className="text-mars-muted">DOSE: </span>
                <span className="font-bold text-mars-amber">{cumulativeRadUSv} µSv</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TimelineScrubber.displayName = 'TimelineScrubber';
