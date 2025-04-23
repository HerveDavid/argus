import zmq
import base64
import json
import uuid


class NetworkClient:
    """Client for the ZMQ network service."""

    def __init__(self, server_address="tcp://localhost:5555"):
        """Initialize the client.
        
        Args:
            server_address: ZMQ server address
        """
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.connect(server_address)
        
    def close(self):
        """Close the client connection."""
        self.socket.close()
        self.context.term()
        
    def _send_request(self, method, params=None):
        """Send a request to the server.
        
        Args:
            method: The method name
            params: Optional parameters dictionary
            
        Returns:
            dict: The server response
        """
        # Create request message
        request = {
            "type": "request",
            "id": str(uuid.uuid4()),
            "method": method,
            "params": params or {}
        }
        
        # Send request
        self.socket.send_json(request)
        
        # Wait for response
        response = self.socket.recv_json()
        return response
        
    def upload_iidm(self, file_path):
        """Upload an IIDM file to the server.
        
        Args:
            file_path: Path to the IIDM file
            
        Returns:
            dict: The server response
        """
        # Read file as binary data
        with open(file_path, "rb") as f:
            file_data = f.read()
            
        # Encode file data as base64 for transmission
        encoded_data = base64.b64encode(file_data).decode('utf-8')
        
        params = {
            "filename": file_path.split("/")[-1],
            "file_data": encoded_data
        }
        
        return self._send_request("upload_iidm", params)
        
    def get_network_json(self):
        """Get the current network in JSON format.
        
        Returns:
            dict: The server response with network JSON
        """
        return self._send_request("get_network_json")
        
    def get_current_network_info(self):
        """Get information about the currently loaded network.
        
        Returns:
            dict: The server response with network info
        """
        return self._send_request("get_current_network_info")
        
    def get_single_line_diagram(self, element_id, response_format="svg"):
        """Get a single line diagram for a voltage level or substation.
        
        Args:
            element_id: The identifier of the voltage level or substation
            response_format: Format of the response ("svg" or "json")
            
        Returns:
            dict: The server response with diagram
        """
        params = {
            "id": element_id,
            "format": response_format
        }
        
        return self._send_request("get_single_line_diagram", params)
        
    def get_single_line_diagram_metadata(self, element_id):
        """Get metadata for a single line diagram.
        
        Args:
            element_id: The identifier of the voltage level or substation
            
        Returns:
            dict: The server response with diagram metadata
        """
        params = {"id": element_id}
        return self._send_request("get_single_line_diagram_metadata", params)
        
    def get_network_substations(self):
        """Get all substations in the network.
        
        Returns:
            dict: The server response with substations
        """
        return self._send_request("get_network_substations")
        
    def get_network_voltage_levels(self):
        """Get all voltage levels in the network.
        
        Returns:
            dict: The server response with voltage levels
        """
        return self._send_request("get_network_voltage_levels")
        
    def get_voltage_levels_for_substation(self, substation_id):
        """Get all voltage levels for a specific substation.
        
        Args:
            substation_id: The substation ID
            
        Returns:
            dict: The server response with voltage levels
        """
        params = {"substation_id": substation_id}
        return self._send_request("get_voltage_levels_for_substation", params)


# Example usage
if __name__ == "__main__":
    client = NetworkClient()
    
    try:
        # Example: Get current network info
        response = client.get_current_network_info()
        print("Network info response:", json.dumps(response, indent=2))
        
        # Check if a network is loaded, if not, you might want to upload one
        if response.get("status") == 404:
            print("No network loaded. You might want to upload an IIDM file.")
            # Example: 
            # response = client.upload_iidm("path/to/your/network.xiidm")
            # print("Upload response:", json.dumps(response, indent=2))
        
    finally:
        client.close()