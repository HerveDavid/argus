from quart import request, jsonify, make_response, json
import os
import uuid
import traceback

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def register_api_routes(app, network_service):
    """Register API routes for the application.

    Args:
        app: The Quart application
        network_service: Instance of NetworkService
    """

    @app.route("/api/v1/config/iidm", methods=["POST"])
    async def upload_iidm():
        """Endpoint to receive a large IIDM file via POST and convert it to JSON."""
        try:
            # First check if the request contains a file
            files = await request.files
            if "file" not in files:
                return {"error": "No file found in the request"}, 400

            file = files.get("file")

            # Generate a unique filename
            unique_filename = f"{uuid.uuid4().hex}.xiidm"
            destination = os.path.join(network_service.UPLOAD_FOLDER, unique_filename)

            # Write the file to disk using direct stream
            await file.save(destination)

            # Process the file
            app.logger.info(
                f"File received and saved to {destination}. Processing in progress..."
            )
            error = await network_service.process_iidm_file(destination)

            if error:
                os.remove(destination)
                return {"error": f"Error during processing: {error}"}, 400

            app.logger.info(f"File received and successfully saved to {destination}.")

            # After successful upload, clean up old files
            await network_service.cleanup_old_networks()

            return {"status": "IIDM file loaded", "file_path": destination}, 201

        except Exception as e:
            error_details = traceback.format_exc()
            app.logger.error(f"Error during upload: {str(e)}\n{error_details}")
            return {"error": f"Error during upload: {str(e)}"}, 500

    @app.route("/api/v1/config/iidm", methods=["GET"])
    async def get_network_json():
        """
        Endpoint to get the current network in JSON format.

        Returns:
            The network in JSON format or an error message if no network is available
        """
        try:
            # Check if a network is available
            if not network_service.current_network:
                return {"error": "No network available"}, 404

            # Convert the network to JSON
            json_content, error = await network_service.convert_network_to_json()

            if error:
                return {"error": f"Error converting network to JSON: {error}"}, 500

            return jsonify(json_content)

        except Exception as e:
            # Log the error for debugging
            app.logger.error(f"Error when getting network JSON: {str(e)}")
            return {"error": f"Unable to get network JSON: {str(e)}"}, 500

    @app.route("/api/v1/config/iidm/metadata", methods=["GET"])
    async def get_current_network_info():
        """
        Endpoint to get information about the currently loaded network.

        Returns:
            Information about the current network or an error message if no network is available
        """
        try:
            if not network_service.current_network:
                return {"status": "No network loaded"}, 404

            # Basic network info
            info = {
                "status": "Network loaded",
                "file_path": network_service.current_file_path,
                "filename": os.path.basename(network_service.current_file_path)
                if network_service.current_file_path
                else None,
            }

            try:
                # Get additional network information
                substations = network_service.current_network.get_substations()
                voltage_levels = network_service.current_network.get_voltage_levels()
                lines = network_service.current_network.get_lines()

                info.update(
                    {
                        "substations_count": len(substations),
                        "voltage_levels_count": len(voltage_levels),
                        "lines_count": len(lines),
                    }
                )
            except Exception as e:
                info["warning"] = f"Error retrieving detailed network info: {str(e)}"

            return jsonify(info)

        except Exception as e:
            app.logger.error(f"Error when getting current network info: {str(e)}")
            return {"error": f"Unable to get current network info: {str(e)}"}, 500

    @app.route("/api/v1/network/diagram/line/<string:id>", methods=["GET"])
    async def get_single_line_diagram(id):
        """
        Endpoint to generate and return a single line diagram (SVG) for a voltage level or substation ID.

        Args:
            id: The identifier of the voltage level or substation

        Returns:
            The SVG diagram or an error message if the ID doesn't exist
        """
        try:
            # Check if a network is available
            if not network_service.current_network:
                return {"error": "No network available"}, 404

            # Check if the ID exists in the network
            if not await network_service.element_exists(id):
                return {
                    "error": f"The identifier '{id}' doesn't exist in the network"
                }, 404

            # Generate the SVG and metadata
            svg_content, metadata = await network_service.generate_single_line_diagram(
                id
            )

            if svg_content is None:
                return {
                    "error": "Failed to generate diagram",
                    "details": metadata.get("error", "Unknown error"),
                }, 500

            # Return format according to the request parameter
            if request.args.get("format") == "json":
                # Return SVG + metadata in JSON format
                return jsonify({"svg": svg_content, "metadata": metadata})
            else:
                # Return the SVG directly with the proper headers
                response = await make_response(svg_content)
                response.headers["Content-Type"] = "image/svg+xml"
                response.headers["Content-Disposition"] = (
                    f"inline; filename={id}_diagram.svg"
                )
                # Add metadata in a custom header
                response.headers["X-Diagram-Metadata"] = json.dumps(metadata)

                return response

        except Exception as e:
            # Log the error for debugging
            app.logger.error(f"Error when generating diagram for {id}: {str(e)}")
            return {"error": f"Unable to generate diagram: {str(e)}"}, 500

    @app.route("/api/v1/network/diagram/line/<string:id>/metadata", methods=["GET"])
    async def get_single_line_diagram_metadata(id):
        """
        Endpoint to get only the metadata of a diagram.
        """
        try:
            if not network_service.current_network:
                return {"error": "No network available"}, 404

            if not await network_service.element_exists(id):
                return {
                    "error": f"The identifier '{id}' doesn't exist in the network"
                }, 404

            _, metadata = await network_service.generate_single_line_diagram(id)

            if metadata is None or "error" in metadata:
                return {
                    "error": "Failed to generate metadata",
                    "details": metadata.get("error", "Unknown error"),
                }, 500

            return jsonify(metadata)

        except Exception as e:
            app.logger.error(f"Error when retrieving metadata for {id}: {str(e)}")
            return {"error": f"Unable to retrieve metadata: {str(e)}"}, 500

    @app.route("/api/v1/network/substations", methods=["GET"])
    async def get_network_substations():
        """
        Endpoint to get all substations in the network.

        Returns:
            A JSON list of all substations or an error message if no network is available
        """
        try:
            # Check if a network is available
            if not network_service.current_network:
                return {"error": "No network available"}, 404

            # Get substations JSON
            substations_json, error = await network_service.get_substations()

            if error:
                return {"error": f"Error retrieving substations: {error}"}, 500

            return jsonify(substations_json)

        except Exception as e:
            # Log the error for debugging
            app.logger.error(f"Error when getting substations: {str(e)}")
            return {"error": f"Unable to get substations: {str(e)}"}, 500

    @app.route("/api/v1/network/voltage-levels", methods=["GET"])
    async def get_network_voltage_levels():
        """
        Endpoint to get all voltage levels in the network.

        Returns:
            A JSON list of all voltage levels or an error message if no network is available
        """
        try:
            # Check if a network is available
            if not network_service.current_network:
                return {"error": "No network available"}, 404

            # Get voltage levels JSON
            voltage_levels_json, error = await network_service.get_voltage_levels()

            if error:
                return {"error": f"Error retrieving voltage levels: {error}"}, 500

            return jsonify(voltage_levels_json)

        except Exception as e:
            # Log the error for debugging
            app.logger.error(f"Error when getting voltage levels: {str(e)}")
            return {"error": f"Unable to get voltage levels: {str(e)}"}, 500

    @app.route(
        "/api/v1/network/substations/<string:substation_id>/voltage-levels",
        methods=["GET"],
    )
    async def get_voltage_levels_for_substation(substation_id):
        """
        Endpoint to get all voltage levels belonging to a specific substation.

        Args:
            substation_id: The ID of the substation

        Returns:
            A JSON list of voltage levels for the specified substation or an error message
        """
        try:
            # Check if a network is available
            if not network_service.current_network:
                return {"error": "No network available"}, 404

            # Check if the substation exists
            substations_df = network_service.current_network.get_substations()
            if substation_id not in substations_df.index:
                return {"error": f"Substation '{substation_id}' not found"}, 404

            # Get all voltage levels
            voltage_levels_df = network_service.current_network.get_voltage_levels()

            # Filter voltage levels belonging to the specified substation
            vl_for_substation = voltage_levels_df[
                voltage_levels_df["substation_id"] == substation_id
            ]

            # Format as JSON response
            result = {"substation_id": substation_id, "voltage_levels": []}

            for vl_id, vl in vl_for_substation.iterrows():
                vl_data = {
                    "id": vl_id,
                    "name": vl.get("name", ""),
                    "nominal_v": vl.get("nominal_v", 0),
                    "high_voltage_limit": vl.get("high_voltage_limit", 0),
                    "low_voltage_limit": vl.get("low_voltage_limit", 0),
                    "topology_kind": vl.get("topology_kind", ""),
                }

                # Add optional attributes if available
                if "fictitious" in vl:
                    vl_data["fictitious"] = bool(vl["fictitious"])

                result["voltage_levels"].append(vl_data)

            return jsonify(result)

        except Exception as e:
            # Log the error for debugging
            app.logger.error(
                f"Error when getting voltage levels for substation {substation_id}: {str(e)}"
            )
            return {
                "error": f"Unable to get voltage levels for substation: {str(e)}"
            }, 500
