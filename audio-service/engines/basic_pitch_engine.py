"""
Spotify Basic Pitch engine — Phase 6.
Responsibilities: note detection, MIDI conversion, timing extraction.
Requires: pip install basic-pitch
"""
import importlib.metadata
import logging
from pathlib import Path

import numpy as np

from engines.base import AudioEngine
from models import (
    StandardizedMetrics, NoteMetrics, NoteEvent,
    TempoMetrics, DynamicsMetrics, OnsetMetrics, TimingMetrics, SpectralMetrics, PitchMetrics,
)

logger = logging.getLogger(__name__)

# MIDI → Hz
def midi_to_hz(midi: int) -> float:
    return 440.0 * (2 ** ((midi - 69) / 12))


class BasicPitchEngine(AudioEngine):
    @staticmethod
    def is_available() -> bool:
        try:
            from basic_pitch.inference import predict  # noqa: F401
            return True
        except ImportError:
            return False

    @property
    def name(self) -> str:
        return "basic_pitch"

    @property
    def version(self) -> str:
        try:
            return importlib.metadata.version("basic-pitch")
        except Exception:
            return "unknown"

    def analyze(self, audio_path: Path, sample_rate: int = 22050) -> StandardizedMetrics:
        try:
            from basic_pitch.inference import predict
            from basic_pitch import ICASSP_2022_MODEL_PATH
            import librosa

            duration = librosa.get_duration(path=str(audio_path))
            logger.info("Running Basic Pitch on %.1fs of audio", duration)

            # Basic Pitch returns: model_output, midi_data, note_events
            # note_events: list of (start_s, end_s, pitch_midi, amplitude, pitch_bend_list)
            _, _, note_events = predict(str(audio_path), ICASSP_2022_MODEL_PATH)

            if not note_events:
                return self._wrap(NoteMetrics(available=True, note_count=0), duration, sample_rate)

            events = []
            for ev in note_events:
                start_s, end_s, pitch_midi, amplitude = ev[0], ev[1], ev[2], ev[3]
                dur = round(end_s - start_s, 3)
                if dur <= 0:
                    continue
                events.append(NoteEvent(
                    start_time=round(float(start_s), 3),
                    end_time=round(float(end_s), 3),
                    duration_s=dur,
                    pitch_midi=int(pitch_midi),
                    pitch_hz=round(midi_to_hz(int(pitch_midi)), 2),
                    amplitude=round(float(amplitude), 3),
                ))

            pitches = [e.pitch_midi for e in events]
            durations = [e.duration_s for e in events]
            amplitudes = [e.amplitude for e in events]

            note_metrics = NoteMetrics(
                available=True,
                note_count=len(events),
                avg_note_duration_s=round(float(np.mean(durations)), 4) if durations else None,
                avg_amplitude=round(float(np.mean(amplitudes)), 4) if amplitudes else None,
                pitch_range_midi=int(max(pitches) - min(pitches)) if pitches else None,
                lowest_pitch_midi=int(min(pitches)) if pitches else None,
                highest_pitch_midi=int(max(pitches)) if pitches else None,
                notes=events,
            )

            return self._wrap(note_metrics, duration, sample_rate)

        except Exception as exc:
            logger.exception("Basic Pitch engine failed")
            return self._wrap(NoteMetrics(available=False), 0.0, sample_rate, error=str(exc))

    def _wrap(self, notes: NoteMetrics, duration: float, sr: int, error: str | None = None) -> StandardizedMetrics:
        return StandardizedMetrics(
            engine=self.name,
            engine_version=self.version,
            engines_used=[self.name],
            duration_seconds=duration,
            sample_rate=sr,
            tempo=TempoMetrics(bpm=0, stability=0, beats=[], downbeats=[]),
            dynamics=DynamicsMetrics(avg_db=0, max_db=0, min_db=0, dynamic_range_db=0),
            onsets=OnsetMetrics(count=0, times=[], strengths=[]),
            timing=TimingMetrics(avg_onset_interval_s=0, timing_consistency=0, rushing_tendency=0, dragging_tendency=0),
            spectral=SpectralMetrics(centroid_mean_hz=0, centroid_std_hz=0, bandwidth_mean_hz=0, rolloff_mean_hz=0, zero_crossing_rate_mean=0),
            pitch=PitchMetrics(),
            notes=notes,
            error=error,
        )
