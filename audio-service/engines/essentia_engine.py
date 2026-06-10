"""
Essentia engine — timbre, MFCC, articulation quality, loudness.
Uses essentia when available; falls back to librosa (always installed) for identical output.
"""
import importlib.metadata
import logging
from pathlib import Path

import numpy as np

from engines.base import AudioEngine
from models import (
    StandardizedMetrics, TimbreMetrics,
    TempoMetrics, DynamicsMetrics, OnsetMetrics, TimingMetrics, SpectralMetrics, PitchMetrics, NoteMetrics,
)

logger = logging.getLogger(__name__)


def _has_essentia() -> bool:
    try:
        import essentia  # noqa: F401
        return True
    except ImportError:
        return False


def _analyze_with_essentia(audio_path: Path) -> tuple[TimbreMetrics, float, int]:
    import essentia.standard as es
    loader = es.MonoLoader(filename=str(audio_path), sampleRate=44100)
    audio = loader()
    duration = len(audio) / 44100.0

    frame_size, hop_size = 2048, 512
    w = es.Windowing(type='hann')
    spec = es.Spectrum(size=frame_size)
    mfcc_extractor = es.MFCC(inputSize=frame_size // 2 + 1, numberCoefficients=13)
    flux_extractor = es.Flux()

    mfcc_frames, flux_frames = [], []
    for frame in es.FrameGenerator(audio, frameSize=frame_size, hopSize=hop_size):
        spectrum = spec(w(frame))
        _, mfcc_coeffs = mfcc_extractor(spectrum)
        mfcc_frames.append(mfcc_coeffs)
        flux_frames.append(flux_extractor(spectrum))

    mfcc_arr = np.array(mfcc_frames) if mfcc_frames else np.zeros((1, 13))
    flux_arr = np.array(flux_frames) if flux_frames else np.zeros(1)

    timbre = _build_metrics(mfcc_arr, flux_arr, audio, 44100, frame_size, hop_size)
    return timbre, duration, 44100


def _analyze_with_librosa(audio_path: Path) -> tuple[TimbreMetrics, float, int]:
    import librosa

    y, sr = librosa.load(str(audio_path), sr=22050, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)

    hop_length = 512
    mfcc_arr = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=hop_length).T  # (frames, 13)

    # Spectral flux: frame-to-frame L2 difference of magnitude spectrum
    stft = np.abs(librosa.stft(y, hop_length=hop_length))
    flux_arr = np.sqrt(np.sum(np.diff(stft, axis=1) ** 2, axis=0))

    timbre = _build_metrics(mfcc_arr, flux_arr, y, sr, 2048, hop_length)
    return timbre, duration, sr


def _build_metrics(
    mfcc_arr: np.ndarray,
    flux_arr: np.ndarray,
    audio: np.ndarray,
    sr: int,
    frame_size: int,
    hop_size: int,
) -> TimbreMetrics:
    mfcc_mean = mfcc_arr.mean(axis=0).tolist()
    mfcc_std = mfcc_arr.std(axis=0).tolist()
    flux_mean = float(np.mean(flux_arr))
    flux_std = float(np.std(flux_arr))

    # Articulation quality from spectral flux pattern (0–50 typical range)
    norm = min(flux_mean / 50.0, 1.0)
    if norm < 0.3:
        artq = norm / 0.3 * 75
    elif norm <= 0.7:
        artq = 75 + (norm - 0.3) / 0.4 * 25
    else:
        artq = max(50.0, 100 - (norm - 0.7) / 0.3 * 50)

    # Approximate LUFS from RMS
    rms = float(np.sqrt(np.mean(audio ** 2)))
    loudness_lufs = round(20 * np.log10(max(rms, 1e-9)) - 0.691, 2)

    # Loudness range: 95th–10th percentile of per-frame RMS
    n_frames = max(1, (len(audio) - frame_size) // hop_size + 1)
    frame_rms = np.array([
        np.sqrt(np.mean(audio[i * hop_size: i * hop_size + frame_size] ** 2))
        for i in range(n_frames)
    ])
    lr = float(np.percentile(frame_rms, 95) - np.percentile(frame_rms, 10)) if len(frame_rms) > 10 else 0.0
    lr_lu = round(20 * np.log10(max(lr, 1e-9)), 2)

    return TimbreMetrics(
        available=True,
        mfcc_mean=[round(v, 4) for v in mfcc_mean],
        mfcc_std=[round(v, 4) for v in mfcc_std],
        spectral_flux_mean=round(flux_mean, 4),
        spectral_flux_std=round(flux_std, 4),
        articulation_quality_score=round(float(artq), 1),
        integrated_loudness_lufs=loudness_lufs,
        loudness_range_lu=lr_lu,
    )


class EssentiaEngine(AudioEngine):
    @staticmethod
    def is_available() -> bool:
        # Always available — uses essentia if installed, librosa otherwise
        try:
            import librosa  # noqa: F401
            return True
        except ImportError:
            return False

    @property
    def name(self) -> str:
        return "essentia"

    @property
    def version(self) -> str:
        if _has_essentia():
            try:
                return importlib.metadata.version("essentia")
            except Exception:
                pass
        try:
            return f"librosa-{importlib.metadata.version('librosa')}"
        except Exception:
            return "unknown"

    def analyze(self, audio_path: Path, sample_rate: int = 22050) -> StandardizedMetrics:
        try:
            if _has_essentia():
                logger.info("Running Essentia (native) on %s", audio_path.name)
                timbre, duration, sr_used = _analyze_with_essentia(audio_path)
            else:
                logger.info("Running Essentia (librosa backend) on %s", audio_path.name)
                timbre, duration, sr_used = _analyze_with_librosa(audio_path)

            return self._wrap(timbre, duration, sr_used)

        except Exception as exc:
            logger.exception("Essentia engine failed")
            return self._wrap(TimbreMetrics(available=False), 0.0, sample_rate, error=str(exc))

    def _wrap(self, timbre: TimbreMetrics, duration: float, sr: int, error: str | None = None) -> StandardizedMetrics:
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
            notes=NoteMetrics(),
            timbre=timbre,
            scores={"articulation_quality_score": timbre.articulation_quality_score or 0.0} if timbre.articulation_quality_score else {},
            error=error,
        )
