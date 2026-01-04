import os

__all__ = []
# Make top-level `import mahjong` resolve to the local package inside the repo.
# Try several likely locations (mounted or copied into container differently).
_here = os.path.dirname(__file__)
_candidates = [
    os.path.abspath(os.path.join(_here, 'Backend', 'mahjong_utils', 'mahjong', 'mahjong')),
    os.path.abspath(os.path.join(_here, 'mahjong_utils', 'mahjong', 'mahjong')),
    os.path.abspath(os.path.join(_here, 'Backend', 'mahjong_utils', 'mahjong')),
]
for _local in _candidates:
    if os.path.isdir(_local) and _local not in __path__:
        __path__.insert(0, _local)
        break
