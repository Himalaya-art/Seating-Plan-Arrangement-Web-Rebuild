import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useSeating } from '../../context/SeatingContext';
import '../SeatingChart.css';

export default function Seat({ student, row, col }) {
  const { handleSeatClick, selectedSeat } = useSeating();

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `seat-${row}-${col}`,
    data: { row, col },
    disabled: !student,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `seat-${row}-${col}`,
    data: { row, col },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  } : undefined;

  const genderClass = student
    ? student.gender === '男' ? 'seat-male' : 'seat-female'
    : '';

  const isSelected = selectedSeat?.row === row && selectedSeat?.col === col;

  const combinedRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  const handleClick = (e) => {
    handleSeatClick(row, col);
    e.stopPropagation();
  };

  return (
    <div
      ref={combinedRef}
      className={`seat ${genderClass} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-over' : ''} ${isSelected ? 'selected' : ''}`}
      style={style}
      {...(student ? listeners : {})}
      {...(student ? attributes : {})}
      onClick={handleClick}
      data-row={row}
      data-col={col}
    >
      <span className="seat-name">{student ? student.name : ''}</span>
    </div>
  );
}
