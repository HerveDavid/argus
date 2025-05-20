import zmq
import json
import base64
import sys
import os
import uuid
from typing import Dict, Any, Optional


class ZmqTestClient:
    """Client de test pour le serveur ZMQ."""

    def __init__(self, server_address: str = "tcp://localhost:4267"):
        """Initialise le client ZMQ."""
        self.server_address = server_address
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.connect(self.server_address)
        print(f"Client ZMQ connecté à {self.server_address}")

    def send_request(self, method: str, params: Dict = None) -> Dict:
        """Envoie une requête au serveur et retourne la réponse."""
        request = {
            "type": "request",
            "id": str(uuid.uuid4()),
            "method": method,
            "params": params or {},
        }

        print(f"\n>>> Envoi requête: {method}")
        print(f"    Paramètres: {params}")

        # Envoi de la requête
        self.socket.send_json(request)

        # Réception de la réponse
        response = self.socket.recv_json()

        print(f"<<< Réponse reçue:")
        print(f"    Status: {response.get('status')}")
        print(f"    Résultat: {json.dumps(response.get('result'), indent=2)}...")

        return response

    def upload_file(self, file_path: str) -> Dict:
        """Teste l'upload d'un fichier IIDM."""
        if not os.path.exists(file_path):
            print(f"Erreur: Le fichier {file_path} n'existe pas")
            return None

        with open(file_path, "rb") as f:
            file_data = f.read()

        encoded_data = base64.b64encode(file_data).decode("utf-8")

        params = {"file_data": encoded_data, "filename": os.path.basename(file_path)}

        return self.send_request("upload_iidm", params)

    def get_network_json(self) -> Dict:
        """Récupère le JSON du réseau."""
        return self.send_request("get_network_json")

    def get_current_network_info(self) -> Dict:
        """Récupère les informations sur le réseau actuel."""
        return self.send_request("get_current_network_info")

    def get_single_line_diagram(self, element_id: str, format: str = "svg") -> Dict:
        """Récupère le diagramme unifilaire."""
        params = {"id": element_id, "format": format}
        return self.send_request("get_single_line_diagram", params)

    def get_single_line_diagram_metadata(self, element_id: str) -> Dict:
        """Récupère les métadonnées du diagramme."""
        params = {"id": element_id}
        return self.send_request("get_single_line_diagram_metadata", params)

    def get_network_substations(self) -> Dict:
        """Récupère la liste des postes."""
        return self.send_request("get_network_substations")

    def get_network_voltage_levels(self) -> Dict:
        """Récupère la liste des niveaux de tension."""
        return self.send_request("get_network_voltage_levels")

    def get_voltage_levels_for_substation(self, substation_id: str) -> Dict:
        """Récupère les niveaux de tension d'un poste spécifique."""
        params = {"substation_id": substation_id}
        return self.send_request("get_voltage_levels_for_substation", params)

    def close(self):
        """Ferme la connexion."""
        self.socket.close()
        self.context.term()
        print("Client ZMQ déconnecté")


def interactive_test():
    """Fonction de test interactive."""
    client = ZmqTestClient()

    try:
        while True:
            print("\n=== Menu de test ZMQ ===")
            print("1. Upload fichier IIDM")
            print("2. Obtenir JSON du réseau")
            print("3. Obtenir infos réseau actuel")
            print("4. Obtenir diagramme unifilaire")
            print("5. Obtenir métadonnées diagramme")
            print("6. Lister les postes")
            print("7. Lister les niveaux de tension")
            print("8. Obtenir niveaux de tension d'un poste")
            print("9. Quitter")

            choice = input("\nChoix (1-9): ")

            if choice == "1":
                file_path = input("Chemin du fichier IIDM: ")
                client.upload_file(file_path)

            elif choice == "2":
                client.get_network_json()

            elif choice == "3":
                client.get_current_network_info()

            elif choice == "4":
                element_id = input("ID de l'élément: ")
                format_choice = input("Format (svg/json) [svg]: ") or "svg"
                client.get_single_line_diagram(element_id, format_choice)

            elif choice == "5":
                element_id = input("ID de l'élément: ")
                client.get_single_line_diagram_metadata(element_id)

            elif choice == "6":
                client.get_network_substations()

            elif choice == "7":
                client.get_network_voltage_levels()

            elif choice == "8":
                substation_id = input("ID du poste: ")
                client.get_voltage_levels_for_substation(substation_id)

            elif choice == "9":
                break

            else:
                print("Choix invalide")

    except KeyboardInterrupt:
        print("\nInterruption par l'utilisateur")

    finally:
        client.close()


def automated_test():
    """Test automatisé de toutes les fonctionnalités."""
    client = ZmqTestClient()

    try:
        # Test 1: Info réseau (devrait retourner une erreur si aucun réseau n'est chargé)
        print("\n=== Test 1: Info réseau sans données ===")
        client.get_current_network_info()

        # Test 2: Upload d'un fichier (créez un fichier test.xiidm pour ce test)
        print("\n=== Test 2: Upload fichier IIDM ===")
        test_file = "test.xiidm"
        if os.path.exists(test_file):
            client.upload_file(test_file)
        else:
            print(f"Créez un fichier {test_file} pour tester l'upload")

        # Test 3: Info réseau après chargement
        print("\n=== Test 3: Info réseau après chargement ===")
        response = client.get_current_network_info()

        # Test 4: Liste des postes
        print("\n=== Test 4: Liste des postes ===")
        substations_response = client.get_network_substations()

        # Test 5: Liste des niveaux de tension
        print("\n=== Test 5: Liste des niveaux de tension ===")
        voltage_levels_response = client.get_network_voltage_levels()

        # Test 6: Si des postes existent, tester la récupération des niveaux de tension
        if substations_response.get("status") == 200:
            substations = substations_response.get("result", {}).get("substations", [])
            if substations and len(substations) > 0:
                first_substation_id = substations[0].get("id")
                if first_substation_id:
                    print(
                        f"\n=== Test 6: Niveaux de tension du poste {first_substation_id} ==="
                    )
                    client.get_voltage_levels_for_substation(first_substation_id)

        # Test 7: Diagramme unifilaire (si des niveaux de tension existent)
        if voltage_levels_response.get("status") == 200:
            voltage_levels = voltage_levels_response.get("result", {}).get(
                "voltage_levels", []
            )
            if voltage_levels and len(voltage_levels) > 0:
                first_vl_id = voltage_levels[0].get("id")
                if first_vl_id:
                    print(f"\n=== Test 7: Diagramme unifilaire pour {first_vl_id} ===")
                    client.get_single_line_diagram(first_vl_id)

                    print(f"\n=== Test 8: Métadonnées diagramme pour {first_vl_id} ===")
                    client.get_single_line_diagram_metadata(first_vl_id)

        # Test 9: JSON du réseau
        print("\n=== Test 9: JSON du réseau ===")
        client.get_network_json()

    except Exception as e:
        print(f"Erreur lors des tests: {e}")

    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        automated_test()
    else:
        interactive_test()
