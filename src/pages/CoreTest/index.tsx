import { DifficultyLevel } from "@/core/types/solver";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import ControlPanel from "./components/ControlPanel";
import SidePanel from "./components/SidePanel";
import SudokuGrid from "./components/SudokuGrid";
import { useSudokuCore } from "./hooks/useSudokuCore";

/**
 * 数独核心测试页面
 * 展示和测试数独游戏功能
 */
const CoreTestPage = () => {
  // 使用核心Facade Hook
  const {
    // 棋盘状态
    grid,
    size,
    boxWidth,
    boxHeight,
    selectedCell,
    handleCellClick,
    handleNumberInput,
    clearSelectedCell,
    setSize,

    // 游戏逻辑
    disabledNumbers,
    candidates,
    isValid,
    isRegularSudoku,
    difficulty,
    setDifficulty,
    isLoading,
    isSolving,
    isGridFull,
    getCandidates,
    generatePuzzle,
    resetGrid,
    clearGrid,
    autoSolve,

    // UI状态
    noteMode,
    enableDiagonal,
    editMode,
    showCandidates,
    toggleNoteMode,
    toggleEnableDiagonal,
    toggleEditMode,
    toggleShowCandidates,
    getNoteButtonLabel,
    getModeButtonLabel,
    enableErrorHighlighting,
    toggleErrorHighlighting,

    // 新增：从 hook 获取用于显示的难度
    displayedDifficulty,
  } = useSudokuCore();

  // 获取选中单元格状态
  const selectedCellState = selectedCell
    ? grid[selectedCell.row][selectedCell.col]
    : null;

  // 处理网格尺寸变化
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    if ([4, 6, 9, 16].includes(newSize)) {
      setSize(newSize);
    }
  };

  // 处理难度变化
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // value 是字符串枚举值 ("easy", "medium", ...)
    const newDifficultyValue = e.target.value;
    // 直接使用字符串值调用 setDifficulty，类型断言确保它是 DifficultyLevel
    setDifficulty(newDifficultyValue as DifficultyLevel);
  };

  // 修复重复提示：使用 useRef 存储上一次的 isValid 状态
  const prevIsValidRef = useRef<boolean | undefined>(undefined);

  // 检查数独是否完成并显示提示
  useEffect(() => {
    // 只有在网格填满且不在加载状态时检查
    if (isGridFull && !isLoading) {
      const currentIsValid = isValid;
      const prevIsValid = prevIsValidRef.current;

      // 仅当 isValid 状态发生变化时，或首次加载完成时显示提示
      if (currentIsValid !== prevIsValid) {
        if (currentIsValid) {
          // 仅当从无效变为有效时庆祝（或首次加载就是有效的）
          if (prevIsValid === false || prevIsValid === undefined) {
            toast.success("恭喜！数独已正确完成！", {
              duration: 3000,
              position: "top-center",
              icon: "🎉",
            });
          }
        } else {
          // 仅当从有效变为无效时提示错误（或首次加载就是无效的）
          if (prevIsValid === true || prevIsValid === undefined) {
            toast.error("数独填写有误，请检查后重试！", {
              duration: 3000,
              position: "top-center",
              icon: "❌",
            });
          }
        }
      }
      // 更新上一次的状态
      prevIsValidRef.current = currentIsValid;
    } else {
      // 如果网格未填满或正在加载，重置 prevIsValidRef，以便下次填满时能正确触发提示
      prevIsValidRef.current = undefined;
    }
  }, [isGridFull, isValid, isLoading]);

  return (
    <div className="container mx-auto p-2">
      <div className="mockup-window bg-base-200 max-w-5xl mx-auto shadow-lg">
        <div className="bg-base-100 p-3">
          <div className="flex justify-between items-center mb-3">
            {/* 标题居左 */}
            <h1 className="text-xl font-bold">数独</h1>

            {/* 功能和控制选项 */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* 尺寸选择器 */}
              <select
                className="select select-sm w-24"
                value={size}
                onChange={handleSizeChange}
              >
                {[4, 6, 9].map((sizeOption) => (
                  <option key={sizeOption} value={sizeOption}>
                    {sizeOption}×{sizeOption}
                  </option>
                ))}
              </select>

              {/* 难度选择器 */}
              <select
                className="select select-sm w-24"
                value={difficulty}
                onChange={handleDifficultyChange}
              >
                {[
                  { value: DifficultyLevel.EASY, label: "简单" },
                  { value: DifficultyLevel.MEDIUM, label: "中等" },
                  { value: DifficultyLevel.HARD, label: "困难" },
                  { value: DifficultyLevel.EXPERT, label: "专家" },
                ].map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>

              {/* 功能按钮 */}
              <button
                onClick={generatePuzzle}
                className="btn btn-primary btn-sm h-9 min-h-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    生成中...
                  </>
                ) : (
                  "生成题目"
                )}
              </button>
              <button
                onClick={resetGrid}
                className="btn btn-outline btn-sm h-9 min-h-0"
                disabled={isLoading}
              >
                重置
              </button>
              <button
                onClick={clearGrid}
                className="btn btn-outline btn-sm h-9 min-h-0"
                disabled={isLoading}
              >
                清空
              </button>
              <button
                onClick={toggleEditMode}
                className={`btn btn-sm h-9 min-h-0 ${
                  editMode === "solve" ? "btn-primary" : "btn-outline"
                }`}
                disabled={isLoading}
              >
                {getModeButtonLabel()}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* 左侧：数独网格 */}
            <div className="flex-1 flex justify-center">
              <SudokuGrid
                gridData={grid}
                size={size}
                boxWidth={boxWidth}
                boxHeight={boxHeight}
                enableDiagonal={enableDiagonal}
                isRegularSudoku={isRegularSudoku}
                showCandidates={showCandidates}
                selectedCell={selectedCell}
                handleCellClick={handleCellClick}
                candidates={candidates}
              />
            </div>

            {/* 右侧：控制面板和状态信息 */}
            <div className="md:w-72 flex flex-col gap-3 min-w-72">
              {/* 控制面板 */}
              <ControlPanel
                size={size}
                onNumberClick={handleNumberInput}
                onClearClick={clearSelectedCell}
                onGenerate={generatePuzzle}
                onReset={resetGrid}
                onClear={clearGrid}
                modeText={getModeButtonLabel()}
                onToggleMode={toggleEditMode}
                showCandidates={showCandidates}
                onToggleCandidates={toggleShowCandidates}
                onGetCandidates={() =>
                  selectedCell &&
                  getCandidates(selectedCell.row, selectedCell.col)
                }
                onAutoSolve={autoSolve}
                disabledNumbers={disabledNumbers}
                enableDiagonal={enableDiagonal}
                onToggleDiagonal={toggleEnableDiagonal}
                noteMode={noteMode}
                onToggleNoteMode={toggleNoteMode}
                noteButtonLabel={getNoteButtonLabel()}
                isLoading={isLoading}
                isSolving={isSolving}
                enableErrorHighlighting={enableErrorHighlighting}
                onToggleErrorHighlighting={toggleErrorHighlighting}
              />

              {/* 状态面板 */}
              <SidePanel
                size={size}
                isValid={isValid}
                mode={editMode}
                noteMode={noteMode}
                enableDiagonal={enableDiagonal}
                selectedCell={selectedCell}
                cellState={selectedCellState}
                difficulty={displayedDifficulty}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreTestPage;
