"""Engine registry — the only place engine names map to classes."""
from engines.base import AudioEngine
from engines.librosa_engine import LibrosaEngine
from engines.crepe_engine import CrepeEngine
from engines.basic_pitch_engine import BasicPitchEngine
from engines.essentia_engine import EssentiaEngine

# Priority order matches CLAUDE.md: librosa → CREPE → Basic Pitch → Essentia
_REGISTRY: dict[str, type[AudioEngine]] = {
    "librosa": LibrosaEngine,
    "crepe": CrepeEngine,
    "basic_pitch": BasicPitchEngine,
    "essentia": EssentiaEngine,
}

# Engines that are always attempted unless explicitly excluded
DEFAULT_ENGINES = ["librosa", "crepe", "basic_pitch", "essentia"]


class EngineRegistry:
    @staticmethod
    def get(name: str) -> AudioEngine:
        cls = _REGISTRY.get(name)
        if cls is None:
            raise ValueError(f"Unknown audio engine: {name!r}. Available: {list(_REGISTRY)}")
        return cls()

    @staticmethod
    def all_names() -> list[str]:
        return list(_REGISTRY)

    @staticmethod
    def available_engines() -> list[str]:
        """Return engines whose dependencies are installed."""
        available = []
        for name, cls in _REGISTRY.items():
            if hasattr(cls, "is_available"):
                try:
                    if cls.is_available():
                        available.append(name)
                except Exception:
                    pass
            else:
                # Assume available (librosa always is)
                available.append(name)
        return available
