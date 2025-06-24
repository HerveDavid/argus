"""
Configuration pytest pour les tests du projet
"""
import sys
from pathlib import Path

# Ajouter le répertoire src au path pour les imports
project_root = Path(__file__).parent
src_path = project_root / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

# Configuration des marqueurs de tests
pytest_plugins = []