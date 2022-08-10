import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css';
import { validWordSet, wordList } from './Words';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.css';
import './index.scss';


function Tile(props) {
  // const [letter, setLetter] = useState('');
  let tileClass = "tile";
  if (props.tileState >= 0) {
    switch (props.tileState) {
      case 1:
        tileClass += " correct-wrong-pos";
        break;
      case 3:
        tileClass += " correct";
        break;
      default:
        tileClass += " incorrect";
        break;
    }
    tileClass += " noborder"
  }

  //non empty 
  if (props.value != '') {
    if (props.tileState == -1) {
      tileClass += " expand-start border";
    }
  } else {
    //empty
    tileClass += " border-gray";
  }
  return (
    <div className={tileClass}>
      <p>{props.value} </p>
    </div>);

}

function KeyboardKey(props) {

  if (props.char == 'backspace') {
    return (<div className={"keyboard-key d-flex justify-content-center align-items-center " + props.char + "-key"} onClick={() => { props.clickListener(props.char) }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="42" width="42">
        <path
          d="m22.4 31.7 5.6-5.6 5.6 5.6 2.15-2.15L30.1 24l5.55-5.55-2.15-2.15-5.5 5.6-5.6-5.6-2.15 2.15L25.9 24l-5.65 5.55ZM6 24l8.45-11.95q.65-.9 1.55-1.475.9-.575 2-.575h21q1.25 0 2.125.875T42 13v22q0 1.25-.875 2.125T39 38H18q-1.1 0-2-.575-.9-.575-1.55-1.475Zm3.75 0 7.7 11H39V13H17.45ZM39 24V13v22Z" />
      </svg>
    </div>);
  } else {
    return (
      <div className={"keyboard-key d-flex justify-content-center align-items-center " + props.char + "-key"} onClick={() => { props.clickListener(props.char) }}>
        <p className="m-1">{props.char}</p>
      </div>);
  }


}

class Keyboard extends React.Component {
  constructor(props) {
    super(props);

    let row2 = ['enter'];
    row2.push(...'zxcvbnm'.split(''));
    row2.push(...['backspace']);

    let keyboardRows = [
      'qwertyuiop'.split(''),
      'asdfghjkl'.split(''),
      row2,
    ];
    this.state = {
      boardRows: keyboardRows,
      listeners: props.listeners
    }
  }

  keyboardClick(letter) {
    if (letter == 'backspace') {
      this.state.listeners['backspace']();
    } else if (letter == 'enter') {
      this.state.listeners['enter']();
    } else {
      this.state.listeners['letter'](letter);
    }
  }

  render() {
    return (
      <div className='keyboard'>
        {/* for every row in keyboard*/
          this.state.boardRows.map((keyboardRow, i) => {
            //render each row 
            return (
              <div className={"keyboard-row-" + i} key={i}>
                {
                  keyboardRow.map((letter, j) => {
                    return (<KeyboardKey char={letter} key={j} clickListener={this.keyboardClick.bind(this)} />);
                  })
                }
              </div>);
          })
        }
      </div>
    );
  }
}

class Grid extends React.Component {

  constructor(props) {
    super(props);
    let freqMap = new Map();
    props.word.split('').forEach((x, i) => {
      let count = freqMap.get(x);
      if (count == null) {
        count = 0;
      }
      freqMap.set(x, count + 1);
    });

    props.listeners['backspace'] = this.processBackspace.bind(this);
    props.listeners['letter'] = this.processLetter.bind(this);
    props.listeners['enter'] = this.processEnter.bind(this);

    this.state = {
      gameStateListener: props.gameOver,
      word: props.word,
      fmap: freqMap,
      nRows: [0, 1, 2, 3, 4, 6],
      nColumns: [0, 1, 2, 3, 4],

      NUM_ROWS: 6,
      NUM_COLS: 5,
      row: 0,
      col: 0,
      grid: [
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', '']
      ],
      gridStateMap: new Map(),
      gameOver: false,
    }
  }

  processLetter(letter) {
    let row = this.state.row;
    let col = this.state.col;

    if (row < this.state.NUM_ROWS) {
      if (col < this.state.NUM_COLS) {
        let nGrid = this.state.grid;
        let newRow = nGrid[row];
        newRow[col] = letter;
        // this.setState({grid: nGrid});
        this.setState({ grid: nGrid, col: col + 1 });
      }
    }
  }

  processEnter() {
    let row = this.state.row;
    let col = this.state.col;
    if (col == this.state.NUM_COLS) {

      let word = this.state.grid[row].reduce((t, current, i, arr) => { return t + current; });

      if (validWordSet.has(word)) {
        //valid word
        let currentWord = this.state.word;
        let currentWordFreqMap = new Map(this.state.fmap);
        let rowScore = 0;
        let stateMap = this.state.gridStateMap;

        for (let i = 0; i < 5; i++) {

          let index = (row * 5) + i;
          let tileState = 0;
          let char = word.charAt(i);

          if (currentWord.match(char)) {
            //highlight tile
            //letter
            //if there is a letter to take
            if (currentWordFreqMap.has(char)) {
              tileState |= 1;

              let count = currentWordFreqMap.get(char);

              if (count > 1) {
                currentWordFreqMap.set(char, count - 1);
              } else {
                currentWordFreqMap.delete(char);
              }
              // tileState |= 1;
              if (currentWord.charAt(i) == char) {
                tileState |= 2;
              }
            }

          }
          rowScore += tileState;
          stateMap.set(index, tileState);
        }
        //highlight letters in word
        let gameOverState = false;
        if (rowScore == 15 || row + 1 == this.state.NUM_ROWS) {
          //game over 
          gameOverState = true;
        }
        this.setState({
          gridStateMap: stateMap,
          row: row + 1, col: 0,
          gameOver: gameOverState,
        });
        this.state.gameStateListener(gameOverState);
      }
    }
  }

  processBackspace() {
    let col = this.state.col;
    let row = this.state.row;
    if (col > 0) {

      let nGrid = this.state.grid;
      let nRow = nGrid[row];
      nRow[col - 1] = '';
      this.setState({ grid: nGrid, col: col - 1 });

    }
  }

  keyboardEventHandler = (event) => {
    //sent down to the grid
    let key = event.key;
    let row = this.state.row;
    let col = this.state.col;
    //game over
    if (row >= this.state.NUM_ROWS | this.state.gameOver) {
      console.log('game over.');
      return;
    }

    if (key.length == 1) {
      //its good no numbers tho
      if (key.match(/[a-zA-Z]/)) {
        this.processLetter(key);
      }
    } else if (key == "Backspace") {
      this.processBackspace();
    } else if (key == "Enter") {
      this.processEnter();
    }
  };

  componentDidMount() {
    document.addEventListener('keydown', this.keyboardEventHandler);
  }


  render() {
    return (
      <div className="game-grid">
        {
          //6 rows
          this.state.nRows.map((_, rowIndex) => {
            return (<div className='tile-row' key={rowIndex}>
              {
                //5 cells per row
                this.state.nColumns.map((__, colIndex) => {
                  return <Tile

                    value={this.state.grid[rowIndex][colIndex]}
                    key={colIndex}
                    index={colIndex}
                    tileState={
                      this.state.gridStateMap.get(rowIndex * 5 + colIndex) == null ? -1 : this.state.gridStateMap.get(rowIndex * 5 + colIndex)
                    }
                  />;
                })
              }
            </div>);
          })
        }
      </div>
    );
  }
}

class Game extends React.Component {

  constructor() {
    super();
    let randomIndex = Math.floor(Math.random() * wordList.length);
    this.state = {
      showAnswer: false,
      word: wordList[randomIndex],
      listeners: {},
    }
  }

  onGameOver(isGameOver) {
    if (isGameOver) {
      //show answer
      this.setState({
        showAnswer: true
      });
    }
  }

  render() {
    let visibility = "invisible";
    if (this.state.showAnswer) {
      visibility = "visible";
    }
    return (
      <div className="game">
        <Grid word={this.state.word} gameOver={(state) => { this.onGameOver(state); }} listeners={this.state.listeners} />
        <div className={"answer-row tile-row mx-auto " + visibility}>
          {
            [0, 1, 2, 3, 4].map((_, i, arr) => {
              return <div className='tile border' key={i}>
                <p>{this.state.word.charAt(i)}</p>
              </div>;
            })
          }
        </div>
        <Keyboard listeners={this.state.listeners} />
      </div>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="navbar">
      <div className="back-button d-flex flex-row-reverse">
        <a href="/">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="32" width="32">
          <path d="M24 39.25 8.75 24 24 8.75l1.6 1.6-12.5 12.5h26.15v2.3H13.1l12.5 12.5Z" />
        </svg>
        </a>
      </div>
      <h1 className="title">Squirdle</h1>
    </div>
    <Game />
  </React.StrictMode>
);
/**
 

  5 x 6 board
  visible keyboard
  nav bar with title

  letter in word => highlight yellow
  letter in word at correct position => highlight green


  0 [] [] [] [] [] 
  1 [] [] [] [] []
  2 [] [] [] [] []
  3 [] [] [] [] []
  4 [] [] [] [] []
  5 [] [] [] [] []


 */
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
