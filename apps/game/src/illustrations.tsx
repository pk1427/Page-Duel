import { Svg, Path, Circle, Rect, Ellipse, G, Text as SvgText } from "react-native-svg";
import { palette } from "./ui";

export function HeroBookIllustration({
  width = 400,
  height = 320,
}: { width?: number; height?: number } = {}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 320">
      <G transform="translate(20, 10)">
        <Path
          d="M0 0 L360 0 Q370 0 370 10 L370 290 Q370 300 360 300 L185 300 Q180 300 180 295 Q180 290 185 290 L350 290 Q355 290 355 285 L355 15 Q355 10 350 10 L10 10 Q5 10 5 15 L5 285 Q5 290 10 290 L175 290 Q170 290 170 295 Q170 300 175 300 L0 300 Z"
          fill={palette.paper}
          stroke={palette.line}
          strokeWidth={2}
        />
        <Path
          d="M180 10 L180 300"
          stroke={palette.leatherDeep}
          strokeWidth={4}
        />
        <Path
          d="M178 10 L178 300"
          stroke={palette.gold}
          strokeWidth={1}
        />
        <Path
          d="M182 10 L182 300"
          stroke={palette.gold}
          strokeWidth={1}
        />
        <Ellipse
          cx={90}
          cy={150}
          rx={65}
          ry={80}
          fill={palette.canvas}
          stroke={palette.line}
          strokeWidth={1.5}
        />
        <Ellipse
          cx={290}
          cy={150}
          rx={65}
          ry={80}
          fill={palette.canvas}
          stroke={palette.line}
          strokeWidth={1.5}
        />
        <G transform="translate(90, 150)">
          <Circle cx={-25} cy={-30} r={8} fill={palette.leftPlayer} opacity={0.9} />
          <Circle cx={-25} cy={-30} r={3} fill={palette.white} />
          <Circle cx={15} cy={-35} r={6} fill={palette.leftPlayer} opacity={0.9} />
          <Circle cx={15} cy={-35} r={2} fill={palette.white} />
          <Circle cx={-10} cy={20} r={7} fill={palette.leftPlayer} opacity={0.8} />
          <Circle cx={-10} cy={20} r={2} fill={palette.white} />
          <Circle cx={20} cy={15} r={5} fill={palette.leftPlayer} opacity={0.8} />
          <Circle cx={20} cy={15} r={1.5} fill={palette.white} />
          <Circle cx={-35} cy={5} r={4} fill={palette.sunshine} opacity={0.9} />
          <Circle cx={30} cy={-10} r={4} fill={palette.sky} opacity={0.9} />
          <Circle cx={0} cy={40} r={5} fill={palette.coral} opacity={0.8} />
        </G>
        <G transform="translate(290, 150)">
          <Circle cx={-20} cy={-25} r={7} fill={palette.rightPlayer} opacity={0.9} />
          <Circle cx={-20} cy={-25} r={2.5} fill={palette.white} />
          <Circle cx={10} cy={-30} r={6} fill={palette.rightPlayer} opacity={0.9} />
          <Circle cx={10} cy={-30} r={2} fill={palette.white} />
          <Circle cx={-15} cy={15} r={6} fill={palette.rightPlayer} opacity={0.8} />
          <Circle cx={-15} cy={15} r={2} fill={palette.white} />
          <Circle cx={25} cy={10} r={5} fill={palette.rightPlayer} opacity={0.8} />
          <Circle cx={25} cy={10} r={1.5} fill={palette.white} />
          <Circle cx={-30} cy={0} r={4} fill={palette.mint} opacity={0.9} />
          <Circle cx={30} cy={-15} r={4} fill={palette.sunshine} opacity={0.9} />
          <Circle cx={5} cy={35} r={5} fill={palette.coral} opacity={0.8} />
        </G>
        <Path
          d="M90 270 Q90 285 180 285 Q180 285 180 270"
          stroke={palette.accent}
          strokeWidth={3}
          fill="none"
          strokeDasharray="8 4"
        />
        <Path
          d="M270 270 Q270 285 180 285 Q180 285 180 270"
          stroke={palette.sky}
          strokeWidth={3}
          fill="none"
          strokeDasharray="8 4"
        />
        <Circle cx={90} cy={270} r={8} fill={palette.accent} />
        <Circle cx={270} cy={270} r={8} fill={palette.sky} />
        <SvgText
          x={90}
          y={270}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          fill={palette.white}
        >
          P1
        </SvgText>
        <SvgText
          x={270}
          y={270}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          fill={palette.white}
        >
          P2
        </SvgText>
        <G transform="translate(360, 20)">
          <Rect x={0} y={0} width={4} height={280} rx={2} fill={palette.leatherDeep} />
          <Rect x={1} y={1} width={2} height={278} rx={1} fill={palette.gold} opacity={0.3} />
        </G>
        <G transform="translate(-20, 20)">
          <Rect x={0} y={0} width={4} height={280} rx={2} fill={palette.leatherDeep} />
          <Rect x={1} y={1} width={2} height={278} rx={1} fill={palette.gold} opacity={0.3} />
        </G>
      </G>
      <G>
        <Ellipse cx={50} cy={50} rx={15} ry={10} fill={palette.sunshine} opacity={0.3} />
        <Ellipse cx={350} cy={40} rx={12} ry={8} fill={palette.sky} opacity={0.3} />
        <Ellipse cx={380} cy={280} rx={18} ry={12} fill={palette.mint} opacity={0.2} />
        <Ellipse cx={30} cy={300} rx={10} ry={7} fill={palette.coral} opacity={0.2} />
      </G>
    </Svg>
  );
}

export function StepIllustration({
  step = 1,
  size = 80,
}: { step?: 1 | 2 | 3; size?: number } = {}) {
  const illustrations = {
    1: (
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Rect x={10} y={15} width={60} height={50} rx={4} fill={palette.paper} stroke={palette.line} strokeWidth={2} />
        <Path d="M40 15 L40 65" stroke={palette.leatherDeep} strokeWidth={3} />
        <Path d="M38 15 L38 65" stroke={palette.gold} strokeWidth={1} />
        <Path d="M42 15 L42 65" stroke={palette.gold} strokeWidth={1} />
        <Circle cx={25} cy={40} r={10} fill={palette.accentLight} />
        <Circle cx={25} cy={40} r={4} fill={palette.accent} />
        <Circle cx={55} cy={40} r={10} fill={palette.skyLight} />
        <Circle cx={55} cy={40} r={4} fill={palette.sky} />
        <Rect x={20} y={25} width={10} height={10} rx={2} fill={palette.sunshine} opacity={0.5} />
        <Rect x={50} y={25} width={10} height={10} rx={2} fill={palette.mint} opacity={0.5} />
      </Svg>
    ),
    2: (
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Rect x={10} y={15} width={60} height={50} rx={4} fill={palette.paper} stroke={palette.line} strokeWidth={2} />
        <Path d="M40 15 L40 65" stroke={palette.leatherDeep} strokeWidth={3} />
        <Path d="M38 15 L38 65" stroke={palette.gold} strokeWidth={1} />
        <Path d="M42 15 L42 65" stroke={palette.gold} strokeWidth={1} />
        <G transform="translate(25, 40)">
          <Circle cx={0} cy={0} r={12} fill={palette.canvas} />
          <Circle cx={-5} cy={-5} r={4} fill={palette.leftPlayer} />
          <Circle cx={5} cy={-6} r={3} fill={palette.leftPlayer} />
          <Circle cx={-2} cy={6} r={3.5} fill={palette.leftPlayer} />
        </G>
        <G transform="translate(55, 40)">
          <Circle cx={0} cy={0} r={12} fill={palette.canvas} />
          <Circle cx={-4} cy={-4} r={3.5} fill={palette.rightPlayer} />
          <Circle cx={6} cy={-5} r={3} fill={palette.rightPlayer} />
          <Circle cx={0} cy={7} r={3} fill={palette.rightPlayer} />
        </G>
        <SvgText x={25} y={72} textAnchor="middle" fontSize={9} fill={palette.muted} fontWeight="bold">COUNT</SvgText>
      </Svg>
    ),
    3: (
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Rect x={10} y={15} width={60} height={50} rx={4} fill={palette.paper} stroke={palette.line} strokeWidth={2} />
        <Path d="M40 15 L40 65" stroke={palette.leatherDeep} strokeWidth={3} />
        <Path d="M38 15 L38 65" stroke={palette.gold} strokeWidth={1} />
        <Path d="M42 15 L42 65" stroke={palette.gold} strokeWidth={1} />
        <Rect x={18} y={22} width={24} height={20} rx={3} fill={palette.accentLight} />
        <Rect x={38} y={22} width={24} height={20} rx={3} fill={palette.skyLight} />
        <SvgText
            x={30}
            y={37}
            textAnchor="middle"
            fontSize={14}
            fontWeight="bold"
            fill={palette.accentDark}
          >
            7
          </SvgText>
          <SvgText
            x={50}
            y={37}
            textAnchor="middle"
            fontSize={14}
            fontWeight="bold"
            fill={palette.skyDark}
          >
            5
          </SvgText>
        <Path d="M40 48 L40 58" stroke={palette.sunshine} strokeWidth={3} strokeLinecap="round" />
        <Path d="M35 53 L45 53" stroke={palette.sunshine} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={20} cy={62} r={6} fill={palette.sunshine} />
        <Circle cx={60} cy={62} r={6} fill={palette.sunshine} />
      </Svg>
    ),
  };
  return illustrations[step];
}

export function BookCardCover({
  book,
  width = 120,
  height = 160,
}: { book: { title: string; coverImage?: string | null; author?: string | null }; width?: number; height?: number }) {
  const hasCover = book.coverImage && !book.coverImage.startsWith("placeholder:");
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={8}
        fill={hasCover ? palette.canvas : palette.plumLight}
        stroke={palette.line}
        strokeWidth={1.5}
      />
      {hasCover ? (
        <Rect
          x={4}
          y={4}
          width={width - 8}
          height={height - 8}
          rx={6}
          fill="url(#coverGradient)"
        />
      ) : (
        <SvgText
            x={width / 2}
            y={height / 2 - 10}
            textAnchor="middle"
            fontSize={48}
            fontWeight="bold"
            fill={palette.paper}
            fontFamily="serif"
          >
            {book.title.slice(0, 1)}
          </SvgText>
      )}
      <Rect
        x={width - 20}
        y={4}
        width={16}
        height={height - 8}
        rx={0}
        fill={palette.leatherDeep}
        opacity={0.15}
      />
      <Rect
        x={width - 18}
        y={6}
        width={2}
        height={height - 12}
        fill={palette.gold}
        opacity={0.4}
      />
      <Rect
        x={width - 14}
        y={6}
        width={2}
        height={height - 12}
        fill={palette.gold}
        opacity={0.4}
      />
    </Svg>
  );
}

export function FloatingDecorations({
  width,
  height,
}: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      <Circle cx={width * 0.05} cy={height * 0.15} r={8} fill={palette.sunshine} opacity={0.15} />
      <Circle cx={width * 0.95} cy={height * 0.1} r={12} fill={palette.sky} opacity={0.1} />
      <Circle cx={width * 0.08} cy={height * 0.85} r={10} fill={palette.mint} opacity={0.12} />
      <Circle cx={width * 0.92} cy={height * 0.9} r={6} fill={palette.coral} opacity={0.1} />
      <Ellipse cx={width * 0.5} cy={height * 0.02} rx={40} ry={3} fill={palette.accent} opacity={0.05} />
      <Ellipse cx={width * 0.5} cy={height * 0.98} rx={40} ry={3} fill={palette.forest} opacity={0.05} />
    </Svg>
  );
}