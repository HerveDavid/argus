#!/usr/bin/env python3
"""
Client de debug pour voir ce que renvoie le serveur
"""

import subprocess
import sys
import json
import time


def debug_server():
    """Lance le serveur et affiche tous les messages"""
    print("🔍 DEBUG DU SERVEUR")
    print("=" * 30)

    try:
        print("Lancement du serveur...")
        process = subprocess.Popen(
            [sys.executable, "server.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )

        print("Serveur lancé, lecture des messages...")

        # Lire les premières lignes pour voir le format
        for i in range(3):
            try:
                line = process.stdout.readline()
                if line:
                    print(f"Message {i + 1}: '{line.strip()}'")
                    try:
                        parsed = json.loads(line.strip())
                        print(f"  -> JSON valide: {parsed}")
                        if parsed.get("type") == "startup":
                            print("  -> Message de démarrage détecté!")
                            break
                    except json.JSONDecodeError as e:
                        print(f"  -> Erreur JSON: {e}")
                else:
                    print(f"Message {i + 1}: vide")

            except Exception as e:
                print(f"Erreur lecture ligne {i + 1}: {e}")

        # Test d'envoi d'une requête simple
        print("\n📤 Test d'envoi de requête...")
        test_request = {
            "id": "test-debug",
            "method": "load_all",
            "params": {
                "file_path": "./it/samples/scenario_MQIS_NB/scenario_MQIS_NB.iidm"
            },
        }

        request_json = json.dumps(test_request) + "\n"
        print(f"Envoi: {request_json.strip()}")

        process.stdin.write(request_json)
        process.stdin.flush()

        # Lire la réponse
        print("📥 Attente de la réponse...")
        response_line = process.stdout.readline()
        if response_line:
            print(f"Réponse: '{response_line.strip()}'")
            try:
                response = json.loads(response_line.strip())
                print(f"  -> JSON valide: {response}")

                if response.get("status") == 200:
                    print("  -> ✅ Succès!")
                else:
                    print(f"  -> ❌ Erreur: {response.get('result', {}).get('error')}")

            except json.JSONDecodeError as e:
                print(f"  -> Erreur JSON: {e}")
        else:
            print("Pas de réponse")

        # Fermer proprement
        process.stdin.close()
        process.wait(timeout=2)
        print("\n✅ Debug terminé")

    except Exception as e:
        print(f"❌ Erreur: {e}")
        if "process" in locals():
            try:
                process.kill()
            except:
                pass


if __name__ == "__main__":
    debug_server()
