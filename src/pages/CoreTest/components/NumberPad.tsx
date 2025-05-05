import classNames from "classnames";

interface NumberPadProps {
  size: number;
  onNumberClick: (num: number) => void;
  onClearClick: () => void;
  disabledNumbers: Set<number>;
}

/**
 * 数字输入组件
 * 展示1-9的数字按钮，以及清除按钮
 */
const NumberPad = ({
  size,
  onNumberClick,
  onClearClick,
  disabledNumbers,
}: NumberPadProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium mb-1">数字输入</h3>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: size }, (_, i) => i + 1).map((num) => (
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
        ))}
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

export default NumberPad;
