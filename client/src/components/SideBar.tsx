import { useState } from "react";
import ToolBox from "./ToolBox";
import ActiveUsers from "./ActiveUsers";
import { SideBarProps } from "../types/allTypes";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function SideBar({
  users,
  toolType,
  setToolType,
  color,
  setColor,
  width,
  setWidth,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onReset,
}: SideBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="toggle-sidebar" onClick={toggleSidebar}>
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      <ToolBox
        toolType={toolType}
        setToolType={setToolType}
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onReset={onReset}
      />
      <ActiveUsers users={users} />
    </div>
  );
}
