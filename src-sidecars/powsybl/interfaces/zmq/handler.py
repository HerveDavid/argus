import asyncio
import json
import logging
import traceback
import uuid
import base64
import os
import zmq
import zmq.asyncio
from domain.network import NetworkService

class ZmqHandler:
    """Handler for ZMQ messages that maps request types to handler functions."""

    def __init__(self, network_service):
        """Initialize the ZMQ handler.
        
        Args:
            network_service: Instance of NetworkService
        """
        self.network_service = network_service
        self.logger = logging.getLogger("zmq_handler")
        
        # Create a mapping of method names to handler functions
        self.handlers = {
            "upload_iidm": self.handle_upload_iidm,
            "get_network_json": self.handle_get_network_json,
            "get_current_network_info": self.handle_get_current_network_info,
            "get_single_line_diagram": self.handle_get_single_line_diagram,
            "get_single_line_diagram_metadata": self.handle_get_single_line_diagram_metadata,
            "get_network_substations": self.handle_get_network_substations,
            "get_network_voltage_levels": self.handle_get_network_voltage_levels,
            "get_voltage_levels_for_substation": self.handle_get_voltage_levels_for_substation
        }
        
        # Ensure upload folder exists
        self.UPLOAD_FOLDER = "uploads"
        os.makedirs(self.UPLOAD_FOLDER, exist_ok=True)

    async def process_message(self, message):
        """Process an incoming ZMQ message.
        
        Args:
            message: The parsed JSON message received via ZMQ
            
        Returns:
            dict: A response message formatted according to the protocol
        """
        try:
            # Validate message format
            if not isinstance(message, dict):
                return self._create_error_response(None, 400, "Invalid message format")
            
            msg_type = message.get("type")
            msg_id = message.get("id")
            method = message.get("method")
            params = message.get("params", {})
            
            # Validate required fields
            if msg_type != "request":
                return self._create_error_response(msg_id, 400, "Message type must be 'request'")
            
            if not msg_id:
                return self._create_error_response(None, 400, "Message ID is required")
                
            if not method:
                return self._create_error_response(msg_id, 400, "Method is required")
                
            # Find and call the appropriate handler
            handler = self.handlers.get(method)
            if not handler:
                return self._create_error_response(msg_id, 404, f"Unknown method: {method}")
                
            # Call the handler with parameters
            status, result = await handler(params)
            
            # Create and return the response
            return {
                "type": "response",
                "id": msg_id,
                "status": status,
                "result": result
            }
            
        except Exception as e:
            self.logger.error(f"Error processing message: {str(e)}")
            error_details = traceback.format_exc()
            self.logger.error(error_details)
            
            # Return an error response with the message ID if available
            msg_id = message.get("id") if isinstance(message, dict) else None
            return self._create_error_response(msg_id, 500, f"Internal server error: {str(e)}")
    
    def _create_error_response(self, msg_id, status, error_message):
        """Create an error response.
        
        Args:
            msg_id: The message ID or None
            status: HTTP-like status code
            error_message: The error message
            
        Returns:
            dict: A formatted error response
        """
        return {
            "type": "response",
            "id": msg_id or str(uuid.uuid4()),
            "status": status,
            "result": {"error": error_message}
        }
        
    async def handle_upload_iidm(self, params):
        """Handle IIDM file upload.
        
        Args:
            params: Dict containing file_data as base64 and filename
            
        Returns:
            tuple: (status_code, result)
        """
        try:
            if "file_data" not in params or "filename" not in params:
                return 400, {"error": "File data and filename are required"}
            
            file_data_encoded = params["file_data"]
            filename = params["filename"]
            
            # Décoder les données Base64 en bytes
            file_data = base64.b64decode(file_data_encoded)
            
            # Generate a unique filename
            unique_filename = f"{uuid.uuid4().hex}.xiidm"
            destination = os.path.join(self.network_service.UPLOAD_FOLDER, unique_filename)
            
            # Write the file to disk
            with open(destination, "wb") as f:
                f.write(file_data)
            
            # Process the file
            self.logger.info(f"File received and saved to {destination}. Processing in progress...")
            error = await self.network_service.process_iidm_file(destination)
            
            if error:
                os.remove(destination)
                return 400, {"error": f"Error during processing: {error}"}
            
            self.logger.info(f"File received and successfully saved to {destination}.")
            
            # After successful upload, clean up old files
            await self.network_service.cleanup_old_networks()
            
            return 201, {"status": "IIDM file loaded", "file_path": destination}
            
        except Exception as e:
            self.logger.error(f"Error during upload: {str(e)}")
            return 500, {"error": f"Error during upload: {str(e)}"}
    
    async def handle_get_network_json(self, params):
        """Handle request for network JSON.
        
        Returns:
            tuple: (status_code, result)
        """
        try:
            # Check if a network is available
            if not self.network_service.current_network:
                return 404, {"error": "No network available"}
            
            # Convert the network to JSON
            json_content, error = await self.network_service.convert_network_to_json()
            
            if error:
                return 500, {"error": f"Error converting network to JSON: {error}"}
            
            return 200, json_content
            
        except Exception as e:
            self.logger.error(f"Error when getting network JSON: {str(e)}")
            return 500, {"error": f"Unable to get network JSON: {str(e)}"}
    
    async def handle_get_current_network_info(self, params):
        """Handle request for current network metadata.
        
        Returns:
            tuple: (status_code, result)
        """
        try:
            if not self.network_service.current_network:
                return 404, {"status": "No network loaded"}
            
            # Basic network info
            info = {
                "status": "Network loaded",
                "file_path": self.network_service.current_file_path,
                "filename": os.path.basename(self.network_service.current_file_path)
                if self.network_service.current_file_path
                else None,
            }
            
            try:
                # Get additional network information
                substations = self.network_service.current_network.get_substations()
                voltage_levels = self.network_service.current_network.get_voltage_levels()
                lines = self.network_service.current_network.get_lines()
                
                info.update({
                    "substations_count": len(substations),
                    "voltage_levels_count": len(voltage_levels),
                    "lines_count": len(lines),
                })
            except Exception as e:
                info["warning"] = f"Error retrieving detailed network info: {str(e)}"
                
            return 200, info
                
        except Exception as e:
            self.logger.error(f"Error when getting current network info: {str(e)}")
            return 500, {"error": f"Unable to get current network info: {str(e)}"}
    
    async def handle_get_single_line_diagram(self, params):
        """Handle request for single line diagram.
        
        Args:
            params: Dict containing element_id and format option
            
        Returns:
            tuple: (status_code, result)
        """
        try:
            if "id" not in params:
                return 400, {"error": "Element ID is required"}
                
            element_id = params["id"]
            response_format = params.get("format", "svg")
            
            # Check if a network is available
            if not self.network_service.current_network:
                return 404, {"error": "No network available"}
                
            # Check if the ID exists in the network
            if not await self.network_service.element_exists(element_id):
                return 404, {"error": f"The identifier '{element_id}' doesn't exist in the network"}
                
            # Generate the SVG and metadata
            svg_content, metadata = await self.network_service.generate_single_line_diagram(element_id)
            
            if svg_content is None:
                return 500, {
                    "error": "Failed to generate diagram",
                    "details": metadata.get("error", "Unknown error"),
                }
                
            # Return format according to the request parameter
            if response_format == "json":
                # Return SVG + metadata in JSON format
                return 200, {"svg": svg_content, "metadata": metadata}
            else:
                # Return the SVG directly
                return 200, {"content_type": "image/svg+xml", "svg": svg_content, "metadata": metadata}
                
        except Exception as e:
            self.logger.error(f"Error when generating diagram: {str(e)}")
            return 500, {"error": f"Unable to generate diagram: {str(e)}"}
    
    async def handle_get_single_line_diagram_metadata(self, params):
        """Handle request for diagram metadata only.
        
        Args:
            params: Dict containing element_id
            
        Returns:
            tuple: (status_code, result)
        """
        try:
            if "id" not in params:
                return 400, {"error": "Element ID is required"}
                
            element_id = params["id"]
            
            if not self.network_service.current_network:
                return 404, {"error": "No network available"}
                
            if not await self.network_service.element_exists(element_id):
                return 404, {"error": f"The identifier '{element_id}' doesn't exist in the network"}
                
            _, metadata = await self.network_service.generate_single_line_diagram(element_id)
            
            if metadata is None or "error" in metadata:
                return 500, {
                    "error": "Failed to generate metadata",
                    "details": metadata.get("error", "Unknown error"),
                }
                
            return 200, metadata
                
        except Exception as e:
            self.logger.error(f"Error when retrieving metadata: {str(e)}")
            return 500, {"error": f"Unable to retrieve metadata: {str(e)}"}
    
    async def handle_get_network_substations(self, params):
        """Handle request for all network substations.
        
        Returns:
            tuple: (status_code, result)
        """
        try:
            # Check if a network is available
            if not self.network_service.current_network:
                return 404, {"error": "No network available"}
                
            # Get substations JSON
            substations_json, error = await self.network_service.get_substations()
            
            if error:
                return 500, {"error": f"Error retrieving substations: {error}"}
                
            return 200, substations_json
                
        except Exception as e:
            self.logger.error(f"Error when getting substations: {str(e)}")
            return 500, {"error": f"Unable to get substations: {str(e)}"}
    
    async def handle_get_network_voltage_levels(self, params):
        """Handle request for all network voltage levels.
        
        Returns:
            tuple: (status_code, result)
        """
        try:
            # Check if a network is available
            if not self.network_service.current_network:
                return 404, {"error": "No network available"}
                
            # Get voltage levels JSON
            voltage_levels_json, error = await self.network_service.get_voltage_levels()
            
            if error:
                return 500, {"error": f"Error retrieving voltage levels: {error}"}
                
            return 200, voltage_levels_json
                
        except Exception as e:
            self.logger.error(f"Error when getting voltage levels: {str(e)}")
            return 500, {"error": f"Unable to get voltage levels: {str(e)}"}
    
    async def handle_get_voltage_levels_for_substation(self, params):
        """Handle request for voltage levels of a specific substation.
        
        Args:
            params: Dict containing substation_id
            
        Returns:
            tuple: (status_code, result)
        """
        try:
            if "substation_id" not in params:
                return 400, {"error": "Substation ID is required"}
                
            substation_id = params["substation_id"]
            
            # Check if a network is available
            if not self.network_service.current_network:
                return 404, {"error": "No network available"}
                
            # Check if the substation exists
            substations_df = self.network_service.current_network.get_substations()
            if substation_id not in substations_df.index:
                return 404, {"error": f"Substation '{substation_id}' not found"}
                
            # Get all voltage levels
            voltage_levels_df = self.network_service.current_network.get_voltage_levels()
            
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
                
            return 200, result
                
        except Exception as e:
            self.logger.error(f"Error when getting voltage levels for substation: {str(e)}")
            return 500, {"error": f"Unable to get voltage levels for substation: {str(e)}"}
