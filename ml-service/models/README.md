# ML Model Files

Serialised model files (.pkl, .pt, .h5) are stored here at runtime.
They are excluded from version control via `.gitignore`.

Models are loaded by `app/main.py` at startup. In Phase 1, no model
file is required — the recommender returns random results.
