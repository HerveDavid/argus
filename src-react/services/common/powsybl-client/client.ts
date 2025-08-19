import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

import { PowsyblError } from './error';
import {
  TableInfoResponse,
  QueryResponse,
  SingleLineDiagramResponse,
  NetworkAreaDiagramResponse,
  GetSingleLineDiagramRequest,
  GetNetworkAreaDiagramRequest,
  ExecuteQueryRequest,
  UpdateSwitchRequest,
} from './types';

interface PowsyblService {
  readonly getTables: () => Effect.Effect<TableInfoResponse[], PowsyblError>;

  readonly getSingleLineDiagram: (
    request: GetSingleLineDiagramRequest,
  ) => Effect.Effect<SingleLineDiagramResponse, PowsyblError>;

  readonly getNetworkAreaDiagram: (
    request: GetNetworkAreaDiagramRequest,
  ) => Effect.Effect<NetworkAreaDiagramResponse, PowsyblError>;

  readonly executeQuery: (
    request: ExecuteQueryRequest,
  ) => Effect.Effect<QueryResponse, PowsyblError>;

  readonly updateSwitch: (
    request: UpdateSwitchRequest,
  ) => Effect.Effect<QueryResponse, PowsyblError>;
}

export class PowsyblClient extends Effect.Service<PowsyblClient>()(
  '@/common/PowsyblClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        getTables: (): Effect.Effect<TableInfoResponse[], PowsyblError> =>
          Effect.tryPromise({
            try: () => invoke<TableInfoResponse[]>('get_tables'),
            catch: (error) =>
              new PowsyblError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        getSingleLineDiagram: ({
          element_id,
        }: GetSingleLineDiagramRequest): Effect.Effect<
          SingleLineDiagramResponse,
          PowsyblError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<SingleLineDiagramResponse>('get_single_line_diagram', {
                element_id,
              }),
            catch: (error) =>
              new PowsyblError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        getNetworkAreaDiagram: ({
          voltage_level_ids,
          depth,
          high_nominal_voltage_bound,
          low_nominal_voltage_bound,
        }: GetNetworkAreaDiagramRequest): Effect.Effect<
          NetworkAreaDiagramResponse,
          PowsyblError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<NetworkAreaDiagramResponse>('get_network_area_diagram', {
                voltage_level_ids,
                depth,
                high_nominal_voltage_bound,
                low_nominal_voltage_bound,
              }),
            catch: (error) =>
              new PowsyblError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        executeQuery: ({
          query,
          parameters,
          limit,
        }: ExecuteQueryRequest): Effect.Effect<QueryResponse, PowsyblError> =>
          Effect.tryPromise({
            try: () =>
              invoke<QueryResponse>('execute_query', {
                query,
                parameters,
                limit,
              }),
            catch: (error) =>
              new PowsyblError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        updateSwitch: ({
          switch_id,
          open,
          retained,
          fictitious,
        }: UpdateSwitchRequest): Effect.Effect<QueryResponse, PowsyblError> =>
          Effect.tryPromise({
            try: () =>
              invoke<QueryResponse>('update_switch', {
                switch_id,
                open,
                retained,
                fictitious,
              }),
            catch: (error) =>
              new PowsyblError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),
      } satisfies PowsyblService;
    }),
  },
) {}
