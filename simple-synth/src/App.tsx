import { useEffect, useState, useRef } from 'react'
import './App.css'


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
        if (typeof window.wave === 'function') {
          outputBuffer[index] = window.wave(audioProcessingEvent.playbackTime + index / sampleRate!);
        }
        
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

  const [code, setCode] = useState(`function wave(t) {
  return Math.sin(2 * Math.PI * 440 * t);
}`);

  useEffect(() => {
    window.eval(code);
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    try {
      //evaluate the code and make sure that if any functions are defined, they are available in the global scope
      // eslint-disable-next-line
      window.eval(newCode);
    } catch (error) {
      console.error('Invalid JavaScript code:', error);
    }
  };

  return (
    <>
      <h1>Simple Synth</h1>
      <div className="card">
        <button onClick={isPlaying ? handleStopClick : handlePlayClick}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="editor">
        <textarea
          className="code-editor"
          spellCheck="false"
          style={{ width: '100ch', height: '100vh' }}
          value={code}
          onChange={handleCodeChange}
          lang="javascript"
        />
      </div>
    </>
  )
}

export default App;
