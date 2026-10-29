"use client";
import { MoveHorizontal, Upload } from "lucide-react";
export function ImageComparison({
  input,
  output,
  value,
  onChange,
  ratio = "4/5",
  layout = false,
}: {
  input?: string;
  output: string;
  value: number;
  onChange: (value: number) => void;
  ratio?: string;
  layout?: boolean;
}) {
  return (
    <div className="comparison" style={{ aspectRatio: ratio }}>
      {input ? (
        <img className="comparison-image" src={input} alt="Input reference" />
      ) : (
        <div className="comparison-placeholder">
          <Upload size={26} />
          <span>Add an input image to compare</span>
        </div>
      )}
      <img
        className="comparison-image output-image"
        src={output}
        alt="Output example"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
      />
      <div className="comparison-labels">
        <span>{layout ? "OUTPUT LAYOUT" : "OUTPUT"}</span>
        <span>INPUT</span>
      </div>
      {value > 0 && value < 100 && (
        <div className="compare-line" style={{ left: `${value}%` }}>
          <span>
            <MoveHorizontal size={25} />
          </span>
        </div>
      )}
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Reveal output image: slide right for output, left for input"
      />
    </div>
  );
}
