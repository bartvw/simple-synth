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

      <header className="w-full bg-gray-100 p-2 sticky top-0 fixed">
        <h1 className="text-xl font-bold">Simple Synth</h1>

      </header>
      <nav className="w-full bg-gray-50 p-2 sticky top-0 z-10">
        <button onClick={isPlaying ? handleStopClick : handlePlayClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5">
          {isPlaying ? '⏹️' : '▶️'}
        </button>
        Edit the <code>wave</code> function below to change the sound.
      </nav>


      <main className="relative">
        <CodeMirror
          value={code}
          onUpdate={handleCodeChange}

          extensions={[javascript({ jsx: true })]}
          lang="javascript"
          className="w-full"
        />

      </main>
      <footer className="w-full bg-gray-100 p-2 bottom-0 sticky z-10">

        <a href="https://github.com/bartvw/simple-synth" target="_blank">
           <img src="github-mark.png" width="12px" alt="logo" className="inline" /> source
        </a>
      </footer>


    </>
  )
}

export default App;
