import { Draggable } from 'react-beautiful-dnd';
import { FiCalendar, FiUser, FiMoreVertical } from 'react-icons/fi';
import { useState } from 'react';

const TaskCard = ({ task, index, onEdit, onDelete, isOwner }) => { // Add isOwner prop
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-all ${
            snapshot.isDragging ? 'shadow-xl opacity-90' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-gray-900 text-sm flex-1">
              {task.title}
            </h4>
            {/* Only show menu if user is owner */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FiMoreVertical size={16} />
                </button>
                
                {showMenu && (
                  <>
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-20">
                      <button
                        onClick={() => {
                          onEdit(task);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(task);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <FiUser size={12} />
                <span>{task.assignedTo.name || task.assignedTo.email.split('@')[0]}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <FiCalendar size={12} />
                <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
