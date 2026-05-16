import { forwardRef } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useSeating } from '../../context/SeatingContext';
import Seat from './Seat';
import Aisle from './Aisle';
import '../SeatingChart.css';

const SeatingChart = forwardRef(function SeatingChart(_props, ref) {
  const { seatingPlan, nRows, nCols, aisles, swapSeats } = useSeating();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromRow = active.data.current?.row;
    const fromCol = active.data.current?.col;
    const toRow = over.data.current?.row;
    const toCol = over.data.current?.col;

    if (
      fromRow !== undefined && fromCol !== undefined &&
      toRow !== undefined && toCol !== undefined
    ) {
      swapSeats(fromRow, fromCol, toRow, toCol);
    }
  };

  if (!seatingPlan) {
    return (
      <div className="seating-chart empty" ref={ref}>
        <div className="empty-hint">请先导入学生名单并点击「生成座位表」</div>
      </div>
    );
  }

  const sortedAisles = [...aisles].sort((a, b) => a - b);

  const gridColumns = [];
  for (let c = 0; c < nCols; c++) {
    gridColumns.push('1fr');
    if (sortedAisles.includes(c + 1)) {
      gridColumns.push('20px');
    }
  }

  return (
    <div className="seating-chart" ref={ref}>
      <div className="podium">讲 台</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div
          className="seat-grid"
          style={{ gridTemplateColumns: gridColumns.join(' ') }}
        >
          {Array.from({ length: nRows }, (_, r) => {
            const cells = [];
            for (let c = 0; c < nCols; c++) {
              cells.push(
                <Seat key={`seat-${r}-${c}`} student={seatingPlan[r]?.[c]} row={r} col={c} />
              );
              if (sortedAisles.includes(c + 1)) {
                cells.push(<Aisle key={`aisle-${r}-${c}`} />);
              }
            }
            return cells;
          })}
        </div>
      </DndContext>
    </div>
  );
});

export default SeatingChart;
