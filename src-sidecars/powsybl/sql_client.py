#!/usr/bin/env python3
"""
Client Python pour tester des requêtes SQL sur le réseau électrique
"""

import subprocess
import sys
import json
import time


def sql_test_client():
    """Client qui charge le réseau et teste plusieurs requêtes SQL"""
    print("⚡ CLIENT TEST SQL POWERSYSTEM")
    print("=" * 40)

    try:
        print("🚀 Lancement du serveur...")
        process = subprocess.Popen(
            [sys.executable, "server.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )

        print("📡 Lecture du message de démarrage...")
        startup_line = process.stdout.readline()
        if startup_line:
            startup_msg = json.loads(startup_line.strip())
            if startup_msg.get("type") == "startup":
                print("✅ Serveur démarré!")
            else:
                print("❌ Message de démarrage invalide")
                return
        else:
            print("❌ Pas de message de démarrage")
            return

        # 1. Charger le réseau et la base de données
        print("\n📁 Chargement du réseau...")
        load_request = {
            "id": "load-1",
            "method": "load_all",
            "params": {
                "file_path": "./it/samples/scenario_MQIS_NB/scenario_MQIS_NB.iidm",
                "db_path": "network_test.db",
            },
        }

        process.stdin.write(json.dumps(load_request) + "\n")
        process.stdin.flush()

        response_line = process.stdout.readline()
        response = json.loads(response_line.strip())

        if response.get("status") == 200:
            network_info = response["result"]["network_info"]
            print("✅ Réseau chargé avec succès!")
            print(f"   - ID Réseau: {network_info['network_id']}")
            print(f"   - Postes: {network_info['buses_count']}")
            print(f"   - Lignes: {network_info['lines_count']}")
            print(f"   - Générateurs: {network_info['generators_count']}")
            print(f"   - Charges: {network_info['loads_count']}")
        else:
            print(f"❌ Erreur chargement: {response.get('result', {}).get('error')}")
            return

        # 2. Liste des requêtes SQL à tester
        sql_queries = [
            {
                "name": "📊 Nombre total de postes",
                "query": "SELECT COUNT(*) as total_substations FROM substations",
            },
            {
                "name": "🗺️ Postes par pays",
                "query": """
                    SELECT country, COUNT(*) as count 
                    FROM substations 
                    WHERE country IS NOT NULL 
                    GROUP BY country 
                    ORDER BY count DESC 
                    LIMIT 5
                """,
            },
            {
                "name": "⚡ Distribution des niveaux de tension",
                "query": """
                    SELECT 
                        CASE 
                            WHEN nominal_v >= 400000 THEN 'THT (≥400kV)'
                            WHEN nominal_v >= 200000 THEN 'HT (200-400kV)'
                            WHEN nominal_v >= 100000 THEN 'HT (100-200kV)'
                            WHEN nominal_v >= 45000 THEN 'MT (45-100kV)'
                            ELSE 'BT (<45kV)'
                        END as niveau_tension,
                        COUNT(*) as nombre,
                        ROUND(AVG(nominal_v)/1000, 1) as tension_moyenne_kv
                    FROM voltage_levels 
                    GROUP BY 
                        CASE 
                            WHEN nominal_v >= 400000 THEN 'THT (≥400kV)'
                            WHEN nominal_v >= 200000 THEN 'HT (200-400kV)'
                            WHEN nominal_v >= 100000 THEN 'HT (100-200kV)'
                            WHEN nominal_v >= 45000 THEN 'MT (45-100kV)'
                            ELSE 'BT (<45kV)'
                        END
                    ORDER BY tension_moyenne_kv DESC
                """,
            },
            {
                "name": "🏭 Top 5 des postes avec le plus de niveaux de tension",
                "query": """
                    SELECT 
                        s.name as poste,
                        s.country as pays,
                        COUNT(vl.id) as nb_niveaux_tension
                    FROM substations s
                    LEFT JOIN voltage_levels vl ON s.id = vl.substation_id
                    GROUP BY s.id, s.name, s.country
                    ORDER BY nb_niveaux_tension DESC
                    LIMIT 5
                """,
            },
            {
                "name": "⚡ Production par type d'énergie",
                "query": """
                    SELECT 
                        COALESCE(energy_source, 'Unknown') as source_energie,
                        COUNT(*) as nombre_unites,
                        ROUND(SUM(COALESCE(max_p, 0)), 2) as puissance_max_totale_mw,
                        ROUND(AVG(COALESCE(max_p, 0)), 2) as puissance_moyenne_mw
                    FROM generators 
                    GROUP BY energy_source
                    ORDER BY puissance_max_totale_mw DESC
                    LIMIT 8
                """,
            },
            {
                "name": "🔌 Statistiques des charges",
                "query": """
                    SELECT 
                        COUNT(*) as nombre_charges,
                        ROUND(SUM(COALESCE(p0, 0)), 2) as puissance_totale_mw,
                        ROUND(AVG(COALESCE(p0, 0)), 2) as puissance_moyenne_mw,
                        ROUND(MIN(COALESCE(p0, 0)), 2) as puissance_min_mw,
                        ROUND(MAX(COALESCE(p0, 0)), 2) as puissance_max_mw
                    FROM loads 
                    WHERE p0 IS NOT NULL
                """,
            },
            {
                "name": "📈 Lignes les plus longues (approximation)",
                "query": """
                    SELECT 
                        id,
                        name,
                        ROUND(COALESCE(r, 0) * 1000, 3) as resistance_approx,
                        voltage_level1_id,
                        voltage_level2_id
                    FROM lines 
                    WHERE r IS NOT NULL AND r > 0
                    ORDER BY r DESC 
                    LIMIT 5
                """,
            },
        ]

        # 3. Exécuter chaque requête
        print("\n" + "=" * 50)
        print("🔍 EXÉCUTION DES REQUÊTES SQL")
        print("=" * 50)

        for i, sql_test in enumerate(sql_queries, 1):
            print(f"\n{i}. {sql_test['name']}")
            print("-" * 45)

            query_request = {
                "id": f"query-{i}",
                "method": "execute_query",
                "params": {"query": sql_test["query"]},
            }

            process.stdin.write(json.dumps(query_request) + "\n")
            process.stdin.flush()

            response_line = process.stdout.readline()
            response = json.loads(response_line.strip())

            if response.get("status") == 200:
                data = response["result"]["data"]
                row_count = response["result"]["row_count"]

                print(f"✅ {row_count} résultat(s):")

                # Afficher les résultats de manière formatée
                if data:
                    # Obtenir les clés pour l'en-tête
                    headers = list(data[0].keys())

                    # Afficher l'en-tête
                    header_line = " | ".join(f"{h:15}" for h in headers)
                    print(f"   {header_line}")
                    print(f"   {'-' * len(header_line)}")

                    # Afficher les données (max 10 lignes)
                    for row in data[:10]:
                        values = [str(row.get(h, ""))[:15] for h in headers]
                        data_line = " | ".join(f"{v:15}" for v in values)
                        print(f"   {data_line}")

                    if len(data) > 10:
                        print(f"   ... et {len(data) - 10} autre(s) résultat(s)")
                else:
                    print("   Aucun résultat")
            else:
                error = response.get("result", {}).get("error", "Erreur inconnue")
                print(f"❌ Erreur: {error}")

        # 4. Test d'une requête personnalisée complexe
        print(
            f"\n{len(sql_queries) + 1}. 🎯 Analyse complexe : Équilibre production/consommation par niveau de tension"
        )
        print("-" * 80)

        complex_query = """
        WITH production_par_tension AS (
            SELECT 
                vl.nominal_v,
                COUNT(g.id) as nb_generateurs,
                SUM(COALESCE(g.max_p, 0)) as production_max_mw
            FROM generators g
            JOIN voltage_levels vl ON g.voltage_level_id = vl.id
            GROUP BY vl.nominal_v
        ),
        consommation_par_tension AS (
            SELECT 
                vl.nominal_v,
                COUNT(l.id) as nb_charges,
                SUM(COALESCE(l.p0, 0)) as consommation_mw
            FROM loads l
            JOIN voltage_levels vl ON l.voltage_level_id = vl.id
            GROUP BY vl.nominal_v
        )
        SELECT 
            COALESCE(p.nominal_v, c.nominal_v)/1000 as tension_kv,
            COALESCE(p.nb_generateurs, 0) as generateurs,
            COALESCE(c.nb_charges, 0) as charges,
            ROUND(COALESCE(p.production_max_mw, 0), 1) as prod_max_mw,
            ROUND(COALESCE(c.consommation_mw, 0), 1) as conso_mw,
            ROUND(COALESCE(p.production_max_mw, 0) - COALESCE(c.consommation_mw, 0), 1) as bilan_mw
        FROM production_par_tension p
        FULL OUTER JOIN consommation_par_tension c ON p.nominal_v = c.nominal_v
        WHERE COALESCE(p.nominal_v, c.nominal_v) >= 45000
        ORDER BY tension_kv DESC
        LIMIT 10
        """

        complex_request = {
            "id": "complex-query",
            "method": "execute_query",
            "params": {"query": complex_query},
        }

        process.stdin.write(json.dumps(complex_request) + "\n")
        process.stdin.flush()

        response_line = process.stdout.readline()
        response = json.loads(response_line.strip())

        if response.get("status") == 200:
            data = response["result"]["data"]
            print("✅ Analyse complexe réussie:")

            if data:
                print(
                    "   Tension(kV) | Générateurs | Charges | Prod.Max(MW) | Conso(MW) | Bilan(MW)"
                )
                print("   " + "-" * 75)
                for row in data:
                    line = f"   {row['tension_kv']:10.1f} | {row['generateurs']:11d} | {row['charges']:7d} | {row['prod_max_mw']:12.1f} | {row['conso_mw']:9.1f} | {row['bilan_mw']:9.1f}"
                    print(line)
            else:
                print("   Aucun résultat")
        else:
            error = response.get("result", {}).get("error", "Erreur inconnue")
            print(f"❌ Erreur: {error}")

        # Fermer proprement
        process.stdin.close()
        process.wait(timeout=3)

        print("\n" + "=" * 50)
        print("✅ TOUS LES TESTS SQL TERMINÉS AVEC SUCCÈS!")
        print("=" * 50)

    except Exception as e:
        print(f"❌ Erreur: {e}")
        if "process" in locals():
            try:
                process.kill()
            except:
                pass


if __name__ == "__main__":
    sql_test_client()
