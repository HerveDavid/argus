#!/usr/bin/env bash
# Ensure script exits on first error
set -e

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="MacOS"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
else
    OS="Unknown"
fi
echo "Executing script on $OS platform"

# Create a temporary directory for spec files
TEMP_SPEC_DIR=$(mktemp -d)
echo "Using temporary directory for spec files: $TEMP_SPEC_DIR"

# Ensure the src-tauri/binaries/ directory exists
mkdir -p src-tauri/binaries/

# Function to setup and activate virtual environment
setup_venv() {
    # Check if VIRTUAL_ENV is already set
    if [[ -z "$VIRTUAL_ENV" ]]; then
        echo "Virtual environment not active, setting it up..."
        
        # Check if venv directory exists
        if [[ ! -d "src-sidecars/powsybl/venv" ]]; then
            echo "Creating virtual environment in src-sidecars/powsybl/venv"
            python3 -m venv src-sidecars/powsybl/venv
        else
            echo "Found existing virtual environment"
        fi
        
        # Activate the virtual environment
        echo "Activating virtual environment"
        source src-sidecars/powsybl/venv/bin/activate
        
        # Store that we activated the venv in this script so we can deactivate later
        ACTIVATED_IN_SCRIPT=true
    else
        # Check if the active venv is in the expected location
        if [[ "$VIRTUAL_ENV" != *"src-sidecars/powsybl"* && "$VIRTUAL_ENV" != *"src-sidecars\\powsybl"* ]]; then
            echo "Warning: The active virtual environment doesn't seem to be in src-sidecars/powsybl"
            echo "Active venv: $VIRTUAL_ENV"
            read -p "Continue anyway? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        
        echo "Using existing virtual environment: $VIRTUAL_ENV"
        ACTIVATED_IN_SCRIPT=false
    fi
    
    # Install requirements if requirements.txt exists
    if [[ -f "src-sidecars/powsybl/requirements.txt" ]]; then
        echo "Installing requirements from requirements.txt..."
        pip install -r src-sidecars/powsybl/requirements.txt
    else
        echo "No requirements.txt found in src-sidecars/powsybl"
        echo "Installing PyInstaller..."
        pip install pyinstaller
    fi
}

# Function to deactivate venv if we activated it
cleanup_venv() {
    if [[ "$ACTIVATED_IN_SCRIPT" == "true" ]]; then
        echo "Deactivating virtual environment"
        deactivate
    fi
}

# Function to clean up temporary directories
cleanup_temp_dirs() {
    echo "Cleaning up temporary spec directory..."
    rm -rf "$TEMP_SPEC_DIR"
}

# Set up trap to ensure cleanup on exit
trap 'cleanup_venv; cleanup_temp_dirs' EXIT

# OS-specific commands
case $OS in
    "Linux")
        echo "Executing Linux-specific commands..."
        setup_venv
        echo "Running PyInstaller for Linux..."
        pyinstaller -c -F --clean --specpath "$TEMP_SPEC_DIR" --name powsybl-x86_64-unknown-linux-gnu --distpath src-tauri/binaries/ src-sidecars/powsybl/main.py
        ;;
    "MacOS")
        echo "Executing MacOS-specific commands..."
        setup_venv
        echo "Running PyInstaller for macOS..."
        pyinstaller -c -F --clean --specpath "$TEMP_SPEC_DIR" --name powsybl-x86_64-apple-darwin --distpath src-tauri/binaries/ src-sidecars/powsybl/main.py
        ;;
    "Windows")
        echo "Executing Windows-specific commands..."
        setup_venv
        echo "Running PyInstaller for Windows..."
        pyinstaller -c -F --clean --specpath "$TEMP_SPEC_DIR" --name powsybl-x86_64-pc-windows-msvc --distpath src-tauri/binaries/ src-sidecars/powsybl/main.py
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

echo "Script execution completed successfully"