# 🔍 Argus Project

## 🛠️ Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

## ⚙️ Installation

### 1. Create a virtual environment
```bash
python -m venv venv
```

### 2. Activate the virtual environment

#### On Windows
```bash
venv\Scripts\activate
```

#### On macOS and Linux
```bash
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

## 🚀 Usage

### Run the main application
```bash
python main.py
```
## 📡 API Documentation

### POST Endpoints

#### Upload an IIDM file
```bash
curl -X POST http://localhost:8000/api/v1/config/iidm \
  -F "file=@/path/to/your/network.xiidm"
```

### GET Endpoints

#### Get network in JSON format
```bash
curl -X GET http://localhost:8000/api/v1/config/iidm
```

### Get current network information
```bash
curl -X GET http://localhost:8000/api/v1/config/iidm/metadata
```

### Get single line diagram (SVG)
```bash
# Get as SVG (direct)
curl -X GET http://localhost:8000/api/v1/network/diagram/line/VL_ID > diagram.svg

# Get as JSON (includes SVG and metadata)
curl -X GET "http://localhost:8000/api/v1/network/diagram/line/VL_ID?format=json"
```

### Get diagram metadata
```bash
curl -X GET http://localhost:8000/api/v1/network/diagram/line/VL_ID/metadata
```

### Get all substations
```bash
curl -X GET http://localhost:8000/api/v1/network/substations
```

### Get all voltage levels
```bash
curl -X GET http://localhost:8000/api/v1/network/voltage-levels
```

### Get voltage levels for a specific substation
```bash
curl -X GET http://localhost:8000/api/v1/network/substations/SUBSTATION_ID/voltage-levels
```

## 📁 Project Structure
```
scada/
├── application/                # Application core
│   └── config/                 # Configuration management
│       ├── logging.py          # Logging configuration
│       └── settings.py         # Application settings
├── domain/                     # Business logic domain
│   └── network/                # Network domain logic
│       └── services/           # Network services
│           ├── network_service.py
│           └── __pycache__/
├── interfaces/                 # Interface layer
│   ├── api/                    # REST API interface
│   │   ├── __pycache__/
│   │   └── routes.py           # API routes
│   ├── grpc/                   # gRPC interface
│   └── sse/                    # Server-Sent Events interface
│       ├── __init__.py
│       ├── __pycache__/
│       └── routes.py           # SSE routes
├── main.py                     # Main entry point
├── README.md                   # Project documentation
├── requirements.txt            # Project dependencies
├── tests/                      # Test suite
└── uploads/                    # Upload directory
    └── last_loaded_network.json
```

