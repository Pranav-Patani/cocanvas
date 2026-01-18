class DrawingState {
  constructor(roomId) {
    this.roomId = roomId;
    this.actions = [];
    this.createdAt = Date.now();
  }

  addAction(action) {
    const actionWithId = {
      ...action,
      id: `${action.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.actions.push(actionWithId);

    return actionWithId.id;
  }

  getAllActions() {
    return [...this.actions];
  }

  getState() {
    return {
      roomId: this.roomId,
      actions: this.getAllActions(),
      actionCount: this.actions.length,
      createdAt: this.createdAt,
    };
  }

  clear() {
    this.actions = [];
  }
}

module.exports = DrawingState;
