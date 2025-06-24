import pypowsybl as pp

network = pp.network.load('scenario_MQIS_NB.iidm')

# Second remedial action: Decrease all loads (transformers to voltage levels code 1 or 2) by 5%
loads = network.get_loads(attributes=['p0','q0'])
lowered_loads = loads.copy()
lowered_loads = lowered_loads.filter(regex='.*(T|Y|TR).[12].$', axis=0)
print(lowered_loads.size)
print(loads.size)

dyd = open("dyd.out", "w")
# par = open("par.out", "w")
network_par = open("network.out", "w")

dyd.write('<blackBoxModel id="LoadReduction" lib="SetPoint" parFile="Events.par" parId="LoadReduction"/>\n')

i = 0
for load_id in lowered_loads.index:
    dyd.write(f'<connect id1="LoadReduction" var1="setPoint_setPoint_value" id2="NETWORK" var2="{load_id}_DeltaPc_value"/>\n')
    dyd.write(f'<connect id1="LoadReduction" var1="setPoint_setPoint_value" id2="NETWORK" var2="{load_id}_DeltaQc_value"/>\n')

    # par.write(f'<par type="DOUBLE" name="deltaP_{i}" value="-0.05"/>\n')
    # par.write(f'<par type="DOUBLE" name="deltaQ_{i}" value="-0.05"/>\n')

    network_par.write(f'<par type="BOOL" name="{load_id}_isControllable" value="true"/>\n')
    i += 1

# par.write(f'<par type="INT" name="nbLoads" value="{i}"/>\n')
