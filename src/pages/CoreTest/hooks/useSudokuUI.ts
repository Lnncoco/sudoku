import { useCallback, useState } from "react";
import type { EditMode, NoteMode } from "../types";

interface UseSudokuUIProps {
  initialEditMode?: EditMode;
  initialNoteMode?: NoteMode;
  initialShowCandidates?: boolean;
  initialErrorHighlighting?: boolean;
  initialEnableDiagonal?: boolean;
  onErrorHighlightingChange?: (enabled: boolean) => void;
  onEditModeChange?: (mode: EditMode) => void;
  onEnterPuzzleMode?: () => void;
}

/**
 * 管理数独UI相关状态和操作
 */
export function useSudokuUI({
  initialEditMode = "solve",
  initialNoteMode = false,
  initialShowCandidates = false,
  initialErrorHighlighting = true,
  initialEnableDiagonal = false,
  onErrorHighlightingChange,
  onEditModeChange,
  onEnterPuzzleMode,
}: UseSudokuUIProps = {}) {
  // UI状态
  const [noteMode, setNoteMode] = useState<NoteMode>(initialNoteMode);
  const [showCandidates, setShowCandidates] = useState<boolean>(
    initialShowCandidates,
  );
  const [enableErrorHighlighting, setEnableErrorHighlighting] =
    useState<boolean>(initialErrorHighlighting);
  const [editMode, setEditMode] = useState<EditMode>(initialEditMode);
  const [enableDiagonal, setEnableDiagonal] = useState<boolean>(
    initialEnableDiagonal,
  );

  // 切换笔记模式
  const toggleNoteMode = useCallback(() => {
    setNoteMode((prev) => !prev);
  }, []);

  // 切换候选数显示
  const toggleShowCandidates = useCallback(() => {
    setShowCandidates((prev) => !prev);
  }, []);

  // 切换错误高亮
  const toggleErrorHighlighting = useCallback(() => {
    setEnableErrorHighlighting((prev) => {
      const newValue = !prev;
      if (onErrorHighlightingChange) {
        onErrorHighlightingChange(newValue);
      }
      return newValue;
    });
  }, [onErrorHighlightingChange]);

  // 切换对角线规则
  const toggleEnableDiagonal = useCallback(() => {
    setEnableDiagonal((prev) => !prev);
  }, []);

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => {
      const newMode = prev === "puzzle" ? "solve" : "puzzle";

      // 如果切换到出题模式，则调用清空网格回调
      if (newMode === "puzzle" && onEnterPuzzleMode) {
        onEnterPuzzleMode();
      }

      if (onEditModeChange) {
        onEditModeChange(newMode);
      }
      return newMode;
    });
  }, [onEditModeChange, onEnterPuzzleMode]);

  // 获取笔记按钮标签
  const getNoteButtonLabel = useCallback(() => {
    return noteMode ? "开启" : "关闭";
  }, [noteMode]);

  // 获取模式切换标签
  const getModeButtonLabel = useCallback(() => {
    return editMode === "puzzle" ? "出题模式" : "解题模式";
  }, [editMode]);

  return {
    // 状态
    noteMode,
    showCandidates,
    enableErrorHighlighting,
    editMode,
    enableDiagonal,

    // setter
    setNoteMode,
    setShowCandidates,
    setEnableErrorHighlighting,
    setEditMode,
    setEnableDiagonal,

    // 切换函数
    toggleNoteMode,
    toggleShowCandidates,
    toggleErrorHighlighting,
    toggleEditMode,
    toggleEnableDiagonal,

    // 辅助函数
    getNoteButtonLabel,
    getModeButtonLabel,
  };
}
