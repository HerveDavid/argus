package com.rte_france;

import com.powsybl.ieeecdf.converter.IeeeCdfNetworkFactory;
import com.powsybl.loadflow.LoadFlow;
import com.powsybl.nad.NetworkAreaDiagram;

import java.nio.file.Path;

public class Main {
    public static void main(String[] args) {
        var network = IeeeCdfNetworkFactory.create300();
        LoadFlow.run(network);
        NetworkAreaDiagram.draw(network, Path.of("single-eu.svg"));
    }
}