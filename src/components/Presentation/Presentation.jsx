import { useState, useRef, useEffect } from 'react';
import { useSeating } from '../../context/SeatingContext';
import { getBlockStructure } from '../../utils/blockUtils';
import '../Presentation.css';

export default function Presentation() {
  /* ── Local state ──────────────────────── */
  const [animationMode, setAnimationMode] = useState('flip'); // 'flip'|'fade'|'bounce'|'scan'
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [revealedSeats, setRevealedSeats] = useState(new Set());
  const timerRef = useRef([]);

  /* ── Context ──────────────────────────── */
  const {
    students,
    seatingPlan,
    nCols,
    aisles,
    generatePlan,
  } = useSeating();

  /* ── Cleanup on unmount ──────────────── */
  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
    };
  }, []);

  /* ── Watch seatingPlan → dispatch animation ── */
  useEffect(() => {
    if (!seatingPlan) {
      // generatePlan() returned null / failed
      setIsAnimating(false);
      setHasRevealed(false);
      return;
    }
    if (isAnimating) return; // prevent double-fire

    setIsAnimating(true);
    const nRows = seatingPlan.length;
    const nCols = seatingPlan[0]?.length || 0;

    switch (animationMode) {
      case 'flip':
        animateFlip(seatingPlan, nRows, nCols, timerRef, setRevealedSeats);
        break;
      case 'fade':
        animateFade(seatingPlan, nRows, nCols, timerRef, setRevealedSeats);
        break;
      case 'bounce':
        animateBounce(seatingPlan, nRows, nCols, timerRef, setRevealedSeats);
        break;
      case 'scan':
        animateScan(seatingPlan, nRows, nCols, timerRef, setRevealedSeats);
        break;
    }
  }, [seatingPlan, animationMode]);

  /* ── Handlers ─────────────────────────── */
  const handleReveal = () => {
    if (isAnimating || students.length === 0) return;
    setHasRevealed(false);
    setRevealedSeats(new Set());
    generatePlan();
  };

  /* ── Animation: 3D Flip Card ──────────── */
  const animateFlip = (plan, nRows, nCols, timerRef, setRevealedSeats) => {
    let completed = 0;
    const total = nRows * nCols;

    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const delay = (r * nCols + c) * 80; // 80ms per seat, row-major
        const id = setTimeout(() => {
          setRevealedSeats(prev => {
            const next = new Set(prev);
            next.add(`${r}-${c}`);
            completed++;
            if (completed >= total) {
              setIsAnimating(false);
              setHasRevealed(true);
            }
            return next;
          });
        }, delay);
        timerRef.current.push(id);
      }
    }
    // Total animation: 56 * 80ms + 400ms (CSS animation-duration) ≈ 4.9s
  };

  /* ── Animation: Row-by-Row Fade ────────── */
  const animateFade = (plan, nRows, nCols, timerRef, setRevealedSeats) => {
    let completed = 0;
    const total = nRows * nCols;

    for (let r = 0; r < nRows; r++) {
      const delay = r * 400; // 400ms per row
      const id = setTimeout(() => {
        setRevealedSeats(prev => {
          const next = new Set(prev);
          for (let c = 0; c < nCols; c++) {
            next.add(`${r}-${c}`);
            completed++;
          }
          if (completed >= total) {
            setIsAnimating(false);
            setHasRevealed(true);
          }
          return next;
        });
      }, delay);
      timerRef.current.push(id);
    }
    // Total: 8 rows × 400ms + 600ms (CSS) ≈ 3.8s
  };

  /* ── Animation: Bounce Pop ─────────────── */
  const animateBounce = (plan, nRows, nCols, timerRef, setRevealedSeats) => {
    // Build shuffled array of all seat coordinates
    const coords = [];
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        coords.push({ r, c });
      }
    }
    // Fisher-Yates shuffle
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    let completed = 0;
    const total = coords.length;

    coords.forEach(({ r, c }, index) => {
      const delay = index * 70; // 70ms per seat
      const id = setTimeout(() => {
        setRevealedSeats(prev => {
          const next = new Set(prev);
          next.add(`${r}-${c}`);
          completed++;
          if (completed >= total) {
            setIsAnimating(false);
            setHasRevealed(true);
          }
          return next;
        });
      }, delay);
      timerRef.current.push(id);
    });
    // Total: 56 × 70ms + 500ms (CSS bouncePop) ≈ 4.4s
  };

  /* ── Animation: Scan Reveal (L→R) ──────── */
  const animateScan = (plan, nRows, nCols, timerRef, setRevealedSeats) => {
    let completed = 0;
    const total = nRows * nCols;

    for (let c = 0; c < nCols; c++) {
      const delay = c * 120; // 120ms per column
      const id = setTimeout(() => {
        setRevealedSeats(prev => {
          const next = new Set(prev);
          for (let r = 0; r < nRows; r++) {
            next.add(`${r}-${c}`);
            completed++;
          }
          if (completed >= total) {
            setIsAnimating(false);
            setHasRevealed(true);
          }
          return next;
        });
      }, delay);
      timerRef.current.push(id);
    }
    // Total: 7 cols × 120ms + 300ms (CSS scanReveal) ≈ 1.14s — fastest animation
  };

  /* ── Grid rendering ──────────────────── */
  const renderGrid = () => {
    if (!seatingPlan || seatingPlan.length === 0) return null;

    const { blockRanges } = getBlockStructure(nCols, aisles);

    if (blockRanges.length === 0) return null;

    // Build grid-template-columns
    const gridCols = [];
    for (let i = 0; i < blockRanges.length; i++) {
      const { start, end } = blockRanges[i];
      for (let c = start; c <= end; c++) {
        gridCols.push('80px');
      }
      if (i < blockRanges.length - 1) {
        gridCols.push('20px');
      }
    }

    const animClass = `anim-${animationMode}`;

    return (
      <div
        className={`present-grid ${animClass}`}
        style={{ gridTemplateColumns: gridCols.join(' ') }}
      >
        {seatingPlan.map((row, r) =>
          blockRanges.flatMap(({ start, end }, blockIdx) => {
            const seats = [];
            for (let c = start; c <= end; c++) {
              const cell = row[c];
              const seatKey = `${r}-${c}`;
              const isRevealed = revealedSeats.has(seatKey);
              const student = cell;
              const genderClass = student
                ? student.gender === '男'
                  ? 'male'
                  : 'female'
                : '';
              const emptyClass = !student ? 'empty' : '';

              seats.push(
                <div
                  key={seatKey}
                  className={`present-seat ${genderClass} ${emptyClass} ${isRevealed ? 'revealed' : ''}`}
                >
                  {student && <span className="seat-name">{student.name}</span>}
                </div>
              );
            }
            if (blockIdx < blockRanges.length - 1) {
              return [
                ...seats,
                <div
                  key={`a-${r}-${blockIdx}`}
                  className="present-aisle"
                />,
              ];
            }
            return seats;
          })
        )}
      </div>
    );
  };

  /* ── JSX ──────────────────────────────── */
  return (
    <div className="presentation-view">
      <h1 className="presentation-title">班级座位表</h1>

      {students.length > 0 && (
        <div className="student-count">共 {students.length} 人</div>
      )}

      {students.length === 0 ? (
        <>
          <div className="presentation-hint">
            请先在配置页加载学生名单
          </div>
          <button className="btn btn-primary reveal-btn" disabled>
            🎲 揭晓座位
          </button>
        </>
      ) : (
        <>
          <div className="mode-selector">
            <label className={`mode-option ${animationMode === 'flip' ? 'active' : ''}`}>
              <input type="radio" name="animMode" value="flip"
                checked={animationMode === 'flip'}
                onChange={() => { if (!isAnimating) setAnimationMode('flip'); }} />
              <span className="mode-label">
                <strong>🃏 翻转卡片</strong>
                <small>3D 翻转逐座揭示</small>
              </span>
            </label>
            <label className={`mode-option ${animationMode === 'fade' ? 'active' : ''}`}>
              <input type="radio" name="animMode" value="fade"
                checked={animationMode === 'fade'}
                onChange={() => { if (!isAnimating) setAnimationMode('fade'); }} />
              <span className="mode-label">
                <strong>📖 逐行渐显</strong>
                <small>一行行依次淡入</small>
              </span>
            </label>
            <label className={`mode-option ${animationMode === 'bounce' ? 'active' : ''}`}>
              <input type="radio" name="animMode" value="bounce"
                checked={animationMode === 'bounce'}
                onChange={() => { if (!isAnimating) setAnimationMode('bounce'); }} />
              <span className="mode-label">
                <strong>💥 跳跃弹出</strong>
                <small>随机顺序弹出</small>
              </span>
            </label>
            <label className={`mode-option ${animationMode === 'scan' ? 'active' : ''}`}>
              <input type="radio" name="animMode" value="scan"
                checked={animationMode === 'scan'}
                onChange={() => { if (!isAnimating) setAnimationMode('scan'); }} />
              <span className="mode-label">
                <strong>🌊 扫描揭示</strong>
                <small>光带从左扫到右</small>
              </span>
            </label>
          </div>

          <div className="podium">讲台</div>
          {renderGrid()}

          {!hasRevealed && !isAnimating && (
            <button
              className="btn btn-primary reveal-btn"
              onClick={handleReveal}
            >
              🎲 揭晓座位
            </button>
          )}

          {isAnimating && (
            <button className="btn btn-primary reveal-btn" disabled>
              揭晓中...
            </button>
          )}

          {hasRevealed && !isAnimating && (
            <button
              className="btn btn-primary reveal-again-btn"
              onClick={handleReveal}
            >
              🔄 重新揭晓
            </button>
          )}
        </>
      )}
    </div>
  );
}
