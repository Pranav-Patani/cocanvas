import { UserData } from "../types/allTypes";
import socketClient from "../socket/socketClient";

export default function ActiveUsers({ users }: { users: UserData[] }) {
  const sortedUsers = [...users].sort((a, b) => {
    if (a.userId === socketClient.userId) return -1;
    if (b.userId === socketClient.userId) return 1;
    return 0;
  });
  return (
    <div className="active-users-container">
      <h4 className="active-users-heading">Online Users ({users.length})</h4>
      <div className="active-users-list">
        {sortedUsers.map((user) => {
          const isCurrentUser = user.userId === socketClient.userId;
          return (
            <div
              key={user.userId}
              style={{
                backgroundColor: isCurrentUser ? "#f0f9ff" : "transparent",
              }}
              className="active-users-item"
            >
              <div
                style={{
                  backgroundColor: user.color,
                  boxShadow: `0 0 0 1px ${user.color}`,
                }}
                className="active-users-color-indicator"
              />
              <span
                className="active-users-id"
                style={{ fontWeight: isCurrentUser ? 600 : 400 }}
              >
                {user.userId.substring(0, 10)}
                {isCurrentUser && (
                  <span className="active-users-current">(You)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
