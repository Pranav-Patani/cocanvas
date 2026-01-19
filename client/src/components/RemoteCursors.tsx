import { RemoteCursorsProps } from "../types/allTypes";

export default function RemoteCursors({
  remoteCursors,
  activeUsers,
}: RemoteCursorsProps) {
  return (
    <>
      {Array.from(remoteCursors.entries()).map(([userId, data]) => {
        const user = activeUsers.find((u) => u.userId === userId);
        const userColor = user?.color || "#999";
        return (
          <div
            key={userId}
            className="remote-cursor"
            style={{
              left: `${data.point.x}px`,
              top: `${data.point.y}px`,
            }}
          >
            <div
              className="remote-cursor-dot"
              style={{ backgroundColor: userColor }}
            />
            <span
              className="remote-cursor-label"
              style={{ backgroundColor: userColor }}
            >
              {userId.substring(0, 8)}
            </span>
          </div>
        );
      })}
    </>
  );
}
