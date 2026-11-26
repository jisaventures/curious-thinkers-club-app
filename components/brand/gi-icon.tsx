import { createElement, type CSSProperties, type ReactNode } from "react";
import { GI, type GiName } from "@/components/brand/gi-data";

type IconNode = { tag: string; attr: Record<string, string>; child: readonly IconNode[] };

function draw(nodes: readonly IconNode[]): ReactNode {
  return nodes.map((node, index) => createElement(node.tag, { key: index, ...node.attr }, node.child.length ? draw(node.child) : undefined));
}

export function GiIcon({ name, color, className, style }: { name: GiName; color?: string; className?: string; style?: CSSProperties }) {
  const data = GI[name];
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox={data.attr.viewBox}
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={color ? { color, ...style } : style}
      aria-hidden="true"
    >
      {draw(data.child)}
    </svg>
  );
}
