import pypowsybl as pp

network = pp.network.load('scenario_MQIS_NB.iidm')

# Add connectors for all MQIS breakers
switches = network.get_switches()
vl = network.get_voltage_levels()

dyd = open("dyd.out", "w")
par = open("par.out", "w")

for switch_id in switches.index:
    voltage_level = switches.at[switch_id, 'voltage_level_id']
    substation_id = vl.at[voltage_level, 'substation_id']
    if substation_id != "MQIS":
        continue
    # if switches.at[switch_id, "kind"] != "BREAKER":
    #     continue
    if not switches.at[switch_id, "retained"]:
        continue
    print(switch_id)

    dyd.write(f'\t<blackBoxModel id="{switch_id}" lib="EventConnectedStatus" parFile="Events.par" parId="{switch_id}"/>\n')
    dyd.write(f'\t<connect id1="{switch_id}" var1="event_state1_value" id2="NETWORK" var2="{switch_id}_state_value"/>\n')

    par.write(f'\t<set id="{switch_id}">\n')
    par.write(f'\t    <par type="DOUBLE" name="event_tEvent" value="999999"/>  <!-- Disabled -->\n')
    par.write(f'\t    <par type="BOOL" name="event_open" value="true"/>\n')
    par.write(f'\t</set>\n')
