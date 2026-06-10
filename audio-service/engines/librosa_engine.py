"""
librosa audio engine — Phase 4 primary engine.
Responsibilities: tempo, dynamics, onset detection, loudness, timing features, spectral.
"""
import importlib.metadata
import logging
from pathlib import Path

import numpy as np

from engines.base import AudioEngine
from models import (
    StandardizedMetrics,
    TempoMetrics,
    DynamicsMetrics,
    OnsetMetrics,
    TimingMetrics,
    SpectralMetrics,
    PitchMetrics,
)

logger = logging.getLogger(__name__)


class LibrosaEngine(AudioEngine):
    @property
    def name(self) -> str:
        return "librosa"

    @property
    def version(self) -> str:
        try:
            return importlib.metadata.version("librosa")
        except Exception:
            return "unknown"

    def analyze(self, audio_path: Path, sample_rate: int = 22050) -> StandardizedMetrics:
        import librosa

        try:
            y, sr = librosa.load(str(audio_path), sr=sample_rate, mono=True)
        except Exception as exc:
            logger.error("librosa.load failed: %s", exc)
            return StandardizedMetrics(
                engine=self.name,
                engine_version=self.version,
                duration_seconds=0.0,
                sample_rate=sample_rate,
                tempo=TempoMetrics(bpm=0, stability=0, beats=[], downbeats=[]),
                dynamics=DynamicsMetrics(avg_db=0, max_db=0, min_db=0, dynamic_range_db=0),
                onsets=OnsetMetrics(count=0, times=[], strengths=[]),
                timing=TimingMetrics(avg_onset_interval_s=0, timing_consistency=0, rushing_tendency=0, dragging_tendency=0),
                spectral=SpectralMetrics(centroid_mean_hz=0, centroid_std_hz=0, bandwidth_mean_hz=0, rolloff_mean_hz=0, zero_crossing_rate_mean=0),
                error=str(exc),
            )

        duration = librosa.get_duration(y=y, sr=sr)

        # ── Tempo ──────────────────────────────────────────────────
        tempo_arr, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
        bpm = float(tempo_arr[0]) if hasattr(tempo_arr, "__len__") else float(tempo_arr)

        # Beat stability: std dev of inter-beat intervals, normalized
        beat_intervals = np.diff(beats) if len(beats) > 1 else np.array([])
        if len(beat_intervals) > 1:
            expected_interval = 60.0 / bpm if bpm > 0 else 0.5
            cv = float(np.std(beat_intervals) / expected_interval) if expected_interval > 0 else 1.0
            stability = float(max(0.0, 1.0 - min(cv, 1.0)))
        else:
            stability = 0.5

        # Downbeats: every 4th beat (simple heuristic without time-signature detection)
        downbeats = [float(b) for i, b in enumerate(beats) if i % 4 == 0]

        # ── Dynamics ───────────────────────────────────────────────
        hop = 512
        rms = librosa.feature.rms(y=y, hop_length=hop)[0]
        rms_times = librosa.times_like(rms, sr=sr, hop_length=hop)
        # Convert to dB, clamp floor
        eps = 1e-8
        rms_db = 20.0 * np.log10(np.maximum(rms, eps))
        avg_db = float(np.mean(rms_db))
        max_db = float(np.max(rms_db))
        min_db = float(np.percentile(rms_db, 5))  # 5th percentile avoids silence outliers
        dynamic_range = max_db - min_db

        # Downsample RMS curve to ~1 point per 100ms for compact JSON
        target_points = min(int(duration * 10), 2000)
        if len(rms_db) > target_points:
            indices = np.linspace(0, len(rms_db) - 1, target_points, dtype=int)
            rms_curve = rms_db[indices].tolist()
            rms_times_out = rms_times[indices].tolist()
        else:
            rms_curve = rms_db.tolist()
            rms_times_out = rms_times.tolist()

        # ── Onsets ─────────────────────────────────────────────────
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(
            onset_envelope=onset_env, sr=sr, units="frames", backtrack=True
        )
        onset_times = librosa.frames_to_time(onset_frames, sr=sr).tolist()
        # Normalize onset strengths 0–1
        strengths_raw = onset_env[onset_frames] if len(onset_frames) > 0 else np.array([])
        max_strength = float(np.max(strengths_raw)) if len(strengths_raw) > 0 else 1.0
        onset_strengths = (strengths_raw / max(max_strength, 1e-8)).tolist()

        # ── Timing ─────────────────────────────────────────────────
        if len(onset_times) > 1:
            intervals = np.diff(onset_times)
            avg_interval = float(np.mean(intervals))
            timing_std = float(np.std(intervals))
            cv_timing = timing_std / avg_interval if avg_interval > 0 else 1.0
            timing_consistency = float(max(0.0, 1.0 - min(cv_timing, 1.0)))

            # Rushing: intervals shorter than avg by more than 10%
            rushing = float(np.mean(intervals < avg_interval * 0.90))
            dragging = float(np.mean(intervals > avg_interval * 1.10))

            longest_gap_idx = int(np.argmax(intervals))
            longest_gap = float(intervals[longest_gap_idx])
            longest_gap_time = float(onset_times[longest_gap_idx])
        else:
            avg_interval = 0.0
            timing_consistency = 0.5
            rushing = 0.0
            dragging = 0.0
            longest_gap = 0.0
            longest_gap_time = 0.0

        # ── Spectral ───────────────────────────────────────────────
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        zcr = librosa.feature.zero_crossing_rate(y)[0]

        # ── Derived Scores ─────────────────────────────────────────
        timing_score = round(timing_consistency * 100, 1)

        # Dynamics score: reward wide dynamic range (35–50 dB ideal), penalize clipping
        dr_score = min(dynamic_range / 50.0, 1.0)
        clipping_penalty = float(np.mean(rms_db > -1.0)) * 0.5  # fraction of frames near 0 dBFS
        dynamics_score = round(max(0.0, dr_score - clipping_penalty) * 100, 1)

        # Onset regularity as articulation proxy
        articulation_score = round(timing_consistency * 85 + stability * 15, 1)

        scores = {
            "timing_score": timing_score,
            "dynamics_score": dynamics_score,
            "articulation_score": articulation_score,
            "tempo_stability_score": round(stability * 100, 1),
        }

        return StandardizedMetrics(
            engine=self.name,
            engine_version=self.version,
            duration_seconds=round(duration, 2),
            sample_rate=sr,
            tempo=TempoMetrics(
                bpm=round(bpm, 2),
                stability=round(stability, 4),
                beats=[round(b, 3) for b in beats.tolist()],
                downbeats=[round(d, 3) for d in downbeats],
            ),
            dynamics=DynamicsMetrics(
                avg_db=round(avg_db, 2),
                max_db=round(max_db, 2),
                min_db=round(min_db, 2),
                dynamic_range_db=round(dynamic_range, 2),
                rms_curve=[round(v, 2) for v in rms_curve],
                rms_times=[round(t, 3) for t in rms_times_out],
            ),
            onsets=OnsetMetrics(
                count=len(onset_times),
                times=[round(t, 3) for t in onset_times],
                strengths=[round(s, 3) for s in onset_strengths],
            ),
            timing=TimingMetrics(
                avg_onset_interval_s=round(avg_interval, 4),
                timing_consistency=round(timing_consistency, 4),
                rushing_tendency=round(rushing, 4),
                dragging_tendency=round(dragging, 4),
                longest_gap_s=round(longest_gap, 3),
                longest_gap_time_s=round(longest_gap_time, 3),
            ),
            spectral=SpectralMetrics(
                centroid_mean_hz=round(float(np.mean(centroid)), 2),
                centroid_std_hz=round(float(np.std(centroid)), 2),
                bandwidth_mean_hz=round(float(np.mean(bandwidth)), 2),
                rolloff_mean_hz=round(float(np.mean(rolloff)), 2),
                zero_crossing_rate_mean=round(float(np.mean(zcr)), 6),
            ),
            scores=scores,
        )
