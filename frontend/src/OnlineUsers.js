import React from "react";

function OnlineUsers({ users }) {
  return (
    <div className="online-users">
      Online: {users.length ? users.join(", ") : "No one else online"}
    </div>
  );
}

export default OnlineUsers;
