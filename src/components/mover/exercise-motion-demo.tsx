import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  getExerciseMotionType,
  type ExerciseMotionType,
} from "@/lib/mover/exercise-motion";

type Props = {
  name: string;
  className?: string;
};

const person = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const equipment = {
  fill: "none",
  stroke: "var(--subtle-foreground)",
  strokeWidth: 5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Pose({ phase, children }: { phase: "a" | "b"; children: ReactNode }) {
  return <g className={`exercise-motion-pose exercise-motion-pose-${phase}`}>{children}</g>;
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="10" {...person} />;
}

function Dumbbell({ x, y, vertical = false }: { x: number; y: number; vertical?: boolean }) {
  return vertical ? (
    <g stroke="var(--primary)" strokeWidth="5" strokeLinecap="round">
      <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
      <line x1={x - 6} y1={y - 8} x2={x + 6} y2={y - 8} />
      <line x1={x - 6} y1={y + 8} x2={x + 6} y2={y + 8} />
    </g>
  ) : (
    <g stroke="var(--primary)" strokeWidth="5" strokeLinecap="round">
      <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
      <line x1={x - 8} y1={y - 6} x2={x - 8} y2={y + 6} />
      <line x1={x + 8} y1={y - 6} x2={x + 8} y2={y + 6} />
    </g>
  );
}

function Direction({ path, reverse = false }: { path: string; reverse?: boolean }) {
  return (
    <g className={cn("exercise-motion-direction", reverse && "exercise-motion-direction-reverse")}>
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray="5 7" />
      <circle r="5" fill="var(--primary)">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={path} keyPoints={reverse ? "1;0" : "0;1"} keyTimes="0;1" />
      </circle>
    </g>
  );
}

function Squat() {
  return <>
    <line x1="62" y1="154" x2="258" y2="154" {...equipment} />
    <Pose phase="a"><Head cx={160} cy={42} /><path d="M160 54 L160 102 M160 68 L132 82 M160 68 L188 82 M160 102 L140 126 L138 151 M160 102 L180 126 L182 151" {...person} /><Dumbbell x={160} y={72} vertical /></Pose>
    <Pose phase="b"><Head cx={160} cy={67} /><path d="M160 79 L151 115 M156 91 L132 101 M156 91 L180 101 M151 115 L124 125 L138 151 M151 115 L180 126 L182 151" {...person} /><Dumbbell x={156} y={95} vertical /></Pose>
    <Direction path="M218 62 L218 125" />
  </>;
}

function LegPress() {
  return <>
    <path d="M74 137 L115 137 L137 106 M74 137 L62 154 M93 137 L86 154 M231 42 L260 128" {...equipment} />
    <Pose phase="a"><Head cx={111} cy={94} /><path d="M122 101 L151 119 L178 101 L225 82 M151 119 L128 138 M124 107 L151 87" {...person} /></Pose>
    <Pose phase="b"><Head cx={111} cy={94} /><path d="M122 101 L151 119 L190 121 L239 113 M151 119 L128 138 M124 107 L151 87" {...person} /></Pose>
    <Direction path="M194 66 L240 90" />
  </>;
}

function SplitSquat() {
  return <>
    <line x1="55" y1="154" x2="270" y2="154" {...equipment} /><path d="M215 111 L265 111 M222 111 L222 154 M258 111 L258 154" {...equipment} />
    <Pose phase="a"><Head cx={158} cy={42} /><path d="M158 54 L158 101 M158 68 L137 91 M158 68 L179 91 M158 101 L136 126 L126 153 M158 101 L196 119 L230 111" {...person} /><Dumbbell x={137} y={94} vertical /><Dumbbell x={179} y={94} vertical /></Pose>
    <Pose phase="b"><Head cx={158} cy={67} /><path d="M158 79 L158 119 M158 91 L137 114 M158 91 L179 114 M158 119 L133 130 L126 153 M158 119 L196 135 L230 111" {...person} /><Dumbbell x={137} y={117} vertical /><Dumbbell x={179} y={117} vertical /></Pose>
    <Direction path="M94 64 L94 127" />
  </>;
}

function StepUp() {
  return <>
    <line x1="47" y1="154" x2="272" y2="154" {...equipment} /><path d="M172 119 L248 119 L248 154 M172 119 L172 154" {...equipment} />
    <Pose phase="a"><Head cx={124} cy={48} /><path d="M124 60 L126 105 M125 73 L105 99 M125 73 L146 99 M126 105 L105 130 L100 153 M126 105 L159 119 L184 119" {...person} /><Dumbbell x={105} y={102} vertical /><Dumbbell x={146} y={102} vertical /></Pose>
    <Pose phase="b"><Head cx={183} cy={38} /><path d="M183 50 L183 91 M183 62 L163 87 M183 62 L203 87 M183 91 L184 119 M183 91 L222 118 L225 151" {...person} /><Dumbbell x={163} y={90} vertical /><Dumbbell x={203} y={90} vertical /></Pose>
    <Direction path="M94 121 Q119 71 159 55" />
  </>;
}

function Hinge() {
  return <>
    <line x1="60" y1="154" x2="260" y2="154" {...equipment} />
    <Pose phase="a"><Head cx={157} cy={42} /><path d="M157 54 L158 102 M158 68 L138 105 M158 68 L178 105 M158 102 L143 126 L142 152 M158 102 L176 126 L178 152" {...person} /><Dumbbell x={138} y={110} vertical /><Dumbbell x={178} y={110} vertical /></Pose>
    <Pose phase="b"><Head cx={111} cy={76} /><path d="M121 80 L166 103 M139 89 L137 128 M148 94 L177 126 M166 103 L153 126 L151 152 M166 103 L180 127 L180 152" {...person} /><Dumbbell x={137} y={133} vertical /><Dumbbell x={177} y={131} vertical /></Pose>
    <Direction path="M218 68 Q193 82 182 112" />
  </>;
}

function GluteBridge() {
  return <>
    <line x1="48" y1="146" x2="272" y2="146" {...equipment} /><path d="M67 108 L105 108 L111 146" {...equipment} />
    <Pose phase="a"><Head cx={102} cy={111} /><path d="M113 116 L161 133 L202 119 L225 145 M161 133 L143 145 M134 124 L158 105" {...person} /></Pose>
    <Pose phase="b"><Head cx={102} cy={111} /><path d="M113 116 L159 102 L202 119 L225 145 M159 102 L142 123 M134 110 L159 91" {...person} /><Dumbbell x={159} y={103} /></Pose>
    <Direction path="M159 135 L159 91" reverse />
  </>;
}

function ChestPress() {
  return <>
    <path d="M75 126 L238 126 M92 126 L85 153 M221 126 L228 153" {...equipment} />
    <Pose phase="a"><Head cx={100} cy={111} /><path d="M112 112 L175 113 L207 126 M140 113 L140 79 L130 61 M170 113 L170 79 L180 61 M175 113 L207 126 L225 151" {...person} /><Dumbbell x={130} y={57} /><Dumbbell x={180} y={57} /></Pose>
    <Pose phase="b"><Head cx={100} cy={111} /><path d="M112 112 L175 113 L207 126 M140 113 L124 94 L112 91 M170 113 L186 94 L198 91 M175 113 L207 126 L225 151" {...person} /><Dumbbell x={108} y={91} /><Dumbbell x={202} y={91} /></Pose>
    <Direction path="M226 105 L226 57" reverse />
  </>;
}

function Row() {
  return <>
    <line x1="54" y1="153" x2="269" y2="153" {...equipment} /><path d="M211 48 L258 48 L258 153 M236 48 L236 110" {...equipment} />
    <Pose phase="a"><Head cx={112} cy={74} /><path d="M123 79 L165 105 L179 137 M142 91 L198 101 M161 103 L205 126 M165 105 L138 127 L130 153" {...person} /><Dumbbell x={204} y={102} vertical /></Pose>
    <Pose phase="b"><Head cx={112} cy={74} /><path d="M123 79 L165 105 L179 137 M142 91 L172 80 L191 93 M161 103 L205 126 M165 105 L138 127 L130 153" {...person} /><Dumbbell x={195} y={95} vertical /></Pose>
    <Direction path="M218 81 L177 81" reverse />
  </>;
}

function Pulldown() {
  return <>
    <path d="M73 153 L73 33 L247 33 L247 153 M119 33 L201 33 M160 33 L160 53 M130 143 L190 143 M160 143 L160 153" {...equipment} />
    <Pose phase="a"><Head cx={160} cy={76} /><path d="M160 88 L160 128 M160 98 L126 66 L119 43 M160 98 L194 66 L201 43 M160 128 L142 143 M160 128 L178 143" {...person} /></Pose>
    <Pose phase="b"><Head cx={160} cy={76} /><path d="M160 88 L160 128 M160 98 L136 105 L122 94 M160 98 L184 105 L198 94 M160 128 L142 143 M160 128 L178 143" {...person} /></Pose>
    <Direction path="M221 54 L221 111" />
  </>;
}

function ShoulderPress() {
  return <>
    <path d="M111 139 L207 139 M126 139 L120 154 M192 139 L198 154" {...equipment} />
    <Pose phase="a"><Head cx={159} cy={67} /><path d="M159 79 L159 124 M159 91 L134 102 L125 119 M159 91 L184 102 L193 119 M159 124 L143 139 M159 124 L175 139" {...person} /><Dumbbell x={125} y={121} /><Dumbbell x={193} y={121} /></Pose>
    <Pose phase="b"><Head cx={159} cy={67} /><path d="M159 79 L159 124 M159 91 L139 68 L139 42 M159 91 L179 68 L179 42 M159 124 L143 139 M159 124 L175 139" {...person} /><Dumbbell x={139} y={38} /><Dumbbell x={179} y={38} /></Pose>
    <Direction path="M222 119 L222 43" reverse />
  </>;
}

function LateralRaise() {
  return <>
    <line x1="62" y1="153" x2="258" y2="153" {...equipment} />
    <Pose phase="a"><Head cx={160} cy={42} /><path d="M160 54 L160 105 M160 70 L140 102 L132 123 M160 70 L180 102 L188 123 M160 105 L145 130 L144 153 M160 105 L175 130 L176 153" {...person} /><Dumbbell x={130} y={126} /><Dumbbell x={190} y={126} /></Pose>
    <Pose phase="b"><Head cx={160} cy={42} /><path d="M160 54 L160 105 M160 70 L121 72 L91 72 M160 70 L199 72 L229 72 M160 105 L145 130 L144 153 M160 105 L175 130 L176 153" {...person} /><Dumbbell x={87} y={72} /><Dumbbell x={233} y={72} /></Pose>
    <Direction path="M76 125 Q68 87 88 61" reverse />
  </>;
}

function RearPull() {
  return <>
    <path d="M256 41 L256 153 M242 58 L256 58" {...equipment} />
    <Pose phase="a"><Head cx={124} cy={50} /><path d="M124 62 L132 108 M128 74 L171 78 L216 59 M132 108 L116 132 L114 153 M132 108 L153 132 L155 153" {...person} /></Pose>
    <Pose phase="b"><Head cx={124} cy={50} /><path d="M124 62 L132 108 M128 74 L158 64 L183 49 M128 74 L158 85 L184 91 M132 108 L116 132 L114 153 M132 108 L153 132 L155 153" {...person} /></Pose>
    <Direction path="M224 76 L179 76" reverse />
  </>;
}

function Curl() {
  return <>
    <line x1="62" y1="153" x2="258" y2="153" {...equipment} />
    <Pose phase="a"><Head cx={160} cy={42} /><path d="M160 54 L160 105 M160 70 L140 100 L135 125 M160 70 L180 100 L185 125 M160 105 L145 130 L144 153 M160 105 L175 130 L176 153" {...person} /><Dumbbell x={135} y={129} /><Dumbbell x={185} y={129} /></Pose>
    <Pose phase="b"><Head cx={160} cy={42} /><path d="M160 54 L160 105 M160 70 L140 90 L133 72 M160 70 L180 100 L185 125 M160 105 L145 130 L144 153 M160 105 L175 130 L176 153" {...person} /><Dumbbell x={131} y={68} /><Dumbbell x={185} y={129} /></Pose>
    <Direction path="M104 126 Q92 89 116 64" reverse />
  </>;
}

function Triceps() {
  return <>
    <path d="M247 35 L247 153 M219 41 L247 41 M219 41 L219 83" {...equipment} />
    <Pose phase="a"><Head cx={145} cy={48} /><path d="M145 60 L151 107 M149 73 L177 85 L201 78 M151 107 L136 132 L135 153 M151 107 L169 132 L171 153" {...person} /></Pose>
    <Pose phase="b"><Head cx={145} cy={48} /><path d="M145 60 L151 107 M149 73 L177 85 L198 116 M151 107 L136 132 L135 153 M151 107 L169 132 L171 153" {...person} /></Pose>
    <Direction path="M219 76 L219 126" />
  </>;
}

function CalfRaise() {
  return <>
    <line x1="72" y1="154" x2="248" y2="154" {...equipment} /><rect x="127" y="145" width="66" height="9" rx="3" fill="var(--subtle-foreground)" />
    <Pose phase="a"><Head cx={160} cy={45} /><path d="M160 57 L160 107 M160 72 L137 98 M160 72 L183 98 M160 107 L145 132 L143 146 M160 107 L175 132 L177 146" {...person} /><Dumbbell x={137} y={102} vertical /><Dumbbell x={183} y={102} vertical /></Pose>
    <Pose phase="b"><Head cx={160} cy={35} /><path d="M160 47 L160 97 M160 62 L137 88 M160 62 L183 88 M160 97 L145 122 L143 145 M160 97 L175 122 L177 145" {...person} /><Dumbbell x={137} y={92} vertical /><Dumbbell x={183} y={92} vertical /></Pose>
    <Direction path="M216 128 L216 72" reverse />
  </>;
}

function DeadBug() {
  return <>
    <line x1="45" y1="142" x2="275" y2="142" {...equipment} />
    <Pose phase="a"><Head cx={101} cy={126} /><path d="M112 129 L161 129 M132 129 L129 91 M145 129 L166 103 L184 112 M161 129 L181 109 L203 116" {...person} /></Pose>
    <Pose phase="b"><Head cx={101} cy={126} /><path d="M112 129 L161 129 M132 129 L109 93 L91 74 M145 129 L166 103 L184 112 M161 129 L206 132 L241 132" {...person} /></Pose>
    <Direction path="M206 88 Q230 103 241 130" />
  </>;
}

function PallofPress() {
  return <>
    <path d="M251 34 L251 153 M231 81 L251 81" {...equipment} /><line x1="60" y1="153" x2="260" y2="153" {...equipment} />
    <Pose phase="a"><Head cx={140} cy={43} /><path d="M140 55 L140 105 M140 70 L169 82 L190 82 M140 105 L126 130 L125 153 M140 105 L155 130 L156 153" {...person} /></Pose>
    <Pose phase="b"><Head cx={140} cy={43} /><path d="M140 55 L140 105 M140 70 L177 70 L218 70 M140 105 L126 130 L125 153 M140 105 L155 130 L156 153" {...person} /></Pose>
    <Direction path="M176 112 L218 112" />
  </>;
}

function MotionFigure({ type }: { type: ExerciseMotionType }) {
  switch (type) {
    case "squat": return <Squat />;
    case "leg-press": return <LegPress />;
    case "split-squat": return <SplitSquat />;
    case "step-up": return <StepUp />;
    case "hinge": return <Hinge />;
    case "glute-bridge": return <GluteBridge />;
    case "chest-press": return <ChestPress />;
    case "row": return <Row />;
    case "pulldown": return <Pulldown />;
    case "shoulder-press": return <ShoulderPress />;
    case "lateral-raise": return <LateralRaise />;
    case "rear-pull": return <RearPull />;
    case "curl": return <Curl />;
    case "triceps": return <Triceps />;
    case "calf-raise": return <CalfRaise />;
    case "dead-bug": return <DeadBug />;
    case "pallof-press": return <PallofPress />;
  }
}

export function ExerciseMotionDemo({ name, className }: Props) {
  const type = getExerciseMotionType(name);
  if (!type) return null;

  return (
    <div
      role="img"
      aria-label={`Demostración animada de ${name}`}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(145deg,var(--accent-bg),var(--surface-alt))] text-foreground",
        className,
      )}
    >
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-primary/15 bg-background/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary shadow-sm backdrop-blur-sm">
        <span className="exercise-motion-live-dot size-2 rounded-full bg-primary" />
        Movimiento guía
      </div>
      <svg viewBox="0 0 320 180" className="h-full w-full max-w-3xl" aria-hidden="true">
        <MotionFigure type={type} />
      </svg>
      <div className="absolute bottom-3 right-4 rounded-full bg-background/75 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
        inicio · fin
      </div>
    </div>
  );
}
