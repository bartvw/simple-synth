import { useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function waveFunction(elapsedTime: number): number {
  return Math.sin(2 * Math.PI * 440 * elapsedTime);
}

function App() {
  const [count, setCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const generatorRef = useRef<ScriptProcessorNode | null>(null);

  const handlePlayClick = () => {
    audioContextRef.current = new AudioContext();

    generatorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    generatorRef.current.onaudioprocess = (audioProcessingEvent: AudioProcessingEvent): void => {
      const outputBuffer = audioProcessingEvent.outputBuffer.getChannelData(0);
      const sampleRate = audioContextRef.current?.sampleRate;

      // Using Array.prototype.forEach for functional iteration
      outputBuffer.forEach((_, index) => {
        outputBuffer[index] = waveFunction(audioProcessingEvent.playbackTime + index / sampleRate!);
      });
    };

    generatorRef.current.connect(audioContextRef.current.destination); // Connect the oscillator to the destination node

    console.log("Playing");

    setIsPlaying(true);
    audioContextRef.current.resume();
  };

  const handleStopClick = () => {
    generatorRef.current?.disconnect();
    console.log("Stopped");
    setIsPlaying(false);
  };

  return (
    <>
      <h1>Simple Synth</h1>
      <div className="card">
        <button onClick={isPlaying ? handleStopClick : handlePlayClick}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
    </>
  )
}

export default App;
