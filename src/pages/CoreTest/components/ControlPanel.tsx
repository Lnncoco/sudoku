import classNames from "classnames";
import NumberPad from "./NumberPad";

interface NumericButtonsProps {
  size: number;
  onNumberClick: (num: number) => void;
  onClearClick: () => void;
  disabledNumbers: Set<number>;
}

interface ControlPanelProps {
  size: number;
  onNumberClick: (num: number) => void;
  onClearClick: () => void;
  onGenerate: () => void;
  onReset: () => void;
  onClear: () => void;
  modeText: string;
  onToggleMode: () => void;
  showCandidates: boolean;
  onToggleCandidates: () => void;
  onGetCandidates: () => void;
  onAutoSolve: () => void;
  disabledNumbers: Set<number>;
  enableDiagonal: boolean;
  onToggleDiagonal: () => void;
  noteMode: boolean;
  onToggleNoteMode: () => void;
  noteButtonLabel: string;
  isLoading: boolean;
  isSolving: boolean;
  enableErrorHighlighting: boolean;
  onToggleErrorHighlighting: () => void;
}

// 数字按钮组件
const NumericButtons = ({
  size,
  onNumberClick,
  onClearClick,
  disabledNumbers,
}: NumericButtonsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-1">数字输入</h3>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
          if (num > size) return null; // 只显示有效范围内的数字

          return (
            <button
              key={num}
              onClick={() => onNumberClick(num)}
              className={classNames(
                "btn btn-sm h-12 min-h-0 text-xl font-medium",
                {
                  "btn-outline": true,
                  "opacity-50 cursor-not-allowed": disabledNumbers.has(num),
                },
              )}
              disabled={disabledNumbers.has(num)}
            >
              {num}
            </button>
          );
        })}
      </div>
      <button
        onClick={onClearClick}
        className="btn btn-sm btn-outline h-10 min-h-0 mt-1"
      >
        清除
      </button>
    </div>
  );
};

/**
 * 数独控制面板组件
 * 包含游戏控制选项和数字输入
 */
const ControlPanel = ({
  size,
  onNumberClick,
  onClearClick,
  onGetCandidates,
  onAutoSolve,
  disabledNumbers,
  enableDiagonal,
  onToggleDiagonal,
  noteMode,
  onToggleNoteMode,
  showCandidates,
  onToggleCandidates,
  isLoading,
  isSolving,
  enableErrorHighlighting,
  onToggleErrorHighlighting,
}: ControlPanelProps) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 游戏选项面板 */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-base-200 p-4 rounded-lg text-sm">
        {/* 笔记模式 */}
        <div className="font-medium">笔记模式 [N]:</div>
        <div className="flex items-center justify-end">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={noteMode}
            onChange={onToggleNoteMode}
          />
        </div>

        {/* 对角线规则 */}
        <div className="font-medium">对角线规则:</div>
        <div className="flex justify-end">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={enableDiagonal}
            onChange={onToggleDiagonal}
          />
        </div>

        {/* 显示候选数 */}
        <div className="font-medium">显示候选数:</div>
        <div className="flex justify-end">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={showCandidates}
            onChange={onToggleCandidates}
          />
        </div>

        {/* 启用错误检查 */}
        <div className="font-medium">启用错误检查:</div>
        <div className="flex justify-end">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={enableErrorHighlighting}
            onChange={onToggleErrorHighlighting}
          />
        </div>

        {/* 候选数和解题按钮 */}
        <div className="col-span-2 mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onGetCandidates}
            className="btn btn-sm btn-outline h-9 min-h-0"
            disabled={isLoading || isSolving}
          >
            计算候选数
          </button>
          <button
            onClick={onAutoSolve}
            className="btn btn-sm btn-outline h-9 min-h-0"
            disabled={isLoading || isSolving}
          >
            {isSolving ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                解题中...
              </>
            ) : (
              "自动解题"
            )}
          </button>
        </div>
      </div>

      {/* 数字输入面板 */}
      <NumberPad
        size={size}
        onNumberClick={onNumberClick}
        onClearClick={onClearClick}
        disabledNumbers={disabledNumbers}
      />
    </div>
  );
};

export default ControlPanel;
