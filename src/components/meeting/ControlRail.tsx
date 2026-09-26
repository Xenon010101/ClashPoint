"use client";

import { CircleStop, ListChecks, Pause, Play, RotateCcw } from "lucide-react";

type InputMode = "script" | "manual" | "microphone";
type MeetingStatus = "active" | "paused" | "stopped" | "degraded";

export function ControlRail(props: {
  status: MeetingStatus; judgeMode: boolean; mode: InputMode; inputDisabled: boolean; runningScript: boolean; processing: boolean; scriptPosition: number; scriptLength: number; lastTiming: number | null;
  onResume: () => void; onPause: () => void; onStop: () => void; onReset: () => void; onJudgeMode: () => void; onMode: (mode: InputMode) => void; onNextBeat: () => void; onRunScript: () => void;
}) {
  const complete = props.scriptPosition === props.scriptLength;
  return <footer className="control-rail">
    <div className="meeting-controls">
      {props.status === "paused" || props.status === "stopped" ? <button onClick={props.onResume}><Play aria-hidden="true" /> Resume</button> : <button onClick={props.onPause}><Pause aria-hidden="true" /> Pause</button>}
      <button onClick={props.onStop}><CircleStop aria-hidden="true" /> Stop</button><button onClick={props.onReset}><RotateCcw aria-hidden="true" /> Reset</button>
      <button className={props.judgeMode ? "judge-toggle active" : "judge-toggle"} onClick={props.onJudgeMode} aria-pressed={props.judgeMode}><ListChecks aria-hidden="true" /> Judge guide</button>
    </div>
    <div className="mode-tabs" aria-label="Input mode">{(["script", "manual", "microphone"] as InputMode[]).map((item) => <button key={item} className={props.mode === item ? "active" : ""} aria-pressed={props.mode === item} onClick={() => props.onMode(item)}>{item}</button>)}</div>
    <div className="rail-action">
      {props.mode === "script" && <><button className="run-script" onClick={props.onNextBeat} disabled={props.inputDisabled || props.runningScript || props.processing || complete}>Next demo beat</button><button onClick={props.onRunScript} disabled={props.inputDisabled || props.runningScript || props.processing || complete}><Play aria-hidden="true" />{props.runningScript ? "Running script" : complete ? "Demo complete" : "Run demo script"}</button></>}
      <span className="timing">{props.lastTiming === null ? "—" : props.lastTiming < 1 ? "<1 ms" : `${props.lastTiming} ms`}</span>
    </div>
  </footer>;
}
