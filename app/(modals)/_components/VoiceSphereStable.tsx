import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Mic } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';

/**
 * =====================================================================
 *  LEORA Voice Sphere — Stable React Native Port
 *  Based on HTML canvas reference implementation
 * =====================================================================
 */

// ==================== TYPES ====================
export type VoiceSphereStage = 'idle' | 'listening' | 'analyzing' | 'complete';

export interface VoiceSphereProps {
  /** Current animation stage */
  stage: VoiceSphereStage;
  /** Sphere diameter in pixels */
  size?: number;
  /** Voice input level 0..1 (used in listening mode) */
  inputLevel?: number;
  /** Accent color for idle icon */
  accentColor?: string;
  /** Analysis duration in ms before morphing to checkmark */
  analysisDuration?: number;
  /** Callback when analysis completes */
  onAnalysisComplete?: () => void;
}

// ==================== CONSTANTS ====================
const NUM_LINES = 16;
const NUM_POINTS = 60;
const PI = Math.PI;

// Pre-calculated line configurations (same as reference)
interface LineConfig {
  t: number;
  phase: number;
  ampVar: number;
  vSpread: number;
  speed: number;
  alpha: number;
}

interface PointConfig {
  t: number;
  env: number;
}

const LINE_CONFIGS: LineConfig[] = (() => {
  const arr: LineConfig[] = [];
  for (let i = 0; i < NUM_LINES; i++) {
    const t = i / (NUM_LINES - 1);
    arr.push({
      t,
      phase: t * PI * 2.2 + Math.sin(t * PI * 2.5) * 0.6,
      ampVar: 0.5 + Math.sin(t * PI * 2 + 0.3) * 0.5,
      vSpread: (t - 0.5) * 50,
      speed: 0.8 + t * 0.4,
      alpha: 0.15 + Math.sin(t * PI) * 0.45,
    });
  }
  return arr;
})();

const POINT_CONFIGS: PointConfig[] = (() => {
  const arr: PointConfig[] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    const nodes = Math.abs(Math.cos(t * PI * 3));
    arr.push({
      t,
      env: 0.15 + nodes * 0.85,
    });
  }
  return arr;
})();

// Colors from reference
const COLORS = {
  cyan: '#4dd0ff',
  purple: '#a45bff',
  pink: '#ff65e6',
  blue: '#3b82f6',
} as const;

// ==================== UTILITIES ====================
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const clamp01 = (x: number) => clamp(x, 0, 1);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ==================== WAVE PATH COMPUTATION ====================
interface WavePath {
  d: string;
  opacity: number;
  width: number;
  gradient: 'top' | 'bottom' | 'checkTop' | 'checkBottom';
  dashed?: number[];
}

/**
 * Get checkmark point at parameter t (0..1)
 * Matches reference implementation
 */
function getCheckPoint(
  t: number,
  cx: number,
  cy: number,
  r: number
): [number, number] {
  const s = r * 0.75;
  const sx = cx - s * 0.55;
  const sy = cy + s * 0.05;
  const mx = cx - s * 0.15;
  const my = cy + s * 0.45;
  const ex = cx + s * 0.55;
  const ey = cy - s * 0.4;

  if (t < 0.4) {
    const lt = t / 0.4;
    return [lerp(sx, mx, lt), lerp(sy, my, lt)];
  } else {
    const lt = (t - 0.4) / 0.6;
    return [lerp(mx, ex, lt), lerp(my, ey, lt)];
  }
}

/**
 * Compute wave paths with optional morph to checkmark
 */
function computeWavePaths(
  radius: number,
  time: number,
  intensity: number,
  morphProgress: number = 0
): WavePath[] {
  if (radius <= 0) return [];

  const cx = radius;
  const cy = radius;
  const r = radius * 0.94;
  const waveWidth = r * 2.1;
  const startX = cx - r * 1.05;
  const easedMorph = easeInOutCubic(morphProgress);

  const paths: WavePath[] = [];

  // Main wave ribbons (top and bottom)
  for (let ribbon = 0; ribbon < 2; ribbon++) {
    const vDir = ribbon === 0 ? -1 : 1;
    const baseOff = ribbon === 0 ? -25 : 25;
    const tDir = ribbon === 0 ? 1 : -1;
    const waveGradient: 'top' | 'bottom' = ribbon === 0 ? 'top' : 'bottom';
    const checkGradient: 'checkTop' | 'checkBottom' =
      ribbon === 0 ? 'checkTop' : 'checkBottom';

    for (let li = 0; li < LINE_CONFIGS.length; li++) {
      const ld = LINE_CONFIGS[li];
      const checkSpread = (ld.t - 0.5) * 12 * (1 - easedMorph * 0.7);

      let d = '';
      for (let pi = 0; pi < POINT_CONFIGS.length; pi++) {
        const pd = POINT_CONFIGS[pi];
        const t = pd.t;

        // Wave calculations
        const w1 =
          Math.sin(t * PI * 3 + time * ld.speed * tDir + ld.phase) *
          70 *
          ld.ampVar;
        const w2 =
          Math.sin(t * PI * 2 + time * 0.7 * tDir + ld.phase * 0.6) *
          35 *
          ld.ampVar;
        const w3 =
          Math.sin(t * PI * 5 + time * 1.2 * tDir + ld.t * PI * 1.5) * 18;

        const waveY = (w1 + w2 + w3) * pd.env;

        // Wave position
        const wx = startX + t * waveWidth;
        const wy =
          cy +
          waveY * intensity * vDir +
          (baseOff + ld.vSpread) * intensity * pd.env;

        // Checkmark position
        const [chkX, chkY] = getCheckPoint(t, cx, cy, r);

        // Morph between wave and checkmark
        const fx = lerp(wx, chkX, easedMorph);
        const fy = lerp(wy, chkY + checkSpread * vDir, easedMorph);

        if (pi === 0) {
          d += `M${fx.toFixed(2)},${fy.toFixed(2)} `;
        } else {
          d += `L${fx.toFixed(2)},${fy.toFixed(2)} `;
        }
      }

      const lineWidth = lerp(0.8, 9, easedMorph);
      const alpha = ld.alpha * (0.4 + intensity * 0.6) * lerp(1, 1.5, easedMorph);

      paths.push({
        d: d.trim(),
        opacity: alpha,
        width: lineWidth,
        gradient: easedMorph < 0.5 ? waveGradient : checkGradient,
      });
    }
  }

  // Dashed accent lines (only when not morphing)
  if (morphProgress < 0.5 && intensity > 0.1) {
    const dashAlpha = (1 - morphProgress * 2) * (0.4 + intensity * 0.3);

    for (let ribbon = 0; ribbon < 2; ribbon++) {
      const vDir = ribbon === 0 ? -1 : 1;
      const tDir = ribbon === 0 ? 1 : -1;

      let d = '';
      for (let pi = 0; pi < POINT_CONFIGS.length; pi++) {
        const pd = POINT_CONFIGS[pi];
        const t = pd.t;

        const w1 = Math.sin(t * PI * 3 + time * tDir) * 55;
        const w2 = Math.sin(t * PI * 2 + time * 0.6 * tDir) * 28;
        const waveY = (w1 + w2) * pd.env;

        const wx = startX + t * waveWidth;
        const wy = cy + waveY * intensity * vDir + 25 * intensity * pd.env * vDir;

        if (pi === 0) {
          d += `M${wx.toFixed(2)},${wy.toFixed(2)} `;
        } else {
          d += `L${wx.toFixed(2)},${wy.toFixed(2)} `;
        }
      }

      paths.push({
        d: d.trim(),
        opacity: dashAlpha,
        width: 1,
        gradient: ribbon === 0 ? 'top' : 'bottom',
        dashed: [6, 10],
      });
    }
  }

  return paths;
}

// ==================== MAIN COMPONENT ====================
export const VoiceSphereStable: React.FC<VoiceSphereProps> = ({
  stage,
  size = 280,
  inputLevel = 0,
  accentColor,
  analysisDuration = 3000,
  onAnalysisComplete,
}) => {
  const theme = useAppTheme();
  const gradientId = useId();
  const radius = size / 2;

  // Theme-aware colors for background and mic icon
  const isDark = theme.mode === 'dark';
  const bgColors = isDark
    ? { inner: '#12161f', mid: '#0a0d14', outer: '#050709' }
    : { inner: '#e8eaed', mid: '#d8dce0', outer: '#c8ccd0' };
  const micColor = accentColor ?? (isDark ? '#ffffff' : theme.colors.textPrimary);

  // Animation state refs (to avoid re-renders)
  const ampRef = useRef(0.135);
  const timeRef = useRef(0);
  const speedRef = useRef(0.675);
  const morphProgressRef = useRef(0);
  const analysisStartRef = useRef(0);
  const frameRef = useRef(0);

  // Stage and input refs for animation loop
  const stageRef = useRef<VoiceSphereStage>(stage);
  const inputLevelRef = useRef(inputLevel);

  // Force re-render for animation
  const [, setFrame] = useState(0);

  // Update refs when props change
  useEffect(() => {
    stageRef.current = stage;
    if (stage === 'analyzing') {
      analysisStartRef.current = performance.now();
      morphProgressRef.current = 0;
    }
  }, [stage]);

  useEffect(() => {
    inputLevelRef.current = clamp01(inputLevel);
  }, [inputLevel]);

  // Main animation loop
  useEffect(() => {
    let mounted = true;
    let lastTs: number | null = null;
    const MORPH_DURATION = 2400;

    const loop = (ts: number) => {
      if (!mounted) return;

      if (lastTs === null) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      const currentStage = stageRef.current;
      const currentInput = inputLevelRef.current;

      let targetAmp = ampRef.current;
      let targetSpeed = speedRef.current;
      let targetMorph = morphProgressRef.current;

      // State-specific behavior (matching reference)
      if (currentStage === 'idle') {
        targetAmp = 0.135;
        targetSpeed = 0.675;
        targetMorph = 0;
      } else if (currentStage === 'listening') {
        // Mic input drives animation
        const lvl = currentInput;
        if (lvl > 0.01) {
          targetAmp = 0.3 + lvl * 0.7;
          targetSpeed = 0.8 + lvl * 1.2;
        } else {
          targetAmp = 0.135;
          targetSpeed = 0.45;
        }
        targetMorph = 0;
      } else if (currentStage === 'analyzing') {
        const elapsed = ts - analysisStartRef.current;

        if (elapsed < analysisDuration) {
          // Breathing animation during analysis
          const breathe = (Math.sin(ts / 600) + 1) / 2;
          targetAmp = 0.3 + breathe * 0.3;
          targetSpeed = 0.6 + breathe * 0.5;
          targetMorph = 0;
        } else if (elapsed < analysisDuration + MORPH_DURATION) {
          // Morphing to checkmark
          targetMorph = clamp01(
            (elapsed - analysisDuration) / MORPH_DURATION
          );
          targetAmp = lerp(0.5, 0.6, targetMorph);
          targetSpeed = lerp(0.6, 0.02, targetMorph);
        } else {
          // Complete
          targetMorph = 1;
          targetAmp = 0.6;
          targetSpeed = 0.02;
          
          // Trigger callback once
          if (morphProgressRef.current < 1) {
            onAnalysisComplete?.();
          }
        }
      } else if (currentStage === 'complete') {
        targetAmp = 0.6;
        targetSpeed = 0.02;
        targetMorph = 1;
      }

      // Smooth interpolation (matching reference lerp rates)
      const ampLerp = currentStage === 'listening' 
        ? (targetAmp > ampRef.current ? 0.25 : 0.08)
        : 0.12;
      
      ampRef.current = lerp(ampRef.current, targetAmp, ampLerp);
      speedRef.current = lerp(speedRef.current, targetSpeed, 0.15);
      morphProgressRef.current = lerp(
        morphProgressRef.current,
        targetMorph,
        currentStage === 'analyzing' ? 0.08 : 0.1
      );

      // Advance time
      timeRef.current += (speedRef.current * dt) / 1000;

      // Trigger re-render
      frameRef.current += 1;
      setFrame(frameRef.current);

      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
    };
  }, [analysisDuration, onAnalysisComplete]);

  // Compute paths for current frame
  const wavePaths = useMemo(() => {
    const intensity = ampRef.current;
    if (intensity < 0.01 && morphProgressRef.current < 0.01) return [];
    return computeWavePaths(
      radius,
      timeRef.current,
      intensity,
      morphProgressRef.current
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, frameRef.current]);

  const showIdleIcon = stage === 'idle' && ampRef.current < 0.15;

  return (
    <View style={[localStyles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Sphere base gradient - theme-aware */}
          <RadialGradient
            id={`${gradientId}-base`}
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={bgColors.inner} />
            <Stop offset="60%" stopColor={bgColors.mid} />
            <Stop offset="100%" stopColor={bgColors.outer} />
          </RadialGradient>

          {/* Wave gradients - top ribbon: cyan → purple → cyan */}
          <SvgLinearGradient
            id={`${gradientId}-waves-top`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor={COLORS.cyan} />
            <Stop offset="35%" stopColor={COLORS.purple} />
            <Stop offset="50%" stopColor={COLORS.purple} />
            <Stop offset="65%" stopColor={COLORS.purple} />
            <Stop offset="100%" stopColor={COLORS.cyan} />
          </SvgLinearGradient>

          {/* Wave gradients - bottom ribbon: pink → purple → pink */}
          <SvgLinearGradient
            id={`${gradientId}-waves-bottom`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor={COLORS.pink} />
            <Stop offset="35%" stopColor={COLORS.purple} />
            <Stop offset="50%" stopColor={COLORS.purple} />
            <Stop offset="65%" stopColor={COLORS.purple} />
            <Stop offset="100%" stopColor={COLORS.pink} />
          </SvgLinearGradient>

          {/* Checkmark gradient - diagonal */}
          <SvgLinearGradient
            id={`${gradientId}-check-top`}
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor={COLORS.pink} />
            <Stop offset="30%" stopColor={COLORS.purple} />
            <Stop offset="50%" stopColor={COLORS.blue} />
            <Stop offset="70%" stopColor={COLORS.cyan} />
            <Stop offset="100%" stopColor={COLORS.cyan} />
          </SvgLinearGradient>

          <SvgLinearGradient
            id={`${gradientId}-check-bottom`}
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor={COLORS.pink} />
            <Stop offset="30%" stopColor={COLORS.purple} />
            <Stop offset="50%" stopColor={COLORS.blue} />
            <Stop offset="70%" stopColor={COLORS.cyan} />
            <Stop offset="100%" stopColor={COLORS.cyan} />
          </SvgLinearGradient>

          {/* Clip path for sphere */}
          <ClipPath id={`${gradientId}-clip`}>
            <Circle cx={radius} cy={radius} r={radius * 0.94 - 1} />
          </ClipPath>

          {/* Highlight gradient */}
          {/* <RadialGradient
            id={`${gradientId}-highlight`}
            cx="30%"
            cy="20%"
            r="50%"
            fx="30%"
            fy="20%"
          >
            <Stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <Stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </RadialGradient> */}
        </Defs>

        {/* Sphere base */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.94}
          fill={`url(#${gradientId}-base)`}
        />

        {/* Wave paths clipped to sphere */}
        <G clipPath={`url(#${gradientId}-clip)`}>
          {wavePaths.map((wave, index) => {
            let strokeUrl: string;
            switch (wave.gradient) {
              case 'top':
                strokeUrl = `url(#${gradientId}-waves-top)`;
                break;
              case 'bottom':
                strokeUrl = `url(#${gradientId}-waves-bottom)`;
                break;
              case 'checkTop':
                strokeUrl = `url(#${gradientId}-check-top)`;
                break;
              case 'checkBottom':
                strokeUrl = `url(#${gradientId}-check-bottom)`;
                break;
            }
            return (
              <Path
                key={`wave-${index}`}
                d={wave.d}
                stroke={strokeUrl}
                strokeWidth={wave.width}
                strokeDasharray={wave.dashed?.join(',')}
                opacity={wave.opacity}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
        </G>

        {/* Highlight overlay */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.94}
          fill={`url(#${gradientId}-highlight)`}
          opacity={0.75}
        />

        {/* Border ring */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.94 - 0.5}
          stroke="rgba(120,140,180,0.12)"
          strokeWidth={1}
          fill="none"
        />
      </Svg>

      {/* Idle icon overlay */}
      {showIdleIcon && (
        <View style={localStyles.iconOverlay}>
          <Mic size={38} color={micColor} />
        </View>
      )}
    </View>
  );
};

// ==================== STYLES ====================
const localStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoiceSphereStable;