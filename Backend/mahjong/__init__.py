import os

__all__ = []
_here = os.path.dirname(__file__)
# Try a few candidate locations relative to this shim so imports work both
# when code is mounted under /app or when Backend is the module root.
_candidates = [
    os.path.abspath(os.path.join(_here, '..', 'mahjong_utils', 'mahjong', 'mahjong')),
    os.path.abspath(os.path.join(_here, '..', 'mahjong_utils', 'mahjong')),
    os.path.abspath(os.path.join(_here, '..', '..', 'mahjong_utils', 'mahjong', 'mahjong')),
]
for _local in _candidates:
    if os.path.isdir(_local) and _local not in __path__:
        __path__.insert(0, _local)
        break
