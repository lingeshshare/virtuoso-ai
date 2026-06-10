"""
CREPE pitch engine — Phase 6.
Responsibilities: pitch tracking, intonation analysis, vibrato detection.
CREPE is a deep-learning pitch tracker (CNN-based). Requires: pip install crepe
"""
import importlib.metadata
import logging
import math
from pathlib import Path

import numpy as np

from engines.base import AudioEngine
from models import StandardizedMetrics, PitchMetrics, TempoMetrics, DynamicsMetrics, OnsetMetrics, TimingMetrics, SpectralMetrics

logger = logging.getLogger(__name__)

# Equal temperament: A4 = 440 Hz
A4_HZ = 440.0
A4_MIDI = 69


def hz_to_midi(hz: float) -> float:
    """Convert frequency to MIDI note number (continuous)."""
    if hz <= 0:
        return 0.0
    return 12 * math.log2(hz / A4_HZ) + A4_MIDI


def cents_from_equal_temperament(hz: float) -> float:
    """Deviation in cents from the nearest equal-temperament pitch."""
    if hz <= 0:
        return 0.0
    midi = hz_to_midi(hz)
    nearest_midi = round(midi)
    return (midi - nearest_midi) * 100  # 100 cents per semitone


def _is_voiced(confidence: float, threshold: float = 0.5) -> bool:
    return confidence >= threshold


class CrepeEngine(AudioEngine):
    @staticmethod
    def is_available() -> bool:
        try:
            import crepe  # noqa: F401
            return True
        except ImportError:
            return False

    @property
    def name(self) -> str:
        return "crepe"

    @property
    def version(self) -> str:
        try:
            return importlib.metadata.version("crepe")
        except Exception:
            return "unknown"

    def analyze(self, audio_path: Path, sample_rate: int = 22050) -> StandardizedMetrics:
        try:
            import crepe
            import librosa

            # CREPE works best at 16kHz
            y, sr = librosa.load(str(audio_path), sr=16000, mono=True)
            duration = librosa.get_duration(y=y, sr=sr)

            logger.info("Running CREPE on %.1fs of audio", duration)

            # model_capacity: 'tiny','small','medium','large','full'
            # 'small' is fast enough for production; 'medium' for better accuracy
            time_arr, freq_arr, conf_arr, _ = crepe.predict(
                y, sr,
                model_capacity='small',
                viterbi=True,
                center=True,
                step_size=10,  # ms — 10ms hop
            )

            # Filter to voiced frames
            voiced_mask = conf_arr >= 0.5
            voiced_freq = freq_arr[voiced_mask]
            voiced_conf = conf_arr[voiced_mask]

            if len(voiced_freq) == 0:
                pitch_metrics = PitchMetrics(
                    available=True,
                    avg_confidence=float(np.mean(conf_arr)) if len(conf_arr) > 0 else 0.0,
                )
                return self._wrap(pitch_metrics, duration, sr)

            avg_confidence = float(np.mean(voiced_conf))
            median_pitch = float(np.median(voiced_freq))

            # Pitch stability: 1 - normalized std dev of voiced pitch in cents
            pitch_cents = np.array([hz_to_midi(f) * 100 for f in voiced_freq])
            cents_std = float(np.std(pitch_cents))
            # Map: 0 cents std = 1.0, 200 cents std = 0.0
            pitch_stability = float(max(0.0, 1.0 - min(cents_std / 200.0, 1.0)))

            # Intonation: deviation from equal temperament (voiced frames)
            et_deviations = np.array([cents_from_equal_temperament(f) for f in voiced_freq])
            avg_et_deviation = float(np.mean(np.abs(et_deviations)))
            # Score: 0 cents deviation = 100, 50 cents deviation = 0
            intonation_score = float(max(0.0, 100.0 - avg_et_deviation * 2.0))

            # Vibrato detection: look for periodic pitch oscillation in 4–8 Hz range
            vibrato_detected = False
            vibrato_rate_hz = None
            vibrato_extent_cents = None

            if len(voiced_freq) > 50:
                # Compute pitch oscillation in cents (smoothed)
                pitch_midi_series = np.array([hz_to_midi(f) for f in voiced_freq]) * 100
                pitch_detrended = pitch_midi_series - np.convolve(pitch_midi_series, np.ones(20) / 20, mode='same')
                # Look for oscillation in 4–8 Hz range (vibrato)
                fft_vibrato = np.abs(np.fft.rfft(pitch_detrended))
                freqs_vibrato = np.fft.rfftfreq(len(pitch_detrended), d=0.01)  # 10ms step
                vibrato_band = (freqs_vibrato >= 4.0) & (freqs_vibrato <= 8.0)
                if vibrato_band.any():
                    vibrato_power = float(np.mean(fft_vibrato[vibrato_band]))
                    total_power = float(np.mean(fft_vibrato)) if np.mean(fft_vibrato) > 0 else 1.0
                    if vibrato_power / total_power > 3.0:
                        vibrato_detected = True
                        peak_idx = np.argmax(fft_vibrato[vibrato_band])
                        vibrato_rate_hz = float(freqs_vibrato[vibrato_band][peak_idx])
                        vibrato_extent_cents = float(np.std(pitch_detrended) * 2)

            # Downsample arrays for compact storage (max 1000 points)
            n = len(time_arr)
            if n > 1000:
                idx = np.linspace(0, n - 1, 1000, dtype=int)
                time_out = time_arr[idx].tolist()
                freq_out = freq_arr[idx].tolist()
                conf_out = conf_arr[idx].tolist()
                dev_out = [round(cents_from_equal_temperament(f), 1) for f in freq_arr[idx]]
            else:
                time_out = time_arr.tolist()
                freq_out = freq_arr.tolist()
                conf_out = conf_arr.tolist()
                dev_out = [round(cents_from_equal_temperament(f), 1) for f in freq_arr]

            pitch_metrics = PitchMetrics(
                available=True,
                avg_confidence=round(avg_confidence, 4),
                median_pitch_hz=round(median_pitch, 2),
                pitch_stability=round(pitch_stability, 4),
                avg_intonation_deviation_cents=round(avg_et_deviation, 2),
                intonation_score=round(intonation_score, 1),
                vibrato_detected=vibrato_detected,
                vibrato_rate_hz=round(vibrato_rate_hz, 2) if vibrato_rate_hz else None,
                vibrato_extent_cents=round(vibrato_extent_cents, 1) if vibrato_extent_cents else None,
                pitch_times=[round(t, 3) for t in time_out],
                pitch_hz=[round(f, 2) for f in freq_out],
                pitch_confidence=[round(c, 3) for c in conf_out],
                pitch_cents_deviation=dev_out,
            )

            return self._wrap(pitch_metrics, duration, sr)

        except Exception as exc:
            logger.exception("CREPE engine failed")
            return self._wrap(PitchMetrics(available=False), 0.0, sample_rate, error=str(exc))

    def _wrap(self, pitch: PitchMetrics, duration: float, sr: int, error: str | None = None) -> StandardizedMetrics:
        """CREPE only fills pitch metrics. librosa provides everything else."""
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
            pitch=pitch,
            scores={"intonation_score": pitch.intonation_score or 0.0} if pitch.intonation_score else {},
            error=error,
        )
