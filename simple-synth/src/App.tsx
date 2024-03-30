import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      
      <h1>Simple Synth</h1>
      <div className="card">
        <button onClick={handlePlayClick}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
      
    </>
  )
}

export default App
