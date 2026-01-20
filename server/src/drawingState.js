class DrawingState {
  constructor(roomId) {
    this.roomId = roomId;
    this.actions = [];
    this.undoneActions = [];
    this.strokes = [];
    this.undoneStrokes = [];
    this.currentStroke = null;
    this.createdAt = Date.now();
  }

  addAction(action) {
    this.undoneActions = [];
    this.undoneStrokes = [];

    const actionWithId = {
      ...action,
      actionId:
        action.actionId ||
        `${action.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.actions.push(actionWithId);

    if (action.type === "start") {
      this.currentStroke = {
        userId: action.userId,
        actions: [actionWithId],
        startTime: Date.now(),
      };
    } else if (action.type === "draw" && this.currentStroke) {
      this.currentStroke.actions.push(actionWithId);
    } else if (action.type === "end" && this.currentStroke) {
      this.currentStroke.actions.push(actionWithId);
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
    }

    return actionWithId.actionId;
  }

  getAllActions() {
    return [...this.actions];
  }

  getState() {
    return {
      roomId: this.roomId,
      actions: this.getAllActions(),
      actionCount: this.actions.length,
      canUndo: this.strokes.length > 0,
      canRedo: this.undoneStrokes.length > 0,
      createdAt: this.createdAt,
    };
  }

  undo() {
    if (this.strokes.length === 0) {
      return {
        success: false,
        canUndo: false,
        canRedo: this.undoneStrokes.length > 0,
        actions: this.actions,
      };
    }

    const undoneStroke = this.strokes.pop();
    this.undoneStrokes.push(undoneStroke);

    const strokeActionIds = new Set(
      undoneStroke.actions.map((a) => a.actionId),
    );
    this.actions = this.actions.filter((a) => !strokeActionIds.has(a.actionId));

    return {
      success: true,
      canUndo: this.strokes.length > 0,
      canRedo: true,
      actions: this.actions,
      undoneStroke,
    };
  }

  redo() {
    if (this.undoneStrokes.length === 0) {
      return {
        success: false,
        canUndo: this.strokes.length > 0,
        canRedo: false,
        actions: this.actions,
      };
    }

    const redoneStroke = this.undoneStrokes.pop();
    this.strokes.push(redoneStroke);
    this.actions.push(...redoneStroke.actions);

    return {
      success: true,
      canUndo: true,
      canRedo: this.undoneStrokes.length > 0,
      actions: this.actions,
      redoneStroke,
    };
  }

  finalizeIncompleteStroke() {
    if (this.currentStroke && this.currentStroke.actions.length > 0) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
    }
  }

  clear() {
    this.actions = [];
    this.undoneActions = [];
    this.strokes = [];
    this.undoneStrokes = [];
    this.currentStroke = null;
  }
}

module.exports = DrawingState;
