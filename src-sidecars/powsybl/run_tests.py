#!/usr/bin/env python3
"""
Script pour exécuter les tests unitaires du ConfigController
"""

import subprocess
import sys
from pathlib import Path


def run_tests():
    """Exécute les tests unitaires avec pytest"""

    # Vérifier que nous sommes dans le bon répertoire
    current_dir = Path.cwd()
    if not (current_dir / "src").exists():
        print("❌ Erreur: Ce script doit être exécuté depuis la racine du projet")
        return False

    print("🚀 Lancement des tests unitaires...")
    print("-" * 50)

    # Commande pytest avec options
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_config_controller.py",
        "-v",  # verbose
        "--tb=short",  # traceback format
        "--cov=src.config.config_controller",  # coverage spécifique
        "--cov-report=term-missing",
        "--cov-report=html:htmlcov",
        "--color=yes"
    ]

    try:
        result = subprocess.run(cmd, check=True)
        print("\n✅ Tous les tests sont passés avec succès!")
        print("📊 Rapport de couverture HTML généré dans: htmlcov/index.html")
        return True

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Échec des tests (code de retour: {e.returncode})")
        return False

    except FileNotFoundError:
        print("❌ Erreur: pytest n'est pas installé")
        print("💡 Installez les dépendances avec: pip install -r requirements-test.txt")
        return False


def run_specific_test(test_name):
    """Exécute un test spécifique"""

    cmd = [
        sys.executable, "-m", "pytest",
        f"tests/test_config_controller.py::{test_name}",
        "-v", "-s"
    ]

    try:
        subprocess.run(cmd, check=True)
        print(f"✅ Test {test_name} exécuté avec succès!")

    except subprocess.CalledProcessError:
        print(f"❌ Échec du test {test_name}")


def run_with_coverage():
    """Exécute les tests avec un rapport de couverture détaillé"""

    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_config_controller.py",
        "--cov=src.config.config_controller",
        "--cov-report=term-missing",
        "--cov-report=html:htmlcov",
        "--cov-fail-under=80",  # Fail si couverture < 80%
        "-v"
    ]

    try:
        subprocess.run(cmd, check=True)
        print("✅ Tests passés avec couverture suffisante!")

    except subprocess.CalledProcessError:
        print("❌ Tests échoués ou couverture insuffisante")


def main():
    """Point d'entrée principal"""

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "coverage":
            run_with_coverage()
        elif command.startswith("test_"):
            run_specific_test(command)
        else:
            print(f"❌ Commande inconnue: {command}")
            print("💡 Utilisation:")
            print("  python run_tests.py                    # Tous les tests")
            print("  python run_tests.py coverage           # Tests avec couverture")
            print("  python run_tests.py test_load_config   # Test spécifique")
    else:
        run_tests()


if __name__ == "__main__":
    main()