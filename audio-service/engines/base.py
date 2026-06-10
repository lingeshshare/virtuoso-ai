"""Abstract base class for all audio analysis engines."""
from abc import ABC, abstractmethod
from pathlib import Path
from models import StandardizedMetrics


class AudioEngine(ABC):
    """
    All audio engines must implement this interface.
    The pipeline only calls methods defined here — never engine-specific APIs.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique engine identifier, e.g. 'librosa'."""
        ...

    @property
    @abstractmethod
    def version(self) -> str:
        """Engine library version string."""
        ...

    @abstractmethod
    def analyze(self, audio_path: Path, sample_rate: int = 22050) -> StandardizedMetrics:
        """
        Analyze an audio file and return standardized metrics.
        Must not raise — return metrics with error field set on failure.
        """
        ...
