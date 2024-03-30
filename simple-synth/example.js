function noteToFreq(note) {
    const freqs = {
        'a': 440.00,
        'a#': 466.16,
        'b': 493.88,
        'c': 523.25,
        'c#': 554.37,
        'd': 587.33,
        'd#': 622.25,
        'e': 659.25,
        'f': 698.46,
        'f#': 739.99,
        'g': 783.99,
        'g#': 830.61
    };

    const octave = note.substr(-1, 1);
    const pitch = note.substr(0, note.length - 1);
    const factor = Math.pow(2, octave - 4);

    return factor * freqs[pitch];
}

class MonoSynth {
    constructor(waveFunction, ampEnvelopeGenerator) {
        this.waveFunction = waveFunction;
        this.ampEnvelopeGenerator = ampEnvelopeGenerator;
        this.pitchEnvelopeGenerator = new AttackDecayEnvelope(0, 0.02);
        this.pitchEnvelopeAmplitude = 0.2;

        this.note = null;
        this.attackOffset = 0;
        this.releaseOffset = 0;
        this.noteStart = 0;
    }

    dsp(t) {
        if (!this.note) {
            return 0;
        }

        const level = this.ampEnvelopeGenerator.getValue(t);

        let frequency = noteToFreq(this.note);
        if (this.pitchEnvelopeGenerator) {
            frequency = frequency + frequency * this.pitchEnvelopeGenerator.getValue(t) * this.pitchEnvelopeAmplitude;
        }

        return level * this.waveFunction(t - this.noteStart, frequency);
    }

    setPitchEnvelope(pitchEnvelopeGenerator, amplitude) {
        this.pitchEnvelopeGenerator = pitchEnvelopeGenerator;
        this.pitchEnvelopeAmplitude = amplitude;
    }

    noteOn(t, note) {
        this.noteStart = t;
        this.ampEnvelopeGenerator.triggerAttack(t);
        this.pitchEnvelopeGenerator.triggerAttack(t);
        this.note = note;
    }
}

class PolySynth {
    constructor(monosynthFunction, polyfony) {
        this.synths = [];
        this.currentSynth = 0;
        this.mixer = new Mixer(1);
        this.polyfony = polyfony;
        for (let i = 0; i < polyfony; i++) {
            const synth = monosynthFunction();
            this.synths.push(synth);
            this.mixer.addChannel(synth, 0.7);
        }
    }

    noteOn(t, note) {
        this.synths[this.currentSynth].noteOn(t, note);
        this.currentSynth++;
        this.currentSynth %= this.polyfony;
    }

    dsp(t) {
        return this.mixer.dsp(t);
    }
}

class AttackDecayEnvelope {
    constructor(attackTime, decayTime) {
        this.attackTime = attackTime;
        this.decayTime = decayTime;
        this.start = 0;
        this.triggered = false;
    }

    triggerAttack(t) {
        this.start = t;
        this.triggered = true;
    }

    getValue(t) {
        if (!this.triggered) {
            return 0;
        }

        function clamp(value) {
            return Math.min(1, Math.max(0, value));
        }

        const secondsIn = t - this.start;

        if (secondsIn <= this.attackTime) {
            return clamp(secondsIn / this.attackTime);
        } else if (secondsIn <= (this.attackTime + this.decayTime)) {
            return clamp(1 - ((secondsIn - this.attackTime) / this.decayTime));
        } else {
            return 0;
        }
    }
}

class StepSequencer {
    constructor(synth, bpm, pattern) {
        this.synth = synth;
        this.step = 0;
        this.bpm = bpm;
        this.pattern = pattern;
    }

    run(t) {
        const step = Math.floor(t * this.bpm / 15) % this.pattern.length;

        if (step !== this.step) {
            // next step
            this.step = step;
            const note = this.pattern[step];
            if (note) {
                this.synth.noteOn(t, note);
            }
        }
    }
}


class Channel {
    constructor(inputDsp, amp) {
        this.amp = amp;
        this.inputDsp = inputDsp;
    }

    dsp(t) {
        return this.amp * this.inputDsp.dsp(t);
    }
}

class Mixer {
    constructor(masterVolume) {
        this.channels = [];
        this.masterVolume = masterVolume;
    }

    dsp(t) {
        let sum = 0;
        for (let i = 0; i < this.channels.length; i++) {
            sum += this.channels[i].dsp(t);
        }

        return sum * this.masterVolume;
    }

    addChannel(dsp, amp) {
        this.channels.push(new Channel(dsp, amp));
    }
}

function sawtooth(t, freq) {
    return 2 * (t * freq - Math.floor(t * freq)) - 1;
}

function square(t, freq) {
    return (t * freq - Math.floor(t * freq)) < 0.5 ? 1 : -1;
}

function sine(t, freq) {
    return Math.sin(t * freq);
}

const mainMixer = new Mixer(0.9);

const synth = new PolySynth(
    () => new MonoSynth(square, new AttackDecayEnvelope(0.02, 0.1)),
    4
);
mainMixer.addChannel(synth, 0.2);

const bassDrum = new MonoSynth(sine, new AttackDecayEnvelope(0.0, 0.3));
bassDrum.setPitchEnvelope(new AttackDecayEnvelope(0.0, 0.2), 2.5);
const bassDrumSequencer = new StepSequencer(bassDrum, 120, ['a3', null, null, null]);
mainMixer.addChannel(bassDrum, 0.8);

const stepSequencer = new StepSequencer(
    synth, 120, [
    'a1', 'a2', 'a3', 'a2', 'a1', 'e2', 'a3', 'a2', 'a1', 'e2', 'a3', 'a2', 'a1', 'a2', 'a3', 'a2'
]
);

const stepSequencer2 = new StepSequencer(
    synth, 120, [
    'c3', null, null, 'g3', null, null, 'd3', 'e2', null, null, 'e2', 'c1', null, 'c3', null, null
]
);

function wave(t) {
    stepSequencer.run(t);
    stepSequencer2.run(t);
    bassDrumSequencer.run(t);

    return mainMixer.dsp(t);
}
