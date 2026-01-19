import { RemoteCursorsProps } from "../types/allTypes";

export default function RemoteCursors({ remoteCursors }: RemoteCursorsProps) {
  return (
    <>
      {Array.from(remoteCursors.entries()).map(([userId, data]) => {
        return (
          <div
            key={userId}
            className="remote-cursor"
            style={{
              left: `${data.point.x}px`,
              top: `${data.point.y}px`,
            }}
          >
            <div className="remote-cursor-dot" />
            <span className="remote-cursor-label">
              {userId.substring(0, 8)}
            </span>
          </div>
        );
      })}
    </>
  );
}
