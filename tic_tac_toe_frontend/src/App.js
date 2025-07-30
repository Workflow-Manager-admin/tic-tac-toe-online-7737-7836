import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Color scheme from requirements:
 *  - Primary:   #1976d2 (blue)
 *  - Secondary: #fff176 (yellow)
 *  - Accent:    #e53935 (red)
 * Theming is handled by overriding CSS variables per design.
 */

// -- Helpers --

const GAME_MODES = {
  TWO_PLAYER: "Two Players",
  VS_COMPUTER: "Vs Computer",
};

// AI: simple "medium" level, not perfect (for fun).
// Returns index (0..8) for AI's move
function getAIMove(board, aiMark, playerMark) {
  // Try to win
  for (let i = 0; i < 9; ++i) {
    if (!board[i]) {
      const test = board.slice();
      test[i] = aiMark;
      if (calculateWinner(test)) return i;
    }
  }
  // Block player win
  for (let i = 0; i < 9; ++i) {
    if (!board[i]) {
      const test = board.slice();
      test[i] = playerMark;
      if (calculateWinner(test)) return i;
    }
  }
  // Center
  if (!board[4]) return 4;
  // Corners
  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  // Any empty
  const empties = board.reduce((arr, val, idx) => (val ? arr : arr.concat(idx)), []);
  return empties.length > 0 ? empties[Math.floor(Math.random() * empties.length)] : -1;
}

// Returns "X", "O", "draw", or null
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],[3, 4, 5],[6, 7, 8], // rows
    [0, 3, 6],[1, 4, 7],[2, 5, 8], // cols
    [0, 4, 8],[2, 4, 6],           // diags
  ];
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  if (squares.every(Boolean)) return "draw";
  return null;
}

// -- Components --

/**
 * PUBLIC_INTERFACE
 * Main App entry point, game logic and layout
 */
function App() {
  // Theme: always light per requirements, allow toggle for future
  const [theme] = useState("light");

  // Game state
  const [mode, setMode] = useState(GAME_MODES.TWO_PLAYER);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const winner = calculateWinner(board);

  // Score panel (reset only with main Reset)
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });

  // For smoother UX: allow setting player symbol in AI mode.
  const [playerIsX, setPlayerIsX] = useState(true);

  // Effect: set CSS theme variable
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle move (human)
  function handleMove(idx) {
    if (board[idx] || winner) return; // already taken or game over
    if (mode === GAME_MODES.VS_COMPUTER && !isPlayerTurn()) return;

    const nextBoard = board.slice();
    nextBoard[idx] = currentMark();
    setBoard(nextBoard);
    setXIsNext((prev) => !prev);
  }

  // After player/AI move, check for game end and update score
  useEffect(() => {
    const result = winner;
    if (result && result !== null) {
      setTimeout(() => {
        setScore((prev) => ({
          ...prev,
          [result]: (prev[result] ?? 0) + 1,
        }));
      }, 150);
    }
    // If AI's turn, trigger AI move.
    if (
      mode === GAME_MODES.VS_COMPUTER &&
      !winner &&
      !isPlayerTurn()
    ) {
      const ai = getAIMove(board, aiMark(), playerMark());
      if (ai > -1) {
        setTimeout(() => {
          const nextBoard = board.slice();
          nextBoard[ai] = aiMark();
          setBoard(nextBoard);
          setXIsNext((prev) => !prev);
        }, 375); // delay for realism
      }
    }
    // eslint-disable-next-line
  }, [board, mode, playerIsX, xIsNext, winner]);

  // Helpers: players and display
  function currentMark() {
    return xIsNext ? "X" : "O";
  }
  function isPlayerTurn() {
    if (mode === GAME_MODES.TWO_PLAYER) return true;
    return (xIsNext && playerIsX) || (!xIsNext && !playerIsX);
  }
  function playerMark() {
    return playerIsX ? "X" : "O";
  }
  function aiMark() {
    return playerIsX ? "O" : "X";
  }
  function statusText() {
    if (winner) {
      if (winner === "draw") return "It's a draw!";
      return `Player ${winner} wins!`;
    }
    if (mode === GAME_MODES.VS_COMPUTER) {
      if (isPlayerTurn()) return "Your turn";
      return "Computer's turn...";
    } else {
      return `Player ${currentMark()}'s turn`;
    }
  }

  // Reset Board
  function resetBoard() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }
  // Master reset including score
  function resetAll() {
    resetBoard();
    setScore({ X: 0, O: 0, draw: 0 });
  }
  // Game mode change resets game (score kept)
  function setGameMode(m) {
    setMode(m);
    resetBoard();
  }

  // Set player symbol (resets only board)
  function selectSymbol(val) {
    setPlayerIsX(val === "X");
    resetBoard();
  }

  // UI starts here

  return (
    <div className="App" style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="ttt-container">
        <h1 className="ttt-title">
          <span style={{ color: "var(--accent)" }}>Tic</span>
          <span style={{ color: "var(--primary)" }}>Tac</span>
          <span style={{ color: "var(--secondary)" }}>Toe</span>
        </h1>
        <div className="ttt-top-controls">
          <ModeSelect mode={mode} setGameMode={setGameMode} />
          {mode === GAME_MODES.VS_COMPUTER && (
            <SymbolSelect playerIsX={playerIsX} selectSymbol={selectSymbol} />
          )}
        </div>
        <div className="ttt-main-section">
          <ScorePanel score={score} playerIsX={playerIsX} mode={mode} playerMark={playerMark()} aiMark={aiMark()} />
          <GameBoard
            board={board}
            onCellClick={handleMove}
            disabled={!!winner || (mode === GAME_MODES.VS_COMPUTER && !isPlayerTurn())}
            winner={winner}
          />
        </div>
        <div className="ttt-bottom-controls">
          <div className="ttt-status" tabIndex={0} aria-live="polite">
            {statusText()}
          </div>
          <button className="ttt-btn" onClick={resetBoard} tabIndex={0}>
            Play Again
          </button>{" "}
          <button className="ttt-btn ttt-btn-secondary" onClick={resetAll} tabIndex={0}>
            Reset All
          </button>
        </div>
        <footer className="ttt-footer">
          <span>
            Built with <span style={{ color: "var(--accent)" }}>♥</span> for fun •{" "}
            <a
              href="https://reactjs.org"
              className="footer-link"
              style={{ color: "var(--primary)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              React
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function GameBoard({ board, onCellClick, disabled, winner }) {
  // Highlight win if there is one
  const winLine = getWinLine(board);

  function getClass(idx) {
    let cls = "ttt-cell";
    if (winLine && winLine.includes(idx)) cls += " ttt-cell-win";
    return cls;
  }

  return (
    <div className="ttt-board">
      {board.map((value, idx) => (
        <button
          key={idx}
          className={getClass(idx)}
          onClick={() => onCellClick(idx)}
          disabled={disabled || board[idx]}
          style={{
            cursor: disabled || board[idx] ? "not-allowed" : "pointer",
          }}
          aria-label={
            board[idx]
              ? `Cell ${idx + 1}, ${board[idx]}`
              : `Cell ${idx + 1}, empty`
          }
        >
          <span className={`ttt-mark ttt-mark-${value || "empty"}`}>
            {value}
          </span>
        </button>
      ))}
    </div>
  );
}

// Get winning line: return triple or null (for highlight)
function getWinLine(squares) {
  const lines = [
    [0, 1, 2],[3, 4, 5],[6, 7, 8],
    [0, 3, 6],[1, 4, 7],[2, 5, 8],
    [0, 4, 8],[2, 4, 6],
  ];
  for (let trio of lines) {
    const [a, b, c] = trio;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return trio;
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function ModeSelect({ mode, setGameMode }) {
  return (
    <div className="ttt-mode-select">
      <button
        className={`ttt-btn${mode === GAME_MODES.TWO_PLAYER ? " ttt-btn-active" : ""}`}
        style={mode === GAME_MODES.TWO_PLAYER ? { background: "var(--primary)", color: "#fff" } : {}}
        onClick={() => setGameMode(GAME_MODES.TWO_PLAYER)}
        tabIndex={0}
      >
        2 Players
      </button>
      <button
        className={`ttt-btn${mode === GAME_MODES.VS_COMPUTER ? " ttt-btn-active" : ""}`}
        style={mode === GAME_MODES.VS_COMPUTER ? { background: "var(--primary)", color: "#fff" } : {}}
        onClick={() => setGameMode(GAME_MODES.VS_COMPUTER)}
        tabIndex={0}
      >
        Vs Computer
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function SymbolSelect({ playerIsX, selectSymbol }) {
  return (
    <div className="ttt-symbol-select">
      <label style={{ fontWeight: 500, marginRight: 8 }}>
        <span style={{ color: "var(--primary)" }}>Your symbol:</span>
      </label>
      <button
        className={`ttt-btn${playerIsX ? " ttt-btn-active" : ""}`}
        style={playerIsX ? { background: "var(--accent)", color: "#fff" } : {}}
        onClick={() => selectSymbol("X")}
        tabIndex={0}
        aria-pressed={playerIsX}
      >
        X
      </button>
      <button
        className={`ttt-btn${!playerIsX ? " ttt-btn-active" : ""}`}
        style={!playerIsX ? { background: "var(--secondary)", color: "#222" } : {}}
        onClick={() => selectSymbol("O")}
        tabIndex={0}
        aria-pressed={!playerIsX}
      >
        O
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function ScorePanel({ score, playerIsX, mode, playerMark, aiMark }) {
  // Title and legend for panel
  let panelTitle = "Scores";
  let p1 = "Player X";
  let p2 = "Player O";
  if (mode === GAME_MODES.VS_COMPUTER) {
    p1 = playerIsX ? "You (X)" : "Computer (X)";
    p2 = !playerIsX ? "You (O)" : "Computer (O)";
  }
  return (
    <div className="ttt-score-panel">
      <div className="score-title">{panelTitle}</div>
      <div className="score-row">
        <span className="score-label" style={{ color: "var(--accent)" }}>{p1}:</span>
        <span className="score-value">{score.X}</span>
      </div>
      <div className="score-row">
        <span className="score-label" style={{ color: "var(--secondary)" }}>{p2}:</span>
        <span className="score-value">{score.O}</span>
      </div>
      <div className="score-row">
        <span className="score-label" style={{ color: "var(--primary)" }}>Draw:</span>
        <span className="score-value">{score.draw}</span>
      </div>
    </div>
  );
}

export default App;
