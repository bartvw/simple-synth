import { useEffect, useState, useRef } from 'react'
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript';
import './App.css'
import initialCode from '../example.js?raw'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [code, setCode] = useState(initialCode);
  const audioContextRef = useRef<AudioContext | null>(null);
  const generatorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    window.eval(code);
  }, []);
  
  const handlePlayClick = () => {
    audioContextRef.current = new AudioContext();

    generatorRef.current = audioContextRef.current.createScriptProcessor(8192, 1, 1);
    generatorRef.current.onaudioprocess = (audioProcessingEvent: AudioProcessingEvent): void => {
      const outputBuffer = audioProcessingEvent.outputBuffer.getChannelData(0);
      const sampleRate = audioContextRef.current?.sampleRate;

      // Using Array.prototype.forEach for functional iteration
      outputBuffer.forEach((_, index) => {
        if (typeof (window as any).wave === 'function') {
          outputBuffer[index] = (window as any).wave(audioProcessingEvent.playbackTime + index / sampleRate!);
        }
      });
    };

    generatorRef.current.connect(audioContextRef.current.destination); 
    setIsPlaying(true);
    audioContextRef.current.resume();
  };

  const handleStopClick = () => {
    generatorRef.current?.disconnect();
    setIsPlaying(false);
  };


  const handleCodeChange = (viewUpdate: ViewUpdate) => {
    if (!viewUpdate.docChanged) return;

    const newCode = viewUpdate.view.state.doc.toString();
    setCode(newCode);
    try {
      // eslint-disable-next-line
      window.eval(newCode);
    } catch (error) {
      console.error('Invalid JavaScript code:', error);
    }
  };

  return (
    <>
      <button onClick={isPlaying ? handleStopClick : handlePlayClick}>
        {isPlaying ? '⏹️' : '▶️'}
      </button>
      <p>Edit the <code>wave</code> function below to change the sound.</p>
      <CodeMirror
        value={code}
        onUpdate={handleCodeChange}
        style={{ textAlign: 'left' }}
        height="600px"
        width="800px"
        extensions={[javascript({ jsx: true })]}
        lang="javascript"
      />
    </>
  )
}

export default App;
